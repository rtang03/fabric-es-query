import fs from 'fs';
import path from 'path';
import api, { type Span, type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import FabricCAServices, { type IEnrollResponse } from 'fabric-ca-client';
import { User } from 'fabric-common';
import {
  Gateway,
  type GatewayOptions,
  type Identity,
  type Network,
  Wallet,
  type X509Identity,
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  type BlockListener,
  BlockEvent,
} from 'fabric-network';
import fabprotos from 'fabric-protos';
import { Subject } from 'rxjs';
import { Connection } from 'typeorm';
import winston from 'winston';
import { KIND, MSG } from '../message';
import type { ConnectionProfile, FabricGateway, MessageCenter, SyncJob } from '../types';
import { type Meters } from '../utils';
import { processBlockEvent } from './processBlockEvent';
import { createPsqlWallet } from './psqlWallet';

const { BlockDecoder } = require('fabric-common');

export type CreateFabricGatewayOption = {
  adminSecret: string;
  adminId: string;
  connection: Connection;
  discovery: boolean;
  asLocalhost: boolean;
  logger: winston.Logger;
  meters?: Partial<Meters>;
  tracer?: Tracer;
  messageCenter?: MessageCenter;
};

export const createFabricGateway: (
  profile: ConnectionProfile,
  option: CreateFabricGatewayOption
) => FabricGateway = (
  profile,
  {
    adminId,
    adminSecret,
    connection,
    logger,
    discovery,
    asLocalhost,
    meters,
    tracer,
    messageCenter: mCenter,
  }
) => {
  let wallet: Wallet;
  let identity: Identity;
  let ca: FabricCAServices;
  let caRootCert: string;
  let isCaAdminEnrolled: boolean;
  let isCaAdminInWallet: boolean;
  let caAdminUserContext: User;
  let isGatewayConnected: boolean;
  let network: Network;
  let nonDiscoveryNetwork: Network;

  logger.info('Loading configuration');

  const NS = 'fabric:gateway';
  const debug = Debug(NS);
  const gateway = new Gateway();
  const nonDiscoveryGateway = new Gateway();

  /* === LOADING CONFIGURATION === */
  const caName = profile.organizations?.[profile.client?.organization]?.certificateAuthorities[0];
  const caUrl = profile.certificateAuthorities?.[caName]?.url;
  const caAdminId = profile.certificateAuthorities?.[caName]?.registrar[0]?.enrollId;
  const caAdminSecret = profile.certificateAuthorities?.[caName]?.registrar[0]?.enrollSecret;
  const mspId = profile.organizations?.[profile.client?.organization]?.mspid;
  const channels = Object.keys(profile.channels);
  const defaultChannel = Object.keys(profile.channels)?.[0];
  // currently, there is only one channel event hub
  const channelEventHubs: Record<string, BlockListener> = {};

  !caName && logger.error('missing caName');
  !caUrl && logger.error('missing caUrl');
  !caAdminId && logger.error('missing caAdminId');
  !caAdminSecret && logger.error('missing caAdminSecret');
  !mspId && logger.error('missing mspId');
  !defaultChannel && logger.error('missing channel');

  if (!caName || !caUrl || !caAdminId || !caAdminSecret || !mspId || !defaultChannel)
    throw new Error('fail to load connection profile');

  /**
   * getUserContext
   * @param user
   */
  const getUserContext = async (user: string) => {
    const identity = await wallet.get(user);

    !identity && logger.error('Not exist user :', user);

    return identity
      ? wallet.getProviderRegistry().getProvider(identity.type).getUserContext(identity, user)
      : null;
  };

  /**
   * enrollAndSave
   * @param enrollmentID
   * @param enrollmentSecret
   */
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

    meters?.enrollCount.add(1);

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

  /**
   * getTlsCACertsPem
   * @param ca
   */
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

  /**
   * enrollCaIdentity
   * @param id
   */
  const enrollCaIdentity = async (id) => {
    logger.info(`enrollCaIdentity ${id} - caName: ${caName}, caUrl ${caUrl}`);

    const trustedRoots = Buffer.from(getTlsCACertsPem(caName));
    ca = new FabricCAServices(caUrl, { trustedRoots, verify: false }, caName);

    debug('caService-caName: %s', ca.getCaName());

    const { rootCertificate } = await enrollAndSave(caAdminId, caAdminSecret);

    caRootCert = rootCertificate;
    isCaAdminEnrolled = true;
    isCaAdminInWallet = true;
  };

  return {
    /**
     * disconnect
     */
    disconnect: async () => {
      gateway.disconnect();
      nonDiscoveryGateway.disconnect();
    },
    /**
     * getDefaultChannelName
     */
    getDefaultChannelName: () => defaultChannel,
    /**
     * getIdentityInfo
     * @param label
     */
    getIdentityInfo: async (label) => {
      const me = 'getIdentityInfo';
      logger.info(`=== ${me}() ===`);

      try {
        const result: any = await wallet.get(label);

        if (!result) return null;

        const identity = {
          type: result?.type,
          mspId: result?.mspId,
          credentials: { certificate: result?.credentials?.certificate },
        };

        Debug(`${NS}:${me}`)('result, %O', identity);

        return identity;
      } catch (e) {
        logger.error(`fail to getIdentityInfo ${label} : `, e);
        return null;
      }
    },
    /**
     * getInfo
     */
    getInfo: () => {
      const me = 'getInfo()';
      const debugL2 = Debug(`${NS}:${me}`);

      logger.info(`=== ${me} ===`);
      logger.info(`caAdminId: ${caAdminId}`);
      logger.info(`adminId: ${adminId}`);
      logger.info(`caName: ${caName}`);
      logger.info(`caUrl: ${caUrl}`);
      logger.info(`msp: ${mspId}`);
      logger.info(`defaultChannel: ${defaultChannel}`);

      debugL2('connectionProfile: %O', profile);

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
    /**
     * getNetwork
     */
    getNetwork: () => network,
    /**
     * getNonDiscoveryNetwork
     */
    getNonDiscoveryNetwork: () => nonDiscoveryNetwork,
    /**
     * initialize
     * - configure EventHandlerStrategies and QueryHandlerStrategies
     * - enroll (not register) CA admin
     * - enroll (not register) organizational admin
     * - connect fabric-gateway
     * - connect PsqlWallet
     * @param option
     */
    initialize: async (option) => {
      const me = 'initialize';
      const debugL2 = Debug(`${NS}:${me}`);

      logger.info(`=== ${me}() ===`);

      // Defaults
      const defaultEventHandlerOptions = {
        commitTimeout: 300,
        endorseTimeout: 30,
        strategy: DefaultEventHandlerStrategies.PREFER_MSPID_SCOPE_ALLFORTX,
      };
      const defaultQueryHandlerOptions = {
        timeout: 10,
        strategy: DefaultQueryHandlerStrategies.PREFER_MSPID_SCOPE_SINGLE,
      };

      // Trace
      let span: Span;
      const traceEnabled = option?.parent && tracer;
      if (traceEnabled) {
        const ctx = api.trace.setSpan(api.context.active(), option.parent);
        span = tracer.startSpan(me, undefined, ctx);
      }

      try {
        wallet = createPsqlWallet({ conn: connection, logger, messageCenter: mCenter });

        logger.info('Database wallet found');

        debugL2('adminId: %s', caAdminId);

        identity = await wallet.get(caAdminId);

        if (identity) {
          logger.info(`Wallet for ca-admin: ${caAdminId} already exists`);

          isCaAdminInWallet = true;
          isCaAdminEnrolled = true;
        } else logger.info('Wallet for ca-admin not found');

        // Step 1: enroll ca admin
        if (!identity) {
          await enrollCaIdentity(caAdminId);

          meters?.enrollCount.add(1);

          mCenter?.notify({ kind: KIND.SYSTEM, title: MSG.ENROLLED });
        }

        // Step 2: enroll organization-admin
        await enrollAndSave(adminId, adminSecret);

        // Step 3:
        const options: GatewayOptions = {
          identity: adminId,
          wallet,
          discovery: { enabled: discovery, asLocalhost },
          eventHandlerOptions: option?.eventHandlerOptions || defaultEventHandlerOptions,
          queryHandlerOptions: option?.queryHandlerOptions || defaultQueryHandlerOptions,
          'connection-options': option?.connectionOptions,
        };

        /**
         * For public data use
         */
        await gateway.connect(profile, options);

        logger.info('gatwway connected');

        isGatewayConnected = true;

        network = await gateway.getNetwork(defaultChannel);

        logger.info('network returned');

        /**
         * For private data use
         */
        const nonDiscoveryOptions: GatewayOptions = {
          ...options,
          discovery: { enabled: false, asLocalhost },
        };

        await nonDiscoveryGateway.connect(profile, nonDiscoveryOptions);

        logger.info('non-discovery gatwway connected');

        nonDiscoveryNetwork = await nonDiscoveryGateway.getNetwork(defaultChannel);

        logger.info('non-discovery network returned');

        traceEnabled && span.end();

        return true;
      } catch (err) {
        logger.error(`fail to ${me} : `, err);
        return null;
      }
    },
    /**
     * initializeChannelEventHubs
     * @param newBlock$
     */
    initializeChannelEventHubs: async (newBlock$: Subject<SyncJob>) => {
      const me = 'initializeChannelEventHubs';
      const save = true;
      const broadcast = true;

      logger.info(`=== ${me}() ===`);

      const createChannelEventHub = async (channelName: string) => {
        const current =
          channelName === defaultChannel ? network : await gateway.getNetwork(channelName);

        // Skip first block, it is process by peer event hub
        channelEventHubs[channelName] = await current.addBlockListener(
          async (event) => {
            const blocknum = event.blockNumber.low;
            logger.info(`blocknum arrives: ${blocknum}`);

            if (!(event.blockNumber.low === 0 && event.blockNumber.high === 0)) {
              // notify synchronizer
              newBlock$.next({ id: parseFloat(`99.${blocknum}`), blocknum, timestamp: new Date() });

              mCenter?.notify<number>({
                kind: KIND.SYSTEM,
                title: MSG.BLOCK_ARRIVAL,
                desc: `blocknum ${event.blockNumber} arrives`,
                data: Number(event.blockNumber),
                broadcast,
                save,
              });
            }
          },
          { type: 'full' }
        );

        logger.info(`block listener added ${channelName}`);
        return true;
      };

      for await (const channelName of channels) {
        try {
          await createChannelEventHub(channelName);
        } catch (e) {
          logger.error(`Failed to initializeChannelEventHubs from ${channelName} : `, e);

          mCenter?.notify({
            kind: KIND.ERROR,
            title: MSG.CHANNELHUB_LISTENER_FAIL,
            error: e.message,
            broadcast: true,
            save: true,
          });

          return null;
        }
      }
      return true;
    },
    /**
     * processBlockEvent
     * @param block
     */
    processBlockEvent: (block) => processBlockEvent(block, logger),
    /**
     * queryBlock
     * @param channelName
     * @param blockNum
     */
    queryBlock: async (channelName, blockNum) => {
      const me = 'queryBlock';
      logger.info(`=== ${me}() ===`);

      try {
        const contract = network.getContract('qscc');
        const resultByte = await contract.evaluateTransaction(
          'GetBlockByNumber',
          channelName,
          String(blockNum)
        );
        const resultJson = BlockDecoder.decode(resultByte);

        Debug(`${NS}:${me}`)('result, %O', resultJson);

        meters?.queryBlockCount.add(1);

        return resultJson;
      } catch (e) {
        logger.error(`Failed to get block ${blockNum} from channel ${channelName} : `, e);
        return null;
      }
    },
    /**
     * queryChannelHeight
     * @param channelName
     */
    queryChannelHeight: async (channelName) => {
      const me = 'queryChannelHeight';
      logger.info(`=== ${me}() ===`);

      try {
        const contract = network.getContract('qscc');
        const resultByte = await contract.evaluateTransaction('GetChainInfo', channelName);
        const resultJson: any = fabprotos.common.BlockchainInfo.decode(resultByte);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const height = resultJson?.height?.low && parseInt(resultJson.height.low, 10) - 1;

        mCenter?.notify({ kind: KIND.INFO, title: MSG.CHANNEL_HEIGHT, data: height });

        Debug(`${NS}:${me}`)('result, %O', resultJson);

        return resultJson?.height?.low ? height : null;
      } catch (e) {
        logger.error(`fail to queryChannelHeight`);
        return null;
      }
    },
    /**
     * queryChannels
     */
    queryChannels: async () => {
      const me = 'queryChannels';
      logger.info(`=== ${me}() ===`);

      try {
        const contract = network.getContract('cscc');
        const result = await contract.evaluateTransaction('GetChannels');
        const resultJson = fabprotos.protos.ChannelQueryResponse.decode(result);

        Debug(`${NS}:${me}`)('result: %O', resultJson);

        return resultJson;
      } catch (e) {
        logger.error(`fail to queryChannels: `, e);
        return null;
      }
    },
    /**
     * registerNewUser
     * @param enrollmentID
     * @param enrollmentSecret
     */
    registerNewUser: async (enrollmentID, enrollmentSecret) => {
      const me = 'registerNewUser';
      logger.info(`=== ${me}() ===`);

      try {
        caAdminUserContext = await getUserContext(caAdminId);

        await ca.register(
          { affiliation: '', enrollmentID, enrollmentSecret, role: 'client' },
          caAdminUserContext
        );

        logger.info(`ca.register new ${enrollmentID} complete`);

        return true;
      } catch (e) {
        logger.error(`fail to register new user ${enrollmentID} : `, e);
        return null;
      }
    },
  };
};
