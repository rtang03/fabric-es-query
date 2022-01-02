import { Models } from '@rematch/core';
import { syncJob } from './SyncJob';

export interface RootModel extends Models<RootModel> {
  syncJob: typeof syncJob;
}

export const models: RootModel = { syncJob };
