export type PlatformConfig = {
  sync: { syncDuration: number };
  querydb: {
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
};
