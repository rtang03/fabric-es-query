import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { interval, map, Subject, Subscription, merge } from 'rxjs';
import { Connection } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import { KIND, MSG } from '../message';
import type { FabricGateway, MessageCenter, QueryDb, Synchronizer, SyncJob } from '../types';
import { type Meters, waitSecond } from '../utils';
import { SYNC_ALL_BLOCKS } from './constants';
import { dispatcher, type DispatcherResult } from './dispatcher';
import { store } from './store';

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
  initialMaxSyncHeight?: number;
  dev?: boolean; // if true, no job dispatching
};

/**
 *
 * @param initialSyncTime
 * @param persist
 * @param fabric
 * @param queryDb
 * @param broadcaster
 * @param connection
 * @param logger
 * @param dev
 * @param initialTimeoutMs
 * @param initialShowStateChanges
 * @param mCenter
 * @param initialMaxSyncHeight
 */
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
    initialMaxSyncHeight,
  }
) => {
  // interval for checking job queue
  const executionInterval = 1;
  const NS = 'sync';
  const LAST_JOB = -1;
  const SYNC_START = { type: 'syncJob/syncStart' };
  const syncJobMap = map<number, SyncJob>((id) => ({ id, timestamp: new Date() }));
  const execution$ = interval(executionInterval * 1000).pipe(syncJobMap);
  const stop$ = new Subject<SyncJob>();
  const newBlock$ = new Subject<SyncJob>();

  let conn: Connection;
  let syncTime = initialSyncTime;
  let timeout = initialTimeoutMs;
  let showStateChanges = initialShowStateChanges;
  let currentBatch = 0;
  let currentJob = '';
  let regularSync$ = interval(syncTime * 1000).pipe(syncJobMap);
  let executionSubscription: Subscription;
  let regularSyncSubscription: Subscription;
  let maxSyncHeight = initialMaxSyncHeight || SYNC_ALL_BLOCKS;

  logger.info('Preparing synchronizer');
  logger.info(`syncTime: ${initialSyncTime}`);
  logger.info(`maxSyncHeight: ${maxSyncHeight}`);
  logger.info(`timeout: ${initialTimeoutMs}`);
  logger.info(`showStateChanges: ${initialShowStateChanges}`);
  logger.info(`persist: ${persist}`);
  logger.info(`broadcaster: ${!!broadcaster}`);

  /**
   * perform
   */
  const perform: (
    payload,
    option?: { timeout: number; showStateChanges: boolean; maxSyncHeight?: number }
  ) => Promise<DispatcherResult> = dev
    ? async (payload) => {
        // dummy implementation for dev/test
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
          maxSyncHeight: option.maxSyncHeight,
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
    /**
     * connect
     */
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
    /**
     * disconnect
     */
    disconnect: async () => {
      if (!persist) throw new Error('disconnectSyncDb() is not available');

      await conn.close();
      logger.info(`${NS} disconnectSyncDb`);
    },
    /**
     * getInfo
     */
    getInfo: () => ({ persist, syncTime, currentJob, timeout, showStateChanges, maxSyncHeight }),
    /**
     * getNewBlockObs
     */
    getNewBlockObs: () => newBlock$,
    /**
     * isBackendsReady
     */
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
    /**
     * isConnected
     */
    isConnected: async () => {
      if (!persist) throw new Error('isConnected() is not available');

      if (!conn?.isConnected) {
        logger.info(`${NS} is not connected`);
        return false;
      }
      return true;
    },
    /**
     * isSyncJobActive
     */
    isSyncJobActive: () => regularSyncSubscription.closed,
    /**
     * setMaxSyncHeight
     * @param maxHeight
     */
    setMaxSyncHeight: (maxHeight) => (maxSyncHeight = maxHeight),
    /**
     * start
     * @param numberOfExecution
     */
    start: async (numberOfExecution) =>
      new Promise((resolve) => {
        const broadcast = true;
        let numberOfDispatch = 0;

        // emit every 15 min, or initialSyncTime
        regularSyncSubscription = merge(regularSync$, newBlock$).subscribe(({ id, timestamp }) => {
          Debug(NS)(`dispatch regular syncJob, ${id} at ${timestamp}`);

          store.dispatch({ type: 'queue/newJob', payload: { id, kind: 'regular' } });
        });
        regularSyncSubscription.add(() => {
          logger.info('⛔️  regularSync tear down');

          mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast });
        });

        logger.info('⭕️  syncJob start');

        mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_START, broadcast });

        // batch number increase for every start / restart
        currentBatch++;

        // emit every second
        executionSubscription = merge(execution$, stop$).subscribe(async ({ id, timestamp }) => {
          const { workInProgress, queued } = store.getState().queue;
          currentJob = `${currentBatch}-${id}`;

          // used to exit the execution loop
          if (id === LAST_JOB) return resolve(false);

          // checking if there is queue job
          if (!workInProgress && ~~queued.length) {
            Debug(NS)(`queued job found; dispatch ${currentJob}`);

            const option = { timeout, showStateChanges };
            maxSyncHeight !== SYNC_ALL_BLOCKS && (option['maxSyncHeight'] = maxSyncHeight);

            // dispatch once
            await store.dispatch.queue.dispatchSyncJob({
              action: perform(currentJob, option),
              option: { logger },
            });

            numberOfDispatch++;

            // exit start(), when numberOfExecution reaches
            // numbeOfExecution is undefined, it will NEVER resolve
            if (numberOfExecution === numberOfDispatch) {
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
    /**
     * stop
     */
    stop: async () => {
      stop$.next({ id: LAST_JOB });

      await waitSecond(1);

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });
    },
    /**
     * stopAndChangeRequestTimeout
     * @param t
     */
    stopAndChangeRequestTimeout: (t) => {
      stop$.next({ id: LAST_JOB });
      timeout = t;

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change requestTimeout: ${t}`);
    },
    /**
     * stopAndChangeShowStateChanges
     * @param s
     */
    stopAndChangeShowStateChanges: (s) => {
      stop$.next({ id: LAST_JOB });
      showStateChanges = s;

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change requestTimeout: ${s}`);
    },
    /**
     * stopAndChangeSyncTime
     * @param t
     */
    stopAndChangeSyncTime: (t) => {
      stop$.next({ id: LAST_JOB });
      syncTime = t;

      regularSyncSubscription.unsubscribe();
      executionSubscription.unsubscribe();

      mCenter?.notify({ kind: KIND.INFO, title: MSG.SYNC_STOP, broadcast: true, save: false });

      logger.info(`🛑  change syncTime: ${t}`);

      regularSync$ = interval(t * 1000).pipe(syncJobMap);
    },
    /**
     * syncBlocksByEntityName
     * @param entityName
     */
    syncBlocksByEntityName: async (entityName) => {
      return Promise.reject('Not yet implemented');
    },
    /**
     * syncBlocksByEntityNameEntityId
     * @param entityName
     * @param entityId
     */
    syncBlocksByEntityNameEntityId: async (entityName, entityId) => {
      return Promise.reject('Not yet implemented');
    },
  };
};
