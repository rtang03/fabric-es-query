import { type Models } from '@rematch/core';
import { queue } from './Queue';
import { syncJob } from './SyncJob';

export interface RootModel extends Models<RootModel> {
  syncJob: typeof syncJob;
  queue: typeof queue;
}

export const models: RootModel = { syncJob, queue };
