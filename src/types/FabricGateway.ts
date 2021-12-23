import type {
  ConnectedGatewayOptions,
  DefaultEventHandlerOptions,
  DefaultQueryHandlerOptions,
} from 'fabric-network/lib/gateway';

export type FabricGateway = {
  getInfo: () => FabricGatewayInfo;
  initialize: (option?: {
    eventHandlerOptions?: DefaultEventHandlerOptions;
    queryHandlerOptions?: DefaultQueryHandlerOptions;
    connectionOptions?: any;
  }) => Promise<boolean>;
  registerNewUser: (id: string, secret: string) => Promise<boolean>;
  disconnect: () => void;
  // getIdentityInfo: (label: string) => Promise<any>;
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
