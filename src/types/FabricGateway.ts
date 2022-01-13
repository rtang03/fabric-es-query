import type { Span } from '@opentelemetry/api';
import type {
  Identity,
  DefaultEventHandlerOptions,
  DefaultQueryHandlerOptions,
  Network,
} from 'fabric-network';
import type { ConnectedGatewayOptions } from 'fabric-network/lib/gateway';
import { protos } from 'fabric-protos';
import { Subject } from 'rxjs';
import { Blocks, Transactions } from '../querydb/entities';
import { SyncJob } from './Synchronizer';
import { type TBlock } from './TBlock';
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
  queryChannelHeight: (channelName: string) => Promise<number>;
  getDefaultChannelName: () => string;
  initializeChannelEventHubs: (newBlock$: Subject<SyncJob>) => Promise<boolean>;
  processBlockEvent: (block: TBlock) => [Blocks, Partial<Transactions>[]];
  getNetwork: () => Network;
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
