import { type Unsubscribe } from 'redux';
import type { FabricGateway } from '../../types';
import { logger, waitForSecond } from '../../utils';
import { dispatcher } from '../dispatcher';
import { store } from '../store';

const dispatch = store.dispatch;
const option = { logger, timeout: 5000 };

let fabric: Partial<FabricGateway>;
let unsubscribe: Unsubscribe;
let done: Promise<any>;

// type TAction = {
//   type: string;
//   payload: { tx_id: string; option?: any };
// };

beforeAll(async () => {
  fabric = {
    queryChannelHeight: async () => {
      await waitForSecond(2); // must be bigger than t1 test, i.e. timeout = 1000
      return 10;
    },
  };

  // add fabricGateway
  option['fabric'] = fabric;

  // done = new Promise<any>((resolve, reject) => {
  //   unsubscribe = store.subscribe(() => {
  //     const state = store.getState();
  //
  //     console.log(state.syncJob);
  //
  //     if (state.syncJob.status === 'ok') {
  //       unsubscribe();
  //       resolve({ status: 'ok' });
  //     } else if (state.syncJob.status === 'error') {
  //       unsubscribe();
  //       reject(state.syncJob?.error);
  //     }
  //   });
  // });
});

afterAll(async () => {
  // handling timeout error
  // try {
  //   await done;
  // } catch (e) {
  //   if (e instanceof Error && e.message === 'timeout') console.log('timeout occurs');
  //   else console.error(e);
  // }
  await waitForSecond(6); // it should be bigger than the PromiseWithTimeout
});

describe('sync tests', () => {
  // it('sync: throw timeout error', async () => {
  //   const tx_id = generateToken();
  //   dispatch<TAction>({
  //     type: 'syncJob/syncStart',
  //     payload: { tx_id, option: { ...option, timeout: 1000 } },
  //   });
  // });
  it('t1 - sync: throw timeout error', async () =>
    dispatcher({ type: 'syncJob/syncStart' }, { ...option, timeout: 1000, debugNS: 'sync:test:t1' }).catch(
      (error) => {
        console.log(error);
      }
    ));

  // it('sync', async () => {
  //   const tx_id = generateToken();
  //   dispatch<TAction>({
  //     type: 'syncJob/syncStart',
  //     payload: { tx_id, option },
  //   });
  // });
});
