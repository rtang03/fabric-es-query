import Debug from 'debug';
import omit from 'lodash/omit';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import { createFabricGateway } from '../fabric';
import { FabricWallet } from '../fabric/entities';
import { createMessageCenter } from '../message';
import { createQueryDb } from '../querydb';
import { Blocks, Commit, KeyValue, Transactions } from '../querydb/entities';
import { createRepository } from '../repository';
import { createSynchronizer } from '../sync/createSynchronizer';
import type {
  ConnectionProfile,
  FabricGateway,
  MessageCenter,
  Platform,
  PlatformConfig,
  QueryDb,
  Repository,
  Synchronizer,
} from '../types';

export type CreatePlatformOption = {
  profile: ConnectionProfile;
  config: PlatformConfig;
  broadcaster?: WebSocket.Server;
  wsEnabled?: boolean;
  logger: winston.Logger;
  env?: string;
};

export const createPlatform: (option: CreatePlatformOption) => Platform = ({
  profile,
  config,
  broadcaster,
  wsEnabled,
  logger,
}) => {
  const NS = 'platform';
  const debug = Debug(NS);

  let queryDb: QueryDb;
  let connection: Connection;
  let fabric: FabricGateway;
  let synchronizer: Synchronizer;
  let messageCenter: MessageCenter;
  let repository: Repository;

  logger.info(`=== starting platform ===`);
  const connectionOption: ConnectionOptions = {
    name: 'default',
    type: 'postgres',
    host: config.querydb.host,
    port: config.querydb.port,
    username: config.querydb.username,
    password: config.querydb.password,
    database: config.querydb.database,
    logging: true,
    synchronize: false,
    dropSchema: false,
    entities: [Blocks, Transactions, KeyValue, FabricWallet, Commit],
    connectTimeoutMS: 10000,
  };
  const debuggedConnection = omit(connectionOption, ['password', 'entities']);

  debug(debuggedConnection);

  return {
    initialize: async () => {
      logger.info('initialize()');
      // connect psql, update fabric-height, integrity check
      // connect fabric, update fabric-height
      // should trigger sync

      // should connect psql
      try {
        connection = await createConnection(connectionOption);
        queryDb = createQueryDb({ connection, logger });

        if (!connection) {
          logger.error('failed connectionOption, %O', debuggedConnection);
          return null;
        }
      } catch (e) {
        logger.error('fail to connect queryDb : ', e);
        return null;
      }
      return true;
    },
    syncStart: async () => {
      // inspect - get fabric height
    },
  };
};
