require('dotenv').config({ path: 'src/querydb/__tests__/.env.querydb' });
import fs from 'fs';
import path from 'path';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import fetch from 'isomorphic-unfetch';
import yaml from 'js-yaml';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import type { QueryDb, PlatformConfig } from '../../types';
import {
  createMetricServer,
  isPlatformConfig,
  logger,
  type Meters,
  METERS,
  waitForSecond,
} from '../../utils';
import { createQueryDb } from '../createQueryDb';
import { Blocks, Transactions } from '../entities';
import block0 from './__utils__/data/block-0.json';

let queryDb: QueryDb;
let defaultConnection: Connection;
let testConnection: Promise<Connection>;
let testConnectionOptions: ConnectionOptions;
let platformConfig: PlatformConfig;
let metrics: {
  meters: Partial<Meters>;
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
};

const metricsOn = true;
const schema = 'querydbtest';
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
  entities: [Blocks, Transactions],
  connectTimeoutMS: 10000,
};

const constructBlockObj = (block: Blocks, data: any) => {
  block.blocknum = data.blocknum;
  block.datahash = data.datahash;
  block.prehash = data.prehash;
  block.txcount = data.txcount;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  block.createdt = new Date(data.createdt);
  block.blockhash = data.blockhash;
  block.blksize = data.blksize;
  return block;
};

beforeAll(async () => {
  try {
    metrics = createMetricServer('my-meter', {
      interval: 1000,
      exporterHost: 'localhost',
      exporterPort: 9000,
      filterMeters: [METERS.QUERYDB_CONNECTED_COUNT, METERS.QUERYDB_BLOCKHEIGHT],
      logger,
    });
  } catch (e) {
    console.error(e);
    console.error('fail to create MeterProvider');
    process.exit(1);
  }

  try {
    const pathToConfig = path.join(process.cwd(), process.env.PLATFORM_CONFIG);
    const file = fs.readFileSync(pathToConfig);
    const loadedFile: unknown = yaml.load(file);
    if (isPlatformConfig(loadedFile)) platformConfig = loadedFile;
    else {
      console.log(loadedFile);
      console.error('invalid file format');
      process.exit(1);
    }
  } catch {
    console.error('fail to load file');
    process.exit(1);
  }

  try {
    defaultConnection = await createConnection(connectionOptions);
    await defaultConnection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    testConnectionOptions = {
      ...connectionOptions,
      ...{ name: 'querydbtest', schema, synchronize: true, dropSchema: true },
    };
    testConnection = createConnection(testConnectionOptions);
    queryDb = createQueryDb({
      logger,
      connection: testConnection,
      nonDefaultSchema: schema,
      metricsOn,
      meters: metrics.meters,
    });
  } catch {
    logger.error('fail to createQueryDb');
    process.exit(1);
  }
});

afterAll(async () => {
  await defaultConnection.close();
  await queryDb.disconnect();
  await metrics.meterProvider.shutdown();
  await waitForSecond(2);
});

describe('query-db tests', () => {
  it('connect', async () =>
    queryDb.connect().then((conn) => {
      if (!conn) {
        console.error('fail to connect: connectionOptions', testConnectionOptions);
        process.exit(1);
      }
    }));

  it('getBlockHeight #1: no data', async () =>
    queryDb.getBlockHeight().then((result) => expect(result).toBeNull()));

  it('insertBlock', async () => {
    const block = new Blocks();

    const result = await queryDb.insertBlock(constructBlockObj(block, block0));
    console.log(result);
  });

  it('getBlockHeight #2', async () =>
    queryDb.getBlockHeight().then((result) => {
      console.log(result);
      return true;
    }));

  it('validate with metric server', async () => {
    await waitForSecond(2);
    const res = await fetch('http://localhost:9000/metrics');
    expect(res.status).toEqual(200);

    const metricText = await res.text();
    console.log(metricText);

    expect(metricText).toBeDefined();
  });
});
