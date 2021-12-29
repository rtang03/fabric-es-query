require('dotenv').config();
import fs from 'fs';
import http from 'http';
import path from 'path';
import { URL } from 'url';
import util from 'util';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import yaml from 'js-yaml';
import { parseInt } from 'lodash';
import WebSocket from 'ws';
import { createPlatform } from './platform';
import type { ConnectionProfile, Platform, PlatformConfig } from './types';
import {
  createHttpServer,
  createMetricServer,
  isConnectionProfile,
  isPlatformConfig,
  logger,
  type Meters,
} from './utils';

const PORT: number = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000;
const HOST = process.env.HOST || 'localhost';

let server: http.Server;
let profile: ConnectionProfile;
let config: PlatformConfig;
let metrics: {
  meters: Partial<Meters>;
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
};
let platform: Platform;

class Broadcaster extends WebSocket.Server {
  constructor(bServer: any) {
    super({ server: bServer });
    this.on('connection', function connection(ws, req) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const location = new URL(req.url).host;
      this.on('message', (message) => {
        logger.info('received: %s, %s', location, message);
      });
    });
  }

  broadcast(data) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        logger.debug('Broadcast >> %j', data);
        client.send(JSON.stringify(data));
      }
    });
  }
}

const start = async () => {
  logger.info('♨️♨️  Starting server  ♨️♨️');

  logger.info('Loading connection profile');
  try {
    const file = fs.readFileSync(path.join(process.cwd(), process.env.CONNECTION_PROFILE));
    const loadedFile: unknown = yaml.load(file);
    if (isConnectionProfile(loadedFile)) profile = loadedFile;
    else {
      logger.error('invalid connection-profile.yaml');
      process.exit(1);
    }
  } catch (error) {
    logger.error('fail to read connection profile');
    process.exit(1);
  }

  logger.info('Loading configuration');
  try {
    const file = fs.readFileSync(path.join(process.cwd(), process.env.PLATFORM_CONFIG));
    const loadedFile: unknown = yaml.load(file);
    if (isPlatformConfig(loadedFile)) config = loadedFile;
    else {
      logger.error('invalid platform-config.yaml');
      process.exit(1);
    }
  } catch (error) {
    logger.error('fail to read configuation');
    process.exit(1);
  }

  // Overriding configuration
  const qPort = process.env.QUERYDB_PORT && parseInt(process.env.QUERYDB_PORT, 10);
  const qHost = process.env.QUERYDB_HOST;
  const qDb = process.env.QUERYDB_DATABASE;
  const qUser = process.env.QUERYDB_USERNAME;
  const qPw = process.env.QUERYDB_PASSWD;
  const mPort = process.env.METRICSERVER_PORT && parseInt(process.env.METRICSERVER_PORT, 10);
  const mHost = process.env.METRICSERVER_HOST;
  const mInt = process.env.METRICSERVER_INTERVAL && parseInt(process.env.METRICSERVER_INTERVAL, 10);
  qPort && (config.querydb.port = qPort);
  qHost && (config.querydb.host = qHost);
  qDb && (config.querydb.database = qDb);
  qUser && (config.querydb.username = qUser);
  qPw && (config.querydb.password = qPw);
  mPort && (config.metricserver.port = mPort);
  mHost && (config.metricserver.host = mHost);
  mInt && (config.metricserver.interval = mInt);
  logger.info('platform-config : ', config);

  logger.info('Loading metric server');
  try {
    metrics = createMetricServer('queryside-meter', {
      exporterHost: config.metricserver.host,
      exporterPort: config.metricserver.port,
      interval: config.metricserver.interval,
      logger,
    });
  } catch (error) {
    logger.error('fail to start metric server');
    process.exit(1);
  }

  logger.info('Loading http server');
  try {
    const { app } = await createHttpServer();
    server = app;
  } catch (error) {
    logger.error(util.format('❌  An error occurred while createHttpserver: %j', error));
    process.exit(1);
  }

  logger.info('Loading platform');
  platform = createPlatform({
    profile,
    broadcaster: new Broadcaster(server),
    wsEnabled: true,
    config,
    logger,
  });
  await platform.initialize();

  logger.info('Platform initialized');

  server.listen(PORT, () => {
    logger.info(`🚀  rest server started at port: http://${HOST}:${PORT}`);
  });
};

let connections = [];

server.on('connection', (connection) => {
  connections.push(connection);
  connection.on('close', () => (connections = connections.filter((curr) => curr !== connection)));
});

process.on('unhandledRejection', (up: Error) => {
  logger.error('<< Error (unhandledRejection) >>');
  logger.error(up);
});

process.on('uncaughtException', (up) => {
  logger.error('<< Error (uncaughtException) >>');
  logger.error(up);
});

await start();
