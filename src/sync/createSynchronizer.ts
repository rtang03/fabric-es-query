import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { interval, map, Subject, Subscription, take, merge } from 'rxjs';
import { Connection, Repository } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import { KIND, MSG } from '../message';
import type { FabricGateway, MessageCenter, QueryDb, Synchronizer } from '../types';
import { type Meters, waitSecond } from '../utils';
import { dispatcher, DispatcherResult } from './dispatcher';
import { Job } from './entities';
import { store } from './store';

type SyncJob = {
  id: number;
  timestamp?: Date;
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
  const executionInterval = 1;
  const NS = 'sync';
  const SYNC_START = { type: 'syncJob/syncStart' };
  const syncJobMap = map<number, SyncJob>((id) => ({ id, timestamp: new Date() }));
  const execution$ = interval(executionInterval * 1000).pipe(syncJobMap);
  const stop$ = new Subject<SyncJob>();

  let conn: Connection;
  let jobRepository: Repository<Job>;
  let syncTime = initialSyncTime;
  let timeout = initialTimeoutMs;
  let showStateChanges = initialShowStateChanges;
  let currentBatch = 0;
  let currentJob = '';
  let regularSync$ = interval(syncTime * 1000).pipe(syncJobMap);
  let executionSubscription: Subscription;
  let regularSyncSubscription: Subscription;

  logger.info('Preparing synchronizer');
  logger.info(`syncTime: ${initialSyncTime}`);
  logger.info(`timeout: ${initialTimeoutMs}`);
  logger.info(`showStateChanges: ${initialShowStateChanges}`);
  logger.info(`persist: ${persist}`);
  logger.info(`broadcaster: ${!!broadcaster}`);

  const performAction: (payload, option?) => Promise<DispatcherResult> = dev
    ? async (payload) => {
        // dummy implementation
        console.log('test-', payload);

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
    isSyncJobActive: () => regularSyncSubscription.closed,
    stopAndChangeRequestTimeout: (t) => {
      stop$.next({ id: -1 });
      timeout = t;

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change requestTimeout: ${t}`);
    },
    stopAndChangeShowStateChanges: (s) => {
      stop$.next({ id: -1 });
      showStateChanges = s;

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change requestTimeout: ${s}`);
    },
    stopAndChangeSyncTime: (t) => {
      stop$.next({ id: -1 });
      syncTime = t;

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change syncTime: ${t}`);

      regularSync$ = interval(t * 1000).pipe(syncJobMap);
    },
    start: async (numberOfExecution) =>
      new Promise((resolve) => {
        // runOnce will wait for completion, before resolve(true);
        // else, will resolve(true) without waiting
        // runOnce is used for jest testing
        const broadcast = true;

        // emit by numberOfExecution
        // const sync$ = numberOfExecution ? regularSync$.pipe(take(numberOfExecution)) : regularSync$;

        // emit every 15 min, or initialSyncTime
        regularSyncSubscription = regularSync$.subscribe(({ id, timestamp }) => {
          Debug(NS)(`dispatch regular syncJob, ${id} at ${timestamp}`);

          store.dispatch({ type: 'queue/newJob', payload: { id, kind: 'regular' } });
        });
        regularSyncSubscription.add(() => {
          logger.info('⛔️  regularSync tear down');

          mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast });
        });

        logger.info('⭕️  syncJob start');

        mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_START, broadcast });

        currentBatch++;

        // emit every second
        executionSubscription = merge(execution$, stop$).subscribe(async ({ id, timestamp }) => {
          const { workInProgress, queued } = store.getState().queue;
          currentJob = `${currentBatch}-${id}`;

          // used to exit the execution loop
          if (id < 0) return resolve(false);

          // checking if there is queue job
          if (!workInProgress && ~~queued.length) {
            Debug(NS)(`queued job found; dispatch ${currentJob}`);

            // dispatch once
            await store.dispatch.queue.dispatchSyncJob({
              action: performAction(currentJob, { timeout, showStateChanges }),
              option: { logger },
            });

            if (numberOfExecution === id + 1) {
              regularSyncSubscription.unsubscribe();

              resolve(true);
            }
          }
        });
        executionSubscription.add(() => {
          logger.info('⛔️  execution tear down');

          mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast });
        });
      }),
    stop: async () => {
      stop$.next({ id: -1 });

      await waitSecond(1);

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();
      // stop$.unsubscribe();

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
