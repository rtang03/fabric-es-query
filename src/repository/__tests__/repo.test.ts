require('dotenv').config({ path: 'src/repository/__tests__/.env.repo' });
import fs from 'fs';
import path from 'path';
import util from 'util';
import yaml from 'js-yaml';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import { createFabricGateway } from '../../fabric';
import { FabricWallet } from '../../fabric/entities';
import { createMessageCenter } from '../../message';
import { createQueryDb } from '../../querydb';
import { Blocks, Commit, KeyValue, Transactions } from '../../querydb/entities';
import { createSynchronizer } from '../../sync/createSynchronizer';
import type {
  MessageCenter,
  QueryDb,
  FabricGateway,
  ConnectionProfile,
  Repository,
  Synchronizer,
} from '../../types';
import {
  extractNumberEnvVar,
  extractStringEnvVar,
  isCommit,
  isConnectionProfile,
  logger,
  waitSecond,
} from '../../utils';
import { ERROR } from '../constants';
import { createRepository } from '../createRepository';

/**
 * Running:
 * 1. cd && ./run.sh
 * 2. docker-compose -f compose.1org.yaml -f compose.2org.yaml -f compose.cc.org1.yaml -f compose.cc.org2.yaml -f compose.ot.yaml up -d --no-recreate
 */
let messageCenter: MessageCenter;
let fabric: FabricGateway;
let profile: ConnectionProfile;
let queryDb: QueryDb;
let repo: Repository;
let defaultConnection: Connection;
let connection: Connection;
let testConnectionOptions: ConnectionOptions;
let commitId1: string;
let commitId0: string;
let commitId1_private: string;
let commitId0_private: string;
let synchronizer: Synchronizer;

// used by built-in chaincode logic
const dev_entityName = 'dev_entity';
const dev_entityId = 'ent_dev_';
// used by this test
const entityName = 'dev_entity';
const entityId = `devtest${Math.floor(Math.random() * 10000)}`;
const entityId_private = `repotestprivate${Math.floor(Math.random() * 10000)}`;
const events = [{ type: 'User', payload: { name: 'me' } }];
const events_2 = [{ type: 'User', payload: { name: 'me too' } }];
const schema = 'repotest';
const port = extractNumberEnvVar('QUERYDB_PORT');
const username = extractStringEnvVar('QUERYDB_USERNAME');
const host = extractStringEnvVar('QUERYDB_HOST');
const password = extractStringEnvVar('QUERYDB_PASSWD');
const database = extractStringEnvVar('QUERYDB_DATABASE');
const connectionProfile = extractStringEnvVar('CONNECTION_PROFILE');
const adminId = extractStringEnvVar('ADMIN_ID');
const adminSecret = extractStringEnvVar('ADMIN_SECRET');
const connectionOptions: ConnectionOptions = {
  name: 'default',
  type: 'postgres' as any,
  host,
  port,
  username,
  password,
  database,
  logging: true,
  synchronize: false,
  dropSchema: false,
  entities: [Blocks, Transactions, Commit, KeyValue, FabricWallet],
  connectTimeoutMS: 10000,
};

