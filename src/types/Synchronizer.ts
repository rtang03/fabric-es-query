import { Connection } from 'typeorm';

export type Synchronizer = {
  connect?: () => Promise<Connection>;
  disconnect?: () => Promise<void>;
  isConnected?: () => Promise<boolean>;
  getInfo: () => any;
  start: () => Promise<any>;
  stop: () => any;
};
