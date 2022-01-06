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
  // it('t1: run 1x', async () => {
  //   await synchronizer.start(1);
  //   asyncScheduler.schedule(async () => synchronizer.stop(), 2000);
  //   await waitSecond(3);
  //   console.log('test #1 done');
  // });
  //
  // it('t2: run 1x', async () => {
  //   await synchronizer.start(1);
  //   asyncScheduler.schedule(async () => synchronizer.stop(), 2000);
  //   await waitSecond(3);
  //   console.log('test #2 done');
  // });

  it('repeated start / stop', async () => {
    await synchronizer.start();
    asyncScheduler.schedule(async () => synchronizer.stop(), 5000);
    asyncScheduler.schedule(async () => synchronizer.start(), 10000);
    asyncScheduler.schedule(async () => synchronizer.stop(), 15000);
    await waitSecond(16);
  });

  // it('start / change syncTime / restart', async () => {
  //   await synchronizer.start();
  //   asyncScheduler.schedule(async () => synchronizer.stopAndChangeSyncTime(2), 5000);
  //   asyncScheduler.schedule(async () => synchronizer.start(), 6000);
  //   asyncScheduler.schedule(async () => synchronizer.stop(), 18000);
  // });
});
