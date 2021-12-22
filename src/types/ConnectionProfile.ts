export type ConnectionProfile = {
  client: {
    organization: string;
    connection?: {
      timeout: {
        peer: {
          endorser: string;
        };
      };
    };
  };
  channels: {
    [x: string]: {
      orderers: string[];
      peers: string[];
    };
  };
  organizations: {
    [x: string]: {
      mspid: string;
      peers: string[];
      certificateAuthorities?: string[];
      adminPrivateKey: {
        path?: string;
        pem?: string;
      };
      signedCert: {
        path?: string;
        pem?: string;
      };
    };
  };
  orderers: {
    [x: string]: {
      url: string;
      grpcOptions?: {
        'ssl-target-name-override'?: string;
      };
      tlsCACerts: {
        path?: string;
        pem?: string;
      };
    };
  };
  peers: {
    [x: string]: {
      url: string;
      grpcOptions?: {
        'ssl-target-name-override'?: string;
        'request-timeout': string;
      };
      tlsCACerts: {
        path?: string;
        pem?: string;
      };
    };
  };
  certificateAuthorities?: {
    [x: string]: {
      url: string;
      httpOptions: { verify: boolean };
      tlsCACerts: {
        path?: string;
        pem?: string;
        client?: {
          keyfile: string;
          certfile: string;
        };
      };
      registrar: {
        enrollId: string;
        enrollSecret: string;
      }[];
      caName?: string;
    };
  };
};
