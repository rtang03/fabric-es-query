import { Connection } from 'typeorm';
import { Blocks, Commit, Transactions } from '../querydb/entities';
import type { PaginatedBlock, PaginatedCommit, PaginatedTransaction } from './index';

export type FindPaginatedCommitOption = {
  take?: number;
  skip?: number;
  sort?: 'ASC' | 'DESC';
  orderBy?: keyof Commit;
  id?: string;
  entityName?: string;
  commitId?: string;
  entityId?: string;
  mspId?: string;
};

export type FindPaginatedBlockOption = {
  take?: number;
  skip?: number;
  sort?: 'ASC' | 'DESC';
  orderBy?: keyof Blocks;
  blocknum?: number;
};

export type FindPaginatedTransactionOption = {
  take?: number;
  skip?: number;
  sort?: 'ASC' | 'DESC';
  orderBy?: keyof Transactions;
  code?: number;
  isValid?: boolean;
};

export type ParseBlocksToCommitsOption = {
  take?: number;
  skip?: number;
  isPrivate?: boolean;
  batchSize?: number;
};

export type QueryDb = {
  connect: () => Promise<Connection>;
  disconnect: () => Promise<void>;
  findBlock: (option?: FindPaginatedBlockOption) => Promise<PaginatedBlock>;
  findCommit: (option?: FindPaginatedCommitOption) => Promise<PaginatedCommit>;
  findMissingBlock: (maxHeight: number) => Promise<number[]>;
  findTxWithCommit: (option: FindPaginatedTransactionOption) => Promise<PaginatedTransaction>;
  getBlockHeight: () => Promise<number>;
  getTxCount: () => Promise<number>;
  insertBlock: (block: Blocks) => Promise<Blocks>;
  insertCommit: (commit: Commit) => Promise<Commit>;
  insertTransaction: (tx: Transactions) => Promise<Transactions>;
  isConnected: () => Promise<boolean>;
  parseBlocksToCommits: (option?: ParseBlocksToCommitsOption) => Promise<PaginatedCommit>;
  removeAllBlock?: () => Promise<boolean>;
  removeAllCommit?: () => Promise<boolean>;
  removeAllTransaction?: () => Promise<boolean>;
  replaceBlock?: (blockNum: number) => Promise<any>;
};
