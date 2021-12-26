import type { ConnectionProfile, PlatformConfig } from '../types';

export const isConnectionProfile = (input: any): input is ConnectionProfile =>
  input?.channels !== undefined &&
  input?.organizations !== undefined &&
  input?.peers !== undefined &&
  input?.orderers !== undefined;

export const isPlatformConfig = (input: any): input is PlatformConfig =>
  input?.sync?.syncDuration !== undefined;
