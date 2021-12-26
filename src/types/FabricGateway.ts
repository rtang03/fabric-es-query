import type { Span } from '@opentelemetry/api';
import type {
  Identity,
  DefaultEventHandlerOptions,
  DefaultQueryHandlerOptions,
} from 'fabric-network';
import type { ConnectedGatewayOptions } from 'fabric-network/lib/gateway';
import { protos } from 'fabric-protos';
import ChannelQueryResponse = protos.ChannelQueryResponse;

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
  queryChainInfo: (chanelName: string) => Promise<any>;
  getDefaultChannelName: () => string;
  initializeChannelEventHubs: () => Promise<void>;
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
