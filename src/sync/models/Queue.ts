import util from 'util';
import { createModel } from '@rematch/core';
import Debug from 'debug';
import winston from 'winston';
import { waitSecond } from '../../utils';
import { type DispatcherResult } from '../dispatcher';
import type { RootModel } from '.';

type TArg = {
  action: Promise<DispatcherResult>;
  option?: {
    logger?: winston.Logger;
  };
};

type Job = {
  id: string;
  kind: 'regular' | 'arrival';
  result?: DispatcherResult;
};

type QueueState = {
  queued: Job[];
  lapsedJob: Job[];
  status: 'idle' | 'busy';
  lastModified: Date;
  workInProgress?: string;
  alias?: string;
  lastExecutionResult: Job;
};

const TEMPLATE: QueueState = {
  alias: 'initial',
  lapsedJob: [],
  status: 'idle',
  lastModified: null,
  queued: [],
  workInProgress: null,
  lastExecutionResult: null,
};
const NS = 'sync:queue';

/**
 * Queue of SyncJob
 */
export const queue = createModel<RootModel>()({
  state: TEMPLATE,
  reducers: {
    setResult: (state, result) => ({
      ...state,
      alias: 'set-result',
      lastExecutionResult: result,
      lastModified: new Date(),
    }),
    newJob: (state, job: Job) => {
      Debug(NS)('newJob added id: %s', job.id);

      return {
        ...state,
        alias: 'new-job',
        queued: [...state.queued, job],
        lastModified: new Date(),
      };
    },
    syncStart: (state) => {
      const jobsArray = [...state.queued];
      const workInProgress = jobsArray.pop().id;

      Debug(NS)('syncStart workInProgress: %s', workInProgress);

      return {
        ...state,
        alias: 'syncStart',
        status: 'busy',
        queued: [],
        lapsedJob: jobsArray,
        workInProgress,
        lastModified: new Date(),
      };
    },
    syncEnd: (state) => {
      Debug(NS)('syncEnd jobId: %s', state.workInProgress);

      return {
        ...state,
        alias: 'syncEnd',
        status: 'idle',
        workInProgress: null,
        lastModified: new Date(),
      };
    },
  },
  effects: (dispatch) => ({
    runNoOp: async () => {
      Debug(NS)('running noops');
      console.log('wait 2 second.... ');

      await waitSecond(2);

      console.log('done');
      return;
    },
    dispatchSyncJob: async (payload: TArg) => {
      const logger = payload?.option?.logger;
      let result: DispatcherResult;

      logger?.info('== model:queue:dispatchSyncJob ==');

      dispatch.queue.syncStart();

      try {
        result = await payload.action;

        Debug(NS)('runJob result, %O', result);
      } catch (error) {
        // error is {}.
        // it may not be an error; when the syncStart is thrown because of pre-existing running job
        logger.warn(util.format('fail to run syncStart, %j', error));
        dispatch.queue.setResult({ status: 'error', error });
      }

      dispatch.queue.setResult(result);

      Debug(NS)('setResult, %O', result);

      dispatch.queue.syncEnd();

      logger.info('== syncEnd ==');
    },
  }),
});
