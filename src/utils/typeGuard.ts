import type { ConnectionProfile, PlatformConfig } from '../types';
import { Blocks, Transactions } from '../querydb/entities';

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
