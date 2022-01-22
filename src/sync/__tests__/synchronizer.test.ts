require('dotenv').config({ path: 'src/sync/__tests__/.env.sync' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import { createFabricGateway } from '../../fabric';
import { FabricWallet } from '../../fabric/entities';
import { createMessageCenter } from '../../message';
import { createQueryDb } from '../../querydb';
import { Blocks, Commit, KeyValue, Transactions } from '../../querydb/entities';
import type {
  Synchronizer,
  MessageCenter,
  ConnectionProfile,
  FabricGateway,
  QueryDb,
} from '../../types';
import {
  CODE,
  extractNumberEnvVar,
  extractStringEnvVar,
  isConnectionProfile,
  logger,
  waitSecond,
} from '../../utils';
import { createSynchronizer } from '../createSynchronizer';

/**
 * Running:
 * 1. cd && ./run.sh
 * 2. docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.ot.yaml up -d --no-recreate
 */
let messageCenter: MessageCenter;
let synchronizer: Synchronizer;
let fabric: FabricGateway;
let profile: ConnectionProfile;
let queryDb: QueryDb;
let defaultConnection: Connection;
let connection: Connection;
let testConnectionOptions: ConnectionOptions;

const schema = 'synctest';
const port = extractNumberEnvVar('QUERYDB_PORT');
const username = extractStringEnvVar('QUERYDB_USERNAME');
const host = extractStringEnvVar('QUERYDB_HOST');
const password = extractStringEnvVar('QUERYDB_PASSWD');
const database = extractStringEnvVar('QUERYDB_DATABASE');
const connectionProfile = extractStringEnvVar('CONNECTION_PROFILE');
const adminId = extractStringEnvVar('ADMIN_ID');
const adminSecret = extractStringEnvVar('ADMIN_SECRET');
const channelName = extractStringEnvVar('CHANNEL_NAME');
const connectionOptions: ConnectionOptions = {
  name: 'default',
  type: 'postgres' as any,
  host,
  port,
  username,
  password,
  database,
  logging: true,
  synchronize: false,
  dropSchema: false,
  entities: [Blocks, Transactions, Commit, KeyValue, FabricWallet],
  connectTimeoutMS: 10000,
};

beforeAll(async () => {
  messageCenter = createMessageCenter({ logger, persist: false });
  // the default message subscription is using winston.logger, and data/error is intentionally removed.
  // below subscription will show both data and error for debugging purpose
  messageCenter.subscribe({
    next: (m) => console.log(util.format('📨 message received: %j', m)),
  });

  // Loading connection profile
  try {
    const pathToConnectionProfile = path.join(process.cwd(), connectionProfile);
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
      adminId,
      adminSecret,
      discovery: true,
      asLocalhost: true,
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

  // Synchronizer
  try {
    // Notice that first sync job will be dispatched after initialSyncTime (10 second) is lapsed.
    synchronizer = createSynchronizer(10, {
      channelName,
      persist: false,
      initialTimeoutMs: 2000,
      initialShowStateChanges: true,
      dev: false,
      fabric,
      queryDb,
      logger,
      initialMaxSyncHeight: 10,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }
});

afterAll(async () => {
  await waitSecond(3);
  await synchronizer.stop();
  messageCenter.getMessagesObs().unsubscribe();
  await defaultConnection.close();
  await connection.close();
  await fabric.disconnect();
  await queryDb.disconnect();
  await waitSecond(1);
});

describe('sync tests', () => {
  it('initialize fabric gateway', async () => {
    await fabric.initialize();

    const { isCaAdminEnrolled, isCaAdminInWallet } = fabric.getInfo();

    expect(isCaAdminEnrolled).toBeTruthy();
    expect(isCaAdminInWallet).toBeTruthy();
  });

  it('isBackendsReady', async () =>
    synchronizer.isBackendsReady().then((result) => expect(result).toBeTruthy()));

  it('sync start', async () => {
    // Notice that this test will run only once
    const result = await synchronizer.start(1);
    await synchronizer.stop();
    expect(result).toBeTruthy();
  });

  it('verify blocks', async () => {
    const blockHeighQuery = await queryDb.getBlockHeight();
    expect(blockHeighQuery).toEqual(11);

    // validate data after dispatch
    const blocks = await queryDb.findBlock({
      skip: 0,
      take: 11,
      sort: 'ASC',
      orderBy: 'blocknum',
    });
    expect(blocks.total).toEqual(11);
    expect(blocks.hasMore).toBeFalsy();
    expect(blocks.cursor).toEqual(11);
    expect(blocks.items.filter(({ verified }) => verified).length).toEqual(11);
  });

  it('verify commits', async () => {
    const commits = await queryDb.findCommit({
      skip: 0,
      take: 10,
      sort: 'ASC',
      orderBy: 'commitId',
      entityName: 'dev_entity',
    });
    console.log(commits);
    expect(commits.total).toEqual(2);
    expect(commits.hasMore).toBeFalsy();
    expect(commits.cursor).toEqual(2);
    expect(commits.items.map(({ blocknum }) => blocknum)).toEqual([7, 9]);
  });
});
