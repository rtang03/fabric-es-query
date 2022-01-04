import type { Span } from '@opentelemetry/api';
import type {
  Identity,
  DefaultEventHandlerOptions,
  DefaultQueryHandlerOptions,
} from 'fabric-network';
import type { ConnectedGatewayOptions } from 'fabric-network/lib/gateway';
import { common, protos } from 'fabric-protos';
import ChannelQueryResponse = protos.ChannelQueryResponse;
import { TBlock } from './TBlock';
import winston from 'winston';
import { Blocks, Transactions } from '../querydb/entities';

export type FabricGateway = {
  getInfo: () => FabricGatewayInfo;
  initialize: (option?: {
    eventHandlerOptions?: DefaultEventHandlerOptions;
    queryHandlerOptions?: DefaultQueryHandlerOptions;
    connectionOptions?: any;
    parent?: Span;
  }) => Promise<boolean>;
  registerNewUser: (id: string, secret: string) => Promise<boolean>;
  disconnect: () => void;
  getIdentityInfo: (label: string) => Promise<Identity & { credentials: { certificate } }>;
  queryChannels: () => Promise<ChannelQueryResponse>;
  queryBlock: (channelName: string, blockNum: number) => Promise<any>;
  queryChannelHeight: (channelName: string) => Promise<number>;
  getDefaultChannelName: () => string;
  initializeChannelEventHubs: () => Promise<boolean>;
  processBlockEvent: (block: TBlock) => [Blocks, Partial<Transactions>[]];
};

export type FabricGatewayInfo = {
  caName: string;
  caUrl: string;
  caAdminId: string;
  adminId?: string;
  mspId?: string;
  isCaAdminEnrolled?: boolean;
  isCaAdminInWallet?: boolean;
  caRootCert?: string;
  connectedGatewayOptions?: ConnectedGatewayOptions;
};
