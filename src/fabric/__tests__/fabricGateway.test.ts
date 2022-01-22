require('dotenv').config({ path: 'src/fabric/__tests__/.env.fabricgateway' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import fetch from 'isomorphic-unfetch';
import yaml from 'js-yaml';
import { range } from 'lodash';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import { createMessageCenter } from '../../message';
import type { MetricServer, ConnectionProfile, FabricGateway, MessageCenter } from '../../types';
import {
  createMetricServer,
  extractNumberEnvVar,
  extractStringEnvVar,
  isConnectionProfile,
  logger,
  METERS,
  waitSecond,
} from '../../utils';
import { createFabricGateway } from '../createFabricGateway';
import { FabricWallet } from '../entities';

/**
 * Running:
 * 1. cd && ./run.sh
 * 2. docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.ot.yaml up -d --no-recreate
 */
let messageCenter: MessageCenter;
let fg: FabricGateway;
let profile: ConnectionProfile;
let defaultConnection: Connection;
let connection: Connection;
let testConnectionOptions: ConnectionOptions;
let metricServer: MetricServer;

const schema = 'fabrictest';
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
  messageCenter = createMessageCenter({ logger });
  messageCenter.subscribe({
    next: (m) => console.log(util.format('📨 message received: %j', m)),
    error: (e) => console.error(util.format('❌ message error: %j', e)),
    complete: () => console.log('subscription completed'),
  });

  try {
    metricServer = createMetricServer('my-meter', {
      filterMeters: [METERS.ENROLL_COUNT, METERS.QUERYBLOCK_COUNT],
      logger,
    });
  } catch (e) {
    console.error(e);
    console.error('fail to create MeterProvider');
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
      meters: metricServer.meters,
      messageCenter,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }
});

afterAll(async () => {
  await defaultConnection.close();
  await connection.close();
  messageCenter.getMessagesObs().unsubscribe();
  await fg.disconnect();
  await waitSecond(2);
  await metricServer.meterProvider.shutdown();
  await metricServer.exporter.stopServer();
});

describe('fabricGateway tests', () => {
  it('should getInfo', async () => {
    const { adminId } = fg.getInfo();
    expect(adminId).toBeDefined();
  });

  it('initialize', async () => {
    await fg.initialize();

    const { isCaAdminEnrolled, isCaAdminInWallet } = fg.getInfo();

    expect(isCaAdminEnrolled).toBeTruthy();
    expect(isCaAdminInWallet).toBeTruthy();
  });

  it('queryChannels', async () =>
    fg
      .queryChannels()
      .then((channels) => expect(channels).toEqual({ channels: [{ channel_id: 'loanapp' }] })));

  it('fail to getIdentityInfo', async () =>
    fg.getIdentityInfo('abcd').then((result) => expect(result).toBeNull()));

  it('getIdentityInfo', async () =>
    fg.getIdentityInfo(adminId).then(({ type, mspId }) => {
      expect(type).toEqual('X.509');
      expect(mspId).toEqual('Org1MSP');
    }));

  // generated for other tests
  range(11).forEach((blockNum) => {
    it(`queryBlock - ${blockNum}`, async () =>
      fg.queryBlock(fg.getDefaultChannelName(), blockNum).then(async (result) => {
        const fs = require('fs');
        fs.writeFileSync(
          path.join(__dirname, `__generated__/block-${blockNum}.json`),
          JSON.stringify(result, null, 2)
        );
        expect(result?.header).toBeDefined();
        expect(result?.data).toBeDefined();
        expect(result?.metadata).toBeDefined();
      }));
  });

  it('queryChannelHeight', async () =>
    fg
      .queryChannelHeight(fg.getDefaultChannelName())
      .then((result) => expect(typeof result).toBe('number')));

  it('validate with metric server', async () => {
    await waitSecond(2);

    const res = await fetch('http://localhost:9000/metrics');
    expect(res.status).toEqual(200);

    const metricText = await res.text();
    // should return:
    // # HELP enrollment_total Count number of enrolled
    // # TYPE enrollment_total counter
    //   enrollment_total 2 1640367546744
    // # HELP queryBlock_total Count number of queryBlock executed
    // # TYPE queryBlock_total counter
    //   queryBlock_total 1 1640367548673

    expect(metricText).toBeDefined();
  });
});
