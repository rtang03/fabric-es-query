import { Connection } from 'typeorm';
import { Blocks, Commit, Transactions } from '../querydb/entities';

export type QueryDb = {
  connect: () => Promise<Connection>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  findMissingBlock: (maxHeight: number) => Promise<number[]>;
  replaceBlock?: (blockNum: number) => Promise<any>;
  getBlockHeight: () => Promise<number>;
  getTxCount: () => Promise<number>;
  insertBlock: (block: Blocks) => Promise<Blocks>;
  insertTransaction: (tx: Transactions) => Promise<Transactions>;
  getPublicCommitTx: () => Promise<Transactions[]>;
  getPrivateCommitTx: () => Promise<Transactions[]>;
  findPublicCommitTxWithFailure: () => Promise<Transactions[]>;
  findPrivateCommitTxWithFailure: () => Promise<Transactions[]>;
  getPublicCommit: (blockid?: number) => Promise<Commit[]>;
  getPrivateCommit: (blockid?: number) => Promise<Commit[]>;
};
