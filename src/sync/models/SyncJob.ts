import { createModel } from '@rematch/core';
import Debug from 'debug';
import { isEqual, range, takeRight, tail } from 'lodash';
import { KIND, MSG } from '../../message';
import { parseWriteSet } from '../../querydb';
import { Blocks, Commit, Transactions } from '../../querydb/entities';
import { withTimeout, waitSecond } from '../../utils';
import type { TAction } from '../dispatcher';
import type { RootModel } from '.';

const channelName = process.env.CHANNEL_NAME;

type TSyncJob = 'sync' | 'arrival' | 'idle';
type TStatus = 'active' | 'error' | 'none' | 'ok';

type SyncJobState = {
  kind: TSyncJob;
  alias?: string;
  tx_id: string;
  running: boolean;
  startTime: Date;
  lastModified: Date;
  status: TStatus;
  data?: any;
  error?: any;
  maxHeightFabric?: number;
  maxHeightQuery?: number;
  maxSyncHeight?: number;
  missingBlocks?: number[];
  validated?: boolean;
  queued?: number[];
  failed?: number[];
  completed?: number[];
  blockHasCommit?: number[];
  blockHasNoCommit?: number[];
  unverifiedBlockFound?: number[];
  unverifiedBlockDeleted?: number[];
};

const TEMPLATE: SyncJobState = {
  kind: 'idle' as TSyncJob,
  running: false,
  alias: 'step0',
  tx_id: null,
  startTime: null,
  lastModified: null,
  data: null,
  status: 'none' as TStatus,
  error: null,
  maxHeightFabric: null,
  maxHeightQuery: null,
  maxSyncHeight: null,
  missingBlocks: null,
  validated: null,
  completed: [],
  failed: [],
  queued: [],
  blockHasCommit: [],
  blockHasNoCommit: [],
  unverifiedBlockFound: [],
  unverifiedBlockDeleted: [],
};

const NS = 'sync';

/**
 * Execution of one syncJob
 */
