require('dotenv').config({ path: 'src/repository/__tests__/.env.repo' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import { createFabricGateway, isCommitRecord } from '../../fabric';
import { FabricWallet } from '../../fabric/entities';
import { createMessageCenter } from '../../message';
import { createQueryDb } from '../../querydb';
import { Blocks, Commit, KeyValue, Transactions } from '../../querydb/entities';
import type {
  MessageCenter,
  QueryDb,
  FabricGateway,
  ConnectionProfile,
  Repository,
} from '../../types';
import { isConnectionProfile, logger, waitSecond } from '../../utils';
import { createRepository } from '../createRepository';

/**
 * Running:
 * 1. cd && ./run.sh
 * 2. docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.explorer.yaml -f compose.ot.yaml up -d --no-recreate
 */
let messageCenter: MessageCenter;
let fabric: FabricGateway;
let profile: ConnectionProfile;
let queryDb: QueryDb;
let repo: Repository;
let defaultConnection: Connection;
let connection: Connection;
let testConnectionOptions: ConnectionOptions;

const entityName = 'dev_entity';
const entityId = 'ent_dev_';
const schema = 'repotest';
const connectionOptions: ConnectionOptions = {
  name: 'default',
  type: 'postgres' as any,
  host: process.env.QUERYDB_HOST,
  port: parseInt(process.env.QUERYDB_PORT, 10),
  username: process.env.QUERYDB_USERNAME,
  password: process.env.QUERYDB_PASSWD,
  database: process.env.QUERYDB_DATABASE,
  logging: true,
  synchronize: false,
  dropSchema: false,
  entities: [Blocks, Transactions, Commit, KeyValue, FabricWallet],
  connectTimeoutMS: 10000,
};

beforeAll(async () => {
  messageCenter = createMessageCenter({ logger, persist: false });
  messageCenter.subscribe({
    next: (m) => console.log(util.format('📨 message received: %j', m)),
  });

  // Loading connection profile
  try {
    const pathToConnectionProfile = path.join(process.cwd(), process.env.CONNECTION_PROFILE);
    const file = fs.readFileSync(pathToConnectionProfile);
    const loadedFile: unknown = yaml.load(file);
    if (isConnectionProfile(loadedFile)) profile = loadedFile;
    else {
      console.error('invalid connection profile');
      process.exit(1);
    }
  } catch {
    console.error('fail to read connection profile');
    process.exit(1);
  }

  // FabricGateway
  try {
    // use different schema for testing
    defaultConnection = await createConnection(connectionOptions);
    await defaultConnection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    testConnectionOptions = {
      ...connectionOptions,
      ...{ name: schema, schema, synchronize: true, dropSchema: true },
    };
    connection = await createConnection(testConnectionOptions);

    fabric = createFabricGateway(profile, {
      adminId: process.env.ADMIN_ID,
      adminSecret: process.env.ADMIN_SECRET,
      connection,
      logger,
      messageCenter,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }

  // QueryDb
  try {
    queryDb = createQueryDb({
      logger,
      connection,
      nonDefaultSchema: schema,
      messageCenter,
    });
  } catch (e) {
    logger.error('fail to createQueryDb: ', e);
    process.exit(1);
  }
  // Repo
  try {
    await fabric.initialize();

    repo = createRepository({ fabric, queryDb, logger, messageCenter, timeoutMs: 1500 });
  } catch (e) {
    logger.error('fail to createRepository: ', e);
    process.exit(1);
  }
});

afterAll(async () => {
  messageCenter.getMessagesObs().unsubscribe();
  await defaultConnection.close();
  fabric.disconnect();
  await queryDb.disconnect();
  await waitSecond(2);
});

describe('repo tests', () => {
  // it('fail to cmd_getByEntityName: invalid entityName', async () =>
  //   repo
  //     .cmd_getByEntityName('abcd')
  //     .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));
  //
  // it('cmd_getByEntityName', async () =>
  //   repo.cmd_getByEntityName(entityName).then(({ status, data }) => {
  //     expect(status).toEqual('ok');
  //     expect(data.map(({ commitId }) => commitId)).toEqual(['ent_dev_org1', 'ent_dev_org2']);
  //   }));

  // it('fail to cmd_getByEntityNameEntityId: invalid entityName', async () =>
  //   repo
  //     .cmd_getByEntityNameEntityId('abcd', entityId)
  //     .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));
  //
  // it('fail to cmd_getByEntityNameEntityId: invalid entityId', async () =>
  //   repo
  //     .cmd_getByEntityNameEntityId(entityName, 'efgh')
  //     .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));
  //
  // it('cmd_getByEntityNameEntityId', async () =>
  //   repo.cmd_getByEntityNameEntityId(entityName, entityId).then(({ status, data }) => {
  //     expect(status).toEqual('ok');
  //     expect(data.map(({ commitId }) => commitId)).toEqual(['ent_dev_org1', 'ent_dev_org2']);
  //   }));

  // it('fail to cmd_getByEntityNameEntityId: invalid entityName', async () =>
  //   repo
  //     .cmd_getByEntityNameEntityIdCommitId(entityName, entityId, 'abcd')
  //     .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));
  //
  // it('cmd_getByEntityNameEntityId', async () =>
  //   repo
  //     .cmd_getByEntityNameEntityIdCommitId(entityName, entityId, 'ent_dev_org1')
  //     .then(({ status, data }) => {
  //       expect(status).toEqual('ok');
  //       expect(data.map(({ commitId }) => commitId)).toEqual(['ent_dev_org1']);
  //     }));


});
