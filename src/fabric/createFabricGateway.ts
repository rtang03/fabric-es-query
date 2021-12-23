import fs from 'fs';
import path from 'path';
import Debug from 'debug';
import FabricCAServices, { IEnrollResponse } from 'fabric-ca-client';
import { User } from 'fabric-common';
import {
  Gateway,
  GatewayOptions,
  Identity,
  Network,
  Wallet,
  Wallets,
  X509Identity,
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
} from 'fabric-network';
import fabprotos from 'fabric-protos';
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
  let ca: FabricCAServices;
  let caRootCert: string;
  let isCaAdminEnrolled: boolean;
  let isCaAdminInWallet: boolean;
  let caAdminUserContext: User;
  let isGatewayConnected: boolean;
  let network: Network;

  logger.info('Loading configuration');

  const NS = 'fabric:gateway';
  const debug = Debug(NS);
  const gateway = new Gateway();

  // Loading configuration
  const caName = profile.organizations?.[profile.client?.organization]?.certificateAuthorities[0];
  const caUrl = profile.certificateAuthorities?.[caName]?.url;
  const caAdminId = profile.certificateAuthorities?.[caName]?.registrar[0]?.enrollId;
  const caAdminSecret = profile.certificateAuthorities?.[caName]?.registrar[0]?.enrollSecret;
  const mspId = profile.organizations?.[profile.client?.organization]?.mspid;
  const defaultChannel = Object.keys(profile.channels)?.[0];

  !caName && logger.error('missing caName');
  !caUrl && logger.error('missing caUrl');
  !caAdminId && logger.error('missing caAdminId');
  !caAdminSecret && logger.error('missing caAdminSecret');
  !mspId && logger.error('missing mspId');
  !defaultChannel && logger.error('missing channel');

  if (!caName || !caUrl || !caAdminId || !caAdminSecret || !mspId || !defaultChannel)
    throw new Error('fail to load connection profile');

  /* GET USER CONTEXT */
  const getUserContext = async (user: string) => {
    const identity = await wallet.get(user);

    !identity && logger.error('Not exist user :', user);

    return identity
      ? wallet.getProviderRegistry().getProvider(identity.type).getUserContext(identity, user)
      : null;
  };
  /* END */

  /* RETRIEVE ORG ADMIN PEM & PRIVATEKEY */
  const getOrgAdminPemOrKey = (kind: 'adminPrivateKey' | 'signedCert'): string => {
    logger.info(`getOrgAdminPemOrKey`);
    const _path = profile.organizations?.[profile?.client?.organization][kind]?.path;
    return _path ? fs.readFileSync(path.join(process.cwd(), _path), 'utf8') : '';
  };
  /* END */

  /* ENROLL AND SAVE TO WALLET */
  const enrollAndSave = async (
    enrollmentID: string,
    enrollmentSecret: string
  ): Promise<IEnrollResponse> => {
    const identity = await wallet.get(enrollmentID);

    if (identity) {
      logger.error(`${enrollmentID} already exists, cannot enroll`);
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID,
      enrollmentSecret,
    });
    const { certificate, key } = enrollment;

    logger.info(`enrollment ${enrollmentID} complete`);

    await wallet.put(enrollmentID, <X509Identity>{
      credentials: { certificate, privateKey: key.toBytes() },
      mspId,
      type: 'X.509',
    });

    logger.info(`wallet  ${enrollmentID} saved`);

    return enrollment;
  };
  /* END */

  /* RETRIEVE TLSCA PEM */
  const getTlsCACertsPem = (ca: string): string => {
    logger.info(`getTlsCACertsPem: ${ca}`);

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
  /* END */

  /* ENROLL CA */
  const enrollCaIdentity = async (id, secret) => {
    logger.info(`enrollCaIdentity ${id} - caName: ${caName}, caUrl ${caUrl}`);

    const trustedRoots = Buffer.from(getTlsCACertsPem(caName));
    ca = new FabricCAServices(caUrl, { trustedRoots, verify: false }, caName);

    debug('caService-caName: %s', ca.getCaName());

    const { rootCertificate } = await enrollAndSave(caAdminId, caAdminSecret);

    caRootCert = rootCertificate;
    isCaAdminEnrolled = true;
    isCaAdminInWallet = true;
  };
  /* END */

  return {
    /* INFO */
    getInfo: () => {
      logger.info('=== getInfo() ===');
      logger.info(`caAdminId: ${caAdminId}`);
      logger.info(`adminId: ${adminId}`);
      logger.info(`caName: ${caName}`);
      logger.info(`caUrl: ${caUrl}`);
      logger.info(`msp: ${mspId}`);
      logger.info(`defaultChannel: ${defaultChannel}`);

      debug('wallletPath: %s', walletPath);
      // debug('connectionProfile: %O', profile);

      const info = {
        caName,
        caUrl,
        caAdminId,
        adminId,
        mspId,
        isCaAdminEnrolled,
        isCaAdminInWallet,
      };

      caRootCert && (info['caRootCert'] = caRootCert);
      isGatewayConnected && (info['connectedGatewayOptions'] = gateway.getOptions());

      return info;
    },
    /* INITIALIZE */
    initialize: async (
      option = {
        eventHandlerOptions: {
          commitTimeout: 300,
          endorseTimeout: 30,
          strategy: DefaultEventHandlerStrategies.PREFER_MSPID_SCOPE_ALLFORTX,
        },
        queryHandlerOptions: {
          timeout: 10,
          strategy: DefaultQueryHandlerStrategies.PREFER_MSPID_SCOPE_SINGLE,
        },
      }
    ) => {
      logger.info('=== initialize() ===');

      try {
        const fullPath = path.join(process.cwd(), walletPath);

        debug('wallet fullPath: %s', fullPath);

        wallet = await Wallets.newFileSystemWallet(fullPath);

        debug('Filesystem wallet found');
        debug('adminId: %s', caAdminId);

        identity = await wallet.get(caAdminId);

        if (identity) {
          logger.info(`Wallet for ca-admin: ${caAdminId} already exists`);

          isCaAdminInWallet = true;
          isCaAdminEnrolled = true;
        } else logger.info('Wallet for ca-admin not found');

        // Step 1: enroll ca admin
        !identity && (await enrollCaIdentity(caAdminId, caAdminSecret));

        // Step 2: enroll organization-admin
        await enrollAndSave(adminId, adminSecret);

        // Step 3:
        const options: GatewayOptions = {
          identity: adminId,
          wallet,
          discovery: { enabled: false },
          eventHandlerOptions: option.eventHandlerOptions,
          queryHandlerOptions: option.queryHandlerOptions,
        };

        await gateway.connect(profile, options);

        logger.info('🔥 gatwway connected');

        isGatewayConnected = true;

        network = await gateway.getNetwork(defaultChannel);

        logger.info('get network');
      } catch (err) {
        logger.error(err);
        return false;
      }
      return true;
    },
    /* REGISTER */
    registerNewUser: async (enrollmentID, enrollmentSecret) => {
      logger.info('=== registerNewUser() ===');
      try {
        caAdminUserContext = await getUserContext(caAdminId);

        await ca.register(
          { affiliation: '', enrollmentID, enrollmentSecret, role: 'client' },
          caAdminUserContext
        );
        logger.info(`ca.register new ${enrollmentID} complete`);
      } catch (err) {
        logger.error(err);
        return false;
      }
      return true;
    },
    /* DISCONNECT */
    disconnect: () => gateway.disconnect(),
    /* IDENTITY INFO */
    getIdentityInfo: async (label) => {
      logger.info('=== getIdentityInfo() ===');

      // remove privateKey from this api
      return wallet.get(label).then((identity: any) => ({
        type: identity?.type,
        mspId: identity?.mspId,
        credentials: { certificate: identity?.credentials?.certificate },
      }));
    },
    /* QUERY CHANNEL */
    queryChannels: async () => {
      logger.info('=== queryChannels() ===');
      const contract = network.getContract('cscc');
      const result = await contract.evaluateTransaction('GetChannels');
      const ressultJson = fabprotos.protos.ChannelQueryResponse.decode(result);

      debug('queryChannels: %O', ressultJson);

      return ressultJson;
    },
  };
};
