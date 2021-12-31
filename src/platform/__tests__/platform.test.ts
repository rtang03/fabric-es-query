require('dotenv').config({ path: 'src/querydb/__tests__/.env.platform' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';
import type { PlatformConfig } from '../../types';
import { isPlatformConfig } from '../../utils';

let platformConfig: PlatformConfig;

beforeAll(async () => {
  try {
    const pathToConfig = path.join(process.cwd(), process.env.PLATFORM_CONFIG);
    const file = fs.readFileSync(pathToConfig);
    const loadedFile: unknown = yaml.load(file);
    if (isPlatformConfig(loadedFile)) platformConfig = loadedFile;
    else {
      console.log(loadedFile);
      console.error('invalid file format');
      process.exit(1);
    }
  } catch {
    console.error('fail to load file');
    process.exit(1);
  }
});

afterAll(async () => {});

describe('platform test', () => {
  it('connect', async () => {
    return;
  });
});
