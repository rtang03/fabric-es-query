import util from 'util';
import Debug from 'debug';
import { type Network } from 'fabric-network';
import winston from 'winston';
import type { MessageCenter } from '../../types';
import { type Commit, createCommitId } from './Commit';
import { isCommitRecord } from './typeGuard';

export const submit: (
  fcn: string,
  args: string[],
  option: { network: Network; logger: winston.Logger; messageCenter?: MessageCenter }
) => Promise<Record<string, Commit> & { error?: any; status?: string; message?: string }> = async (
  fcn,
  args,
  { network, logger, messageCenter: mCenter }
) => {
  const NS = 'fabric:service';
  const isNullArg = args.reduce((prev, curr) => prev || curr === undefined || curr === null, false);

  if (isNullArg) return { error: 'invalid input argument' };

  let input_args = args;

  if (fcn === 'eventstore:createCommit') {
    input_args = [...args.slice(0, 4), createCommitId()];
    // signedRequest
    if (args[4]) input_args.push(args[4]);
    else input_args.push('');
  }

  Debug(NS)('submit tx: input_arg, %O', input_args);

  return network
    .getContract('eventstore')
    .createTransaction(fcn)
    .submit(...input_args)
    .then<Record<string, Commit>>((res: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());

      Debug(NS)('%s successful response', fcn);
      Debug(NS)('submitTx response in raw Buffer', res);
      Debug(NS)('submitTx  parse response', result);

      if (isCommitRecord(result))
        logger.error(util.format(`❌ unexpected submitTx response format, %j`, result));

      return result;
    })
    .catch((error) => {
      logger.error(util.format('error in %s: %j', fcn, error));

      return { error };
    });
};
