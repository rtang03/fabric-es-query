import fs from 'fs';
import path from 'path';
import Debug from 'debug';
import FabricCAServices from 'fabric-ca-client';
import { X509Identity, Wallets, Gateway, Wallet, Identity } from 'fabric-network';
import winston from 'winston';
import type { ConnectionProfile, FabricGateway } from '../types';

export type CreateFabricGatewayOption = {
  adminSecret: string;
  adminId: string;
  walletPath: string;
  logger: winston.Logger;
};

export const createFabricGateway: (
  profile: ConnectionProfile,
  option: CreateFabricGatewayOption
) => FabricGateway = (profile, { adminId, adminSecret, walletPath, logger }) => {
  let wallet: Wallet;
  let identity: Identity;

  const NS = 'fabric:gateway';
  const debug = Debug(NS);
  const caName = profile.organizations[profile.client.organization].certificateAuthorities[0];
  const caUrl = profile.certificateAuthorities[caName].url;
  const caAdminId = profile.certificateAuthorities[caName].registrar[0].enrollId;
  const caAdminSecret = profile.certificateAuthorities[caName].registrar[0].enrollSecret;
  const mspId = profile.organizations[profile.client.organization].mspid;

  const getTlsCACertsPem = (ca: string) => {
    const tlsCACerts = profile.certificateAuthorities[ca].tlsCACerts;

    tlsCACerts?.pem && debug('tlsCACerts.pem found');
    tlsCACerts?.path && debug('tlsCACerts.path found, %s', tlsCACerts.path);
    !tlsCACerts?.pem && !tlsCACerts?.path && logger.error('tlsCACerts not found');

    return !tlsCACerts?.pem && !tlsCACerts?.path
      ? ''
      : tlsCACerts?.pem
      ? tlsCACerts.pem
      : fs.readFileSync(path.join(process.cwd(), tlsCACerts.path), 'utf8');
  };

  const enrollCaIdentity = async (id, secret) => {
    logger.info(`Enroll ca identity ${id} - caName: ${caName}, caUrl ${caUrl}`);

    const ca = new FabricCAServices(
      caUrl,
      {
        trustedRoots: Buffer.from(getTlsCACertsPem(caName)),
        verify: false,
      },
      caName
    );

    debug('caService-caName: %s', ca.getCaName());

    const enrollment = await ca.enroll({
      enrollmentID: caAdminId,
      enrollmentSecret: caAdminSecret,
    });

    logger.info('enrollment: ca admin');

    const identity: X509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId,
      type: 'X.509',
    };

    // Import wallet
    await wallet.put(caAdminId, identity);
  };

  return {
    // mainly used for console.log
    getInfo: () => {
      logger.info('=== getInfo() ===');
      logger.info(`caAdminId: ${caAdminId}`);
      logger.info(`adminId: ${adminId}`);
      logger.info(`caName: ${caName}`);
      logger.info(`caUrl: ${caUrl}`);

      debug('wallletPath: %s', walletPath);
      // debug('connectionProfile: %O', profile);

      return { caName, caUrl, caAdminId, adminId };
    },
    initialize: async () => {
      logger.info('=== initialize() ===');
      try {
        const fullPath = path.join(process.cwd(), walletPath);

        debug('wallet fullPath: %s', fullPath);

        wallet = await Wallets.newFileSystemWallet(fullPath);

        debug('Filesystem wallet found');
        debug('adminId: %s', adminId);

        identity = await wallet.get(adminId);
      } catch (err) {
        logger.error(err);
      }

      if (identity) logger.info(`Wallet for admin: ${adminId} already exists`);
      else logger.info('Wallet for admin not found');

      if (!identity) {
        await enrollCaIdentity(caAdminId, caAdminSecret);
      }
    },
  };
};
