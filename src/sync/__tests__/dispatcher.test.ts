require('dotenv').config({ path: 'src/sync/__tests__/.env.sync' });
import { processBlockEvent } from '../../fabric';
import { KEY } from '../../querydb';
import { logger, waitSecond } from '../../utils';
import { dispatcher, type TAction } from '../dispatcher';
import { block7, block8, block9, block10 } from './__utils__';

const option: TAction['payload']['option'] = { logger, timeout: 5000 };

const fabric = {
  queryChannelHeight: jest.fn(),
  queryBlock: jest.fn(),
  processBlockEvent: jest.fn(),
};
const queryDb = {
  getBlockHeight: jest.fn(),
  findMissingBlock: jest.fn(),
  insertBlock: jest.fn(),
  insertCommit: jest.fn(),
  insertTransaction: jest.fn(),
  findUnverified: jest.fn(),
  removeUnverifiedBlock: jest.fn(),
  updateInsertedBlockKeyValue: jest.fn(),
  updateVerified: jest.fn(),
};
const SYNC_START = { type: 'syncJob/syncStart' };

beforeAll(async () => {
  // must be bigger than t1 test, i.e. timeout = 1000
  fabric.queryChannelHeight.mockImplementation(async () => waitSecond(2).then(() => 10));
  fabric.queryBlock.mockImplementation(async (channelName, blockNum) =>
    waitSecond(1).then(
      () =>
        ({
          7: block7,
          8: block8,
          9: block9,
          10: block10,
        }[blockNum])
    )
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  fabric.processBlockEvent.mockImplementation((block) => processBlockEvent(block, logger));

  queryDb.getBlockHeight.mockImplementation(async () => waitSecond(1).then(() => 6));
  queryDb.findMissingBlock.mockImplementation(async () => waitSecond(1).then(() => [7, 8, 9, 10]));
  queryDb.insertBlock.mockImplementation(async (b) => waitSecond(1).then(() => b));
  queryDb.insertCommit.mockImplementation(async (c) => waitSecond(1).then(() => c));
  queryDb.insertTransaction.mockImplementation(async (tx) => waitSecond(1).then(() => tx));
  queryDb.findUnverified.mockImplementation(async () => waitSecond(1).then(() => []));
  queryDb.removeUnverifiedBlock.mockImplementation(async () => waitSecond(1).then(() => true));
  queryDb.updateInsertedBlockKeyValue.mockImplementation(async () => ({ key: KEY.INSERTED_BLOCK }));
  queryDb.updateVerified.mockImplementation(async () => true);

  option['fabric'] = fabric;
  option['queryDb'] = queryDb;
});

afterAll(async () => {
  await waitSecond(5); // it should be bigger than the PromiseWithTimeout
});

describe('sync tests -- failure tests', () => {
  it('t0 - syncStart: throw timeout error', async () => {
    return dispatcher(SYNC_START, { ...option, timeout: 1000, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual('timeout');
      }
    );
  });

  it('t0a.1 - syncStart: fail to check unverified block - reject', async () => {
    queryDb.findUnverified.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, timeout: 1000, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t0a.2 - syncStart: fail to check unverified block - null', async () => {
    queryDb.findUnverified.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, timeout: 1000, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t0b.1 - syncStart: fail to remove unverified block - reject', async () => {
    queryDb.removeUnverifiedBlock.mockImplementation(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, timeout: 1000, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t0b.2 - syncStart: fail to remove unverified block - null', async () => {
    queryDb.removeUnverifiedBlock.mockImplementation(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, timeout: 1000, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t2.1 - syncStart: fail to query channel height / fabric - reject', async () => {
    fabric.queryChannelHeight.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t2.2 - syncStart: fail to query channel height / fabric - null', async () => {
    fabric.queryChannelHeight.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t3.1 - syncStart: fail to query channel height / query - reject', async () => {
    queryDb.getBlockHeight.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t3.2 - syncStart: fail to query channel height / query - null', async () => {
    queryDb.getBlockHeight.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t4.1 - syncStart: fail to findMissingBlocks / query - reject', async () => {
    queryDb.findMissingBlock.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t4.2 - syncStart: fail to findMissingBlocks / query - null', async () => {
    queryDb.findMissingBlock.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6b.1 - syncStart: fail to queryBlock in fabric - reject', async () => {
    fabric.queryBlock.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6b.2 - syncStart: fail to queryBlock in fabric - null', async () => {
    fabric.queryBlock.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6c.1 - syncStart: fail to processBlockEvent - reject', async () => {
    fabric.queryBlock.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6c.2 - syncStart: fail to processBlockEvent - null', async () => {
    fabric.queryBlock.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6d.1 - syncStart: fail to insert block in querydb - reject', async () => {
    queryDb.insertBlock.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6d.2 - syncStart: fail to insert block in querydb - null', async () => {
    queryDb.insertBlock.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6e.1 - syncStart: fail to insert tx in querydb - reject', async () => {
    queryDb.insertTransaction.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6e.2 - syncStart: fail to insert tx in querydb - null', async () => {
    queryDb.insertTransaction.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6f.1 - syncStart: fail to insert commit in querydb - reject', async () => {
    queryDb.insertCommit.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6f.2 - syncStart: fail to insert commit in querydb - null', async () => {
    queryDb.insertCommit.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });
  it('t6g.1 - syncStart: fail to update KeyValue table - reject', async () => {
    queryDb.updateInsertedBlockKeyValue.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6g.2 - syncStart: fail to update KeyValue table - null', async () => {
    queryDb.updateInsertedBlockKeyValue.mockImplementationOnce(async () =>
      waitSecond(1).then(() => null)
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6h.1 - syncStart: fail to update verified block - reject', async () => {
    queryDb.updateVerified.mockImplementationOnce(async () =>
      waitSecond(1).then(() => Promise.reject())
    );

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });

  it('t6h.2 - syncStart: fail to update verified block - null', async () => {
    queryDb.updateVerified.mockImplementationOnce(async () => waitSecond(1).then(() => null));

    return dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch(
      ({ status, error }) => {
        expect(status).toEqual('error');
        expect(error).toBeInstanceOf(Error);
      }
    );
  });
});

describe('sync tests -- good tests', () => {
  it('full test - syncStart', async () =>
    dispatcher(SYNC_START, { ...option, showStateChanges: true }).then(({ status }) =>
      expect(status).toEqual('ok')
    ));
});

describe('others', () => {
  it('syncStart will throw, when there is running job', async () =>
    dispatcher(SYNC_START, { ...option, showStateChanges: true }).catch((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toEqual('fail to dispatch');
    }));
});
