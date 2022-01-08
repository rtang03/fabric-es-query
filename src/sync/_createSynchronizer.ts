import util from 'util';
import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { interval, map, Subscription, take } from 'rxjs';
import { Connection, Repository } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import { KIND, MSG } from '../message';
import type { FabricGateway, MessageCenter, QueryDb, Synchronizer } from '../types';
import { type Meters } from '../utils';
import { dispatcher } from './dispatcher';
import { Job } from './entities';

type SyncJob = {
  id: number;
  timestamp: Date;
};

export type CreateSynchronizerOption = {
  persist?: boolean;
  initialTimeoutMs?: number;
  initialShowStateChanges?: boolean;
  connection?: Promise<Connection>;
  fabric?: Partial<FabricGateway>;
  queryDb?: QueryDb;
  broadcaster?: WebSocket.Server;
  logger: winston.Logger;
  meters?: Partial<Meters>;
  tracer?: Tracer;
  messageCenter?: MessageCenter;
  dev?: boolean; // if true, no job dispatching
};

export const createSynchronizer: (
  initialSyncTime: number,
  option: CreateSynchronizerOption
) => Synchronizer = (
  initialSyncTime,
  {
    persist,
    fabric,
    queryDb,
    broadcaster,
    connection,
    logger,
    dev,
    initialTimeoutMs,
    initialShowStateChanges,
    messageCenter: mCenter,
  }
) => {
  const NS = 'sync';
  const SYNC_START = { type: 'syncJob/syncStart' };
  const syncJobMap = map<number, SyncJob>((id) => ({ id, timestamp: new Date() }));

  let conn: Connection;
  let jobRepository: Repository<Job>;
  let subscription: Subscription;
  let syncTime = initialSyncTime;
  let timeout = initialTimeoutMs;
  let showStateChanges = initialShowStateChanges;
  let currentBatch = 0;
  let currentJob = '';
  let $jobs = interval(initialSyncTime * 1000).pipe(syncJobMap);

  logger.info('Preparing synchronizer');
  logger.info(`syncTime: ${initialSyncTime}`);
  logger.info(`timeout: ${initialTimeoutMs}`);
  logger.info(`showStateChanges: ${initialShowStateChanges}`);
  logger.info(`persist: ${persist}`);
  logger.info(`broadcaster: ${!!broadcaster}`);

  const performAction = dev
    ? async (payload) => {
      // dummy implementation
      console.log(payload);
      return { status: 'ok', error: null };
    }
    : async (payload, option) => {
      const result = await dispatcher(SYNC_START, {
        fabric,
        queryDb,
        logger,
        messageCenter: mCenter,
        timeout: option?.timeout || initialTimeoutMs,
        showStateChanges:
          option?.showStateChanges === undefined
            ? initialShowStateChanges
            : option.showStateChanges,
      });

      logger.info(`syncJob result: ${result.status} at ${new Date()}`);
      Debug(NS)('sync-result %O', result);
      return result;
    };

  return {
    connect: async () => {
      // sync connection
      if (!persist) throw new Error('connect() is not available');

      try {
        logger.info('connecting database');

        conn = await connection;

        logger.info(`database connected`);
        return conn;
      } catch (e) {
        logger.error(`fail to connect : `, e);
        return null;
      }
    },
    isConnected: async () => {
      if (!persist) throw new Error('isConnected() is not available');

      if (!conn?.isConnected) {
        logger.info(`${NS} is not connected`);
        return false;
      }
      return true;
    },
    disconnect: async () => {
      if (!persist) throw new Error('disconnectSyncDb() is not available');

      await conn.close();
      logger.info(`${NS} disconnectSyncDb`);
    },
    getInfo: () => ({ persist, syncTime, currentJob, timeout, showStateChanges }),
    isSyncJobActive: () => subscription.closed,
    stopAndChangeRequestTimeout: (t) => {
      timeout = t;

      subscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change requestTimeout: ${t}`);
    },
    stopAndChangeShowStateChanges: (s) => {
      showStateChanges = s;

      subscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change requestTimeout: ${s}`);
    },
    stopAndChangeSyncTime: (t) => {
      syncTime = t;

      subscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change syncTime: ${t}`);

      $jobs = interval(t * 1000).pipe(syncJobMap);
    },
    start: async (numberOfExecution) =>
      new Promise((resolve) => {
        // runOnce will wait for completion, before resolve(true);
        // else, will resolve(true) without waiting
        // runOnce is used for jest testing
        const runOnce = numberOfExecution === 1;
        const $execution = numberOfExecution ? $jobs.pipe(take(numberOfExecution)) : $jobs;

        logger.info('⭕️  syncJob start');

        mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_START, broadcast: true, save: false });

        currentBatch++;

        subscription = $execution.subscribe(async ({ id }) => {
          const broadcast = true;
          currentJob = `${currentBatch}-${id}`;

          Debug(`${NS}:start`)('currentJob: %s', currentJob);

          try {
            const result = await performAction(currentJob, { timeout, showStateChanges });

            result?.status === 'ok' &&
            mCenter?.notify({ kind: KIND.SYSTEM, title: MSG.SYNCJOB_OK, broadcast, save: false });

            runOnce && resolve(true);
          } catch (error) {
            logger.error(util.format('fail to run syncStart, %j', error));
          }

          mCenter?.notify({ kind: KIND.ERROR, title: MSG.SYNCJOB_FAIL, broadcast, save: true });
          runOnce && resolve(false);
        });
        subscription.add(() => logger.info('⛔️  syncJob tear down'));

        !runOnce && resolve(true);
      }),
    stop: () => {
      subscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });
    },
    isBackendsReady: async () => {
      try {
        const heightFabric = await fabric.queryChannelHeight(fabric.getDefaultChannelName());

        Debug(`${NS}:isBackendsReady`)('heightFabric: %s', heightFabric);

        if (!heightFabric || !Number.isInteger(heightFabric)) {
          logger.info(`block height /fabric: ${heightFabric}`);
          return false;
        }
        // cannot use heightQuery, as a checking criteria. Because QueryDb is empty, when before any shnc.
        return await queryDb.isConnected();
      } catch (e) {
        logger.error(`fail to isBackendsReady : `, e);
        return null;
      }
    },
    getState: async () => {
      return null;
    },
  };
};
