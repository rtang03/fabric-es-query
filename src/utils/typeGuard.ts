import type { ConnectionProfile } from '../types';

export const isConnectionProfile = (input: any): input is ConnectionProfile =>
  input?.channels !== undefined &&
  input?.organizations !== undefined &&
  input?.peers !== undefined &&
  input?.orderers !== undefined;
