require('dotenv').config({ path: 'src/sync/__tests__/.env.sync' });
import { asyncScheduler } from 'rxjs';
import type { Synchronizer } from '../../types';
import { logger, waitSecond } from '../../utils';
import { createSynchronizer } from '../createSynchronizer';

let synchronizer: Synchronizer;

beforeAll(async () => {
  synchronizer = createSynchronizer(1, { persist: false, logger, dev: true });
});

afterAll(async () => {
  await waitSecond(1);
});

describe('sync tests -- good tests', () => {
  it('run 1x', async () => {
    asyncScheduler.schedule(() => synchronizer.stop(), 5000);
    await synchronizer.start(1);
  });

  it('repeated start / stop', async () => {
    asyncScheduler.schedule(() => synchronizer.stop(), 5000);
    asyncScheduler.schedule(() => synchronizer.start(), 10000);
    asyncScheduler.schedule(() => synchronizer.stop(), 15000);
    await synchronizer.start();
  });

  it('start / change syncTime / restart', async () => {
    asyncScheduler.schedule(() => synchronizer.stopAndChangeSyncTime(2), 5000);
    asyncScheduler.schedule(() => synchronizer.start(), 6000);
    asyncScheduler.schedule(() => synchronizer.stop(), 18000);
    await synchronizer.start();
  });
});
