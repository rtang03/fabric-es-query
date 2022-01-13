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
  dev?: boolean;
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

export type QueryPagTxParseToCommitsOption = {
  take?: number;
  skip?: number;
  isPrivate?: boolean;
  batchSize?: number;
};

export type QueryDb = {
  cascadedDeleteByBlocknum: (blocknum: number) => Promise<boolean>;
  checkIntegrity: (blocknum: number) => Promise<boolean>;
  disconnect: () => Promise<void>;
  findBlock: (option?: FindPaginatedBlockOption) => Promise<PaginatedBlock>;
  findCommit: (option: FindPaginatedCommitOption) => Promise<PaginatedCommit>;
  findMissingBlock: (maxHeight: number) => Promise<number[]>;
  findTxWithCommit: (option: FindPaginatedTransactionOption) => Promise<PaginatedTransaction>;
  findUnverified: () => Promise<number[]>;
  getBlockHeight: () => Promise<number>;
  getTxCount: () => Promise<number>;
  insertBlock: (block: Blocks) => Promise<Blocks>;
  insertCommit: (commit: Commit) => Promise<Commit>;
  insertTransaction: (tx: Transactions) => Promise<Transactions>;
  isConnected: () => Promise<boolean>;
  queryPaginatedTxAndParseToCommits: (
    option?: QueryPagTxParseToCommitsOption
  ) => Promise<PaginatedCommit>;
  removeAllBlock?: () => Promise<boolean>;
  removeAllCommit?: () => Promise<boolean>;
  removeAllTransaction?: () => Promise<boolean>;
  removeUnverifiedBlock: (blocknum: number) => Promise<any>;
  updateInsertedBlockKeyValue: (blocknum: number) => Promise<any>;
  updateVerified: (blocknum: number, verified: boolean) => Promise<boolean>;
};
