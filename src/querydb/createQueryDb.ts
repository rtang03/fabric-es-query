import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { flatten, range, includes } from 'lodash';
import { Connection, Not, getManager, Repository } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import { MSG } from '../message';
import type { MessageCenter, PaginatedCommit, QueryDb } from '../types';
import { CODE, isBlocks, isCommit, isTransactions, isWriteSet, type Meters } from '../utils';
import { KEY } from './constants';
import { Blocks, Commit, KeyValue, Transactions } from './entities';

export type CreateQueryDbOption = {
  connection: Promise<Connection>;
  nonDefaultSchema?: string;
  broadcaster?: WebSocket.Server;
  logger: winston.Logger;
  meters?: Partial<Meters>;
  tracer?: Tracer;
  messageCenter?: MessageCenter;
};

export const createQueryDb: (option: CreateQueryDbOption) => QueryDb = ({
  connection,
  nonDefaultSchema,
  meters,
  logger,
  messageCenter: mCenter,
}) => {
  let conn: Connection;
  let txRepository: Repository<Transactions>;
  let commitRepository: Repository<Commit>;
  let blockRepository: Repository<Blocks>;
  let kvRepository: Repository<KeyValue>;

  logger.info('Preparing query db');

  const NS = 'querydb';
  const schema = nonDefaultSchema || 'default';

  return {
    /* CONNECT */
    connect: async () => {
      try {
        conn = await connection;
        logger.info(`database connected`);

        mCenter?.notify({ title: MSG.DB_CONNECTED });

        meters?.queryDbConnected.add(1);

        txRepository = conn.getRepository(Transactions);
        commitRepository = conn.getRepository(Commit);
        blockRepository = conn.getRepository(Blocks);
        kvRepository = conn.getRepository(KeyValue);

        return conn;
      } catch (e) {
        logger.error(`fail to connect : `, e);
        return null;
      }
    },
    /* ISCONNECTED */
    isConnected: async () => {
      if (!conn?.isConnected) {
        logger.info('querydb is not connected');
        return false;
      }
      return true;
    },
    /* DISCONNECT */
    disconnect: async () => {
      await conn.close();
      logger.info(`querydb disconnected`);

      meters?.queryDbConnected.add(-1);
    },
    /* GET BLOCKHEIGHT */
    getBlockHeight: async () => {
      const me = 'getBlockHeight';
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
    /* GET TX COUNT */
    getTxCount: async () => {
      const me = 'getTxCount';
      try {
        const result = await txRepository.count();

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} :`, e);
        return null;
      }
    },
    /* INSERT BLOCK */
    insertBlock: async (b: Blocks) => {
      const me = 'insertBlock';
      const desc = `blocknum: ${b.blocknum}`;
      const broadcast = true;
      const save = true;
      let result;

      // step 1: insert block
      try {
        if (!isBlocks(b)) {
          logger.error('unexpected error: invalid block format');
          return null;
        }

        result = await blockRepository.save(b);

        mCenter?.notify({ title: MSG.INSERT_BLOCK_OK, desc, broadcast, save, data: b.blocknum });

        Debug(`${NS}:${me}`)('result: %O', result);
      } catch (error) {
        logger.error(`fail to ${me} : `, error);
        const title = MSG.INSERT_BLOCK_FAIL;

        mCenter?.notify({ kind: 'error', title, desc, error, broadcast, save });
        return null;
      }

      // step 2: update KeyValue "INSERTED_BLOCK"
      try {
        const insertedBlock = { key: KEY.INSERTED_BLOCK, modified: new Date() };

        // load pre-existing
        const keyvalue = await kvRepository.preload(insertedBlock);

        // append new blocknum
        insertedBlock['value'] = keyvalue?.value
          ? `${keyvalue.value},${b.blocknum}`
          : b.blocknum.toString();

        const updatedResult = await kvRepository.save(insertedBlock);

        Debug(`${NS}:${me}`)('updating keyvalue: %O', updatedResult);

        if (!updatedResult) {
          logger.error('unexpected error in updating key-value: insertedBlock');

          const title = MSG.UPDATE_KV_INSERTEDBLOCK_FAIL;

          mCenter.notify({ kind: 'error', title, desc, save, data: b.blocknum });
        }
      } catch (e) {
        logger.error(`fail to keyvalue: insertedblock : `, e);
      }
      return result;
    },
    /* INSERT TX */
    insertTransaction: async (tx) => {
      const me = 'insertTransaction';
      const desc = `txhash: ${tx.txhash}; blocknum: ${tx.blockid}`;
      const broadcast = true;
      const save = true;

      try {
        if (!isTransactions(tx)) {
          logger.error('unexpected error: invalid transaction format');
          return null;
        }

        const result = await txRepository.save(tx);

        mCenter?.notify({ title: MSG.INSERT_TX_OK, desc, broadcast, save, data: tx.txhash });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);

        mCenter?.notify({ kind: 'error', title: MSG.INSERT_TX_FAIL, desc, error, broadcast, save });

        return null;
      }
    },
    /* INSERT COMMIT */
    insertCommit: async (commit) => {
      const me = 'insertCommit';
      const desc = `entname: ${commit.entityName}; entId: ${commit.entityId} commitId: ${commit.commitId}`;
      const broadcast = true;
      const save = true;

      try {
        if (!isCommit(commit)) {
          logger.error('unexpected error: invalid commit format');
          return null;
        }

        const result = await commitRepository.save(commit);

        mCenter?.notify({ title: MSG.INSERT_COMMIT_OK, desc, broadcast, save });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);

        const title = MSG.INSERT_COMMIT_FAIL;
        mCenter?.notify({ kind: 'error', title, desc, error, broadcast, save });

        return null;
      }
    },
    /* FIND MISSING BLOCK */
    findMissingBlock: async (maxBlockNum) => {
      const me = 'findMissingBlock';
      const all = range(maxBlockNum);

      try {
        const insertedBlock = await kvRepository.findOne(KEY.INSERTED_BLOCK);
        const blocknumInKVStore = insertedBlock?.value
          ?.split(',')
          .map((item) => parseInt(item, 10));

        Debug(`${NS}:${me}`)('blocknumArray: %O', blocknumInKVStore);

        // no existing block found
        if (!blocknumInKVStore || blocknumInKVStore?.length === 0) return all;

        const result = all
          .map<[number, boolean]>((blocknum) => [blocknum, includes(blocknumInKVStore, blocknum)])
          .filter(([_, found]) => !found)
          .map(([blocknum]) => blocknum);

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    /* FIND TX WITH COMMIT */
    findTxWithCommit: async ({ take, skip, orderBy, sort, code, isValid }) => {
      isValid = isValid === undefined ?? true;
      sort = sort || 'ASC';
      orderBy = orderBy || 'blockid';

      const me = 'findTxWithCommit';
      const validation_code = isValid ? 'VALID' : Not('VALID');

      try {
        const where = {};
        code && (where['code'] = code);
        validation_code && (where['validation_code'] = validation_code);

        const order = {};
        orderBy && (order[orderBy] = sort);

        const query = {};
        (code || validation_code) && (query['where'] = where);
        orderBy && (query['order'] = order);

        Debug(`${NS}:${me}`)('query, %O', query);

        const total = await txRepository.count(query);

        take && (query['take'] = take);
        skip && (query['skip'] = skip);

        const items = await txRepository.find(query);

        const hasMore = skip + take < total;
        const cursor = hasMore ? skip + take : total;
        const result = { total, items, hasMore, cursor };

        // const result = await conn
        //   .getRepository(Transactions)
        //   .find({ where: [{ code: CODE.PUBLIC_COMMIT }], order: { blockid: 'ASC' } });
        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    /* FIND BLOCK */
    findBlock: async (option) => {
      const take = option?.take;
      const skip = option?.skip;
      const orderBy = option?.orderBy || 'blocknum';
      const sort = option?.sort || 'ASC';
      const blocknum = option?.blocknum;
      const me = 'findBlock';
      try {
        const where = {};
        blocknum && (where['blocknum'] = blocknum);

        const order = {};
        orderBy && (order[orderBy] = sort);

        const query = {};
        blocknum && (query['where'] = where);
        orderBy && (query['order'] = order);

        Debug(`${NS}:${me}`)('query, %O', query);

        const total = await blockRepository.count(query);

        take && (query['take'] = take);
        skip && (query['skip'] = skip);

        const items = await blockRepository.find(query);

        const hasMore = skip + take < total;
        const cursor = hasMore ? skip + take : total;
        const result = { total, items, hasMore, cursor };

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    /* FIND COMMIT */
    findCommit: async (option) => {
      const dev = option?.dev === undefined ? false : option.dev;
      const take = option?.take;
      const skip = option?.skip;
      const orderBy = option?.orderBy || 'commitId';
      const sort = option?.sort || 'ASC';
      const id = option?.id;
      const commitId = option?.commitId;
      const entityId = option?.entityId;
      const mspId = option?.mspId;
      const me = 'findCommit';
      const entityName = dev ? 'dev_entity' : option?.entityName;

      if (!entityName) throw new Error('entityName is required');

      try {
        const where = {};
        id && (where['id'] = id);
        entityName && (where['entityName'] = entityName);
        commitId && (where['commitId'] = commitId);
        entityId && (where['entityId'] = entityId);
        mspId && (where['mspId'] = mspId);

        const order = {};
        orderBy && (order[orderBy] = sort);

        const query = {};
        (id || entityName || entityId || commitId || mspId) && (query['where'] = where);
        orderBy && (query['order'] = order);

        Debug(`${NS}:${me}`)('query, %O', query);

        const total = await commitRepository.count(query);

        take && (query['take'] = take);
        skip && (query['skip'] = skip);

        const items = await commitRepository.find(query);

        const hasMore = skip + take < total;
        const cursor = hasMore ? skip + take : total;
        const result = { total, items, hasMore, cursor };

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    /* PARSE BLOCKS TO COMMITS */
    parseBlocksToCommits: async (option) => {
      const me = 'parseBlockToCommits';
      const take = option?.take;
      const skip = option?.skip;
      const code =
        option?.isPrivate === undefined
          ? CODE.PUBLIC_COMMIT
          : option.isPrivate
          ? CODE.PRIVATE_COMMIT
          : CODE.PUBLIC_COMMIT;

      // Parse one write_set
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

            valueJson['txhash'] = tx.txhash;
            valueJson['blocknum'] = tx.blockid;

            if (isCommit(valueJson) && !is_delete) return valueJson;
            // if (isCommit(valueJson) && !is_delete) return omit(valueJson, 'key');
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
      // End parse one write_set

      try {
        const query = {
          where: { code, validation_code: 'VALID' },
          order: { blockid: 'ASC' as any },
        };

        Debug(`${NS}:${me}`)('query, %O', query);

        const total = await txRepository.count(query);

        take && (query['take'] = take);
        skip && (query['skip'] = skip);

        const transactions = await txRepository.find(query);

        Debug(`${NS}:${me}`)('transactions: %O', transactions);

        const items = flatten(
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

        const allCommitValid = items.reduce((prev, curr) => prev && !!curr, true);

        if (!allCommitValid) {
          logger.error(`${me} fails: has null commit`);
          return null;
        }

        const hasMore = skip + take < total;
        const cursor = hasMore ? skip + take : total;
        const result: PaginatedCommit = { total, items, hasMore, cursor };

        Debug(`${NS}:${me}`)('result: %O', result);

        logger.info(`${me} done: total: ${total}, cursor: ${cursor}`);

        return result;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
  };
};
