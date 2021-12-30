import { Blocks, Commit, Transactions } from '../querydb/entities';
import type { ConnectionProfile, PlatformConfig } from '../types';

export const isConnectionProfile = (input: any): input is ConnectionProfile =>
  input?.channels !== undefined &&
  input?.organizations !== undefined &&
  input?.peers !== undefined &&
  input?.orderers !== undefined;

export const isPlatformConfig = (input: any): input is PlatformConfig =>
  input?.sync?.syncDuration !== undefined &&
  input?.querydb?.port !== undefined &&
  input?.querydb?.host !== undefined;

export const isBlocks = (input: any): input is Blocks =>
  input?.blocknum !== undefined &&
  input?.datahash !== undefined &&
  input?.prehash !== undefined &&
  input?.txcount !== undefined &&
  input?.createdt !== undefined &&
  input?.blockhash !== undefined;

export const isTransactions = (input: any): input is Transactions =>
  input?.blockid !== undefined &&
  input?.txhash !== undefined &&
  input?.createdt !== undefined &&
  input?.type !== undefined &&
  input?.creator_msp_id !== undefined &&
  input?.validation_code !== undefined &&
  input?.creator_id_bytes !== undefined;

export type WriteSet = {
  chaincode: string;
  set: { key: string; is_delete?: boolean; value: string }[];
}[];

export const isWriteSet = (input: any): input is WriteSet =>
  Array.isArray(input)
    ? input.map((item) => item?.chaincode !== undefined).reduce((prev, curr) => prev && curr, true)
    : false;

export const isCommit = (input: any): input is Commit =>
  input?.id !== undefined &&
  input?.commitId !== undefined &&
  input?.entityId !== undefined &&
  input?.entityName !== undefined &&
  input?.events !== undefined &&
  input?.version !== undefined;
