import winston from 'winston';
import Observable from 'zen-observable';
import type { Synchronizer } from '../types';

export type CreateSynchronizerOption = {
  logger: winston.Logger;
};

export const createSynchronizer: (option: CreateSynchronizerOption) => Synchronizer = (option) => {
  return null;
};
