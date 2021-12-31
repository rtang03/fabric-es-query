import { type Observer, ReplaySubject, Subscription } from 'rxjs';
import { Connection } from 'typeorm';
import { PaginatedIncident } from './index';

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
  save?: boolean;
  timestamp?: Date;
};

export type GetIncidentsOptions = {
  take?: number;
  skip?: number;
  sort?: 'ASC' | 'DESC';
  kind?: string;
  title?: string;
  orderBy?: string;
};

export type MessageCenter = {
  connect?: () => Promise<Connection>;
  disconnect?: () => Promise<void>;
  isConnected?: () => Promise<boolean>;
  getInfo: () => any;
  subscribe: <T = any>(observer: Partial<Observer<Message<T>>>) => Subscription;
  getMessagesObs: () => ReplaySubject<Message>;
  notify: <T = any>(message: Message<T>) => void;
  getSubscription: () => Subscription;
  getIncidents: (option?: GetIncidentsOptions) => Promise<PaginatedIncident>;
};
