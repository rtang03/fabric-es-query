require('dotenv').config({ path: 'src/querydb/__tests__/.env.querydb' });
import fs from 'fs';
import path from 'path';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import fetch from 'isomorphic-unfetch';
import yaml from 'js-yaml';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import type { QueryDb, PlatformConfig } from '../../types';
import {
  createMetricServer,
  isPlatformConfig,
  logger,
  Meters,
  METERS,
  waitForSecond,
} from '../../utils';
import { createQueryDb } from '../createQueryDb';
import { Blocks, Transactions } from '../entities';

let queryDb: QueryDb;
let connection: Connection;
let platformConfig: PlatformConfig;
let metrics: {
  meters: Partial<Meters>;
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
};

const connectionOptions: ConnectionOptions = {
  name: 'default',
  type: 'postgres' as any,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWD,
  database: process.env.DATABASE_DATABASE,
  logging: true,
  synchronize: false,
  dropSchema: false,
  entities: [Blocks],
  connectTimeoutMS: 10000,
};

beforeAll(async () => {
  try {
    metrics = createMetricServer('my-meter', {
      filterMeters: [METERS.ENROLL_COUNT, METERS.QUERYBLOCK_COUNT],
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
      console.error('invalid file format');
      process.exit(1);
    }
  } catch {
    console.error('fail to load file');
    process.exit(1);
  }

  try {
    queryDb = createQueryDb({ logger, connection: createConnection(connectionOptions) });
  } catch {
    console.error('fail to createQueryDb');
    process.exit(1);
  }
});

afterAll(async () => {
  await queryDb.disconnect();
  await waitForSecond(2);
});

describe('query-db tests', () => {
  it('connect', async () =>
    queryDb.connect().then((conn) => {
      connection = conn;
      expect(!!conn).toBeTruthy();
    }));

  it('test', () => {

  })
});
