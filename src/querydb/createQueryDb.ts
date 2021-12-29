import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { flatten, range } from 'lodash';
import { Connection, Not, getManager } from 'typeorm';
import winston from 'winston';
import type { QueryDb } from '../types';
import { CODE, isBlocks, isTransactions, type Meters } from '../utils';
import { Blocks, Commit, Transactions } from './entities';

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
  const schema = nonDefaultSchema || 'default';

  const parseWriteSet = (write_set: any): Commit[] => {
    return null;
  };

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
        const result = await getManager().query(`SELECT MAX (blocknum) FROM ${schema}.blocks`);
        let blockHeight: number = result?.[0]?.max;
        if (!(blockHeight === undefined || blockHeight === null)) blockHeight = blockHeight + 1;

        Debug(`${NS}:${me}`)(`result: %O`, blockHeight);

        return blockHeight;
      } catch (e) {
        logger.error(`fail to ${me} :`, e);
        return null;
      }
    },
    getTxCount: async () => {
      const me = 'getTxCount()';
      try {
        const result = await conn.getRepository(Transactions).count();

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} :`, e);
        return null;
      }
    },
    insertBlock: async (b: Blocks) => {
      const me = 'insertBlock()';
      try {
        if (!isBlocks(b)) {
          logger.error('unexpected error: invalid block format');
          return null;
        }

        const result = await conn.getRepository(Blocks).save(b);

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    insertTransaction: async (tx) => {
      const me = 'insertTransaction()';
      try {
        if (!isTransactions(tx)) {
          logger.error('unexpected error: invalid transaction format');
          return null;
        }

        const result = await conn.getRepository(Transactions).save(tx);

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    findMissingBlock: async (maxBlockNum) => {
      const me = 'findMissingBlock()';
      const result: number[] = [];
      const all = range(maxBlockNum);
      let currentBlockNum = 0;

      try {
        for await (const itemNum of all) {
          currentBlockNum = itemNum;
          const block = await conn.getRepository(Blocks).find({ blocknum: itemNum });

          !~~block.length && result.push(itemNum);
        }

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`encounter error at ${currentBlockNum} out of ${maxBlockNum}`);
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    getPublicCommitTx: async () => {
      const me = 'getPublicCommitTx()';
      try {
        const result = await conn
          .getRepository(Transactions)
          .find({ where: [{ code: CODE.PUBLIC_COMMIT }], order: { blockid: 'ASC' } });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    getPrivateCommitTx: async () => {
      const me = 'getPrivateCommitTx()';
      try {
        const result = await conn
          .getRepository(Transactions)
          .find({ where: [{ code: CODE.PRIVATE_COMMIT }], order: { blockid: 'ASC' } });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    findPublicCommitTxWithFailure: async () => {
      const me = 'findPublicCommitTxWithFailure()';
      try {
        const result = await conn.getRepository(Transactions).find({
          where: [{ code: CODE.PUBLIC_COMMIT, validation_code: Not('VALID') }],
          order: { blockid: 'ASC' },
        });
        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    findPrivateCommitTxWithFailure: async () => {
      const me = 'findPrivateCommitTxWithFailure()';
      try {
        const result = await conn.getRepository(Transactions).find({
          where: [{ code: CODE.PRIVATE_COMMIT, validation_code: Not('VALID') }],
          order: { blockid: 'ASC' },
        });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    getPublicCommit: async () => {
      const me = 'getPublicCommit()';
      try {
        const transactions = await conn
          .getRepository(Transactions)
          .find({ where: [{ code: CODE.PUBLIC_COMMIT }], order: { blockid: 'ASC' } });

        const result = flatten(transactions.map((tx) => parseWriteSet(tx)));

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    getPrivateCommit: async () => {
      const me = 'getPrivateCommit()';
      try {
        const result = await conn
          .getRepository(Transactions)
          .find({ where: [{ code: CODE.PRIVATE_COMMIT }], order: { blockid: 'ASC' } });

        Debug(`${NS}:${me}`)('result: %O', result);

        return null;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
  };
};
