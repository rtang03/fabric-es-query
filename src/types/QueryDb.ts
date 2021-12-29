import { Connection } from 'typeorm';
import { Blocks, Transactions } from '../querydb/entities';

export type QueryDb = {
  connect: () => Promise<Connection>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  findMissingBlockNumber?: (maxHeight: number) => Promise<number[]>;
  getBlockHeight: () => Promise<number>;
  getTxCount: () => Promise<number>;
  insertBlock: (block: Blocks) => Promise<Blocks>;
  insertTransaction: (tx: Transactions) => Promise<Transactions>;
};
