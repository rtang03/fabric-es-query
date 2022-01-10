import { Subject } from 'rxjs';
import { Connection } from 'typeorm';

export type SyncJob = {
  id: number;
  timestamp?: Date;
  blocknum?: number;
};

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
  getNewBlockObs: () => Subject<SyncJob>;
};
