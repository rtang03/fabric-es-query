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

export type GetIncidentsByPeriodOptions = {
  sort?: 'ASC' | 'DESC';
  kind?: string;
  title?: string;
  from?: Date;
  to?: Date;
};

export type MessageCenter = {
  disconnect?: () => Promise<void>;
  getIncidents: (option?: GetIncidentsOptions) => Promise<PaginatedIncident>;
  getIncidentsByPeriod?: (option?: GetIncidentsByPeriodOptions) => Promise<PaginatedIncident>;
  getInfo: () => any;
  getMessagesObs: () => ReplaySubject<Message>;
  getSubscription: () => Subscription;
  isConnected?: () => Promise<boolean>;
  notify: <T = any>(message: Message<T>) => void;
  subscribe: <T = any>(observer: Partial<Observer<Message<T>>>) => Subscription;
};
