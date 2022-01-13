import util from 'util';
import Debug from 'debug';
import { type Network } from 'fabric-network';
import winston from 'winston';
import { KIND, MSG } from '../../message';
import type { MessageCenter } from '../../types';
import { type Commit } from './Commit';
import { isCommitRecord } from './typeGuard';

export const evaluate: (
  fcn: string,
  args: string[],
  options: { network: Network; logger: winston.Logger; messageCenter?: MessageCenter }
) => Promise<Record<string, Commit> | { error: any }> = async (
  fcn,
  args,
  { network, logger, messageCenter: mCenter }
) => {
  const NS = 'fabric:service';
  const isNullArg = args.reduce((prev, curr) => prev && !!curr, true);

  if (!isNullArg) return { error: 'invalid input argument' };

  const transaction = network.getContract('eventstore').createTransaction(fcn);
  const txName = transaction.getName();
  const txId = transaction.getTransactionId();
  const broadcast = true;
  const save = true;
  const desc = `fcn: ${fcn}, txName: ${txName}, txId: ${txId}`;

  logger.info('== submitting evaluation == ');
  logger.info(`tx object: name: ${txName}, id: ${txId}`);

  return transaction
    .evaluate(...args)
    .then<Record<string, Commit>>((res: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());

      Debug(NS)('%s successful response', fcn);
      Debug(NS)('evaluate tx response in raw Buffer', res);
      Debug(NS)('evaluate tx  parse response', result);

      if (isCommitRecord(result))
        logger.error(util.format(`❌ unexpected evaluateTx response format, %j`, result));

      mCenter?.notify({
        kind: KIND.SYSTEM,
        title: MSG.EVALUATE_OK,
        desc,
        data: txId,
        broadcast,
        save,
      });

      return result;
    })
    .catch((error) => {
      logger.error(util.format('error in %s: %j', fcn, error));

      mCenter?.notify({
        kind: KIND.ERROR,
        title: MSG.EVALUATE_ERROR,
        desc,
        error: error.message,
        broadcast,
        save,
      });

      return { error };
    });
};
