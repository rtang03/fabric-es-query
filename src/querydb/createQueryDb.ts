import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { omit, flatten, range } from 'lodash';
import { Connection, Not, getManager } from 'typeorm';
import winston from 'winston';
import { MSG } from '../message';
import type { MessageCenter, QueryDb } from '../types';
import { CODE, isBlocks, isCommit, isTransactions, isWriteSet, type Meters } from '../utils';
import { Blocks, Commit, Transactions } from './entities';

export type CreateQueryDbOption = {
  connection: Promise<Connection>;
  nonDefaultSchema?: string;
  logger: winston.Logger;
  meters?: Partial<Meters>;
  tracer?: Tracer;
  messageCenter?: MessageCenter;
};

export const createQueryDb: (option: CreateQueryDbOption) => QueryDb = ({
  connection,
  nonDefaultSchema,
  meters,
  tracer,
  logger,
  messageCenter: mCenter,
}) => {
  let conn: Connection;

  logger.info('Preparing query db');

  const NS = 'querydb';
  const schema = nonDefaultSchema || 'default';

  const parseWriteSet = (tx: Transactions): Commit => {
    let ws: unknown;
    const { chaincodename, write_set, txhash, blockid } = tx;

    try {
      ws = JSON.parse(write_set);

      Debug(`${NS}:parseWriteSet`)('txhash, %s', txhash);
      Debug(`${NS}:parseWriteSet`)('%O', ws);
    } catch {
      logger.error(`fail to parseWriteSet(), txid: ${txhash}`);
      return null;
    }

    try {
      if (isWriteSet(ws)) {
        const { key, value, is_delete } = ws.filter(
          ({ chaincode }) => chaincode === chaincodename
        )[0].set[0];

        logger.info(`parsing ${key}, txid: ${txhash}, blockid: ${blockid}`);

        const valueJson: unknown = JSON.parse(value);

        if (isCommit(valueJson) && !is_delete) return omit(valueJson, 'key');
      }
      logger.error(`invalid write_set, , txid: ${txhash}, blockid: ${blockid}`);
      logger.error(`write_set: ${write_set}`);
      return null;
    } catch (e) {
      logger.error(`invalid write_set, , txid: ${txhash}, blockid: ${blockid} : `, e);
      logger.error(`write_set: ${write_set}`);
      return null;
    }
  };

  return {
    connect: async () => {
      try {
        conn = await connection;
        logger.info(`database connected`);

        mCenter?.notify({ title: MSG.DB_CONNECTED });

        meters?.queryDbConnected.add(1);

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
      logger.info(`querydb disconnected`);

      meters?.queryDbConnected.add(-1);
    },
    getBlockHeight: async () => {
      const me = 'getBlockHeight()';
      try {
        // NOTE: psql-only
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
      const desc = `blocknum: ${b.blocknum}`;
      const broadcast = true;
      const save = true;

      try {
        if (!isBlocks(b)) {
          logger.error('unexpected error: invalid block format');
          return null;
        }

        const result = await conn.getRepository(Blocks).save(b);

        mCenter?.notify({ title: MSG.INSERT_BLOCK_OK, desc, broadcast, save, data: b.blocknum });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);

        mCenter?.notify({
          kind: 'error',
          title: MSG.INSERT_BLOCK_FAIL,
          desc,
          error,
          broadcast,
          save,
        });

        return null;
      }
    },
    insertTransaction: async (tx) => {
      const me = 'insertTransaction()';
      const desc = `txhash: ${tx.txhash}; blocknum: ${tx.blockid}`;
      const broadcast = true;
      const save = true;

      try {
        if (!isTransactions(tx)) {
          logger.error('unexpected error: invalid transaction format');
          return null;
        }

        const result = await conn.getRepository(Transactions).save(tx);

        mCenter?.notify({ title: MSG.INSERT_TX_OK, desc, broadcast, save, data: tx.txhash });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);

        mCenter?.notify({ kind: 'error', title: MSG.INSERT_TX_FAIL, desc, error, broadcast, save });

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
    parseBlocksToCommits: async (isPrivate) => {
      const me = 'parseBlockToCommits()';
      const code = isPrivate ? CODE.PRIVATE_COMMIT : CODE.PUBLIC_COMMIT;

      try {
        const transactions = await conn
          .getRepository(Transactions)
          .find({ where: [{ code }], order: { blockid: 'ASC' } });

        Debug(`${NS}:${me}`)('transactions: %O', transactions);

        const result = flatten(
          transactions.map((tx) => {
            const parsedResult = parseWriteSet(tx);

            !parsedResult &&
              mCenter?.notify({
                kind: 'error',
                title: MSG.PARSE_WRITESET_FAIL,
                desc: `txhash: ${tx.txhash}; blocknum: ${tx.blockid}`,
                error: tx.write_set,
                broadcast: false,
                save: true,
              });

            return parsedResult;
          })
        );

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
  };
};