beforeAll(async () => {
  messageCenter = createMessageCenter({ logger, persist: false });
  messageCenter.subscribe({
    next: (m) => console.log(util.format('📨 message received: %j', m)),
  });

  // Loading connection profile
  try {
    const pathToConnectionProfile = path.join(process.cwd(), connectionProfile);
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

  // FabricGateway
  try {
    // use different schema for testing
    defaultConnection = await createConnection(connectionOptions);
    await defaultConnection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    testConnectionOptions = {
      ...connectionOptions,
      ...{ name: schema, schema, synchronize: true, dropSchema: true },
    };
    connection = await createConnection(testConnectionOptions);

    fabric = createFabricGateway(profile, {
      adminId,
      adminSecret,
      discovery: true,
      asLocalhost: true,
      connection,
      logger,
      messageCenter,
    });
  } catch {
    console.error('fail to createFabricGateway');
    process.exit(1);
  }

  // QueryDb
  try {
    queryDb = createQueryDb({
      logger,
      connection,
      nonDefaultSchema: schema,
      messageCenter,
    });
  } catch (e) {
    logger.error('fail to createQueryDb: ', e);
    process.exit(1);
  }
  // Repo
  try {
    await fabric.initialize();

    repo = createRepository({ fabric, queryDb, logger, messageCenter, timeoutMs: 4000 });
  } catch (e) {
    logger.error('fail to createRepository: ', e);
    process.exit(1);
  }

  // Sync
  try {
    // 300 sec is long enough so that this test suite will finish before regular sync start
    synchronizer = createSynchronizer(300, {
      persist: false,
      initialTimeoutMs: 2000,
      initialShowStateChanges: false,
      dev: false,
      fabric,
      queryDb,
      logger,
    });

    void synchronizer.start().then(() => true);

    await fabric.initializeChannelEventHubs(synchronizer.getNewBlockObs());
  } catch (e) {
    logger.error('fail to createSynchronizer: ', e);
    process.exit(1);
  }
});

afterAll(async () => {
  await waitSecond(5);
  await synchronizer.stop();
  messageCenter.getMessagesObs().unsubscribe();
  await defaultConnection.close();
  await connection.close();
  await fabric.disconnect();
  await waitSecond(2);
});

describe('repo failure tests', () => {
  it('fail to cmd_getByEntityName: invalid entityName', async () =>
    repo
      .cmd_getByEntityName('abcd')
      .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));

  it('cmd_getByEntityName', async () =>
    repo.cmd_getByEntityName(dev_entityName).then(({ status, data }) => {
      expect(status).toEqual('ok');
      expect(data.map(({ commitId }) => commitId)).toEqual(['ent_dev_org1', 'ent_dev_org2']);
    }));

  it('fail to cmd_getByEntityNameEntityId: invalid entityName', async () =>
    repo
      .cmd_getByEntityNameEntityId('abcd', dev_entityId)
      .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));

  it('fail to cmd_getByEntityNameEntityId: invalid entityId', async () =>
    repo
      .cmd_getByEntityNameEntityId(dev_entityName, 'efgh')
      .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));

  it('cmd_getByEntityNameEntityId', async () =>
    repo.cmd_getByEntityNameEntityId(dev_entityName, dev_entityId).then(({ status, data }) => {
      expect(status).toEqual('ok');
      expect(data.map(({ commitId }) => commitId)).toEqual(['ent_dev_org1', 'ent_dev_org2']);
    }));

  it('fail to cmd_getByEntityNameEntityId: invalid entityName', async () =>
    repo
      .cmd_getByEntityNameEntityIdCommitId(dev_entityName, dev_entityId, 'abcd')
      .then((result) => expect(result).toEqual({ status: 'ok', data: [] })));

  it('cmd_getByEntityNameEntityId', async () =>
    repo
      .cmd_getByEntityNameEntityIdCommitId(dev_entityName, dev_entityId, 'ent_dev_org1')
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(data.map(({ commitId }) => commitId)).toEqual(['ent_dev_org1']);
      }));

  it('fail to cmd_create: invalid: invalid character', async () =>
    repo
      .cmd_create({ entityName: '_abc+=', id: entityId, version: 0, events }, false)
      .catch((error) => expect(error.message).toEqual(ERROR.ALPHA_NUMERIC_REQUIRED)));
});

describe('repo tests - public data', () => {
  it('cmd_create', async () =>
    repo
      .cmd_create({ entityName, id: entityId, version: 0, events }, false)
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(isCommit(data)).toBeTruthy();

        commitId0 = data.commitId;
      }));

  it('cmd_getByEntityNameEntityId', async () =>
    repo.cmd_getByEntityNameEntityId(entityName, entityId).then(({ status, data }) => {
      expect(status).toEqual('ok');
      data.forEach((commit) => {
        commit.events.map(({ payload }) => {
          expect(payload.timestamp).toBeDefined();
          expect(payload.name).toEqual('me');
        });
        expect(isCommit(commit)).toBeTruthy();
      });
    }));

  it('cmd_append', async () =>
    repo
      .cmd_append({ entityName, id: entityId, events: events_2 }, false)
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(isCommit(data)).toBeTruthy();

        commitId1 = data.commitId;
      }));

  it('cmd_getByEntityNameEntityId', async () =>
    repo.cmd_getByEntityNameEntityId(entityName, entityId).then(({ status, data }) => {
      expect(data[1].version).toEqual(1);
      expect(data.map(({ events }) => events.map(({ payload }) => payload.name))).toEqual([
        ['me'],
        ['me too'],
      ]);
      expect(status).toEqual('ok');
    }));

  it('cmd_deleteByEntityIdCommitId', async () =>
    repo
      .cmd_deleteByEntityIdCommitId(entityName, entityId, commitId0, false)
      .then(({ status }) => expect(status).toEqual('ok')));

  it('cmd_getByEntityNameEntityId', async () =>
    repo.cmd_getByEntityNameEntityId(entityName, entityId).then(({ status, data }) => {
      expect(data.length).toEqual(1);
      expect(data[0].version).toEqual(1);
      expect(status).toEqual('ok');
    }));

  it('cmd_deleteByEntityId', async () =>
    repo
      .cmd_deleteByEntityId(entityName, entityId)
      .then(({ status }) => expect(status).toEqual('ok')));

  it('cmd_getByEntityNameEntityId', async () =>
    repo.cmd_getByEntityNameEntityId(entityName, entityId).then(({ status, data }) => {
      expect(data).toEqual([]);
      expect(status).toEqual('ok');
    }));
});

