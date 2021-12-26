require('dotenv').config({ path: 'src/explorer-db/__tests__/.env.explorerdb' });
import fs from 'fs';
import path from 'path';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import fetch from 'isomorphic-unfetch';
import yaml from 'js-yaml';
import { ConnectionOptions, createConnection } from 'typeorm';
import type { ExplorerDb, PlatformConfig } from '../../types';
import { createMetricServer, isPlatformConfig, logger, Meters, METERS } from '../../utils';
import { createExplorerDb } from '../createExplorerDb';
import { Blocks, Transactions } from '../entities';

let explorerDb: ExplorerDb;
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
  dropSchema: true,
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
    explorerDb = createExplorerDb({ logger, connection: createConnection(connectionOptions) });
  } catch {
    console.error('fail to createExplorerDb');
    process.exit(1);
  }
});

describe('explorer-db tests', () => {
  it('connect', async () => explorerDb.connect().then((ok) => expect(ok).toBeTruthy()));
});
