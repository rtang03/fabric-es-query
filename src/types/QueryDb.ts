import { Connection } from 'typeorm';

export type QueryDb = {
  connect: () => Promise<Connection>;
  disconnect: () => Promise<void>;
  findMissingBlockNumber?: (maxHeight: number) => Promise<number[]>;
  getBlockCount?: () => Promise<number>;
  getTxCount?: () => Promise<number>;
};
