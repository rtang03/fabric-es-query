import Debug from 'debug';
import { Wallet, type WalletStore } from 'fabric-network';
import { Connection } from 'typeorm';
import winston from 'winston';
import { KIND, MSG } from '../../message';
import type { MessageCenter } from '../../types';
import { FabricWallet } from '../entities';

export const createPsqlWallet: (option: {
  conn: Connection;
  logger: winston.Logger;
  messageCenter?: MessageCenter;
}) => Wallet = ({ conn, logger, messageCenter: mCenter }) => {
  const encoding = 'utf8';
  const NS = 'fabric:psqlwallet';

  const psqlWalletStore: WalletStore = {
    get: async (label: string) => {
      try {
        const result = await conn.getRepository(FabricWallet).findOne(label);
        if (!result?.data) {
          logger.error(`unexpected error - get, label: ${label}`);
          return undefined;
        }

        Debug(NS)('get fabricwallet, %s', result?.data);

        return Buffer.from(result.data, encoding);
      } catch (e) {
        logger.error('fail to get fabricwallet');
        return null;
      }
    },
    list: async () => {
      try {
        const result = await conn.getRepository(FabricWallet).find();
        if (!result) {
          logger.error(`unexpected error - list`);
          return [];
        }

        return result.map(({ id }) => id);
      } catch (e) {
        logger.error('fail to list fabricwallet');
        return null;
      }
    },
    put: async (label: string, data: Buffer) => {
      try {
        const walletItem = new FabricWallet();
        walletItem.id = label;
        walletItem.data = data.toString(encoding);

        const result = await conn.getRepository(FabricWallet).save(walletItem);

        if (!result) {
          logger.error(`unexpected error - put, label: ${label}`);
          return null;
        }

        mCenter?.notify({ kind: KIND.INFO, title: MSG.WALLET_REMOVED });
      } catch (e) {
        logger.error('fail to put fabricwallet');
        return null;
      }
    },
    remove: async (label: string) => {
      try {
        const result = await conn.getRepository(FabricWallet).delete(label);

        if (!result) {
          logger.error(`unexpected error - remove, label: ${label}`);
          return null;
        }

        Debug(NS)('remove %s, %O', label, result);

        mCenter?.notify({ kind: KIND.INFO, title: MSG.WALLET_REMOVED });
      } catch (e) {
        logger.error('fail to remove fabricwallet');
        return null;
      }
    },
  };

  return new Wallet(psqlWalletStore);
};
