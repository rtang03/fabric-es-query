require('dotenv').config({ path: 'src/sync/__tests__/.env.sync' });
import { asyncScheduler } from 'rxjs';
import type { Synchronizer } from '../../types';
import { logger, waitSecond } from '../../utils';
import { createSynchronizer } from '../createSynchronizer';

let synchronizer: Synchronizer;

afterAll(async () => {
  await waitSecond(1);
});

// TODO: DON"T work, fix later

describe('sync tests -- good tests', () => {
  it('t1: run 1x', async () => {
    synchronizer = createSynchronizer(1, { persist: false, logger, dev: true });
    await synchronizer.start(1);
    asyncScheduler.schedule(async () => synchronizer.stop(), 2000);

    // wait it to stop
    await waitSecond(4);
    console.log('1x done');
  });

  it('t2: run 2x', async () => {
    synchronizer = createSynchronizer(1, { persist: false, logger, dev: true });

    await synchronizer.start(2);
    asyncScheduler.schedule(async () => synchronizer.stop(), 2000);

    // wait it to stop
    await waitSecond(4);
    console.log('2x done');

  });

  it('repeated start / stop - 1x', async () => {
    synchronizer = createSynchronizer(1, { persist: false, logger, dev: true });

    asyncScheduler.schedule(async () => synchronizer.stop(), 5000);

    await synchronizer.start();

    await waitSecond(2);
  });

  it('repeated start / stop - 2x', async () => {
    synchronizer = createSynchronizer(1, { persist: false, logger, dev: true });

    // stop#1
    asyncScheduler.schedule(async () => synchronizer.stop(), 5000);

    // start#2
    asyncScheduler.schedule(async () => synchronizer.start(), 10000);

    // stop#2
    asyncScheduler.schedule(async () => synchronizer.stop(), 14000);

    //  start#1. below start() will return, after first
    await synchronizer.start();

    // wait for start#2
    await waitSecond(15);
  });

  it('start / change syncTime / restart', async () => {
    synchronizer = createSynchronizer(1, { persist: false, logger, dev: true });

    // stop#1
    asyncScheduler.schedule(async () => synchronizer.stopAndChangeSyncTime(2), 5000);

    // start#2
    asyncScheduler.schedule(async () => synchronizer.start(), 7000);

    // stop#2
    asyncScheduler.schedule(async () => synchronizer.stop(), 13000);

    //  start#1. below start() will return, after first
    await synchronizer.start();

    // wait for start#2
    await waitSecond(15);
  });
});
