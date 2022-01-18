export type NewCommitNotify = {
  entityName: string;
  entityId: string;
  commitId: string;
  blocknum: number;
  txId?: string;
  timestamp?: Date;
};
