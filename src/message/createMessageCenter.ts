import { type Observer, ReplaySubject } from 'rxjs';
import winston from 'winston';
import type { MessageCenter, Message } from '../types';

export type CreateMessageCenterOptions = {
  windowTime?: number;
  bufferSize?: number;
  logger: winston.Logger;
};

export const createMessageCenter: (options: CreateMessageCenterOptions) => MessageCenter = (
  options
) => {
  const { windowTime, bufferSize } = options;

  const $messages = new ReplaySubject<Message>(bufferSize || 3, windowTime || 10);

  return {
    getInfo: () => ({ windowTime, bufferSize }),
    subscribe: (observer: Partial<Observer<Message>>) => $messages.subscribe(observer),
    notify: (m) => $messages.next(m),
    getMessagesObs: () => $messages,
  };
};
