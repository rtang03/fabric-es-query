import { logger } from '../../utils';
import { processBlockEvent } from '../processBlockEvent';
import { block0, block3, block9 } from './__generated__';

describe('dummy', () => {
  it('test', async () => {
    const a = processBlockEvent(block9, logger);
    return true;
  });
});
