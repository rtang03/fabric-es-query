require('dotenv').config({ path: 'src/fabric/__tests__/.env.fg.test' });
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { ConnectionProfile, FabricGateway } from '../../types';
import { isConnectionProfile, logger, waitForSecond } from '../../utils';
import { createFabricGateway } from '../createFabricGateway';

/*
./dev-net/run.sh
 */

let fg: FabricGateway;
let profile: ConnectionProfile;

beforeAll(async () => {
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
    });
  } catch (err) {
    console.error(err);
  }
});

afterAll(async () => {
  await waitForSecond(2);
});

describe('fabricGateway tests', () => {
  it('getInfo', async () => {
    const { adminId } = fg.getInfo();
    expect(adminId).toBeDefined();
  });

  it('initialize', async () => {
    await fg.initialize();

    expect(fg.getInfo().isCaAdminInWallet).toBeTruthy();
  });
});