export const syncJob = createModel<RootModel>()({
  state: TEMPLATE as SyncJobState,
  reducers: {
    failed: (state, [error, alias]: [error: any, alias?: string]) => ({
      ...state,
      alias,
      status: 'error',
      error: error.message,
      lastModified: new Date(),
      running: false,
    }),
    init: (state, [tx_id, alias]: [tx_id: string, alias?: string]) => {
      const startTime = new Date();
      return {
        ...TEMPLATE,
        kind: 'sync' as TSyncJob,
        alias,
        tx_id,
        running: true,
        startTime,
        lastModified: startTime,
        status: 'active' as TStatus,
      };
    },
    reset: (state, [tx_id, alias]: [tx_id: string, alias?: string]) => ({
      ...TEMPLATE,
      tx_id,
      alias,
    }),
    setAlias: (state, alias: string) => ({
      ...state,
      alias,
      lastModified: new Date(),
    }),
    setBlockHasCommit: (state, [blocknum, alias]: [blocknum: number, alias?: string]) => ({
      ...state,
      alias,
      blockHasCommit: [...state.blockHasCommit, blocknum],
      lastModified: new Date(),
    }),
    setBlockHasNoCommit: (state, [blocknum, alias]: [blocknum: number, alias?: string]) => ({
      ...state,
      alias,
      blockHasNoCommit: [...state.blockHasNoCommit, blocknum],
      lastModified: new Date(),
    }),
    setFailed: (state, [failed, alias]: [failed: number, alias?: string]) => ({
      ...state,
      alias,
      failed: [...state.failed, failed],
      lastModified: new Date(),
    }),
    setCompleted: (state, [completed, alias]: [completed: number, alias?: string]) => ({
      ...state,
      alias,
      completed: [...state.completed, completed],
      lastModified: new Date(),
    }),
    setData: (state, [data, alias]: [data: any, alias?: string]) => ({
      ...state,
      alias,
      data,
      lastModified: new Date(),
    }),
    setMaxHeightFabric: (
      state,
      [maxHeightFabric, alias]: [maxHeightFabric: number, alias?: string]
    ) => ({
      ...state,
      alias,
      maxHeightFabric,
      lastModified: new Date(),
    }),
    setMaxHeightQuerydb: (
      state,
      [maxHeightQuery, alias]: [maxHeightQuery: number, alias?: string]
    ) => ({
      ...state,
      alias,
      maxHeightQuery,
      lastModified: new Date(),
    }),
    setMaxSyncHeight: (state, [maxSyncHeight, alias]) => ({
      ...state,
      alias,
      maxSyncHeight,
      lastModified: new Date(),
    }),
    setMissingBlocks: (
      state,
      [missingBlocks, alias]: [missingBlocks: number[], alias?: string]
    ) => ({
      ...state,
      alias,
      missingBlocks,
      lastModified: new Date(),
    }),
    setQueued: (state, [queued, alias]: [queued: any, alias?: string]) => ({
      ...state,
      alias,
      queued,
      lastModified: new Date(),
    }),
    setStatus: (state, [status, alias]: [status: TStatus, alias?: string]) => ({
      ...state,
      alias,
      status,
      lastModified: new Date(),
      running: state.running && status === 'ok' ? false : state.running,
    }),
    setUnverifiedBlockFound: (
      state,
      [unverifiedBlockFound, alias]: [unverifiedBlockFound: number[], alias?: string]
    ) => ({
      ...state,
      alias,
      unverifiedBlockFound,
      lastModified: new Date(),
    }),
    setUnverifiedBlockDeleted: (state, [blocknum, alias]: [blocknum: number, alias?: string]) => ({
      ...state,
      alias,
      unverifiedBlockDeleted: [...state.unverifiedBlockDeleted, blocknum],
      lastModified: new Date(),
    }),
    setValidated: (state, [validated, alias]: [validated: boolean, alias?: string]) => ({
      ...state,
      alias,
      validated,
      lastModified: new Date(),
    }),
  },
  effects: (dispatch) => ({
    wait5Second: async (payload: TAction['payload']) => {
      dispatch.syncJob.init([payload.tx_id, 'step1:init']);
      await waitSecond(5);
      dispatch.syncJob.setStatus(['ok', 'step2:setStatus(ok)']);
      dispatch.syncJob.reset([payload.tx_id, 'step99:result']);
      return true;
    },
    syncStart: async (payload: TAction['payload']) => {
      const me = 'syncStart';
      const logger = payload?.option?.logger;
      const fabric = payload?.option?.fabric;
      const queryDb = payload?.option?.queryDb;
      const mCenter = payload?.option?.messageCenter;
      const timeout = payload?.option?.timeout || 10000;
      const maxSyncHeight = payload?.option?.maxSyncHeight;
      const notifyMessageCenterWhenError = (blocknum: number) =>
        mCenter?.notify({
          kind: KIND.ERROR,
          title: MSG.SYNCJOB_FAIL,
          desc: `error in ${blocknum}`,
          error: new Error(`error in ${blocknum}`),
          broadcast: true,
          save: true,
        });

      if (!fabric) throw new Error('fabric-gateway not found');
      if (!queryDb) throw new Error('queryDb not found');
      if (!channelName) throw new Error('channelName not found');

      logger?.info(`=== redux-effect: ${me} ===`);

      let heightFabric: number;
      let heightQuerydb: number;
      let missingBlocks: number[];

      dispatch.syncJob.init([payload.tx_id, 'step1:init']);

      const catchErrorAndDispatchFailure = (currentStep, e: any, errorMessage: string) => {
        logger.error(errorMessage);
        logger.error(e);

        if (e instanceof Error && e.message === 'timeout')
          dispatch.syncJob.failed([e, `${currentStep}:failed`]);
        else dispatch.syncJob.failed([new Error(errorMessage), `${currentStep}:failed`]);
      };

      let errorMsg: string;

      /**
       * step 0a: check unverified block
       */
      let CURRENT = 'step0a';
      let unverified: number[];
      errorMsg = 'fail to find unverified blocks';

      try {
        unverified = await withTimeout(queryDb.findUnverified(), timeout);

        Debug(NS)('step0a: unverified blocks, %s', unverified.toString());

        if (!unverified) {
          logger.error(errorMsg);
          dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
          return;
        }
      } catch (e) {
        catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
        return;
      }
      dispatch.syncJob.setUnverifiedBlockFound([unverified, `${CURRENT}:setUnverifiedBlockFound`]);

      /**
       * step 0b: remove unverified block
       */
      CURRENT = 'step0b';
      let removedUnverifiedBlockResult;

      if (isEqual(unverified, [])) logger.info('no unverified blocks');

      for await (const blocknum of unverified) {
        errorMsg = `fail to remove unverified block ${blocknum}`;
        try {
          removedUnverifiedBlockResult = await withTimeout(
            queryDb.removeUnverifiedBlock(blocknum),
            timeout
          );

          if (!removedUnverifiedBlockResult) {
            logger.error(errorMsg);

            dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
            return;
          }
        } catch (e) {
          catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
          return;
        }
        dispatch.syncJob.setUnverifiedBlockDeleted([
          blocknum,
          `${CURRENT}:setUnverifiedBlockDeleted`,
        ]);
      }

      /**
       * step 1: get block height from live Fabric
       */
      CURRENT = 'step1';
      errorMsg = 'invalid blockheight / fabric';
      try {
        heightFabric = await withTimeout(
          fabric.queryChannelHeight(fabric.getDefaultChannelName()),
          timeout
        );

        Debug(NS)(`current heightFabric: ${heightFabric}`);
        Debug(NS)(`configured maxSyncHeight: ${maxSyncHeight}`);

        // do syncJob, up to maxSyncHeight
        if (maxSyncHeight && heightFabric >= maxSyncHeight) {
          heightFabric = maxSyncHeight;

          dispatch.syncJob.setMaxSyncHeight([maxSyncHeight, `${CURRENT}:setMaxSyncHeight`]);
        }

        Debug(NS)('step1: heightFabric %s', heightFabric);

        if (!heightFabric) {
          logger.error(errorMsg);
          dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
          return;
        }
      } catch (e) {
        logger.error(e);
        catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
        return;
      }

      /**
       * step 2: set block height
       */
      CURRENT = 'step2';
      dispatch.syncJob.setMaxHeightFabric([heightFabric, `${CURRENT}:setMaxHeightFabric`]);

      /**
       * step 3: get block height from queryDb
       */
      CURRENT = 'step3';
      errorMsg = 'invalid blockheight / queydb';
      try {
        heightQuerydb = await withTimeout(queryDb.getBlockHeight(), timeout);

        Debug(NS)('step 3: heightQuerydb %s', heightQuerydb);

        // Notice heightQuerydb is null, when querydb is initially setup. And, that is NORMAL
      } catch (e) {
        catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
        return;
      }
      dispatch.syncJob.setMaxHeightQuerydb([heightQuerydb, 'step3:setMaxHeightQuerydb']);

      /**
       * step 4: find missing block
       */
      CURRENT = 'step4';
      errorMsg = 'invalid missingblocks';
      try {
        missingBlocks = await withTimeout(queryDb.findMissingBlock(heightFabric + 1), timeout);

        Debug(NS)('step 4: missingBlocks %O', missingBlocks);

        if (!missingBlocks) {
          logger.error(errorMsg);
          dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
          return;
        }
      } catch (e) {
        catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
        return;
      }
      dispatch.syncJob.setMissingBlocks([missingBlocks, `${CURRENT}:setMissingBlocks`]);

      /**
       * Step 5: validated
       */
      CURRENT = 'step5';
      const derivedMissingBlocks = takeRight(
        range(heightFabric + 1),
        heightFabric - heightQuerydb + 1
      );

      Debug(NS)('step 5: derivedMissingBlocks %O', derivedMissingBlocks);

      dispatch.syncJob.setValidated([
        isEqual(derivedMissingBlocks, missingBlocks),
        `${CURRENT}:setValidated`,
      ]);

      let queued = [...missingBlocks];

      for await (const blocknum of missingBlocks) {
        let block;
        let processedBlock: Blocks;
        let txArray: Partial<Transactions>[];
        let txInserted: Transactions;

        /**
         * step 6a: set queue
         */
        CURRENT = 'step6a';
        dispatch.syncJob.setQueued([queued, `${CURRENT}:setQueued`]);

        /**
         * step 6b: query missing block from fabric
         */
        CURRENT = 'step6b';
        errorMsg = 'fail to queryBlock';
        try {
          block = await withTimeout(fabric.queryBlock(channelName, blocknum), timeout);

          if (!block) {
            notifyMessageCenterWhenError(blocknum);

            logger.error(`${errorMsg} at ${blocknum}`);

            Debug(NS)('step 6b: null block is detect. Please explore blocknum %s', blocknum);

            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
            dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
            return;
          }
        } catch (e) {
          notifyMessageCenterWhenError(blocknum);

          dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);

          catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
          return;
        }
        dispatch.syncJob.setData([block, `${CURRENT}:setData`]);

        /**
         * step 6c: process block
         */
        CURRENT = 'step6c';
        errorMsg = 'fail to process block';
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const result = fabric.processBlockEvent(block);

          if (!result?.[0] || !result?.[1]) {
            notifyMessageCenterWhenError(blocknum);

            logger.error(`${errorMsg} at ${blocknum}`);

            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
            dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
            return;
          }
          [processedBlock, txArray] = result;
        } catch (e) {
          notifyMessageCenterWhenError(blocknum);

          dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);

          catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
          return;
        }
        dispatch.syncJob.setAlias(`${CURRENT}:setAlias`);

        /**
         * step 6d: insert block
         */
        CURRENT = 'step6d';
        errorMsg = 'fail to insert block';
        try {
          const data = new Blocks();
          data.setData(processedBlock);
          const result = await withTimeout(queryDb.insertBlock(data), timeout);

          if (!result) {
            notifyMessageCenterWhenError(blocknum);

            logger.error(`${errorMsg} at ${blocknum}`);

            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
            dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
            return;
          }
        } catch (e) {
          notifyMessageCenterWhenError(blocknum);

          dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);

          catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
          return;
        }

        for (const inputTransaction of txArray) {
          /**
           * step 6e: insert tx
           */
          CURRENT = 'step6e';
          errorMsg = 'fail to insert tx';
          try {
            const data = new Transactions();

            data.setData(inputTransaction);

            txInserted = await withTimeout(queryDb.insertTransaction(data), timeout);

            if (!txInserted) {
              notifyMessageCenterWhenError(blocknum);

              logger.error(`${errorMsg} at ${blocknum}`);

              dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
              dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
              return;
            }
          } catch (e) {
            notifyMessageCenterWhenError(blocknum);

            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);

            catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
            return;
          }

          /**
           * step 6f: insert commit if found; or else, continue.
           */
          CURRENT = 'step6f';
          errorMsg = 'fail to insert commit';
          try {
            const inputCommit = parseWriteSet(txInserted, logger);
            if (inputCommit) {
              dispatch.syncJob.setBlockHasCommit([blocknum, `${CURRENT}:setBlockHasCommit`]);

              const data = new Commit();
              data.setData(inputCommit);
              const result = await queryDb.insertCommit(data);

              if (!result) {
                notifyMessageCenterWhenError(blocknum);

                logger.error(`${errorMsg} at ${blocknum}`);

                dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
                dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
                return;
              }
            } else
              dispatch.syncJob.setBlockHasNoCommit([blocknum, `${CURRENT}:setBlockHasNoCommit`]);
          } catch (e) {
            notifyMessageCenterWhenError(blocknum);

            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);

            catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
            return;
          }

          /**
           * step 6g: update KeyValue table InsertedBlock
           */
          CURRENT = 'step6g';
          errorMsg = 'fail to update KeyValue table';
          try {
            const result = await withTimeout(
              queryDb.updateInsertedBlockKeyValue(blocknum),
              timeout
            );

            if (!result) {
              notifyMessageCenterWhenError(blocknum);

              logger.error(`${errorMsg} at ${blocknum}`);

              dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
              dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
              return;
            }
          } catch (e) {
            notifyMessageCenterWhenError(blocknum);

            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);

            catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
            return;
          }

          /**
           * step 6h: update verified block
           */
          CURRENT = 'step6h';
          errorMsg = 'fail to verify block';
          try {
            const result = await withTimeout(queryDb.updateVerified(blocknum, true), timeout);

            if (!result) {
              notifyMessageCenterWhenError(blocknum);

              logger.error(`${errorMsg} at ${blocknum}`);

              dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
              dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
              return;
            }
          } catch (e) {
            notifyMessageCenterWhenError(blocknum);

            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);

            catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
            return;
          }
        }

        /**
         * step 6i: complete
         */
        CURRENT = 'step6i';
        dispatch.syncJob.setCompleted([blocknum, `${CURRENT}:setCompleted`]);

        queued = tail(queued);
      }
      dispatch.syncJob.setQueued([[], `${CURRENT}:setQueued`]);

      // step: 99
      dispatch.syncJob.setStatus(['ok', 'step98:setStatus']);

      logger.info(`=== sync complete at ${new Date()} ===`);

      dispatch.syncJob.reset([payload.tx_id, 'step99:reset']);
      return true;
    },
  }),
});
