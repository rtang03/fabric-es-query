require('dotenv').config({ path: 'src/sync/__tests__/.env.sync' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';
import rimraf from 'rimraf';
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
import { CODE, extractNumberEnvVar, extractStringEnvVar, isConnectionProfile, logger, waitSecond } from '../../utils';
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
  await synchronizer.stop();
  messageCenter.getMessagesObs().unsubscribe();
  await defaultConnection.close();
  fabric.disconnect();
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

  it('initialChannelHub', async () => {
    const newBlock$ = synchronizer.getNewBlockObs();
    const result = await fabric.initializeChannelEventHubs(newBlock$);
    expect(result).toBeTruthy();
  });

  it('synchronizer start', async () => {
    return true;
  });

  it('submit fabric tx', async () => {
    return true;
  });
});
