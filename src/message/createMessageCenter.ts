import util from 'util';
import Debug from 'debug';
import { type Observer, ReplaySubject, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Connection } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import type { MessageCenter, Message, PaginatedIncident } from '../types';
import { Incident } from './entities';

export type CreateMessageCenterOptions = {
  persist?: boolean;
  connection?: Connection;
  broadcaster?: WebSocket.Server;
  windowTime?: number;
  bufferSize?: number;
  logger: winston.Logger;
};

export const createMessageCenter: (options: CreateMessageCenterOptions) => MessageCenter = ({
  persist,
  windowTime,
  bufferSize,
  broadcaster,
  connection,
  logger,
}) => {
  let subscription: Subscription;
  const _bufferSize = bufferSize || 3;
  const _windowTime = windowTime || 10;

  logger.info('Preparing message center');
  logger.info(`windowTime: ${_windowTime}`);
  logger.info(`bufferSize: ${_bufferSize}`);
  logger.info(`persist: ${persist}`);
  logger.info(`broadcaster: ${!!broadcaster}`);

  const NS = 'mcenter';
  const $messages = new ReplaySubject<Message>(_bufferSize, _windowTime);

  if (persist)
    subscription = $messages
      .pipe(
        filter(({ save }) => save),
        map((x) => x)
      )
      .subscribe({
        next: async (m) => {
          const incident = new Incident();
          incident.kind = m.kind || '';
          incident.title = m.title;
          incident.desc = m.desc || '';
          incident.status = m.status || '';
          incident.data = m.data;
          incident.timestamp = m.timestamp;
          incident.canignore = false;
          if (m.error instanceof Error) {
            incident.errormsg = m.error.message;
            incident.errorstack = m.error.stack;
          }
          try {
            const result = await connection.getRepository(Incident).save(incident);

            logger.info(`incident #${result.id} saved`);
          } catch (e) {
            logger.error(`incident not saved`);
          }
        },
        error: (e) => logger.error(`${NS} subscription error: `, e),
        complete: () => logger.info(`${NS} subscription completed`),
      });
  else
    subscription = $messages
      .pipe(
        filter(({ save }) => !save),
        map(({ kind, title, desc, timestamp }) => ({ kind, title, desc, timestamp }))
      )
      .subscribe({
        next: (m) => logger.info(util.format('📨 message received: %j', m)),
        error: (e) => logger.error(util.format('❌ message error: %j', e)),
        complete: () => logger.info('subscription completed'),
      });

  return {
    isConnected: async () => {
      if (!persist) throw new Error('isConnected() is not available');
      if (!connection?.isConnected) {
        logger.info(`${NS} is not connected`);
        return false;
      }
      return true;
    },
    disconnect: async () => {
      if (!persist) throw new Error('disconnect() is not available');
      await connection.close();

      logger.info(`${NS} disconnected`);
    },
    getInfo: () => ({ windowTime, bufferSize, persist }),
    subscribe: (observer: Partial<Observer<Message>>) => $messages.subscribe(observer),
    notify: (m) => $messages.next({ ...m, timestamp: new Date() }),
    getMessagesObs: () => $messages,
    getSubscription: () => subscription,
    getIncidents: async ({ take, skip, orderBy, sort, kind, title }) => {
      const me = 'getIncidents';
      if (!persist) throw new Error(`${me}() is not available`);

      try {
        const where = {};
        kind && (where['kind'] = kind);
        title && (where['title'] = title);

        const order = {};
        orderBy && (order[orderBy] = sort);

        const query = {};
        (kind || title) && (query['where'] = where);
        orderBy && (query['order'] = order);

        Debug(`${NS}:${me}`)('query, %O', query);

        const total = await connection.getRepository(Incident).count(query);

        take && (query['take'] = take);
        skip && (query['skip'] = skip);

        const items = await connection.getRepository(Incident).find(query);

        const hasMore = skip + take < total;
        const cursor = hasMore ? skip + take : total;
        const result: PaginatedIncident = { total, items, hasMore, cursor };

        Debug(`${NS}:${me}`)(`result: %O`, result);

        return result;
      } catch (error) {
        logger.error(`fail to ${me} : `, error);
        return null;
      }
    },
    getIncidentsByPeriod: async () => {
      return Promise.reject(new Error('Not implemented yet'));
    },
  };
};
