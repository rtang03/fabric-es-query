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
  channelName: string;
  broadcaster?: WebSocket.Server;
  dev?: boolean; // if true, no job dispatching
  fabric: Partial<FabricGateway>;
  initialMaxSyncHeight?: number;
  initialTimeoutMs: number;
  initialShowStateChanges?: boolean;
  logger: winston.Logger;
  messageCenter?: MessageCenter;
  meters?: Partial<Meters>;
  persist?: boolean;
  queryDb: QueryDb;
  tracer?: Tracer;
};

/**
 *
 * @param initialSyncTime
 * @param channelName
 * @param persist
 * @param fabric
 * @param queryDb
 * @param broadcaster
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
    channelName,
    persist,
    fabric,
    queryDb,
    broadcaster,
    logger,
    dev,
    initialTimeoutMs,
    initialShowStateChanges,
    messageCenter: mCenter,
    initialMaxSyncHeight,
  }
) => {
  // interval for checking job queue
  const executionInterval = 1; // per second
  const NS = 'sync';
  const LAST_JOB = -1;
  // Synchronizing
  const SYNC_START = { type: 'syncJob/syncStart' };
  const syncJobMap = map<number, SyncJob>((id) => ({ id, timestamp: new Date() }));
  // Emit execution action
  const execution$ = interval(executionInterval * 1000).pipe(syncJobMap);
  // End the execution
  const stop$ = new Subject<SyncJob>();
  // When new block arrives
  const newBlock$ = new Subject<SyncJob>();

  let syncTime = initialSyncTime;
  let timeout = initialTimeoutMs;
  let showStateChanges = initialShowStateChanges;
  let currentBatch = 0;
  let currentJob = '';
  let regularSync$ = interval(syncTime * 1000).pipe(syncJobMap);
  let executionSubscription: Subscription;
  let regularSyncSubscription: Subscription;
  let maxSyncHeight = initialMaxSyncHeight || SYNC_ALL_BLOCKS;

  logger.info('=== Preparing synchronizer ===');
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
          channelName,
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

  logger.info('=== synchronizer ok ===');

  return {
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
     * isSyncJobActive
     */
    isSyncJobActive: () => !!regularSyncSubscription,
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

        // counter of dispatching action
        let numberOfDispatch = 0;

        if (!regularSync$ || !newBlock$) {
          logger.error('No available observables. SyncJob will not start');
          return false;
        }

        // emit every 15 sec, or initialSyncTime
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

      regularSyncSubscription?.unsubscribe();
      executionSubscription?.unsubscribe();

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
