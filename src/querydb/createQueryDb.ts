import { Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { Connection } from 'typeorm';
import winston from 'winston';
import type { QueryDb } from '../types';
import { Meters } from '../utils';

export type CreateQueryDbOption = {
  connection: Promise<Connection>;
  logger: winston.Logger;
  metricsOn?: boolean;
  meters?: Partial<Meters>;
  tracer?: Tracer;
};

export const createQueryDb: (option: CreateQueryDbOption) => QueryDb = ({ connection, logger }) => {
  let conn: Connection;

  logger.info('Connect query db');

  const NS = 'querydb';
  const debug = Debug(NS);

  return {
    connect: async () => {
      logger.info(`=== connect() ===`);

      try {
        conn = await connection;

        logger.info(`database connected`);
        return conn;
      } catch (e) {
        logger.error(`fail to connect : `, e);
        return null;
      }
    },
    disconnect: async () => conn.close(),
  };
};
