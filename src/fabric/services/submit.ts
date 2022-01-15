import util from 'util';
import Debug from 'debug';
import { KIND, MSG } from '../../message';
import { type Commit, createCommitId } from './Commit';
import type { FabricOption } from './FabricOption';

export const submit: (
  fcn: string,
  args: string[],
  option: FabricOption
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

  const transaction = network.getContract('eventstore').createTransaction(fcn);
  const txName = transaction.getName();
  const txId = transaction.getTransactionId();
  const broadcast = true;
  const save = true;
  const desc = `fcn: ${fcn}, txName: ${txName}, txId: ${txId}`;

  logger.info('== submitting transaction == ');
  logger.info(`tx object: name: ${txName}, id: ${txId}`);

  Debug(NS)('submit tx: input_arg, %O', input_args);

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
