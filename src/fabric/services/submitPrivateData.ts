import util from 'util';
import Debug from 'debug';
import { type Network } from 'fabric-network';
import winston from 'winston';
import type { MessageCenter } from '../../types';
import { type Commit, createCommitId } from './Commit';
import { isCommitRecord } from './typeGuard';

export const submitPrivateData: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  options: { network: Network; logger: winston.Logger; messageCenter?: MessageCenter }
) => Promise<Record<string, Commit> & { error?: any; status?: string; message?: string }> = async (
  fcn,
  args,
  transientData,
  { network, logger, messageCenter: mCenter }
) => {
  const NS = 'fabric:service';
  const isNullArg = args.reduce((prev, curr) => prev && !!curr, true);

  if (!isNullArg) return { error: 'invalid input argument' };

  const input_args = fcn === 'privatedata:createCommit' ? [...args, createCommitId()] : args;

  Debug(NS)('submit private tx: input_arg, %O', input_args);
  Debug(NS)('submit private tx: transientData, %O', transientData);

  return network
    .getContract('eventstore')
    .createTransaction(fcn)
    .setTransient(transientData)
    .submit(...input_args)
    .then<Record<string, Commit>>((res: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());

      Debug(NS)('%s successful response', fcn);
      Debug(NS)('submitTx response in raw Buffer', res);
      Debug(NS)('submitTx  parse response', result);

      if (isCommitRecord(result))
        logger.error(util.format(`❌ unexpected submitPrivateTx response format, %j`, result));

      return result;
    })
    .catch((error) => {
      logger.error(util.format('error in %s: %j', fcn, error));

      return { error };
    });
};
