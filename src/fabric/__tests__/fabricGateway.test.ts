require('dotenv').config({ path: 'src/fabric/__tests__/.env.fabricgateway' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import fetch from 'isomorphic-unfetch';
import yaml from 'js-yaml';
import rimraf from 'rimraf';
import { createMessageCenter } from '../../message';
import type { ConnectionProfile, FabricGateway, MessageCenter } from '../../types';
import {
  createMetricServer,
  isConnectionProfile,
  logger,
  type Meters,
  METERS,
  waitSecond,
} from '../../utils';
import { createFabricGateway } from '../createFabricGateway';

/**
 * Running:
 * 1. cd && ./run.sh
 * 2. docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.explorer.yaml -f compose.ot.yaml up -d --no-recreate
 */
let messageCenter: MessageCenter;
let fg: FabricGateway;
let profile: ConnectionProfile;
let metrics: {
  meters: Partial<Meters>;
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
};

beforeAll(async () => {
  messageCenter = createMessageCenter({ logger });
  messageCenter.subscribe({
    next: (m) => console.log(util.format('📨 message received: %j', m)),
    error: (e) => console.error(util.format('❌ message error: %j', e)),
    complete: () => console.log('subscription completed'),
  });

  // removing pre-existing wallet
  try {
    await new Promise((resolve, reject) =>
      rimraf(path.join(__dirname, '__wallet__'), (err) => (err ? reject(err) : resolve(true)))
    );
  } catch {
    console.error('fail to remove wallet');
    process.exit(1);
  }

  try {
    metrics = createMetricServer('my-meter', {
      filterMeters: [METERS.ENROLL_COUNT, METERS.QUERYBLOCK_COUNT],
      logger,
    });
  } catch (e) {
    console.error(e);
    console.error('fail to create MeterProvider');
    process.exit(1);
  }

  // Loading connection profile
  try {
    const pathToConnectionProfile = path.join(process.cwd(), process.env.CONNECTION_PROFILE);
    const file = fs.readFileSync(pathToConnectionProfile);
    const loadedFile: unknown = yaml.load(file);
    if (isConnectionProfile(loadedFile)) profile = loadedFile;
    else {
      console.error('invalid connection profile');
      process.exit(1);
    }
  } catch {
    console.error('fail to read connection profile');
    process.exit(1);
  }

  try {
    fg = createFabricGateway(profile, {
      adminId: process.env.ADMIN_ID,
      adminSecret: process.env.ADMIN_SECRET,
      walletPath: process.env.WALLET,
      logger,
      meters: metrics.meters,
      messageCenter,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }
});

afterAll(async () => {
  messageCenter.getMessagesObs().unsubscribe();
  await waitSecond(2);
  await metrics.meterProvider.shutdown();
  await metrics.exporter.stopServer();
});

describe('fabricGateway tests', () => {
  it('should getInfo', async () => {
    const { adminId } = fg.getInfo();
    expect(adminId).toBeDefined();
  });

  it('initialize', async () => {
    await fg.initialize();

    const { isCaAdminEnrolled, isCaAdminInWallet } = fg.getInfo();

    expect(isCaAdminEnrolled).toBeTruthy();
    expect(isCaAdminInWallet).toBeTruthy();
  });

  it('queryChannels', async () =>
    fg
      .queryChannels()
      .then((channels) => expect(channels).toEqual({ channels: [{ channel_id: 'loanapp' }] })));

  it('fail to getIdentityInfo', async () =>
    fg.getIdentityInfo('abcd').then((result) => expect(result).toBeNull()));

  it('getIdentityInfo', async () =>
    fg.getIdentityInfo(process.env.ADMIN_ID).then(({ type, mspId }) => {
      expect(type).toEqual('X.509');
      expect(mspId).toEqual('Org1MSP');
    }));

  // generated for other tests
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((blockNum) => {
    it(`queryBlock - ${blockNum}`, async () =>
      fg.queryBlock(fg.getDefaultChannelName(), blockNum).then(async (result) => {
        const fs = require('fs');
        fs.writeFileSync(
          path.join(__dirname, `__generated__/block-${blockNum}.json`),
          JSON.stringify(result, null, 2)
        );
        expect(result?.header).toBeDefined();
        expect(result?.data).toBeDefined();
        expect(result?.metadata).toBeDefined();
      }));
  });

  it('queryChannelHeight', async () =>
    fg
      .queryChannelHeight(fg.getDefaultChannelName())
      .then((result) => expect(typeof result).toBe('number')));

  it('validate with metric server', async () => {
    await waitSecond(2);

    const res = await fetch('http://localhost:9000/metrics');
    expect(res.status).toEqual(200);

    const metricText = await res.text();
    // should return:
    // # HELP enrollment_total Count number of enrolled
    // # TYPE enrollment_total counter
    //   enrollment_total 2 1640367546744
    // # HELP queryBlock_total Count number of queryBlock executed
    // # TYPE queryBlock_total counter
    //   queryBlock_total 1 1640367548673

    expect(metricText).toBeDefined();
  });
});
