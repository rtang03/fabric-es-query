import { Connection } from 'typeorm';
import type { FabricGateway } from './FabricGateway';
import type { MessageCenter } from './MessageCenter';
import type { QueryDb } from './QueryDb';
import type { Repository } from './Repository';
import type { Synchronizer } from './Synchronizer';

type Info = {
  status: 'ok' | 'error';
  info: string;
};

export type HealthInfo = {
  fabric: Info[];
  queryDb: Info[];
  messageCenter: Info[];
  synchronizer: Info[];
  dbConnection: Info[];
};

export type Platform = {
  disconnect: () => Promise<void>;
  initialize: () => Promise<boolean>;
  getRepository: () => Repository;
  getQueryDb: () => QueryDb;
  getFabricGateway: () => FabricGateway;
  getConnection: () => Connection;
  getSynchronizer: () => Synchronizer;
  getMessageCenter: () => MessageCenter;
  getHealthInfo: () => Promise<HealthInfo>;
};
