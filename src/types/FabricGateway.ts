export type FabricGateway = {
  getInfo: () => any;
  initialize: (option?: { registerNewAdmin?: boolean; enrollNewAdmin?: boolean }) => Promise<void>;
};