describe('repo test - private data', () => {
  it('cmd_create', async () =>
    repo
      .cmd_create({ entityName, id: entityId_private, version: 0, events }, true)
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(isCommit(data)).toBeTruthy();

        commitId0_private = data.commitId;
      }));

  it('cmd_getByEntityNameEntityId', async () =>
    repo
      .cmd_getByEntityNameEntityId(entityName, entityId_private, true)
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(data[0].id).toEqual(entityId_private);
        expect(data[0].version).toEqual(0);
        data.forEach((commit) => {
          commit.events.map(({ payload }) => {
            expect(payload.timestamp).toBeDefined();
            expect(payload.name).toEqual('me');
          });
          expect(isCommit(commit)).toBeTruthy();
        });
      }));

  it('cmd_append', async () =>
    repo
      .cmd_append({ entityName, id: entityId_private, events: events_2 }, true)
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(isCommit(data)).toBeTruthy();

        commitId1_private = data.commitId;
      }));

  it('cmd_getByEntityNameEntityId', async () =>
    repo
      .cmd_getByEntityNameEntityId(entityName, entityId_private, true)
      .then(({ status, data }) => {
        expect(data[1].version).toEqual(1);
        expect(data.map(({ events }) => events.map(({ payload }) => payload.name))).toEqual([
          ['me'],
          ['me too'],
        ]);
        expect(status).toEqual('ok');
      }));

  it('cmd_deleteByEntityIdCommitId - commit0', async () =>
    repo
      .cmd_deleteByEntityIdCommitId(entityName, entityId_private, commitId0_private, true)
      .then(({ status }) => expect(status).toEqual('ok')));

  it('cmd_deleteByEntityIdCommitId - commit1', async () =>
    repo
      .cmd_deleteByEntityIdCommitId(entityName, entityId_private, commitId1_private, true)
      .then(({ status }) => expect(status).toEqual('ok')));

  it('cmd_getByEntityNameEntityId - should be []', async () =>
    repo
      .cmd_getByEntityNameEntityId(entityName, entityId_private, true)
      .then(({ status, data }) => {
        expect(data).toEqual([]);
        expect(status).toEqual('ok');
      }));
});

describe('query tests, after sync completes', () => {
  // long enough for first syncJob to complete
  // repeated tests accumulated more blocks, the below time may need increased.
  // And, the total increases correspondingly.
  it('dummy wait for sync to complete', async () => await waitSecond(60));

  // return first two of eventstore:createCommit
  it('query_getByEntityName: use dev_entity (return first 2 commits)', async () =>
    repo
      .query_getByEntityName({ entityName, take: 2, skip: 0, sort: 'ASC', orderBy: 'commitId' })
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(data.items.map(({ entityName }) => entityName)).toEqual([entityName, entityName]);
      }));

  // return build-in chaincode dev_entity
  it('query_getByEntityNameEntityId: use dev_entityId (return 2x commits)', async () =>
    repo
      .query_getByEntityNameEntityId({
        entityName,
        entityId: dev_entityId,
        take: 2,
        skip: 0,
        sort: 'ASC',
        orderBy: 'commitId',
      })
      .then(({ status, data }) => {
        expect(status).toEqual('ok');
        expect(data.total).toEqual(2);
        expect(data.items.map(({ entityId }) => entityId)).toEqual([dev_entityId, dev_entityId]);
      }));

  // return build-in chaincode dev_entity
  it('query_getByEntityNameEntityIdCommitId: use ent_dev_ & ent_dev_org1', async () =>
    repo
      .query_getByEntityNameEntityIdCommitId({
        entityName,
        entityId: dev_entityId,
        commitId: 'ent_dev_org1',
      })
      .then(({ status, data }) => {
        expect(data.total).toEqual(1);
        expect(data.items.map(({ commitId }) => commitId)).toEqual(['ent_dev_org1']);
      }));
});
