import { createModel } from '@rematch/core';
import { isEqual, range, takeRight, tail } from 'lodash';
import winston from 'winston';
import { parseWriteSet } from '../../querydb';
import { Blocks, Commit, Transactions } from '../../querydb/entities';
import type { FabricGateway, QueryDb } from '../../types';
import { promiseWithTimeout, waitSecond } from '../../utils';
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
  missingBlocks?: number[];
  validated?: boolean;
  queued?: number[];
  failed?: number[];
  completed?: number[];
  blockHasCommit?: number[];
  blockHasNoCommit?: number[];
};

export type TArgs = {
  tx_id: string;
  action?: Promise<any>;
  option?: {
    timeout?: number;
    fabric?: FabricGateway;
    queryDb?: QueryDb;
    logger?: winston.Logger;
  };
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
  missingBlocks: null,
  validated: null,
  completed: [],
  failed: [],
  queued: [],
  blockHasCommit: [],
  blockHasNoCommit: [],
};

export const syncJob = createModel<RootModel>()({
  state: TEMPLATE as SyncJobState,
  reducers: {
    reset: (state, [tx_id, alias]: [tx_id: string, alias?: string]) => ({
      ...TEMPLATE,
      tx_id,
      alias,
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
    setQueued: (state, [queued, alias]: [queued: any, alias?: string]) => ({
      ...state,
      alias,
      queued,
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
    setMissingBlocks: (
      state,
      [missingBlocks, alias]: [missingBlocks: number[], alias?: string]
    ) => ({
      ...state,
      alias,
      missingBlocks,
      lastModified: new Date(),
    }),
    setValidated: (state, [validated, alias]: [validated: boolean, alias?: string]) => ({
      ...state,
      alias,
      validated,
      lastModified: new Date(),
    }),
    setStatus: (state, [status, alias]: [status: TStatus, alias?: string]) => ({
      ...state,
      alias,
      status,
      lastModified: new Date(),
      running: state.running && status === 'ok' ? false : state.running,
    }),
    failed: (state, [error, alias]: [error: any, alias?: string]) => ({
      ...state,
      alias,
      status: 'error',
      error,
      lastModified: new Date(),
      running: false,
    }),
  },
  effects: (dispatch) => ({
    wait5Second: async (payload: TArgs) => {
      dispatch.syncJob.init([payload.tx_id, 'step1:init']);
      await waitSecond(5);
      dispatch.syncJob.setStatus(['ok', 'step2:setStatus(ok)']);
      dispatch.syncJob.reset([payload.tx_id, 'step99:result']);
      return true;
    },
    syncStart: async (payload: TArgs) => {
      const me = 'syncStart';
      const logger = payload?.option?.logger;
      const fabric = payload?.option?.fabric;
      const queryDb = payload?.option?.queryDb;
      const timeout = payload?.option?.timeout || 10000;

      if (!fabric) throw new Error('fabric-gateway not found');
      if (!queryDb) throw new Error('queryDb not found');
      if (!channelName) throw new Error('channelName not found');

      logger?.info(`=== redux-effect: ${me} ===`);

      let heightFabric: number;
      let heightQuerydb: number;
      let missingBlocks: number[];

      dispatch.syncJob.init([payload.tx_id, 'step1:init']);

      /**
       * step 1: get block height from live Fabric
       */
      let CURRENT = 'step1';
      let errorMsg: string;

      const catchErrorAndDispatchFailure = (currentStep, e: any, errorMessage: string) => {
        logger.error(errorMessage);
        if (e instanceof Error && e.message === 'timeout')
          dispatch.syncJob.failed([e, `${currentStep}:failed`]);
        else dispatch.syncJob.failed([new Error(errorMessage), `${currentStep}:failed`]);
      };

      errorMsg = 'invalid blockheight / fabric';
      try {
        heightFabric = await promiseWithTimeout(fabric.queryChannelHeight('eventstore'), timeout);
        if (!heightFabric) {
          logger.error(errorMsg);
          dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
          return;
        }
      } catch (e) {
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
        heightQuerydb = await promiseWithTimeout(queryDb.getBlockHeight(), timeout);
        if (!heightQuerydb) {
          logger.error(errorMsg);
          dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
          return;
        }
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
        missingBlocks = await promiseWithTimeout(queryDb.findMissingBlock(heightFabric), timeout);
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
      const derivedMissingBlocks = takeRight(range(heightFabric + 1), heightFabric - heightQuerydb);
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
          block = await promiseWithTimeout(fabric.queryBlock(channelName, blocknum), timeout);

          if (!block) {
            logger.error(`${errorMsg} at ${blocknum}`);
            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
            dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
            return;
          }
        } catch (e) {
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
            logger.error(`${errorMsg} at ${blocknum}`);
            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
            dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
            return;
          }
          [processedBlock, txArray] = result;
        } catch (e) {
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
          const result = await promiseWithTimeout(
            queryDb.insertBlock(new Blocks(processedBlock)),
            timeout
          );

          if (!result) {
            logger.error(`${errorMsg} at ${blocknum}`);
            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
            dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
            return;
          }
        } catch (e) {
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
            txInserted = await promiseWithTimeout(
              queryDb.insertTransaction(new Transactions(inputTransaction)),
              timeout
            );
            if (!txInserted) {
              logger.error(`${errorMsg} at ${blocknum}`);
              dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
              dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
              return;
            }
          } catch (e) {
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

              const result = await queryDb.insertCommit(new Commit(inputCommit));

              if (!result) {
                logger.error(`${errorMsg} at ${blocknum}`);
                dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
                dispatch.syncJob.failed([new Error(errorMsg), `${CURRENT}:failed`]);
                return;
              }
            } else
              dispatch.syncJob.setBlockHasNoCommit([blocknum, `${CURRENT}:setBlockHasNoCommit`]);
          } catch (e) {
            dispatch.syncJob.setFailed([blocknum, `${CURRENT}:setFailed`]);
            catchErrorAndDispatchFailure(CURRENT, e, errorMsg);
            return;
          }
        }

        /**
         * step 6g: complete
         */
        CURRENT = 'step6g';
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
