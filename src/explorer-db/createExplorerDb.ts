import { Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { Connection } from 'typeorm';
import winston from 'winston';
import type { ExplorerDb } from '../types';
import { Meters } from '../utils';

export type CreateExplorerDbOption = {
  connection: Promise<Connection>;
  logger: winston.Logger;
  metricsOn?: boolean;
  meters?: Partial<Meters>;
  tracer?: Tracer;
};

export const createExplorerDb: (option: CreateExplorerDbOption) => ExplorerDb = ({
  connection,
  logger,
}) => {
  let conn: Connection;

  logger.info('Connect explorer db');

  const NS = 'explorerdb';
  const debug = Debug(NS);

  return {
    connect: async () => {
      logger.info(`=== connect() ===`);

      conn = await connection;

      logger.info(`database connected`);
      return true;
    },
    disconnect: () => {},
  };
};
