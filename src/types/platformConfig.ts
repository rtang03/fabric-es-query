export type PlatformConfig = {
  sync: {
    syncDuration: number;
    requestTimeoutMs?: number;
    showStateChanges?: boolean;
    devMode?: boolean;
    persist?: boolean;
  };
  fabric?: {
    orgAdminId?: string;
    orgAdminSecret?: string;
    discovery?: boolean;
    asLocalhost?: boolean;
  };
  querydb: {
    connectionName?: string;
    schema?: string;
    type?: string;
    port: number;
    host: string;
    database?: string;
    username?: string;
    password?: string;
    logging?: boolean;
    connectTimeoutMS?: number;
  };
  metricserver?: {
    port?: number;
    host?: string;
    interval: number;
  };
  messageCenter?: {
    newCommitEndpoint?: string;
    notifyNewCommit?: boolean;
    persist?: boolean;
    websocketEnabled?: boolean;
  };
  repo?: {
    requestTimeoutMs?: number;
  };
};
