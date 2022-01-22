import util from 'util';
import Debug from 'debug';
import { type Network } from 'fabric-network';
import winston from 'winston';
import { KIND, MSG } from '../../message';
import type { MessageCenter } from '../../types';
import { type Commit, createCommitId } from './Commit';
import type { FabricOption } from './FabricOption';

export const submitPrivateData: (
  fcn: string,
  args: string[],
  transientData: Record<string, Buffer>,
  options: FabricOption
) => Promise<Record<string, Commit> & { error?: any; status?: string; message?: string }> = async (
  fcn,
  args,
  transientData,
  { nonDiscoveryNetwork, logger, messageCenter: mCenter }
) => {
  const NS = 'fabric:service';

  const isNullArg = args.reduce((prev, curr) => prev && !!curr, true);

  if (!isNullArg) return { error: 'invalid input argument' };

  const input_args = fcn === 'privatedata:createCommit' ? [...args, createCommitId()] : args;

  const transaction = nonDiscoveryNetwork
    .getContract('eventstore')
    .createTransaction(fcn)
    .setTransient(transientData);
  const txName = transaction.getName();
  const txId = transaction.getTransactionId();
  const broadcast = true;
  const save = true;
  const desc = `fcn: ${fcn}, txName: ${txName}, txId: ${txId}`;

  logger.info('== submitting transaction == ');
  logger.info(`tx object: name: ${txName}, id: ${txId}`);

  Debug(NS)('== submitting private transaction == ');
  Debug(NS)('submit private tx: input_arg, %O', input_args);
  Debug(NS)('submit private tx: transientData, %O', transientData);

  return transaction
    .submit(...input_args)
    .then<Record<string, Commit>>((res: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = JSON.parse(Buffer.from(JSON.parse(res)).toString());

      Debug(NS)('%s successful response', fcn);
      Debug(NS)('submitTx response in raw Buffer', res);
      Debug(NS)('submitTx  parse response', result);

      mCenter?.notify({
        kind: KIND.SYSTEM,
        title: MSG.SUBMIT_OK,
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
        title: MSG.SUBMIT_ERROR,
        desc,
        error: error.message,
        broadcast,
        save,
      });

      return { error };
    });
};
