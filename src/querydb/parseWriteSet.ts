import Debug from 'debug';
import winston from 'winston';
import { isCommit, isWriteSet } from '../utils';
import { Commit, Transactions } from './entities';

// Parse one write_set
export const parseWriteSet = (tx: Transactions, logger: winston.Logger): Commit => {
  let ws: unknown;
  const NS = 'querydb';
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
      const item = ws?.filter(({ chaincode }) => chaincode === chaincodename)?.[0]?.set?.[0];
      const key = item?.key;
      const value = item?.value;
      const is_delete = item?.is_delete;

      if (!value) {
        logger.warn(`no value in write_set is found at blockid: ${blockid}`);
        return null;
      }

      logger.info(`parsing ${key}, txid: ${txhash}, blockid: ${blockid}`);
      logger.info(`value in write_set is found at blockid: ${blockid}`);

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
