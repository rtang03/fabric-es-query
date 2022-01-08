require('dotenv').config({ path: 'src/sync/__tests__/.env.sync' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';
import rimraf from 'rimraf';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import { createFabricGateway } from '../../fabric';
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
import { CODE, isConnectionProfile, logger, waitSecond } from '../../utils';
import { createSynchronizer } from '../createSynchronizer';

/**
 * Running:
 * 1. cd && ./run.sh
 * 2. docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.explorer.yaml -f compose.ot.yaml up -d --no-recreate
 */
let messageCenter: MessageCenter;
let synchronizer: Synchronizer;
let fabric: FabricGateway;
let profile: ConnectionProfile;
let queryDb: QueryDb;
let defaultConnection: Connection;
let testConnection: Promise<Connection>;
let testConnectionOptions: ConnectionOptions;

const schema = 'synctest';
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
  entities: [Blocks, Transactions, Commit, KeyValue],
  connectTimeoutMS: 10000,
};

beforeAll(async () => {
  messageCenter = createMessageCenter({ logger, persist: false });
  // the default message subscription is using winston.logger, and data/error is intentionally removed.
  // below subscription will show both data and error for debugging purpose
  messageCenter.subscribe({
    next: (m) => console.log(util.format('📨 message received: %j', m)),
    error: (e) => console.error(util.format('❌ message error: %j', e)),
    complete: () => console.log('subscription completed'),
  });

  // removing pre-existing wallet
  try {
    await new Promise((resolve, reject) =>
      rimraf(path.join(__dirname, '__wallet__'), (err) => (err ? reject(err) : resolve(true)))
    );
  } catch {
    console.error('fail to remove wallet');
    process.exit(1);
  }

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
    fabric = createFabricGateway(profile, {
      adminId: process.env.ADMIN_ID,
      adminSecret: process.env.ADMIN_SECRET,
      walletPath: process.env.WALLET,
      logger,
      messageCenter,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }

  // QueryDb
  try {
    // use different schema for testing
    defaultConnection = await createConnection(connectionOptions);
    await defaultConnection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    testConnectionOptions = {
      ...connectionOptions,
      ...{ name: schema, schema, synchronize: true, dropSchema: true },
    };
    testConnection = createConnection(testConnectionOptions);

    queryDb = createQueryDb({
      logger,
      connection: testConnection,
      nonDefaultSchema: schema,
      messageCenter,
    });
  } catch (e) {
    logger.error('fail to createQueryDb: ', e);
    process.exit(1);
  }

  // Synchronizer
  try {
    // Notice that first sync job will be dispatched after initialSyncTime (2 second) is lapsed.
    synchronizer = createSynchronizer(2, {
      persist: false,
      initialTimeoutMs: 1500,
      initialShowStateChanges: true,
      dev: false,
      fabric,
      queryDb,
      logger,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }
});

afterAll(async () => {
  await waitSecond(3);
  synchronizer.stop();
  messageCenter.getMessagesObs().unsubscribe();
  await defaultConnection.close();
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

  it('connect queryDb', async () =>
    queryDb.connect().then((result) => expect(result instanceof Connection).toBeTruthy()));

  it('isBackendsReady', async () =>
    synchronizer.isBackendsReady().then((result) => expect(result).toBeTruthy()));

  it('sync start', async () => {
    const result = await synchronizer.start(1);

    if (result) {
      const blockHeighQuery = await queryDb.getBlockHeight();
      expect(blockHeighQuery).toEqual(11);

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

      const tx = await queryDb.findTxWithCommit({
        skip: 0,
        take: 10,
        sort: 'ASC',
        orderBy: 'blockid',
        code: CODE.PUBLIC_COMMIT,
      });

      expect(tx.total).toEqual(2);
      expect(tx.hasMore).toBeFalsy();
      expect(tx.cursor).toEqual(2);
      expect(tx.items.map(({ blockid }) => blockid)).toEqual([7, 9]);

      const commits = await queryDb.findCommit({
        skip: 0,
        take: 10,
        sort: 'ASC',
        orderBy: 'commitId',
        entityName: 'dev_entity',
      });
      expect(commits.total).toEqual(2);
      expect(commits.hasMore).toBeFalsy();
      expect(commits.cursor).toEqual(2);
      expect(commits.items.map(({ blocknum }) => blocknum)).toEqual([7, 9]);
    } else return Promise.reject('this test fails');
  });
});
