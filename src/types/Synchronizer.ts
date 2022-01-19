import { Subject } from 'rxjs';
import { Connection } from 'typeorm';

export type SyncJob = {
  id: number;
  timestamp?: Date;
  blocknum?: number;
};

export type Synchronizer = {
  getInfo: () => {
    persist: boolean;
    syncTime: number;
    currentJob: string;
    timeout: number;
    showStateChanges: boolean;
  };
  getNewBlockObs: () => Subject<SyncJob>;
  isBackendsReady: () => Promise<boolean>;
  isSyncJobActive: () => boolean;
  setMaxSyncHeight: (maxheight: number) => void;
  start: (numberOfExecution?: number) => Promise<boolean>;
  stop: () => Promise<void>;
  stopAndChangeRequestTimeout: (timeout: number) => void;
  stopAndChangeShowStateChanges: (state: boolean) => void;
  stopAndChangeSyncTime: (syncTime: number) => void;
  syncBlocksByEntityName?: (entityName: string) => Promise<boolean>;
  syncBlocksByEntityNameEntityId?: (entityName: string, entityId: string) => Promise<boolean>;
};
