import util from 'util';
import { type Tracer } from '@opentelemetry/api';
import Debug from 'debug';
import { flatten, includes, isEqual, range } from 'lodash';
import { Connection, getManager, Not } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import { KIND, MSG } from '../message';
import type { MessageCenter, PaginatedCommit, QueryDb } from '../types';
import { CODE, isBlocks, isCommit, isTransactions, isWriteSet, type Meters } from '../utils';
import { KEY } from './constants';
import { Blocks, Commit, KeyValue, Transactions } from './entities';

export type CreateQueryDbOption = {
  connection: Connection;
  // used for dev/test only
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
  logger.info('=== Preparing query db ===');

  if (!connection?.isConnected) {
    logger.error('no psql connection found');

    mCenter?.notify({ kind: KIND.ERROR, title: MSG.NO_CONNECTION_ERROR, broadcast: true });

    return null;
  }

  const txRepository = connection.getRepository(Transactions);
  const commitRepository = connection.getRepository(Commit);
  const blockRepository = connection.getRepository(Blocks);
  const kvRepository = connection.getRepository(KeyValue);
  const NS = 'querydb';
  const schema = nonDefaultSchema || 'default';

  /**
   * parseWriteSet
   * @param tx
   */
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

        if (isCommit(valueJson) && !is_delete) {
          valueJson['txhash'] = tx.txhash;
          valueJson['blocknum'] = tx.blockid;
          return valueJson;
        }
      }
      logger.info(`write_set is NOT commit, txid: ${txhash}, blockid: ${blockid}`);
      Debug(`${NS}:parseWriteSet`)(`write_set: ${write_set}`);
      return null;
    } catch (e) {
      logger.error(`invalid write_set, txid: ${txhash}, blockid: ${blockid} : `, e);
      Debug(`${NS}:parseWriteSet`)('write_set: %O', write_set);
      return null;
    }
  };
  // End parse one write_set

  logger.info('=== query db ok ===');

  return {
    /**
     * checkIntegrity - all repos
     * @param blocknum
     */
    checkIntegrity: async (blocknum) => {
      try {
        // check KV store
        const insertedBlock = await kvRepository.findOne(KEY.INSERTED_BLOCK);
        const blocknumInKVStore = insertedBlock?.value
          ?.split(',')
          .map((item) => parseInt(item, 10));

        if (!includes(blocknumInKVStore, blocknum)) {
          logger.info(`block ${blocknum} in KVStore: FALSE`);
          return false;
        }

        // check block
        const block = await blockRepository.findOne({ blocknum });
        if (!block) {
          logger.info(`block ${blocknum} in block repo`);
          return false;
        }

        // check tx
        const tx = await txRepository.findOne({ blockid: blocknum });
        if (!tx) {
          logger.info(`block ${blocknum} in tx repo`);
          return false;
        }
        return true;
      } catch (e) {
        logger.info(`block: ${blocknum} fails integrity check`);
        logger.error(e);
        return false;
      }
    },
    /**
     * cascadedDeleteByBlocknum
     * @param blocknum
     */
    cascadedDeleteByBlocknum: async (blocknum) => {
      const me = 'cascadedDeleteByBlocknum';
      try {
        let cascadedDeleteResult = true;

        // step 1: delete block
        const deleteBlockResult = await blockRepository.delete({ blocknum });
        if (deleteBlockResult?.affected === 1) {
          logger.info(`block ${blocknum} is deleted from Block repo`);
        } else {
          logger.error(util.format('deleteBlockResult %j', deleteBlockResult));
          cascadedDeleteResult = false;
        }

        Debug(`${NS}:${me}`)('deleteBlockResult, %O', deleteBlockResult);

        // step 2: delete tx
        const deleteTxResult = await txRepository.delete({ blockid: blocknum });
        if (deleteTxResult?.affected === 1) {
          logger.info(`${blocknum} is deleted from tx repo`);
        } else {
          logger.error(util.format('deleteTxResult %j', deleteTxResult));
          cascadedDeleteResult = false;
        }

        Debug(`${NS}:${me}`)('deleteTxResult, %O', deleteTxResult);

        // step 3: delete commit
        // not like step 1 and step 2; "affected" can be 0
        const deleteCommitResult = await commitRepository.delete({ blocknum });
        const numberOfDeleted = deleteCommitResult?.affected;
        if (numberOfDeleted === 1 || numberOfDeleted === 0) {
          logger.info(`at block ${blocknum}, ${numberOfDeleted} commit deleted`);
        } else {
          logger.error(util.format('deleteCommitResult %j', deleteCommitResult));
          cascadedDeleteResult = false;
        }

        Debug(`${NS}:${me}`)('deleteCommitResult, %O', deleteCommitResult);

        // step 4: update kv store
        const insertedBlock = await kvRepository.findOne(KEY.INSERTED_BLOCK);
        // remove blocknum from insertedBlock.value
        insertedBlock.value = insertedBlock?.value
          ?.split(',')
          .map((item) => parseInt(item, 10))
          .filter((item) => item !== blocknum)
          .map((b) => b.toString())
          .reduce((prev, curr) => (prev ? `${prev},${curr}` : curr), null);

        Debug(`${NS}:${me}`)('insertedBlock, %O', insertedBlock);

        const updatedResult = await kvRepository.save(insertedBlock);
        if (!updatedResult) {
          logger.error(util.format('deleteCommitResult %j', deleteCommitResult));
          cascadedDeleteResult = false;
        }

        Debug(`${NS}:${me}`)('updatedResult, %O', updatedResult);

        return cascadedDeleteResult;
      } catch (e) {
        logger.error(util.format(`fail to ${me} at block ${blocknum} : %j`, e));

        mCenter?.notify({
          kind: KIND.ERROR,
          title: MSG.CASCADED_DELETE_ERROR,
          error: e.message,
          save: true,
        });

        return false;
      }
    },
    /**
     * disconnect
     */
    disconnect: async () => {
      logger.info(`querydb disconnected`);

      meters?.queryDbConnected.add(-1);
    },
    /**
     * findBlock
     * @param option
     */
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
    /**
     * findCommit
     * @param option
     */
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
    /**
     * findMissingBlock
     * @param maxNumberOfBlock
     */
    findMissingBlock: async (maxNumberOfBlock) => {
      const me = 'findMissingBlock';
      // maxNumberOfBlock = BlockHeight + 1
      const all = range(maxNumberOfBlock);

      try {
        const insertedBlock = await kvRepository.findOne(KEY.INSERTED_BLOCK);
        const blocknumInKVStore = insertedBlock?.value
          ?.split(',')
          .map((item) => parseInt(item, 10));

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
    /**
     * findTxWithCommit
     * @param take
     * @param skip
     * @param orderBy
     * @param sort
     * @param code
     * @param isValid
     */
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
    /**
     * findUnverified
     */
    findUnverified: async () => {
      const me = 'findUnverified';
      try {
        const blocks = await blockRepository.find({
          where: { verified: false },
          order: { blocknum: 'ASC' },
        });

        if (!blocks) {
          logger.error(`fail to ${me}`);
          return null;
        }

        const unverified = blocks?.map((b) => b?.blocknum);

        Debug(`${NS}:${me}`)('blocknum: %s', unverified.toString());

        ~~unverified.length &&
          mCenter?.notify({
            kind: KIND.SYSTEM,
            title: MSG.UNVERIFIED_BLOCK_FOUND,
            desc: unverified.toString(),
            data: unverified,
            broadcast: true,
            save: false,
          });

        return unverified;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    /**
     * getBlockHeight
     */
    getBlockHeight: async () => {
      const me = 'getBlockHeight';
      try {
        // NOTE: psql-only
        const result = await getManager().query(`SELECT MAX (blocknum) FROM ${schema}.blocks`);
        const blockHeight: number = result?.[0]?.max;

        Debug(`${NS}:${me}`)(`result: %O`, blockHeight);

        return !(blockHeight === undefined || blockHeight === null) ? blockHeight + 1 : null;
      } catch (e) {
        logger.error(`fail to ${me} :`, e);
        return null;
      }
    },
    /**
     * getTxCount
     */
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
    /**
     * insertBlock
     * @param b
     */
    insertBlock: async (b: Blocks) => {
      const me = 'insertBlock';
      const desc = `blocknum: ${b.blocknum}`;
      const broadcast = true;
      const save = true;
      let result;

      try {
        if (!isBlocks(b)) {
          logger.error('unexpected error: invalid block format');
          return null;
        }

        result = await blockRepository.save(b);

        mCenter?.notify({
          kind: KIND.SYSTEM,
          title: MSG.INSERT_BLOCK_OK,
          desc,
          broadcast,
          save,
          data: b.blocknum,
        });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);
        const title = MSG.INSERT_BLOCK_FAIL;

        mCenter?.notify({ kind: KIND.ERROR, title, desc, error, broadcast, save });
        return null;
      }
    },
    /**
     * insertCommit
     * @param commit
     */
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

        mCenter?.notify({ kind: KIND.SYSTEM, title: MSG.INSERT_COMMIT_OK, desc, broadcast, save });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);

        const title = MSG.INSERT_COMMIT_FAIL;
        mCenter?.notify({ kind: KIND.ERROR, title, desc, error, broadcast, save });

        return null;
      }
    },
    /**
     * insertTransaction
     * @param tx
     */
    insertTransaction: async (tx) => {
      const me = 'insertTransaction';
      const desc = `txhash: ${tx.txhash}; blocknum: ${tx.blockid}`;
      const broadcast = true;
      const save = true;

      try {
        if (!isTransactions(tx)) {
          const errorMessage = 'unexpected error: invalid transaction format';
          logger.error(errorMessage);

          mCenter?.notify({
            kind: KIND.ERROR,
            title: MSG.INSERT_TX_FAIL,
            desc,
            error: errorMessage,
            broadcast,
            save,
          });

          return null;
        }

        const result = await txRepository.save(tx);

        mCenter?.notify({
          kind: KIND.SYSTEM,
          title: MSG.INSERT_TX_OK,
          desc,
          broadcast,
          save,
          data: tx.txhash,
        });

        Debug(`${NS}:${me}`)('result: %O', result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);

        mCenter?.notify({
          kind: KIND.ERROR,
          title: MSG.INSERT_TX_FAIL,
          desc,
          error,
          broadcast,
          save,
        });

        return null;
      }
    },
    /**
     * isConnected
     */
    isConnected: async () => {
      if (!connection?.isConnected) {
        logger.info('querydb is not connected');
        return false;
      }
      return true;
    },
    /**
     * queryPaginatedTxAndParseToCommits
     * @param option
     */
    queryPaginatedTxAndParseToCommits: async (option) => {
      const me = 'parseBlockToCommits';
      const take = option?.take;
      const skip = option?.skip;
      const code =
        option?.isPrivate === undefined
          ? CODE.PUBLIC_COMMIT
          : option.isPrivate
          ? CODE.PRIVATE_COMMIT
          : CODE.PUBLIC_COMMIT;

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
                kind: KIND.ERROR,
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
    /**
     * removeUnverifiedBlock
     */
    removeUnverifiedBlock: async () => {
      const me = 'removeUnverifiedBlock';
      try {
        // step 1: check
        const blocks = await blockRepository.find({
          where: { verified: false },
          order: { blocknum: 'ASC' },
        });

        if (!blocks) {
          logger.error(`fail to ${me}`);
          return null;
        }

        if (isEqual(blocks, [])) {
          logger.info('no unverified blocks found');
          return false;
        }
        const toBeDeleted = blocks.map((b) => b?.blocknum);

        logger.info('delete block: ', toBeDeleted.toString());

        // step 2: delete block
        let result = await blockRepository.delete(toBeDeleted);

        Debug(`${NS}:${me}`)('delete block result %O', result);

        // step 3: delete tx
        for await (const blockid of toBeDeleted) {
          result = await txRepository.delete({ blockid });

          logger.info('delete tx: ', result.affected);
        }

        // step 4: delete commit
        for await (const blocknum of toBeDeleted) {
          result = await commitRepository.delete({ blocknum });

          logger.info('delete commit: ', result.affected);
        }

        mCenter?.notify({ kind: KIND.SYSTEM, title: MSG.UNVERIFIED_BLOCK_DELTED, data: result });

        return true;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
    /**
     * updateInsertedBlockKeyValue
     * @param blocknum
     */
    updateInsertedBlockKeyValue: async (blocknum) => {
      const me = 'updateInsertedBlockKeyValue';
      const desc = `blocknum: ${blocknum}`;
      const save = true;
      try {
        const insertedBlock = { key: KEY.INSERTED_BLOCK, modified: new Date() };

        // load pre-existing
        const keyvalue = await kvRepository.preload(insertedBlock);

        // append new blocknum
        insertedBlock['value'] = keyvalue?.value
          ? `${keyvalue.value},${blocknum}`
          : blocknum.toString();

        const result = await kvRepository.save(insertedBlock);

        Debug(`${NS}:${me}`)('updating keyvalue: %O', result);

        if (!result) {
          logger.error('unexpected error in updating key-value: insertedBlock');

          const title = MSG.UPDATE_KV_INSERTEDBLOCK_FAIL;

          mCenter.notify({ kind: KIND.ERROR, title, desc, save, data: blocknum });
        }
        return result;
      } catch (e) {
        logger.error(`fail to keyvalue: insertedblock : `, e);
        return null;
      }
    },
    /**
     * updateVerified
     * @param blocknum
     * @param verified
     */
    updateVerified: async (blocknum, verified) => {
      const me = 'updateVerified';
      try {
        const result = await blockRepository.update({ blocknum }, { verified });

        if (!result) {
          logger.error(`fail to ${me}`);
          return null;
        }
        return true;
      } catch (e) {
        logger.error(`fail to ${me} : `, e);
        return null;
      }
    },
  };
};
