require('dotenv').config({ path: 'src/platform/__tests__/.env.platform' });
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import { FabricWallet } from '../../fabric/entities';
import { Incident } from '../../message/entities';
import { Blocks, Commit, KeyValue, Transactions } from '../../querydb/entities';
import type { PlatformConfig, ConnectionProfile, Platform } from '../../types';
import {
  extractNumberEnvVar,
  extractStringEnvVar,
  isConnectionProfile,
  isPlatformConfig,
  logger,
  waitSecond,
} from '../../utils';
import { createPlatform } from '../createPlatform';

let config: PlatformConfig;
let profile: ConnectionProfile;
let platform: Platform;
let connection: Connection;

const nonDefaultSchema = 'platformtest';
const connectionProfile = extractStringEnvVar('CONNECTION_PROFILE');
const platformConfig = extractStringEnvVar('PLATFORM_CONFIG');
const port = extractNumberEnvVar('PSQL_PORT');
const username = extractStringEnvVar('PSQL_USERNAME');
const host = extractStringEnvVar('PSQL_HOST');
const password = extractStringEnvVar('PSQL_PASSWD');
const database = extractStringEnvVar('PSQL_DATABASE');
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
  entities: [Blocks, Transactions, KeyValue, FabricWallet, Commit, Incident],
  connectTimeoutMS: 10000,
};

beforeAll(async () => {
  /**
   * use diff schema for testing
   */
  try {
    logger.info('Creating new schema');
    connection = await createConnection(connectionOptions);
    await connection.query(`CREATE SCHEMA IF NOT EXISTS ${nonDefaultSchema}`);
  } catch (e) {
    console.error('fail to create schema');
    console.error(e);
    process.exit(1);
  }

  /**
   * Load platform config
   */
  try {
    logger.info('Loading platform config');
    const loadedFile = yaml.load(fs.readFileSync(path.join(process.cwd(), platformConfig)));
    if (isPlatformConfig(loadedFile)) config = loadedFile;
    else {
      console.log(loadedFile);
      console.error('invalid file format');
      process.exit(1);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  /**
   * Load connection profile
   */
  try {
    logger.info('Loading connection profile');
    const loadedFile = yaml.load(fs.readFileSync(path.join(process.cwd(), connectionProfile)));
    if (isConnectionProfile(loadedFile)) profile = loadedFile;
    else {
      console.log(loadedFile);
      console.error('invalid file format');
      process.exit(1);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  try {
    logger.info('Create platform');
    platform = createPlatform({
      connectionName: nonDefaultSchema,
      nonDefaultSchema,
      profile,
      config,
      logger,
      wsEnabled: false,
      devMode: true,
    });

    const isPlatformInit = await platform.initialize();
    if (!isPlatformInit) {
      console.error('fail to init');
      process.exit(1);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  await platform.disconnect();
  await connection.close();
  await waitSecond(2);
});

describe('platform test', () => {
  it('fabric getInfo', async () => {
    const info = platform.getFabricGateway().getInfo();
    expect(info.caName).toEqual(Object.keys(profile.certificateAuthorities)[0]);
  });

  it('querydb is connected', async () => expect(platform.getQueryDb().isConnected()).toBeTruthy());

  it('messageCenter getInfo', async () => {
    expect(platform.getMessageCenter().getInfo().bufferSize).toBeDefined();
  });

  it('synchronizer is not ready before syncStart', async () => {
    expect(platform.getSynchronizer().isBackendsReady()).toBeTruthy();
    expect(platform.getSynchronizer().isSyncJobActive()).toBeFalsy();
  });

  it('sync start', async () => {
    const synchronizer = platform.getSynchronizer();
    await synchronizer.start(1);
    await waitSecond(2);
    await synchronizer.stop();
  });
});
