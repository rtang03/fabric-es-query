require('dotenv').config({ path: 'src/fabric/__tests__/.env.fg.test' });
import fs from 'fs';
import path from 'path';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import fetch from 'isomorphic-unfetch';
import yaml from 'js-yaml';
import type { ConnectionProfile, FabricGateway } from '../../types';
import {
  createMetricServer,
  isConnectionProfile,
  logger,
  Meters,
  METERS,
  waitForSecond,
} from '../../utils';
import { createFabricGateway } from '../createFabricGateway';

/*
./dev-net/run.sh
 */

let fg: FabricGateway;
let profile: ConnectionProfile;
let metrics: {
  meters: Partial<Meters>;
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
};

beforeAll(async () => {
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
      metricsOn: true,
      meters: metrics.meters,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }
});

afterAll(async () => {
  await waitForSecond(2);
  await metrics.meterProvider.shutdown();
  await metrics.exporter.stopServer();
});

describe('fabricGateway tests', () => {
  it('getInfo', async () => {
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

  it('queryBlock', async () =>
    fg.queryBlock(fg.getDefaultChannelName(), 10).then(async (result) => {
      // do some check
    }));

  it('queryChainInfo', async () =>
    fg.queryChainInfo(fg.getDefaultChannelName()).then((result) => {
      console.log(result);
    }));

  it('validate with metric server', async () => {
    await waitForSecond(2);

    const res = await fetch('http://localhost:9000/metrics');
    expect(res.status).toEqual(200);

    const text = await res.text();
    console.log(text);
  });
});
