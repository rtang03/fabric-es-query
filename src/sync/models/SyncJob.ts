import { createModel } from '@rematch/core';
import winston from 'winston';
import type { FabricGateway, QueryDb } from '../../types';
import { promiseWithTimeout } from '../../utils';
import type { RootModel } from '.';
import { store } from '../store';

type TSyncJob = 'sync' | 'arrival' | 'idle';
type TStatus = 'active' | 'error' | 'none' | 'ok';

type Details = {
  startTime?: Date;
  endTime?: Date;
  error?: any;
  blocknum: number;
};

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
  maxBlockHeight?: number;
  blockQueued: string[];
  blockFailed: Details[];
  blockCompleted: Details[];
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
  maxBlockHeight: 0,
  blockCompleted: [],
  blockFailed: [],
  blockQueued: [],
};

export const syncJob = createModel<RootModel>()({
  state: TEMPLATE as SyncJobState,
  reducers: {
    reset: (state, tx_id) => ({
      ...TEMPLATE,
      tx_id,
    }),
    init: (state, [tx_id, alias]: [tx_id: string, alias: string]) => {
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
    setMaxBlockHeight: (
      state,
      [maxBlockHeight, alias]: [maxBlockHeight: number, alias: string]
    ) => ({
      ...state,
      alias,
      maxBlockHeight,
      lastModified: new Date(),
    }),
    setStatus: (state, [status, alias]: [status: TStatus, alias: string]) => ({
      ...state,
      alias,
      status,
      lastModified: new Date(),
    }),
    failed: (state, [error, alias]: [error: any, alias: string]) => ({
      ...state,
      alias,
      status: 'error',
      error,
      lastModified: new Date(),
    }),
  },
  effects: (dispatch) => ({
    syncStart: async (payload: TArgs) => {
      const me = 'syncStart';
      const logger = payload?.option?.logger;
      const fabric = payload?.option?.fabric;
      const timeout = payload?.option?.timeout || 10000;

      logger?.info(`${me}`);
      let blockHeight: number;

      // checking

      // step 0: reset
      dispatch.syncJob.reset(payload.tx_id);

      dispatch.syncJob.init([payload.tx_id, 'step1']);

      // step 1: get block height
      try {
        const promise = promiseWithTimeout(fabric.queryChannelHeight('eventstore'), timeout);
        blockHeight = await promise;
      } catch (e) {
        if (e instanceof Error && e.message === 'timeout') dispatch.syncJob.failed([e, 'step1']);
        else dispatch.syncJob.failed([new Error('invalid blockheight'), 'step1']);
        return false;
      }

      // step 2: set block height
      dispatch.syncJob.setMaxBlockHeight([blockHeight, 'step2']);

      dispatch.syncJob.setStatus(['ok', 'step3']);
      return true;
    },
  }),
});
