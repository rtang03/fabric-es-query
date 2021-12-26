import winston from 'winston';
import type { FabricGateway, Platform } from '../types';

export type CreatePlatformOption = {
  logger: winston.Logger;
  env?: string;
};

export const createPlatform: (option: CreatePlatformOption) => Platform = ({ logger }) => {
  const me = 'Platform';
  logger.info(`=== starting ${me} ===`);

  let fabricGateway: FabricGateway;

  return {
    initialize: async () => {
      return;
    },
    syncStart: async () => {}
  };
};
