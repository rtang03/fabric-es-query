import { type Tracer } from '@opentelemetry/api';
import { Connection, Repository } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import type { MessageCenter, Synchronizer } from '../types';
import { type Meters } from '../utils';
import Debug from 'debug';
import { Job } from './entities';

export type CreateSynchronizerOption = {
  persist?: boolean;
  connection: Promise<Connection>;
  syncTime: number;
  broadcaster?: WebSocket.Server;
  logger: winston.Logger;
  meters?: Partial<Meters>;
  tracer?: Tracer;
  messageCenter?: MessageCenter;
};

export const createSynchronizer: (option: CreateSynchronizerOption) => Synchronizer = ({
  persist,
  syncTime,
  broadcaster,
  connection,
  logger,
}) => {
  let conn: Connection;
  let jobRepository: Repository<Job>;

  logger.info('Preparing synchronizer');
  logger.info(`syncTime: ${syncTime}`);
  logger.info(`persist: ${persist}`);
  logger.info(`broadcaster: ${!!broadcaster}`);

  const NS = 'sync';

  return {
    connect: async () => {
      if (!persist) throw new Error('connect() is not available');
      try {
        logger.info('connecting database');
        conn = await connection;
        logger.info(`database connected`);
        return conn;
      } catch (e) {
        logger.error(`fail to connect : `, e);
        return null;
      }
    },
    isConnected: async () => {
      if (!persist) throw new Error('isConnected() is not available');
      if (!conn?.isConnected) {
        logger.info(`${NS} is not connected`);
        return false;
      }
      return true;
    },
    disconnect: async () => {
      if (!persist) throw new Error('disconnect() is not available');
      await conn.close();

      logger.info(`${NS} disconnected`);
    },
    getInfo: () => ({ persist, syncTime }),
    start: async () => {},
    stop: () => {
      return;
    },
  };
};
