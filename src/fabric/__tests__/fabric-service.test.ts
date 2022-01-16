require('dotenv').config({ path: 'src/fabric/__tests__/.env.fabricgateway' });
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import rimraf from 'rimraf';
import { Subject } from 'rxjs';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import type { ConnectionProfile, FabricGateway, SyncJob } from '../../types';
import {
  extractNumberEnvVar,
  extractStringEnvVar,
  isConnectionProfile,
  logger,
  waitSecond,
} from '../../utils';
import { createFabricGateway } from '../createFabricGateway';
import { FabricWallet } from '../entities';

/**
 * Running:
 * 1. cd && ./run.sh
 * 2. docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.ot.yaml up -d --no-recreate
 */
let fg: FabricGateway;
let profile: ConnectionProfile;
let defaultConnection: Connection;
let connection: Connection;
let testConnectionOptions: ConnectionOptions;

const newBlock$ = new Subject<SyncJob>();
const schema = 'fabricservicetest';
const port = extractNumberEnvVar('PSQL_PORT');
const username = extractStringEnvVar('PSQL_USERNAME');
const host = extractStringEnvVar('PSQL_HOST');
const password = extractStringEnvVar('PSQL_PASSWD');
const database = extractStringEnvVar('PSQL_DATABASE');
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
  entities: [FabricWallet],
  connectTimeoutMS: 10000,
};

beforeAll(async () => {
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

  try {
    // use different schema for testing
    defaultConnection = await createConnection(connectionOptions);
    await defaultConnection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    testConnectionOptions = {
      ...connectionOptions,
      ...{ name: schema, schema, synchronize: true, dropSchema: true },
    };
    connection = await createConnection(testConnectionOptions);

    fg = createFabricGateway(profile, {
      adminId,
      adminSecret,
      discovery: true,
      asLocalhost: true,
      connection,
      logger,
    });
  } catch (e) {
    console.error(e);
    console.error('fail to createFabricGateway');
    process.exit(1);
  }
});

afterAll(async () => {
  await defaultConnection.close();
  await connection.close();
  newBlock$.complete();
  await fg.disconnect();
  await waitSecond(2);
});

describe('fabric-service tests', () => {
  it('initialize', async () => {
    await fg.initialize();

    const { isCaAdminEnrolled, isCaAdminInWallet } = fg.getInfo();

    expect(isCaAdminEnrolled).toBeTruthy();
    expect(isCaAdminInWallet).toBeTruthy();
  });

  it('initializeChannelEventHubs', async () =>
    fg.initializeChannelEventHubs(newBlock$).then((result) => expect(result).toBeTruthy()));

  it('create Commit', async () => {
    return;
  });
});
