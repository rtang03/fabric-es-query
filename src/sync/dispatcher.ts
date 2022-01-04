import util from 'util';
import { omit, isEqual } from 'lodash';
import winston from 'winston';
import type { FabricGateway, QueryDb } from '../types';
import { generateToken } from '../utils';
import { store } from './store';

export type TResult = { status: string; data?: any; error?: any };

export type TAction = {
  type: string;
  payload: {
    tx_id: string;
    option?: {
      logger: winston.Logger;
      fabric?: Partial<FabricGateway>;
      queryDb?: Partial<QueryDb>;
      timeout?: number;
    };
  };
};

export type TActionOption = {
  alias?: string;
  logger: winston.Logger;
  timeout?: number;
  showStateChanges?: boolean;
};

const removeEmptyField = (syncJob: any) =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  Object.entries(syncJob)
    .filter(([key, value]) => !(isEqual(value, []) || value === null))
    .reduce((prev, [key, value]) => ({ ...prev, [key]: value }), {});

export const dispatcher: (
  action: { type: string; payload?: any },
  option?: TActionOption
) => Promise<TResult> = (action, option) =>
  new Promise<TResult>((resolve, reject) => {
    const { showStateChanges, logger } = option;

    if (store.getState()?.syncJob.running) {
      logger.error('fail to dispatch, when there is active job');

      throw new Error('fail to dispatch');
    }

    const tid = generateToken();
    logger?.info(`action dispatched: ${action.type} ${tid}`);

    const unsubscribe = store.subscribe(() => {
      const { syncJob } = store.getState();
      const { tx_id, status, data, error } = syncJob;

      showStateChanges &&
        logger.info(
          util.format('syncJob state: %j', removeEmptyField(omit(syncJob, 'data', 'error')))
        );

      if (tx_id === tid && status === 'ok') {
        unsubscribe();

        logger.info(`action resolved: ${action.type} ${tid}`);

        const result = { status: 'ok' };
        data && (result['data'] = data);

        resolve(result);
      }
      if (tx_id === tid && status === 'error') {
        unsubscribe();

        logger.info(`action rejected: ${action.type} ${tid}`);
        reject({ status: 'error', error });
      }
    });

    const dispatchedAction: TAction = {
      type: action.type,
      payload: { tx_id: tid, ...action.payload, option },
    };

    store.dispatch<TAction>(dispatchedAction);
  });
