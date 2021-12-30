import { Observable, type Observer, ReplaySubject, Subscription } from 'rxjs';

export type Message<T = any> = {
  kind?: string;
  title: string;
  desc?: string;
  status?: string;
  data?: T;
  error?: any;
  broadcast?: boolean;
  traceId?: string;
  callback?: any;
};

export type MessageCenter = {
  getInfo: () => any;
  subscribe: (observer: Partial<Observer<Message>>) => Subscription;
  getMessagesObs: () => ReplaySubject<Message>;
  notify: (message: Message) => void;
};
