
require('dotenv').config({ path: 'src/message/__tests__/.env.messagecenter' });
import { Connection, createConnection } from 'typeorm';
import { type MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import type { MessageCenter } from '../../types';
import {
  extractNumberEnvVar,
  extractStringEnvVar,
  isIncident,
  logger,
  waitSecond,
} from '../../utils';
import { createMessageCenter } from '../createMessageCenter';
import { Incident } from '../entities/Mongo.Incident';
import { m1a, m2a, m3a, m4a, m5a, m1b, m2b, m3b, m4b, m5b } from './__utils__/data';

let mCenter: MessageCenter;
let mCenterWithSave: MessageCenter;
let connection: Connection;

const port = extractNumberEnvVar('QUERYDB_PORT');
const username = extractStringEnvVar('QUERYDB_USERNAME');
const host = extractStringEnvVar('QUERYDB_HOST');
const password = extractStringEnvVar('QUERYDB_PASSWD');
const database = extractStringEnvVar('QUERYDB_DATABASE');
const connectionOptions: MongoConnectionOptions = {
  name: 'default',
  type: 'mongodb' as any,
  database: 'did-db',
  // "error" | "warn" | "info" | "debug";
  loggerLevel: 'debug',
  synchronize: true,
  dropSchema: true,
  entities: [Incident],
  connectTimeoutMS: 10000,
  url: 'mongodb://tester:tester-password@localhost:27017',
  useUnifiedTopology: true,
};

beforeAll(async () => {
  try {
    connection = await createConnection(connectionOptions);

    mCenter = createMessageCenter({ logger, persist: false });
    mCenterWithSave = createMessageCenter({ logger, connection, persist: true });
  } catch (e) {
    console.error('fail to createMessageCenter', e);
    process.exit(1);
  }
});

afterAll(async () => {
  await waitSecond(2);
  mCenter.getSubscription().unsubscribe();
  mCenterWithSave.getSubscription().unsubscribe();
  await connection.driver.disconnect();
  await mCenterWithSave.disconnect();
  await waitSecond(2);
});

describe('message center test', () => {
  it('notify - console only', async () => {
    [m1b, m2b, m3b, m4b, m5b].forEach((msg) => mCenter.notify({ ...msg, timestamp: new Date() }));
    return true;
  });

  it('mCenterWithSave isConnected', async () =>
    mCenterWithSave.isConnected().then((result) => expect(result).toBeTruthy()));

  it('mCenterWithSave notify - with save', async () => {
    [m1a, m2a, m3a, m4a, m5a].forEach((msg) =>
      mCenterWithSave.notify({ ...msg, timestamp: new Date() })
    );
    await waitSecond(1);
    return true;
  });

  it(`mCenterWithSave getIncidents - all`, async () =>
    mCenterWithSave.getIncidents({ kind: 'test', orderBy: 'id', sort: 'ASC' }).then((result) => {
      const ids = result.items.map((incident) => {
        expect(isIncident(incident)).toBeTruthy();
        return incident.id;
      });
      expect(result.total).toEqual(5);
      expect(result.hasMore).toBeFalsy();
      expect(result.cursor).toEqual(5);
    }));

  it(`mCenterWithSave getIncidents - take 1 - 2`, async () =>
    mCenterWithSave
      .getIncidents({ kind: 'test', orderBy: 'id', sort: 'ASC', skip: 0, take: 2 })
      .then((result) => {
        const ids = result.items.map((incident) => {
          expect(isIncident(incident)).toBeTruthy();
          return incident.id;
        });
        expect(result.total).toEqual(5);
        expect(result.hasMore).toBeTruthy();
        expect(result.cursor).toEqual(2);
        expect(ids.length).toEqual(2);
      }));

  it(`mCenterWithSave getIncidents - take 2 - 4`, async () =>
    mCenterWithSave
      .getIncidents({ kind: 'test', orderBy: 'id', sort: 'ASC', skip: 1, take: 3 })
      .then((result) => {
        const ids = result.items.map((incident) => {
          expect(isIncident(incident)).toBeTruthy();
          return incident.id;
        });
        expect(result.total).toEqual(5);
        expect(result.hasMore).toBeTruthy();
        expect(result.cursor).toEqual(4);
        expect(ids.length).toEqual(3);
      }));

  it(`mCenterWithSave getIncidents - take 4 - 6`, async () =>
    mCenterWithSave
      .getIncidents({ kind: 'test', orderBy: 'id', sort: 'ASC', skip: 3, take: 3 })
      .then((result) => {
        const ids = result.items.map((incident) => {
          expect(isIncident(incident)).toBeTruthy();
          return incident.id;
        });
        expect(result.total).toEqual(5);
        expect(result.hasMore).toBeFalsy();
        expect(result.cursor).toEqual(5);
        expect(ids.length).toEqual(2);
      }));
});
