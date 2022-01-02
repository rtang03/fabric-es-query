import Debug from 'debug';
import winston from 'winston';
import { generateToken } from '../utils';
import { store } from './store';

export type TResult = { status: string; data?: any } | Error;

export type TAction = {
  type: string;
  payload: { tx_id: string; option?: any };
};

export type TActionOption = {
  alias?: string;
  logger: winston.Logger;
  timeout?: number;
  debugNS?: string;
};

export const dispatcher: (
  action: { type: string; payload?: any },
  option?: TActionOption
) => Promise<TResult> = (action, option) =>
  new Promise<TResult>((resolve, reject) => {
    const { debugNS, logger } = option;
    const tid = generateToken();
    const debug = Debug(debugNS || 'dispatcher');

    const unsubscribe = store.subscribe(() => {
      const { syncJob } = store.getState();
      const { tx_id, status, data, error } = syncJob;

      debug('syncJob, %O', syncJob);

      if (tx_id === tid && status === 'ok') {
        unsubscribe();

        logger.info(`action resolved: ${tid}`);
        resolve({ status: 'ok', data });
      }
      if (tx_id === tid && status === 'error') {
        unsubscribe();

        logger.info(`action rejected: ${tid}`);
        reject(error);
      }
    });

    const dispatchedAction: TAction = {
      type: action.type,
      payload: { tx_id: tid, ...action.payload, option },
    };

    debug('dispatchedAction, %O', dispatchedAction);

    store.dispatch<TAction>(dispatchedAction);

    logger?.info(`action dispatched: ${tid}`);
  });
