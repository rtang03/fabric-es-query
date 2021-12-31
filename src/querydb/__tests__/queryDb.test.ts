require('dotenv').config({ path: 'src/querydb/__tests__/.env.querydb' });
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import fetch from 'isomorphic-unfetch';
import { Connection, type ConnectionOptions, createConnection } from 'typeorm';
import { createMessageCenter } from '../../message';
import type { QueryDb, MessageCenter } from '../../types';
import {
  CODE,
  createMetricServer,
  isBlocks,
  isCommit,
  isTransactions,
  logger,
  type Meters,
  METERS,
  waitForSecond,
} from '../../utils';
import { createQueryDb } from '../createQueryDb';
import { Blocks, Commit, Transactions } from '../entities';
import { b0, b1, b10, b2, b3, b4, b5, b6, b7, b8, b9 } from './__utils__/data';
import { t0, t1, t10, t2, t3, t4, t5, t6, t7, t8, t9 } from './__utils__/data';

let messageCenter: MessageCenter;
let queryDb: QueryDb;
let defaultConnection: Connection;
let testConnection: Promise<Connection>;
let testConnectionOptions: ConnectionOptions;
let metrics: {
  meters: Partial<Meters>;
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
};

const schema = 'querydbtest';
const connectionOptions: ConnectionOptions = {
  name: 'default',
  type: 'postgres' as any,
  host: process.env.QUERYDB_HOST,
  port: parseInt(process.env.QUERYDB_PORT, 10),
  username: process.env.QUERYDB_USERNAME,
  password: process.env.QUERYDB_PASSWD,
  database: process.env.QUERYDB_DATABASE,
  logging: true,
  synchronize: false,
  dropSchema: false,
  entities: [Blocks, Transactions, Commit],
  connectTimeoutMS: 10000,
};

const constructBlockObj = (block: Blocks, data: any) => {
  block.blocknum = data.blocknum;
  block.datahash = data.datahash;
  block.prehash = data.prehash;
  block.txcount = data.txcount;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  block.createdt = new Date(data.createdt);
  block.blockhash = data.blockhash;
  block.blksize = data.blksize;
  return block;
};
const constructTxObj = (tx: Transactions, data: any) => {
  tx.code =
    data.validation_code === 'VALID' && data.status === 200
      ? (data.chaincode_proposal_input as string).startsWith('createCommit')
        ? CODE.PUBLIC_COMMIT
        : (data.chaincode_proposal_input as string).startsWith('privatedata:createCommit')
        ? CODE.PRIVATE_COMMIT
        : CODE.UNKNOWN
      : CODE.UNKNOWN;
  tx.blockid = data.blockid;
  tx.txhash = data.txhash;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  tx.createdt = new Date(data.createdt);
  tx.chaincodename = data?.chaincodename || '';
  tx.status = data?.status || 0;
  tx.creator_msp_id = data?.creator_msp_id || '';
  tx.endorser_msp_id = data?.endorser_msp_id || '';
  tx.type = data.type;
  tx.read_set = data.read_set;
  tx.write_set = data.write_set;
  tx.validation_code = data.validation_code;
  tx.envelope_signature = data.envelope_signature;
  tx.payload_extension = data.payload_extension;
  tx.creator_id_bytes = data.creator_id_bytes;
  tx.creator_nonce = data.creator_nonce;
  tx.chaincode_proposal_input = data.chaincode_proposal_input;
  tx.payload_proposal_hash = data.payload_proposal_hash;
  tx.endorser_id_bytes = data.endorser_id_bytes;
  tx.endorser_signature = data.endorser_signature;
  return tx;
};

beforeAll(async () => {
  messageCenter = createMessageCenter({ logger });

  try {
    metrics = createMetricServer('my-meter', {
      interval: 1000,
      exporterHost: 'localhost',
      exporterPort: 9000,
      filterMeters: [METERS.QUERYDB_CONNECTED_COUNT, METERS.QUERYDB_BLOCKHEIGHT],
      logger,
    });
  } catch (e) {
    console.error(e);
    console.error('fail to create MeterProvider');
    process.exit(1);
  }

  try {
    // use different schema for testing
    defaultConnection = await createConnection(connectionOptions);
    await defaultConnection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    testConnectionOptions = {
      ...connectionOptions,
      ...{ name: schema, schema, synchronize: true, dropSchema: true },
    };
    testConnection = createConnection(testConnectionOptions);

    queryDb = createQueryDb({
      logger,
      connection: testConnection,
      nonDefaultSchema: schema,
      meters: metrics.meters,
      messageCenter,
    });
  } catch {
    logger.error('fail to createQueryDb');
    process.exit(1);
  }
});

afterAll(async () => {
  messageCenter.getMessagesObs().unsubscribe();
  await defaultConnection.close();
  await queryDb.disconnect();
  await metrics.meterProvider.shutdown();
  await waitForSecond(3);
});

describe('query-db tests', () => {
  it('isConnected', async () => queryDb.isConnected().then((result) => expect(result).toBeFalsy()));

  it('connect', async () =>
    queryDb.connect().then((conn) => {
      if (!conn) {
        console.error('fail to connect: connectionOptions', testConnectionOptions);
        process.exit(1);
      }
    }));

  it('getBlockHeight #1: no data', async () =>
    queryDb.getBlockHeight().then((result) => expect(result).toBeNull()));

  [b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10].forEach((item) =>
    it(`insertBlock - ${item.blocknum}`, async () => {
      const block = new Blocks();
      const result = await queryDb.insertBlock(constructBlockObj(block, item));
      expect(isBlocks(result)).toBeTruthy();
    })
  );

  it('getBlockHeight #2', async () =>
    queryDb.getBlockHeight().then((result) => expect(result).toEqual(11)));

  it('getTxCount', async () => queryDb.getTxCount().then((result) => expect(result).toEqual(0)));

  [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9, t10].forEach((item) =>
    it(`insertTransaction - ${item.blockid}`, async () => {
      const tx = new Transactions();
      const result = await queryDb.insertTransaction(constructTxObj(tx, item));
      expect(isTransactions(result)).toBeTruthy();
    })
  );

  it('getTxCount', async () => queryDb.getTxCount().then((result) => expect(result).toEqual(11)));

  it('findMissingBlock, at = 5', async () =>
    queryDb.findMissingBlock(5).then((result) => expect(result).toEqual([])));

  it('findMissingBlock, at = 13', async () =>
    queryDb.findMissingBlock(13).then((result) => expect(result).toEqual([11, 12])));

  it('getPublicCommitTx', async () =>
    queryDb
      .getPublicCommitTx()
      .then((result) => result.map(({ blockid }) => blockid))
      .then((blockids) => expect(blockids).toEqual([7, 9])));

  it('getPrivateCommitTx', async () =>
    queryDb
      .getPrivateCommitTx()
      .then((result) => result.map(({ blockid }) => blockid))
      .then((blockids) => expect(blockids).toEqual([8, 10])));

  it('getPubCommit', async () =>
    queryDb
      .parseBlocksToCommits()
      .then((result) => result.map((commit) => expect(isCommit(commit)).toBeTruthy())));

  it('validate with metric server', async () => {
    await waitForSecond(2);
    const res = await fetch('http://localhost:9000/metrics');
    expect(res.status).toEqual(200);

    const metricText = await res.text();
    console.log(metricText);

    expect(metricText).toBeDefined();
  });
});
