import { Connection } from 'typeorm';

export type Synchronizer = {
  connect: () => Promise<Connection>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  getInfo: () => {
    persist: boolean;
    syncTime: number;
    currentJob: string;
    timeout: number;
    showStateChanges: boolean;
  };
  isBackendsReady: () => Promise<boolean>;
  start: (numberOfExecution?: number) => Promise<boolean>;
  stop: () => Promise<void>;
  isSyncJobActive: () => boolean;
  stopAndChangeSyncTime: (syncTime: number) => void;
  stopAndChangeRequestTimeout: (timeout: number) => void;
  stopAndChangeShowStateChanges: (state: boolean) => void;
  getState: () => Promise<any>;
};
