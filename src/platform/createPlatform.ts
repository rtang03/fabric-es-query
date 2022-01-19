import util from 'util';
import Debug from 'debug';
import omit from 'lodash/omit';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import { createFabricGateway } from '../fabric';
import { FabricWallet } from '../fabric/entities';
import { createMessageCenter } from '../message';
import { Incident } from '../message/entities';
import { createQueryDb } from '../querydb';
import { Blocks, Commit, KeyValue, Transactions } from '../querydb/entities';
import { createRepository } from '../repository';
import { createSynchronizer } from '../sync/createSynchronizer';
import type {
  ConnectionProfile,
  FabricGateway,
  MessageCenter,
  MetricServer,
  Platform,
  PlatformConfig,
  QueryDb,
  Repository,
  Synchronizer,
} from '../types';
import { createMetricServer } from '../utils';

export type CreatePlatformOption = {
  profile: ConnectionProfile;
  connectionName?: string;
  nonDefaultSchema?: string;
  config: PlatformConfig;
  broadcaster?: WebSocket.Server;
  wsEnabled?: boolean;
  logger: winston.Logger;
  devMode?: boolean;
};

export const createPlatform: (option: CreatePlatformOption) => Platform = ({
  profile,
  connectionName,
  nonDefaultSchema,
  config,
  broadcaster,
  wsEnabled,
  logger,
  devMode,
}) => {
  const NS = 'platform';
  const debug = Debug(NS);

  let queryDb: QueryDb;
  let connection: Connection;
  let fabric: FabricGateway;
  let synchronizer: Synchronizer;
  let messageCenter: MessageCenter;
  let repository: Repository;
  let metricServer: MetricServer;

  logger.info(`=== Preparing platform ===`);

  const connectionOption: ConnectionOptions = {
    name: connectionName || 'default',
    schema: nonDefaultSchema || 'public',
    type: 'postgres',
    host: config.querydb.host,
    port: config.querydb.port,
    username: config.querydb.username,
    password: config.querydb.password,
    database: config.querydb.database,
    logging: config.querydb.logging,
    synchronize: devMode,
    dropSchema: devMode,
    entities: [Blocks, Transactions, KeyValue, FabricWallet, Commit, Incident],
    connectTimeoutMS: 10000,
  };
  const debuggedConnection = omit(connectionOption, ['password', 'entities']);

  debug('Psql connection, %O', debuggedConnection);

  logger.info('=== platform ok ===');

  return {
    /**
     * disconnect
     */
    disconnect: async () => {
      await fabric.disconnect();
      await messageCenter.disconnect();
      await queryDb.disconnect();
    },
    /**
     * getHealthInfo
     */
    getHealthInfo: () => Promise.reject('not yet implemented'),
    getRepository: () => repository,
    getFabricGateway: () => fabric,
    getQueryDb: () => queryDb,
    getSynchronizer: () => synchronizer,
    getConnection: () => connection,
    getMessageCenter: () => messageCenter,
    /**
     * initialize
     */
    initialize: async () => {
      const me = 'initialize';
      let errorMsg: string;

      logger.info(`=== platform:${me}() ===`);
      // connect psql, update fabric-height, integrity check
      // connect fabric, update fabric-height
      // should trigger sync

      /**
       * Step 1: Connect database
       */
      errorMsg = 'fail to connect db';
      logger.info(`step 1: connect database`);
      try {
        connection = await createConnection(connectionOption);

        if (!connection) {
          logger.error(util.format(`${errorMsg} connection, %j`, debuggedConnection));
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 2: Message center
       */
      errorMsg = 'fail to create message center';
      logger.info(`step 2: create message center`);
      try {
        messageCenter = createMessageCenter({
          logger,
          connection,
          broadcaster: wsEnabled && broadcaster,
          notifyNewCommit: config.messageCenter.notifyNewCommit,
          newCommitEndpoint: config.messageCenter.newCommitEndpoint,
          persist: config?.messageCenter?.persist,
        });

        if (!messageCenter) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 3: Metric server
       */
      errorMsg = 'fail to create metric server';
      logger.info(`step 3: create metric center`);
      try {
        metricServer = createMetricServer('fabric-es-query', {
          interval: config.metricserver?.interval,
          exporterHost: config.metricserver?.host,
          exporterPort: config.metricserver?.port,
          // reserved for future use
          exporterEndpoint: 'localhost',
          logger,
        });

        if (!metricServer) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 4: Farbic gateway
       */
      errorMsg = 'fail to create fabric-gateway';
      logger.info(`step 4: create fabric-gateway`);
      try {
        fabric = createFabricGateway(profile, {
          connection,
          adminId: config.fabric.orgAdminId,
          adminSecret: config.fabric.orgAdminSecret,
          discovery: config.fabric.discovery,
          asLocalhost: config.fabric.asLocalhost,
          meters: metricServer.meters,
          logger,
          messageCenter,
          // reserved for future use
          tracer: null,
        });

        if (!fabric) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 5: Init Gateway
       */
      errorMsg = 'fail to init fabric-gateway';
      logger.info(`step 5: init fabric-gateway`);
      try {
        const isFabricGatewayInit = await fabric.initialize();

        if (!isFabricGatewayInit) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 6: QueryDb
       */
      errorMsg = 'fail to create queryDb';
      logger.info(`step 6: init query db`);
      try {
        queryDb = createQueryDb({
          connection,
          broadcaster,
          logger,
          meters: metricServer.meters,
          messageCenter,
          // reserved for future use
          tracer: null,
        });

        if (!queryDb) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 7: Synchronizer
       */
      errorMsg = 'fail to create synchronizer';
      logger.info(`step 7: create synchronizer`);
      try {
        synchronizer = createSynchronizer(config.sync.syncDuration, {
          broadcaster,
          fabric,
          initialTimeoutMs: config.sync.requestTimeoutMs,
          initialShowStateChanges: config.sync.showStateChanges,
          logger,
          messageCenter,
          meters: metricServer.meters,
          // NOTE: save sync result / failure via MessageCenter
          // Both meesageCenter and sychronizer are required to persist:true, in order save it
          persist: true,
          queryDb,
          tracer: null,
        });

        if (!synchronizer) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 8: Init channel hub
       */
      errorMsg = 'fail to init channel hub';
      logger.info(`step 8: init channel hub`);
      try {
        const newBlock$ = synchronizer.getNewBlockObs();
        const isInit = await fabric.initializeChannelEventHubs(newBlock$);

        if (!isInit) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      /**
       * Step 9: Repository
       */
      errorMsg = 'fail to create repository';
      logger.info(`step 9: create repository`);
      try {
        repository = createRepository({
          fabric,
          queryDb,
          logger,
          messageCenter,
          timeoutMs: config.repo.requestTimeoutMs,
        });

        if (!repository) {
          logger.error(errorMsg);
          return false;
        }
      } catch (e) {
        logger.error(util.format(`${errorMsg}, %j`, e));
        return false;
      }

      return true;
    },
    shutdown: async () => Promise.reject('not yet implemented'),
  };
};
