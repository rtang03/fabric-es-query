import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { Connection, getManager } from 'typeorm';
import winston from 'winston';
import type { QueryDb } from '../types';
import { Meters } from '../utils';
import { Blocks } from './entities';

export type CreateQueryDbOption = {
  connection: Promise<Connection>;
  nonDefaultSchema?: string;
  logger: winston.Logger;
  metricsOn?: boolean;
  meters?: Partial<Meters>;
  tracer?: Tracer;
};

export const createQueryDb: (option: CreateQueryDbOption) => QueryDb = ({
  connection,
  nonDefaultSchema,
  metricsOn,
  meters,
  tracer,
  logger,
}) => {
  let conn: Connection;

  logger.info('Preparing query db');

  const NS = 'querydb';
  const debug = Debug(NS);

  return {
    connect: async () => {
      try {
        conn = await connection;
        logger.info(`database connected`);

        metricsOn && meters.queryDbConnected.add(1);

        return conn;
      } catch (e) {
        logger.error(`fail to connect : `, e);
        return null;
      }
    },
    isConnected: async () => {
      if (!conn?.isConnected) {
        logger.info('querydb is not connected');
        return false;
      }
      return true;
    },
    disconnect: async () => {
      await conn.close();
      metricsOn && meters.queryDbConnected.add(-1);
      logger.info(`querydb disconnected`);
    },
    getBlockHeight: async () => {
      const me = 'getBlockHeight()';
      try {
        // const result = await conn.getRepository(Blocks).count();
        const schema = nonDefaultSchema || 'default';
        const result = await getManager().query(`SELECT MAX (blocknum) FROM ${schema}.blocks`);
        const blockHeight: number = result?.[0]?.max;

        metricsOn &&
          Number.isInteger(blockHeight) &&
          meters.queryDbBlockHeight.observation(blockHeight, { env: 'test' });

        Debug(`${NS}:${me}`)(`result: %O`, blockHeight);

        return blockHeight;
      } catch (e) {
        logger.error(`fail to ${me} :`, e);
        return null;
      }
    },
    getTxCount: async () => {
      return 0;
    },
    insertBlock: async (b: Blocks) => {
      const me = 'insertBlock()';
      try {
        const result = await conn.getRepository(Blocks).save(b);

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    insertTransaction: async (tx) => {
      return null;
    },
  };
};
