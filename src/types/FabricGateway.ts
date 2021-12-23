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
  }) => Promise<boolean>;
  registerNewUser: (id: string, secret: string) => Promise<boolean>;
  disconnect: () => void;
  getIdentityInfo: (label: string) => Promise<Identity & { credentials: { certificate } }>;
  queryChannels: () => Promise<ChannelQueryResponse>;
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
