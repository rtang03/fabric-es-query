import util from 'util';
import Debug from 'debug';
import Status from 'http-status';
import fetch from 'isomorphic-unfetch';
import { type Observer, ReplaySubject, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Connection } from 'typeorm';
import winston from 'winston';
import WebSocket from 'ws';
import type { MessageCenter, Message, PaginatedIncident, NewCommitNotify } from '../types';
import { MSG } from './constant';
import { Incident } from './entities';

export type CreateMessageCenterOptions = {
  persist?: boolean;
  connection?: Connection;
  broadcaster?: WebSocket.Server;
  windowTime?: number;
  bufferSize?: number;
  notifyNewCommit?: boolean;
  newCommitEndpoint?: string;
  logger: winston.Logger;
};

export const createMessageCenter: (options: CreateMessageCenterOptions) => MessageCenter = ({
  persist,
  windowTime,
  bufferSize,
  broadcaster,
  connection,
  newCommitEndpoint,
  notifyNewCommit,
  logger,
}) => {
  let processMessageSub: Subscription;
  let notifyNewCommitSub: Subscription;
  const _bufferSize = bufferSize || 3;
  const _windowTime = windowTime || 10;

  logger.info('Preparing message center');
  logger.info(`windowTime: ${_windowTime}`);
  logger.info(`bufferSize: ${_bufferSize}`);
  logger.info(`persist: ${persist}`);
  logger.info(`newCommitEndpoint: ${newCommitEndpoint}`);
  logger.info(`notifyNewCommit: ${notifyNewCommit}`);
  logger.info(`broadcaster: ${!!broadcaster}`);

  const NS = 'mcenter';
  const messageReplaySubject = new ReplaySubject<Message>(_bufferSize, _windowTime);

  if (persist)
    processMessageSub = messageReplaySubject.subscribe({
      next: async (m) => {
        if (!m.save) {
          logger.info(util.format('📨 message received: %j', m));
          return;
        }

        const incident = new Incident();
        incident.kind = m.kind || '';
        incident.title = m.title;
        incident.desc = m.desc || '';
        incident.status = m.status || '';
        incident.data = m.data;
        incident.timestamp = m.timestamp;
        incident.read = false;
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
    processMessageSub = messageReplaySubject
      .pipe(
        filter(({ save }) => !save),
        map(({ kind, title, desc, timestamp }) => ({ kind, title, desc, timestamp }))
      )
      .subscribe({
        next: (m) => logger.info(util.format('📨 message received: %j', m)),
        error: (e) => logger.error(util.format('❌ message error: %j', e)),
        complete: () => logger.info('subscription completed'),
      });

  if (notifyNewCommit && !!newCommitEndpoint) {
    notifyNewCommitSub = messageReplaySubject
      .pipe(filter<Message<NewCommitNotify>>(({ title }) => title === MSG.NOTIFY_WRITESIDE))
      .subscribe({
        next: async ({ data }) => {
          const errorMsg = `fail to notify ${newCommitEndpoint}`;
          try {
            logger.info('new commit arrives');

            const result = await fetch(newCommitEndpoint, {
              method: 'POST',
              body: JSON.stringify(data),
            });

            if (result?.status === Status.OK) {
              logger.info(
                `notify, block: ${data?.blocknum}, entityName: ${data?.entityName}, entityId: ${data?.entityId}`
              );
            } else
              logger.error(
                util.format('%s, statusCode: %s, %j'),
                errorMsg,
                result?.status,
                await result.text()
              );
          } catch (e) {
            logger.error(util.format('%s, %j', errorMsg, e));
          }
        },
      });
  }

  return {
    /**
     * disconnect
     */
    disconnect: async () => {
      if (!persist) throw new Error('disconnect() is not available');
      await connection.close();

      logger.info(`${NS} disconnected`);

      notifyNewCommitSub?.unsubscribe();
      processMessageSub?.unsubscribe();
    },
    /**
     * getIncidents
     * @param take
     * @param skip
     * @param orderBy
     * @param sort
     * @param kind
     * @param title
     */
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
    /**
     * getIncidentsByPeriod
     */
    getIncidentsByPeriod: async () => {
      return Promise.reject(new Error('Not implemented yet'));
    },
    /**
     * getInfo
     */
    getInfo: () => ({ windowTime, bufferSize, persist }),
    /**
     * getMessagesObs
     */
    getMessagesObs: () => messageReplaySubject,
    /**
     * getSubscription
     */
    getSubscription: () => processMessageSub,
    /**
     * isConnected
     */
    isConnected: async () => {
      if (!persist) throw new Error('isConnected() is not available');
      if (!connection?.isConnected) {
        logger.info(`${NS} is not connected`);
        return false;
      }
      return true;
    },
    /**
     * notify
     * @param message
     */
    notify: (message) => messageReplaySubject.next({ ...message, timestamp: new Date() }),
    /**
     * subscribe
     * @param observer
     */
    subscribe: (observer: Partial<Observer<Message>>) => messageReplaySubject.subscribe(observer),
  };
};
