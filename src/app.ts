require('dotenv').config();
import fs from 'fs';
import http from 'http';
import path from 'path';
import { URL } from 'url';
import util from 'util';
import yaml from 'js-yaml';
import { type ConnectionOptions } from 'typeorm';
import WebSocket from 'ws';
import { FabricWallet } from './fabric/entities';
import { Incident } from './message/entities';
import { createPlatform } from './platform';
import { Blocks, Commit, KeyValue, Transactions } from './querydb/entities';
import type { ConnectionProfile, Platform, PlatformConfig } from './types';
import {
  createHttpServer,
  extractNumberEnvVar,
  extractStringEnvVar,
  isConnectionProfile,
  isPlatformConfig,
  logger,
  waitSecond,
} from './utils';

const PORT = extractNumberEnvVar('PORT') || 3000;
const HOST = extractStringEnvVar('HOST') || 'localhost';
const connectionProfile = extractStringEnvVar('CONNECTION_PROFILE');
const platformConfig = extractStringEnvVar('PLATFORM_CONFIG');

let server: http.Server;
let profile: ConnectionProfile;
let config: PlatformConfig;
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

(async () => {
  logger.info('♨️♨️  Starting server  ♨️♨️');

  /**
   * Step 1: Loading Connection Profile
   */
  logger.info('Loading connection profile');
  try {
    const file = fs.readFileSync(path.join(process.cwd(), connectionProfile));
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

  /**
   * Step 2: Loading Platform Configuration
   */
  logger.info('Loading configuration');
  try {
    const file = fs.readFileSync(path.join(process.cwd(), platformConfig));
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

  // Overriding configuration via env variables
  const channelName = process.env.CHANNEL_NAME;
  const qPort = process.env.QUERYDB_PORT && Number(process.env.QUERYDB_PORT);
  const qHost = process.env.QUERYDB_HOST;
  const qDb = process.env.QUERYDB_DATABASE;
  const qUser = process.env.QUERYDB_USERNAME;
  const qPw = process.env.QUERYDB_PASSWD;
  const logging = process.env.QUERYDB_LOGGING;
  const qLogging = logging === 'true' ? true : logging === 'false' ? false : logging;
  const mPort = process.env.METRICSERVER_PORT && Number(process.env.METRICSERVER_PORT);
  const mHost = process.env.METRICSERVER_HOST;
  const mInt = process.env.METRICSERVER_INTERVAL && Number(process.env.METRICSERVER_INTERVAL);
  const mcPersist = process.env.MCENTER_PERSIST && Boolean(process.env.MCENTER_PERSIST);
  const mcNewCommitEndpoint = process.env.MCENTER_NEW_COMMIT_ENDPOINT;
  const mcNotifyNewCommit =
    process.env.MCENTER_NOTIFY_NEW_COMMIT && Boolean(process.env.MCENTER_NOTIFY_NEW_COMMIT);
  const fOrgAdminId = process.env.FABRIC_ORG_ADMIN_ID;
  const fOrgAdminSecret = process.env.FABRIC_ORG_ADMIN_SECRET;
  const fAsLocalhost = process.env.FABRIC_ASLOCALHOST && Boolean(process.env.FABRIC_ASLOCALHOST);
  const fDiscovery = process.env.FABRIC_DISCOVERY && Boolean(process.env.FABRIC_DISCOVERY);
  const sSyncDuration = process.env.SYNC_DURATION && Number(process.env.SYNC_DURATION);
  const sRequestTimeoutMs = process.env.SYNC_TIMEOUTMS && Number(process.env.SYNC_TIMEOUTMS);
  const sChanges = process.env.SYNC_SHOWSTATECHANGES && Boolean(process.env.SYNC_SHOWSTATECHANGES);
  const sDevMode = process.env.SYNC_DEVMODE && Boolean(process.env.SYNC_DEVMODE);
  const sPersist = process.env.SYNC_PERSIST && Boolean(process.env.SYNC_PERSIST);
  const rTimeout = process.env.REPO_TIMEOUTMS && Number(process.env.REPO_TIMEOUTMS);
  channelName && (config.channelName = channelName);
  qPort && (config.querydb.port = qPort);
  qHost && (config.querydb.host = qHost);
  qDb && (config.querydb.database = qDb);
  qUser && (config.querydb.username = qUser);
  qPw && (config.querydb.password = qPw);
  qLogging && (config.querydb.logging = qLogging);
  mPort && (config.metricserver.port = mPort);
  mHost && (config.metricserver.host = mHost);
  mInt && (config.metricserver.interval = mInt);
  mcPersist !== undefined && (config.messageCenter.persist = mcPersist);
  mcNewCommitEndpoint && (config.messageCenter.newCommitEndpoint = mcNewCommitEndpoint);
  mcNotifyNewCommit && (config.messageCenter.notifyNewCommit = mcNotifyNewCommit);
  fOrgAdminId && (config.fabric.orgAdminId = fOrgAdminId);
  fOrgAdminSecret && (config.fabric.orgAdminSecret = fOrgAdminId);
  fAsLocalhost && (config.fabric.asLocalhost = fAsLocalhost);
  fDiscovery && (config.fabric.discovery = fDiscovery);
  sSyncDuration && (config.sync.syncDuration = sSyncDuration);
  sRequestTimeoutMs && (config.sync.requestTimeoutMs = sRequestTimeoutMs);
  sChanges && (config.sync.showStateChanges = sChanges);
  sDevMode && (config.sync.devMode = sDevMode);
  sPersist && (config.sync.persist = sPersist);
  rTimeout && (config.repo.requestTimeoutMs = rTimeout);

  console.table(config.fabric);
  console.table(config.querydb);
  console.table(config.metricserver);
  console.table(config.messageCenter);
  console.table(config.repo);
  console.table(config.sync);

  /**
   * Step 4: event listeners
   */
  process.on('unhandledRejection', (up: Error) => {
    logger.error('<< Error (unhandledRejection) >>');
    logger.error(up);
  });

  process.on('uncaughtException', (up) => {
    logger.error('<< Error (uncaughtException) >>');
    logger.error(up);
  });

  // Todo: below block throws
  // let connections = [];
  // server.on('connection', (connection) => {
  //   connections.push(connection);
  //   connection.on('close', () => (connections = connections.filter((curr) => curr !== connection)));
  // });

  /**
   * Step 3: Platform
   */
  logger.info('Creating platform');
  let errorMsg = 'fail to create platform';
  try {
    platform = createPlatform({
      connectionName: config.querydb.connectionName,
      profile,
      broadcaster: null, // new Broadcaster(server),
      wsEnabled: config?.messageCenter?.websocketEnabled,
      config,
      logger,
    });
  } catch {
    logger.error(errorMsg);
    process.exit(1);
  }

  errorMsg = 'fail to initialize platform';
  try {
    logger.info('Initializing');
    const isPlatformInit = await platform.initialize();

    if (!isPlatformInit) {
      logger.error(`${errorMsg}; will exit in 30 seconds`);
      logger.error(util.format('connection-profile, %j', profile));
      logger.error(util.format('platform-config, %j', config));
      await waitSecond(30);
      process.exit(1);
    }
  } catch (e) {
    logger.error(e);
    logger.error(errorMsg);
    logger.error(util.format('connection-profile, %j', profile));
    logger.error(util.format('platform-config, %j', config));
    process.exit(1);
  }

  try {
    logger.info('Starting sync');
    const isSyncStarted = await platform.getSynchronizer().start();
    errorMsg = 'fail to sync-start';
    if (!isSyncStarted) {
      logger.error(`❌  ${errorMsg}. The platform will start WITHOUT synchonrization.`);
      logger.error(util.format('connection-profile, %j', profile));
      logger.error(util.format('platform-config, %j', config));
    }
  } catch (e) {
    logger.error(e);
    logger.error(`❌  ${errorMsg}. The platform will start WITHOUT synchonrization.`);
    logger.error(util.format('connection-profile, %j', profile));
    logger.error(util.format('platform-config, %j', config));
  }

  /**
   * Step 4: Http server
   */
  logger.info('Loading http server');
  try {
    server = (await createHttpServer({ platform, logger })).app;
  } catch (error) {
    logger.error(util.format('❌  An error occurred while createHttpserver: %j', error));
    process.exit(1);
  }

  logger.info('Platform initialized');

  /**
   * Start Server
   */
  server.listen(PORT, () => {
    logger.info(`🚀  rest server started at port: ${HOST}:${PORT}`);
  });
})().catch((error) => {
  logger.error(util.format('❌  fail to start app.js, %j', error));
  process.exit(1);
});
