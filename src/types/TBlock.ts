export type TTx = {
  signature: Buffer;
  payload: {
    header: {
      channel_header: {
        epoch: any;
        extension: Buffer;
        channel_id: string;
        timestamp: string;
        tx_id: string;
        type: number;
        typeString: string;
        version: number;
      };
      signature_header: {
        creator: {
          mspid: string;
          id_bytes: Buffer;
        };
        nonce: Buffer;
      };
    };
    data: {
      actions?: {
        header: any;
        payload: {
          chaincode_proposal_payload: {
            input: {
              chaincode_spec: {
                type: number;
                typeString: string;
                input: { args: Buffer[]; decorations: any; is_init: boolean };
                chaincode_id: any;
                timeout: any;
              };
            };
          };
          action: {
            proposal_response_payload: {
              proposal_hash: Buffer;
              extension: {
                results: {
                  data_model: number;
                  ns_rwset: {
                    namespace: string;
                    rwset: {
                      reads: any;
                      range_queries_info: any;
                      writes: any;
                      metadata_writes: any;
                    };
                    collection_hashed_rwset: any;
                  }[];
                };
                events: any;
                response: { status: number; message: string; payload: Buffer };
                chaincode_id: { path: string; name: string; version: string };
              };
            };
            endorsements: {
              endorser: {
                mspid: string;
                id_bytes: Buffer;
              };
              signature: Buffer;
            }[];
          };
        };
      }[];
      config?: any;
      last_update?: {
        payload: {
          header: any;
          data: {
            config_update: {
              channel_id: string;
              read_set: any;
              write_set: any;
            };
            signatures: any;
          };
        };
        signature: Buffer;
      };
    };
  };
};

export type TBlock = {
  header: {
    number: number;
    previous_hash: Buffer;
    data_hash: Buffer;
  };
  data: { data: TTx[] };
  metadata: {
    metadata: any[];
  };
};
