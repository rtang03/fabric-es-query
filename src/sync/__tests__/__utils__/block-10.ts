import type { TBlock } from '../../../types';

export const block10: TBlock = {
  header: {
    number: 10,
    previous_hash: Buffer.from([
      3, 223, 106, 179, 106, 243, 185, 136, 125, 115, 250, 4, 100, 97, 222, 91, 105, 82, 115, 193,
      168, 177, 23, 154, 73, 23, 121, 173, 160, 252, 227, 164,
    ]),
    data_hash: Buffer.from([
      40, 45, 195, 93, 226, 34, 30, 68, 6, 142, 216, 247, 193, 222, 69, 173, 5, 136, 240, 154, 42,
      7, 130, 136, 14, 62, 243, 250, 171, 197, 231, 171,
    ]),
  },
  data: {
    data: [
      {
        signature: Buffer.from([
          48, 68, 2, 32, 102, 212, 139, 29, 70, 207, 238, 212, 41, 218, 194, 151, 224, 83, 238, 192,
          248, 88, 90, 249, 83, 237, 24, 220, 196, 200, 244, 39, 246, 222, 92, 32, 2, 32, 29, 26,
          48, 250, 120, 169, 117, 53, 213, 34, 127, 247, 4, 74, 73, 209, 73, 251, 7, 174, 229, 179,
          180, 38, 51, 190, 247, 167, 42, 117, 78, 170,
        ]),
        payload: {
          header: {
            channel_header: {
              type: 3,
              version: 0,
              timestamp: '2021-12-26T15:30:53.373Z',
              channel_id: 'loanapp',
              tx_id: '5c983d028a9b6b4c6012e800019cd7cd64c9cc1ad3fc3362996f718ee48b811b',
              epoch: 0,
              extension: Buffer.from([
                18, 12, 18, 10, 101, 118, 101, 110, 116, 115, 116, 111, 114, 101,
              ]),
              typeString: 'ENDORSER_TRANSACTION',
            },
            signature_header: {
              creator: {
                mspid: 'Org2MSP',
                id_bytes: Buffer.from([
                  45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70, 73, 67, 65,
                  84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 67, 120, 122, 67, 67, 65, 109, 50,
                  103, 65, 119, 73, 66, 65, 103, 73, 85, 85, 115, 87, 76, 76, 87, 55, 104, 53, 43,
                  66, 80, 77, 119, 104, 100, 71, 48, 97, 104, 120, 87, 57, 87, 101, 104, 85, 119,
                  67, 103, 89, 73, 75, 111, 90, 73, 122, 106, 48, 69, 65, 119, 73, 119, 10, 89, 68,
                  69, 76, 77, 65, 107, 71, 65, 49, 85, 69, 66, 104, 77, 67, 86, 86, 77, 120, 70,
                  122, 65, 86, 66, 103, 78, 86, 66, 65, 103, 84, 68, 107, 53, 118, 99, 110, 82, 111,
                  73, 69, 78, 104, 99, 109, 57, 115, 97, 87, 53, 104, 77, 82, 81, 119, 69, 103, 89,
                  68, 86, 81, 81, 75, 10, 69, 119, 116, 73, 101, 88, 66, 108, 99, 109, 120, 108, 90,
                  71, 100, 108, 99, 106, 69, 80, 77, 65, 48, 71, 65, 49, 85, 69, 67, 120, 77, 71,
                  82, 109, 70, 105, 99, 109, 108, 106, 77, 82, 69, 119, 68, 119, 89, 68, 86, 81, 81,
                  68, 69, 119, 104, 121, 89, 50, 69, 116, 98, 51, 74, 110, 10, 77, 106, 65, 101, 70,
                  119, 48, 121, 77, 84, 69, 121, 77, 106, 89, 120, 78, 84, 73, 48, 77, 68, 66, 97,
                  70, 119, 48, 121, 77, 106, 69, 121, 77, 106, 89, 120, 78, 84, 73, 53, 77, 68, 66,
                  97, 77, 71, 85, 120, 67, 122, 65, 74, 66, 103, 78, 86, 66, 65, 89, 84, 65, 108,
                  86, 84, 10, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81, 81, 73, 69, 119, 53, 79, 98,
                  51, 74, 48, 97, 67, 66, 68, 89, 88, 74, 118, 98, 71, 108, 117, 89, 84, 69, 85, 77,
                  66, 73, 71, 65, 49, 85, 69, 67, 104, 77, 76, 83, 72, 108, 119, 90, 88, 74, 115,
                  90, 87, 82, 110, 90, 88, 73, 120, 10, 68, 106, 65, 77, 66, 103, 78, 86, 66, 65,
                  115, 84, 66, 87, 70, 107, 98, 87, 108, 117, 77, 82, 99, 119, 70, 81, 89, 68, 86,
                  81, 81, 68, 69, 119, 53, 104, 90, 71, 49, 112, 98, 105, 49, 118, 99, 109, 99, 121,
                  76, 109, 53, 108, 100, 68, 66, 90, 77, 66, 77, 71, 66, 121, 113, 71, 10, 83, 77,
                  52, 57, 65, 103, 69, 71, 67, 67, 113, 71, 83, 77, 52, 57, 65, 119, 69, 72, 65, 48,
                  73, 65, 66, 80, 114, 122, 56, 70, 121, 49, 122, 120, 56, 105, 80, 101, 86, 85,
                  105, 89, 75, 78, 47, 49, 119, 54, 74, 105, 50, 112, 115, 99, 54, 86, 104, 49, 112,
                  43, 97, 100, 115, 81, 10, 82, 82, 57, 53, 85, 111, 55, 101, 84, 110, 108, 72, 120,
                  117, 86, 74, 118, 75, 99, 116, 70, 77, 66, 84, 112, 78, 85, 107, 75, 90, 76, 69,
                  78, 78, 48, 106, 47, 78, 53, 69, 51, 116, 121, 51, 97, 109, 121, 106, 103, 102,
                  56, 119, 103, 102, 119, 119, 68, 103, 89, 68, 86, 82, 48, 80, 10, 65, 81, 72, 47,
                  66, 65, 81, 68, 65, 103, 101, 65, 77, 65, 119, 71, 65, 49, 85, 100, 69, 119, 69,
                  66, 47, 119, 81, 67, 77, 65, 65, 119, 72, 81, 89, 68, 86, 82, 48, 79, 66, 66, 89,
                  69, 70, 65, 66, 111, 110, 119, 117, 78, 101, 84, 106, 69, 69, 83, 106, 89, 109,
                  112, 102, 116, 10, 43, 112, 119, 103, 79, 102, 78, 114, 77, 66, 56, 71, 65, 49,
                  85, 100, 73, 119, 81, 89, 77, 66, 97, 65, 70, 76, 81, 57, 81, 52, 70, 105, 65, 80,
                  97, 73, 43, 57, 108, 107, 89, 85, 121, 103, 77, 106, 85, 57, 102, 100, 88, 85, 77,
                  66, 99, 71, 65, 49, 85, 100, 69, 81, 81, 81, 10, 77, 65, 54, 67, 68, 71, 70, 105,
                  90, 84, 99, 122, 79, 68, 89, 52, 90, 109, 89, 53, 77, 106, 67, 66, 103, 103, 89,
                  73, 75, 103, 77, 69, 66, 81, 89, 72, 67, 65, 69, 69, 100, 110, 115, 105, 89, 88,
                  82, 48, 99, 110, 77, 105, 79, 110, 115, 105, 89, 87, 74, 104, 89, 121, 53, 112,
                  10, 98, 109, 108, 48, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73, 115, 73,
                  109, 70, 107, 98, 87, 108, 117, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73,
                  115, 73, 109, 104, 109, 76, 107, 70, 109, 90, 109, 108, 115, 97, 87, 70, 48, 97,
                  87, 57, 117, 73, 106, 111, 105, 73, 105, 119, 105, 10, 97, 71, 89, 117, 82, 87,
                  53, 121, 98, 50, 120, 115, 98, 87, 86, 117, 100, 69, 108, 69, 73, 106, 111, 105,
                  89, 87, 82, 116, 97, 87, 52, 116, 98, 51, 74, 110, 77, 105, 53, 117, 90, 88, 81,
                  105, 76, 67, 74, 111, 90, 105, 53, 85, 101, 88, 66, 108, 73, 106, 111, 105, 89,
                  87, 82, 116, 10, 97, 87, 52, 105, 102, 88, 48, 119, 67, 103, 89, 73, 75, 111, 90,
                  73, 122, 106, 48, 69, 65, 119, 73, 68, 83, 65, 65, 119, 82, 81, 73, 104, 65, 74,
                  81, 104, 75, 87, 115, 116, 110, 87, 82, 82, 106, 109, 57, 78, 77, 52, 53, 51, 56,
                  117, 67, 79, 99, 102, 70, 66, 116, 49, 53, 74, 10, 70, 100, 65, 82, 69, 73, 106,
                  72, 50, 88, 110, 43, 65, 105, 66, 97, 71, 114, 78, 117, 47, 77, 71, 84, 117, 85,
                  99, 72, 55, 69, 121, 100, 74, 52, 110, 108, 81, 50, 51, 89, 48, 117, 65, 56, 109,
                  104, 80, 98, 103, 83, 86, 66, 109, 85, 56, 88, 84, 103, 61, 61, 10, 45, 45, 45,
                  45, 45, 69, 78, 68, 32, 67, 69, 82, 84, 73, 70, 73, 67, 65, 84, 69, 45, 45, 45,
                  45, 45, 10,
                ]),
              },
              nonce: Buffer.from([
                177, 24, 116, 22, 223, 252, 166, 144, 133, 236, 248, 192, 62, 249, 226, 197, 182,
                160, 122, 60, 215, 221, 14, 19,
              ]),
            },
          },
          data: {
            actions: [
              {
                header: {
                  creator: {
                    mspid: 'Org2MSP',
                    id_bytes: Buffer.from([
                      45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70, 73, 67,
                      65, 84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 67, 120, 122, 67, 67, 65, 109,
                      50, 103, 65, 119, 73, 66, 65, 103, 73, 85, 85, 115, 87, 76, 76, 87, 55, 104,
                      53, 43, 66, 80, 77, 119, 104, 100, 71, 48, 97, 104, 120, 87, 57, 87, 101, 104,
                      85, 119, 67, 103, 89, 73, 75, 111, 90, 73, 122, 106, 48, 69, 65, 119, 73, 119,
                      10, 89, 68, 69, 76, 77, 65, 107, 71, 65, 49, 85, 69, 66, 104, 77, 67, 86, 86,
                      77, 120, 70, 122, 65, 86, 66, 103, 78, 86, 66, 65, 103, 84, 68, 107, 53, 118,
                      99, 110, 82, 111, 73, 69, 78, 104, 99, 109, 57, 115, 97, 87, 53, 104, 77, 82,
                      81, 119, 69, 103, 89, 68, 86, 81, 81, 75, 10, 69, 119, 116, 73, 101, 88, 66,
                      108, 99, 109, 120, 108, 90, 71, 100, 108, 99, 106, 69, 80, 77, 65, 48, 71, 65,
                      49, 85, 69, 67, 120, 77, 71, 82, 109, 70, 105, 99, 109, 108, 106, 77, 82, 69,
                      119, 68, 119, 89, 68, 86, 81, 81, 68, 69, 119, 104, 121, 89, 50, 69, 116, 98,
                      51, 74, 110, 10, 77, 106, 65, 101, 70, 119, 48, 121, 77, 84, 69, 121, 77, 106,
                      89, 120, 78, 84, 73, 48, 77, 68, 66, 97, 70, 119, 48, 121, 77, 106, 69, 121,
                      77, 106, 89, 120, 78, 84, 73, 53, 77, 68, 66, 97, 77, 71, 85, 120, 67, 122,
                      65, 74, 66, 103, 78, 86, 66, 65, 89, 84, 65, 108, 86, 84, 10, 77, 82, 99, 119,
                      70, 81, 89, 68, 86, 81, 81, 73, 69, 119, 53, 79, 98, 51, 74, 48, 97, 67, 66,
                      68, 89, 88, 74, 118, 98, 71, 108, 117, 89, 84, 69, 85, 77, 66, 73, 71, 65, 49,
                      85, 69, 67, 104, 77, 76, 83, 72, 108, 119, 90, 88, 74, 115, 90, 87, 82, 110,
                      90, 88, 73, 120, 10, 68, 106, 65, 77, 66, 103, 78, 86, 66, 65, 115, 84, 66,
                      87, 70, 107, 98, 87, 108, 117, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81, 81,
                      68, 69, 119, 53, 104, 90, 71, 49, 112, 98, 105, 49, 118, 99, 109, 99, 121, 76,
                      109, 53, 108, 100, 68, 66, 90, 77, 66, 77, 71, 66, 121, 113, 71, 10, 83, 77,
                      52, 57, 65, 103, 69, 71, 67, 67, 113, 71, 83, 77, 52, 57, 65, 119, 69, 72, 65,
                      48, 73, 65, 66, 80, 114, 122, 56, 70, 121, 49, 122, 120, 56, 105, 80, 101, 86,
                      85, 105, 89, 75, 78, 47, 49, 119, 54, 74, 105, 50, 112, 115, 99, 54, 86, 104,
                      49, 112, 43, 97, 100, 115, 81, 10, 82, 82, 57, 53, 85, 111, 55, 101, 84, 110,
                      108, 72, 120, 117, 86, 74, 118, 75, 99, 116, 70, 77, 66, 84, 112, 78, 85, 107,
                      75, 90, 76, 69, 78, 78, 48, 106, 47, 78, 53, 69, 51, 116, 121, 51, 97, 109,
                      121, 106, 103, 102, 56, 119, 103, 102, 119, 119, 68, 103, 89, 68, 86, 82, 48,
                      80, 10, 65, 81, 72, 47, 66, 65, 81, 68, 65, 103, 101, 65, 77, 65, 119, 71, 65,
                      49, 85, 100, 69, 119, 69, 66, 47, 119, 81, 67, 77, 65, 65, 119, 72, 81, 89,
                      68, 86, 82, 48, 79, 66, 66, 89, 69, 70, 65, 66, 111, 110, 119, 117, 78, 101,
                      84, 106, 69, 69, 83, 106, 89, 109, 112, 102, 116, 10, 43, 112, 119, 103, 79,
                      102, 78, 114, 77, 66, 56, 71, 65, 49, 85, 100, 73, 119, 81, 89, 77, 66, 97,
                      65, 70, 76, 81, 57, 81, 52, 70, 105, 65, 80, 97, 73, 43, 57, 108, 107, 89, 85,
                      121, 103, 77, 106, 85, 57, 102, 100, 88, 85, 77, 66, 99, 71, 65, 49, 85, 100,
                      69, 81, 81, 81, 10, 77, 65, 54, 67, 68, 71, 70, 105, 90, 84, 99, 122, 79, 68,
                      89, 52, 90, 109, 89, 53, 77, 106, 67, 66, 103, 103, 89, 73, 75, 103, 77, 69,
                      66, 81, 89, 72, 67, 65, 69, 69, 100, 110, 115, 105, 89, 88, 82, 48, 99, 110,
                      77, 105, 79, 110, 115, 105, 89, 87, 74, 104, 89, 121, 53, 112, 10, 98, 109,
                      108, 48, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73, 115, 73, 109, 70,
                      107, 98, 87, 108, 117, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73, 115,
                      73, 109, 104, 109, 76, 107, 70, 109, 90, 109, 108, 115, 97, 87, 70, 48, 97,
                      87, 57, 117, 73, 106, 111, 105, 73, 105, 119, 105, 10, 97, 71, 89, 117, 82,
                      87, 53, 121, 98, 50, 120, 115, 98, 87, 86, 117, 100, 69, 108, 69, 73, 106,
                      111, 105, 89, 87, 82, 116, 97, 87, 52, 116, 98, 51, 74, 110, 77, 105, 53, 117,
                      90, 88, 81, 105, 76, 67, 74, 111, 90, 105, 53, 85, 101, 88, 66, 108, 73, 106,
                      111, 105, 89, 87, 82, 116, 10, 97, 87, 52, 105, 102, 88, 48, 119, 67, 103, 89,
                      73, 75, 111, 90, 73, 122, 106, 48, 69, 65, 119, 73, 68, 83, 65, 65, 119, 82,
                      81, 73, 104, 65, 74, 81, 104, 75, 87, 115, 116, 110, 87, 82, 82, 106, 109, 57,
                      78, 77, 52, 53, 51, 56, 117, 67, 79, 99, 102, 70, 66, 116, 49, 53, 74, 10, 70,
                      100, 65, 82, 69, 73, 106, 72, 50, 88, 110, 43, 65, 105, 66, 97, 71, 114, 78,
                      117, 47, 77, 71, 84, 117, 85, 99, 72, 55, 69, 121, 100, 74, 52, 110, 108, 81,
                      50, 51, 89, 48, 117, 65, 56, 109, 104, 80, 98, 103, 83, 86, 66, 109, 85, 56,
                      88, 84, 103, 61, 61, 10, 45, 45, 45, 45, 45, 69, 78, 68, 32, 67, 69, 82, 84,
                      73, 70, 73, 67, 65, 84, 69, 45, 45, 45, 45, 45, 10,
                    ]),
                  },
                  nonce: Buffer.from([
                    177, 24, 116, 22, 223, 252, 166, 144, 133, 236, 248, 192, 62, 249, 226, 197,
                    182, 160, 122, 60, 215, 221, 14, 19,
                  ]),
                },
                payload: {
                  chaincode_proposal_payload: {
                    input: {
                      chaincode_spec: {
                        type: 1,
                        typeString: 'GOLANG',
                        input: {
                          args: [
                            Buffer.from([
                              112, 114, 105, 118, 97, 116, 101, 100, 97, 116, 97, 58, 99, 114, 101,
                              97, 116, 101, 67, 111, 109, 109, 105, 116,
                            ]),
                            Buffer.from([
                              112, 114, 105, 118, 97, 116, 101, 95, 101, 110, 116, 105, 116, 121,
                              78, 97, 109, 101,
                            ]),
                            Buffer.from([112, 114, 105, 118, 97, 116, 101, 95]),
                            Buffer.from([48]),
                            Buffer.from([112, 114, 105, 118, 97, 116, 101, 95]),
                          ],
                          decorations: {},
                          is_init: false,
                        },
                        chaincode_id: {
                          name: 'eventstore',
                        },
                        timeout: 0,
                      },
                    },
                  },
                  action: {
                    proposal_response_payload: {
                      proposal_hash: Buffer.from([
                        76, 125, 191, 119, 135, 249, 222, 230, 194, 9, 245, 180, 10, 51, 51, 30, 78,
                        77, 47, 198, 199, 19, 213, 227, 236, 226, 59, 148, 160, 248, 160, 143,
                      ]),
                      extension: {
                        results: {
                          data_model: 0,
                          ns_rwset: [
                            {
                              namespace: '_lifecycle',
                              rwset: {
                                reads: [
                                  {
                                    key: 'namespaces/fields/eventstore/Collections',
                                    version: {
                                      block_num: 5,
                                      tx_num: 0,
                                    },
                                  },
                                  {
                                    key: 'namespaces/fields/eventstore/EndorsementInfo',
                                    version: {
                                      block_num: 5,
                                      tx_num: 0,
                                    },
                                  },
                                  {
                                    key: 'namespaces/fields/eventstore/Sequence',
                                    version: {
                                      block_num: 5,
                                      tx_num: 0,
                                    },
                                  },
                                  {
                                    key: 'namespaces/fields/eventstore/ValidationInfo',
                                    version: {
                                      block_num: 5,
                                      tx_num: 0,
                                    },
                                  },
                                  {
                                    key: 'namespaces/metadata/eventstore',
                                    version: {
                                      block_num: 5,
                                      tx_num: 0,
                                    },
                                  },
                                ],
                                range_queries_info: [],
                                writes: [],
                                metadata_writes: [],
                              },
                              collection_hashed_rwset: [],
                            },
                            {
                              namespace: 'eventstore',
                              rwset: {
                                reads: [
                                  {
                                    key: '\u0000􏿿initialized',
                                    version: {
                                      block_num: 6,
                                      tx_num: 0,
                                    },
                                  },
                                ],
                                range_queries_info: [],
                                writes: [],
                                metadata_writes: [],
                              },
                              collection_hashed_rwset: [
                                {
                                  collection_name: '_implicit_org_Org2MSP',
                                  hashed_rwset: {
                                    hashed_reads: [],
                                    hashed_writes: [
                                      {
                                        key_hash: Buffer.from([
                                          90, 143, 199, 155, 100, 229, 234, 164, 145, 118, 54, 106,
                                          179, 33, 30, 205, 106, 106, 159, 254, 193, 98, 168, 105,
                                          9, 152, 71, 63, 95, 47, 88, 137,
                                        ]),
                                        is_delete: false,
                                        value_hash: Buffer.from([
                                          78, 26, 75, 161, 116, 204, 249, 23, 42, 70, 78, 247, 34,
                                          201, 8, 174, 48, 41, 197, 189, 147, 100, 23, 88, 255, 132,
                                          169, 97, 244, 1, 3, 4,
                                        ]),
                                      },
                                    ],
                                    metadata_writes: [],
                                  },
                                  pvt_rwset_hash: Buffer.from([
                                    5, 116, 153, 81, 84, 183, 73, 169, 175, 107, 34, 19, 208, 203,
                                    40, 46, 144, 58, 113, 244, 209, 42, 32, 93, 82, 115, 18, 215,
                                    105, 53, 48, 106,
                                  ]),
                                },
                              ],
                            },
                          ],
                        },
                        events: {
                          chaincode_id: '',
                          tx_id: '',
                          event_name: '',
                          payload: Buffer.from([]),
                        },
                        response: {
                          status: 200,
                          message: '',
                          payload: Buffer.from([
                            123, 34, 116, 121, 112, 101, 34, 58, 34, 66, 117, 102, 102, 101, 114,
                            34, 44, 34, 100, 97, 116, 97, 34, 58, 91, 49, 50, 51, 44, 51, 52, 44,
                            49, 49, 50, 44, 49, 49, 52, 44, 49, 48, 53, 44, 49, 49, 56, 44, 57, 55,
                            44, 49, 49, 54, 44, 49, 48, 49, 44, 57, 53, 44, 51, 52, 44, 53, 56, 44,
                            49, 50, 51, 44, 51, 52, 44, 49, 48, 53, 44, 49, 48, 48, 44, 51, 52, 44,
                            53, 56, 44, 51, 52, 44, 49, 49, 50, 44, 49, 49, 52, 44, 49, 48, 53, 44,
                            49, 49, 56, 44, 57, 55, 44, 49, 49, 54, 44, 49, 48, 49, 44, 57, 53, 44,
                            51, 52, 44, 52, 52, 44, 51, 52, 44, 49, 48, 49, 44, 49, 49, 48, 44, 49,
                            49, 54, 44, 49, 48, 53, 44, 49, 49, 54, 44, 49, 50, 49, 44, 55, 56, 44,
                            57, 55, 44, 49, 48, 57, 44, 49, 48, 49, 44, 51, 52, 44, 53, 56, 44, 51,
                            52, 44, 49, 49, 50, 44, 49, 49, 52, 44, 49, 48, 53, 44, 49, 49, 56, 44,
                            57, 55, 44, 49, 49, 54, 44, 49, 48, 49, 44, 57, 53, 44, 49, 48, 49, 44,
                            49, 49, 48, 44, 49, 49, 54, 44, 49, 48, 53, 44, 49, 49, 54, 44, 49, 50,
                            49, 44, 55, 56, 44, 57, 55, 44, 49, 48, 57, 44, 49, 48, 49, 44, 51, 52,
                            44, 52, 52, 44, 51, 52, 44, 49, 49, 56, 44, 49, 48, 49, 44, 49, 49, 52,
                            44, 49, 49, 53, 44, 49, 48, 53, 44, 49, 49, 49, 44, 49, 49, 48, 44, 51,
                            52, 44, 53, 56, 44, 52, 56, 44, 52, 52, 44, 51, 52, 44, 57, 57, 44, 49,
                            49, 49, 44, 49, 48, 57, 44, 49, 48, 57, 44, 49, 48, 53, 44, 49, 49, 54,
                            44, 55, 51, 44, 49, 48, 48, 44, 51, 52, 44, 53, 56, 44, 51, 52, 44, 49,
                            49, 50, 44, 49, 49, 52, 44, 49, 48, 53, 44, 49, 49, 56, 44, 57, 55, 44,
                            49, 49, 54, 44, 49, 48, 49, 44, 57, 53, 44, 51, 52, 44, 52, 52, 44, 51,
                            52, 44, 49, 48, 49, 44, 49, 49, 48, 44, 49, 49, 54, 44, 49, 48, 53, 44,
                            49, 49, 54, 44, 49, 50, 49, 44, 55, 51, 44, 49, 48, 48, 44, 51, 52, 44,
                            53, 56, 44, 51, 52, 44, 49, 49, 50, 44, 49, 49, 52, 44, 49, 48, 53, 44,
                            49, 49, 56, 44, 57, 55, 44, 49, 49, 54, 44, 49, 48, 49, 44, 57, 53, 44,
                            51, 52, 44, 52, 52, 44, 51, 52, 44, 49, 48, 57, 44, 49, 49, 53, 44, 49,
                            49, 50, 44, 55, 51, 44, 49, 48, 48, 44, 51, 52, 44, 53, 56, 44, 51, 52,
                            44, 55, 57, 44, 49, 49, 52, 44, 49, 48, 51, 44, 53, 48, 44, 55, 55, 44,
                            56, 51, 44, 56, 48, 44, 51, 52, 44, 52, 52, 44, 51, 52, 44, 49, 48, 52,
                            44, 57, 55, 44, 49, 49, 53, 44, 49, 48, 52, 44, 51, 52, 44, 53, 56, 44,
                            51, 52, 44, 51, 52, 44, 49, 50, 53, 44, 49, 50, 53, 93, 125,
                          ]),
                        },
                        chaincode_id: {
                          path: '',
                          name: 'eventstore',
                          version: '1.0',
                        },
                      },
                    },
                    endorsements: [
                      {
                        endorser: {
                          mspid: 'Org2MSP',
                          id_bytes: Buffer.from([
                            45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70, 73,
                            67, 65, 84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 67, 111, 106, 67,
                            67, 65, 107, 105, 103, 65, 119, 73, 66, 65, 103, 73, 85, 99, 77, 48, 72,
                            116, 79, 52, 72, 102, 55, 118, 53, 97, 102, 77, 89, 104, 110, 51, 113,
                            122, 121, 89, 79, 116, 67, 81, 119, 67, 103, 89, 73, 75, 111, 90, 73,
                            122, 106, 48, 69, 65, 119, 73, 119, 10, 89, 68, 69, 76, 77, 65, 107, 71,
                            65, 49, 85, 69, 66, 104, 77, 67, 86, 86, 77, 120, 70, 122, 65, 86, 66,
                            103, 78, 86, 66, 65, 103, 84, 68, 107, 53, 118, 99, 110, 82, 111, 73,
                            69, 78, 104, 99, 109, 57, 115, 97, 87, 53, 104, 77, 82, 81, 119, 69,
                            103, 89, 68, 86, 81, 81, 75, 10, 69, 119, 116, 73, 101, 88, 66, 108, 99,
                            109, 120, 108, 90, 71, 100, 108, 99, 106, 69, 80, 77, 65, 48, 71, 65,
                            49, 85, 69, 67, 120, 77, 71, 82, 109, 70, 105, 99, 109, 108, 106, 77,
                            82, 69, 119, 68, 119, 89, 68, 86, 81, 81, 68, 69, 119, 104, 121, 89, 50,
                            69, 116, 98, 51, 74, 110, 10, 77, 106, 65, 101, 70, 119, 48, 121, 77,
                            84, 69, 121, 77, 106, 89, 120, 78, 84, 73, 48, 77, 68, 66, 97, 70, 119,
                            48, 121, 77, 106, 69, 121, 77, 106, 89, 120, 78, 84, 73, 53, 77, 68, 66,
                            97, 77, 71, 81, 120, 67, 122, 65, 74, 66, 103, 78, 86, 66, 65, 89, 84,
                            65, 108, 86, 84, 10, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81, 81, 73,
                            69, 119, 53, 79, 98, 51, 74, 48, 97, 67, 66, 68, 89, 88, 74, 118, 98,
                            71, 108, 117, 89, 84, 69, 85, 77, 66, 73, 71, 65, 49, 85, 69, 67, 104,
                            77, 76, 83, 72, 108, 119, 90, 88, 74, 115, 90, 87, 82, 110, 90, 88, 73,
                            120, 10, 68, 84, 65, 76, 66, 103, 78, 86, 66, 65, 115, 84, 66, 72, 66,
                            108, 90, 88, 73, 120, 70, 122, 65, 86, 66, 103, 78, 86, 66, 65, 77, 84,
                            68, 110, 66, 108, 90, 88, 73, 119, 76, 109, 57, 121, 90, 122, 73, 117,
                            98, 109, 86, 48, 77, 70, 107, 119, 69, 119, 89, 72, 75, 111, 90, 73, 10,
                            122, 106, 48, 67, 65, 81, 89, 73, 75, 111, 90, 73, 122, 106, 48, 68, 65,
                            81, 99, 68, 81, 103, 65, 69, 111, 97, 98, 48, 68, 52, 43, 110, 105, 87,
                            115, 68, 110, 65, 98, 98, 56, 113, 81, 70, 112, 120, 55, 54, 57, 87,
                            108, 88, 54, 69, 113, 47, 84, 116, 112, 71, 100, 56, 57, 66, 10, 73, 82,
                            89, 112, 114, 109, 76, 77, 120, 50, 111, 84, 117, 47, 68, 50, 119, 65,
                            68, 86, 113, 43, 113, 70, 53, 120, 99, 79, 83, 105, 78, 120, 98, 100,
                            110, 103, 121, 70, 66, 68, 112, 115, 116, 119, 54, 97, 79, 66, 50, 122,
                            67, 66, 50, 68, 65, 79, 66, 103, 78, 86, 72, 81, 56, 66, 10, 65, 102,
                            56, 69, 66, 65, 77, 67, 66, 52, 65, 119, 68, 65, 89, 68, 86, 82, 48, 84,
                            65, 81, 72, 47, 66, 65, 73, 119, 65, 68, 65, 100, 66, 103, 78, 86, 72,
                            81, 52, 69, 70, 103, 81, 85, 47, 51, 50, 51, 104, 115, 102, 73, 67, 102,
                            89, 70, 97, 112, 54, 76, 89, 122, 76, 81, 10, 74, 114, 98, 86, 102, 52,
                            48, 119, 72, 119, 89, 68, 86, 82, 48, 106, 66, 66, 103, 119, 70, 111,
                            65, 85, 116, 68, 49, 68, 103, 87, 73, 65, 57, 111, 106, 55, 50, 87, 82,
                            104, 84, 75, 65, 121, 78, 84, 49, 57, 49, 100, 81, 119, 70, 119, 89, 68,
                            86, 82, 48, 82, 66, 66, 65, 119, 10, 68, 111, 73, 77, 77, 68, 65, 48,
                            89, 106, 86, 109, 77, 84, 78, 105, 77, 122, 108, 104, 77, 70, 56, 71,
                            67, 67, 111, 68, 66, 65, 85, 71, 66, 119, 103, 66, 66, 70, 78, 55, 73,
                            109, 70, 48, 100, 72, 74, 122, 73, 106, 112, 55, 73, 109, 104, 109, 76,
                            107, 70, 109, 90, 109, 108, 115, 10, 97, 87, 70, 48, 97, 87, 57, 117,
                            73, 106, 111, 105, 73, 105, 119, 105, 97, 71, 89, 117, 82, 87, 53, 121,
                            98, 50, 120, 115, 98, 87, 86, 117, 100, 69, 108, 69, 73, 106, 111, 105,
                            99, 71, 86, 108, 99, 106, 65, 117, 98, 51, 74, 110, 77, 105, 53, 117,
                            90, 88, 81, 105, 76, 67, 74, 111, 10, 90, 105, 53, 85, 101, 88, 66, 108,
                            73, 106, 111, 105, 99, 71, 86, 108, 99, 105, 74, 57, 102, 84, 65, 75,
                            66, 103, 103, 113, 104, 107, 106, 79, 80, 81, 81, 68, 65, 103, 78, 73,
                            65, 68, 66, 70, 65, 105, 69, 65, 48, 55, 69, 122, 66, 109, 78, 84, 79,
                            67, 66, 85, 48, 43, 97, 77, 10, 119, 49, 108, 52, 119, 56, 90, 73, 102,
                            77, 77, 65, 117, 86, 71, 99, 98, 77, 105, 76, 119, 56, 120, 88, 103,
                            112, 48, 67, 73, 67, 43, 81, 115, 81, 116, 69, 47, 67, 49, 108, 101, 83,
                            82, 56, 82, 76, 72, 119, 50, 116, 47, 79, 122, 109, 51, 56, 50, 70, 70,
                            118, 71, 57, 48, 86, 10, 120, 76, 101, 114, 78, 81, 43, 83, 10, 45, 45,
                            45, 45, 45, 69, 78, 68, 32, 67, 69, 82, 84, 73, 70, 73, 67, 65, 84, 69,
                            45, 45, 45, 45, 45, 10,
                          ]),
                        },
                        signature: Buffer.from([
                          48, 68, 2, 32, 41, 182, 181, 37, 74, 52, 164, 161, 28, 115, 244, 209, 126,
                          75, 142, 36, 163, 211, 74, 83, 193, 121, 133, 253, 230, 21, 71, 32, 145,
                          114, 171, 191, 2, 32, 91, 164, 146, 130, 78, 16, 28, 65, 136, 185, 61,
                          112, 191, 189, 88, 64, 85, 26, 199, 56, 188, 96, 247, 223, 116, 138, 118,
                          45, 240, 99, 88, 0,
                        ]),
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ],
  },
  metadata: {
    metadata: [
      {
        value: Buffer.from([10, 2, 8, 2, 18, 13, 10, 11, 10, 5, 1, 2, 3, 4, 5, 16, 6, 24, 16]),
        signatures: [
          {
            signature_header: {
              creator: {
                mspid: 'Org0MSP',
                id_bytes: Buffer.from([
                  45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70, 73, 67, 65,
                  84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 67, 114, 106, 67, 67, 65, 108, 83,
                  103, 65, 119, 73, 66, 65, 103, 73, 85, 98, 110, 105, 109, 83, 65, 74, 114, 122,
                  110, 118, 111, 68, 51, 82, 52, 54, 121, 49, 78, 105, 88, 43, 69, 108, 101, 85,
                  119, 67, 103, 89, 73, 75, 111, 90, 73, 122, 106, 48, 69, 65, 119, 73, 119, 10, 89,
                  68, 69, 76, 77, 65, 107, 71, 65, 49, 85, 69, 66, 104, 77, 67, 86, 86, 77, 120, 70,
                  122, 65, 86, 66, 103, 78, 86, 66, 65, 103, 84, 68, 107, 53, 118, 99, 110, 82, 111,
                  73, 69, 78, 104, 99, 109, 57, 115, 97, 87, 53, 104, 77, 82, 81, 119, 69, 103, 89,
                  68, 86, 81, 81, 75, 10, 69, 119, 116, 73, 101, 88, 66, 108, 99, 109, 120, 108, 90,
                  71, 100, 108, 99, 106, 69, 80, 77, 65, 48, 71, 65, 49, 85, 69, 67, 120, 77, 71,
                  82, 109, 70, 105, 99, 109, 108, 106, 77, 82, 69, 119, 68, 119, 89, 68, 86, 81, 81,
                  68, 69, 119, 104, 121, 89, 50, 69, 116, 98, 51, 74, 110, 10, 77, 68, 65, 101, 70,
                  119, 48, 121, 77, 84, 69, 121, 77, 106, 89, 120, 78, 84, 73, 48, 77, 68, 66, 97,
                  70, 119, 48, 121, 77, 106, 69, 121, 77, 106, 89, 120, 78, 84, 73, 53, 77, 68, 66,
                  97, 77, 71, 111, 120, 67, 122, 65, 74, 66, 103, 78, 86, 66, 65, 89, 84, 65, 108,
                  86, 84, 10, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81, 81, 73, 69, 119, 53, 79, 98,
                  51, 74, 48, 97, 67, 66, 68, 89, 88, 74, 118, 98, 71, 108, 117, 89, 84, 69, 85, 77,
                  66, 73, 71, 65, 49, 85, 69, 67, 104, 77, 76, 83, 72, 108, 119, 90, 88, 74, 115,
                  90, 87, 82, 110, 90, 88, 73, 120, 10, 69, 68, 65, 79, 66, 103, 78, 86, 66, 65,
                  115, 84, 66, 50, 57, 121, 90, 71, 86, 121, 90, 88, 73, 120, 71, 106, 65, 89, 66,
                  103, 78, 86, 66, 65, 77, 84, 69, 87, 57, 121, 90, 71, 86, 121, 90, 88, 73, 48, 76,
                  109, 57, 121, 90, 122, 65, 117, 89, 50, 57, 116, 77, 70, 107, 119, 10, 69, 119,
                  89, 72, 75, 111, 90, 73, 122, 106, 48, 67, 65, 81, 89, 73, 75, 111, 90, 73, 122,
                  106, 48, 68, 65, 81, 99, 68, 81, 103, 65, 69, 105, 77, 86, 56, 47, 48, 120, 76,
                  54, 106, 79, 104, 107, 74, 51, 71, 74, 68, 106, 66, 89, 122, 78, 79, 66, 66, 121,
                  85, 116, 71, 99, 120, 10, 84, 115, 114, 80, 88, 105, 81, 120, 56, 122, 97, 105,
                  102, 80, 113, 72, 78, 49, 69, 70, 49, 105, 103, 79, 69, 90, 111, 49, 100, 49, 47,
                  75, 106, 68, 108, 107, 85, 81, 78, 66, 111, 110, 97, 104, 119, 112, 80, 47, 85,
                  85, 73, 53, 79, 54, 79, 66, 52, 84, 67, 66, 51, 106, 65, 79, 10, 66, 103, 78, 86,
                  72, 81, 56, 66, 65, 102, 56, 69, 66, 65, 77, 67, 66, 52, 65, 119, 68, 65, 89, 68,
                  86, 82, 48, 84, 65, 81, 72, 47, 66, 65, 73, 119, 65, 68, 65, 100, 66, 103, 78, 86,
                  72, 81, 52, 69, 70, 103, 81, 85, 90, 120, 77, 121, 55, 79, 98, 65, 70, 47, 72, 54,
                  10, 113, 71, 118, 122, 76, 89, 76, 90, 108, 104, 55, 73, 73, 51, 99, 119, 72, 119,
                  89, 68, 86, 82, 48, 106, 66, 66, 103, 119, 70, 111, 65, 85, 113, 81, 70, 54, 43,
                  122, 43, 52, 57, 89, 122, 101, 90, 47, 113, 52, 55, 48, 68, 83, 121, 109, 81, 78,
                  75, 70, 69, 119, 70, 119, 89, 68, 10, 86, 82, 48, 82, 66, 66, 65, 119, 68, 111,
                  73, 77, 77, 68, 65, 48, 89, 106, 86, 109, 77, 84, 78, 105, 77, 122, 108, 104, 77,
                  71, 85, 71, 67, 67, 111, 68, 66, 65, 85, 71, 66, 119, 103, 66, 66, 70, 108, 55,
                  73, 109, 70, 48, 100, 72, 74, 122, 73, 106, 112, 55, 73, 109, 104, 109, 10, 76,
                  107, 70, 109, 90, 109, 108, 115, 97, 87, 70, 48, 97, 87, 57, 117, 73, 106, 111,
                  105, 73, 105, 119, 105, 97, 71, 89, 117, 82, 87, 53, 121, 98, 50, 120, 115, 98,
                  87, 86, 117, 100, 69, 108, 69, 73, 106, 111, 105, 98, 51, 74, 107, 90, 88, 74,
                  108, 99, 106, 81, 117, 98, 51, 74, 110, 10, 77, 67, 53, 106, 98, 50, 48, 105, 76,
                  67, 74, 111, 90, 105, 53, 85, 101, 88, 66, 108, 73, 106, 111, 105, 98, 51, 74,
                  107, 90, 88, 74, 108, 99, 105, 74, 57, 102, 84, 65, 75, 66, 103, 103, 113, 104,
                  107, 106, 79, 80, 81, 81, 68, 65, 103, 78, 73, 65, 68, 66, 70, 65, 105, 69, 65,
                  10, 113, 119, 103, 78, 97, 102, 90, 54, 43, 66, 65, 112, 112, 121, 103, 65, 50,
                  115, 120, 76, 100, 108, 69, 90, 109, 114, 107, 83, 71, 67, 88, 109, 108, 106, 84,
                  107, 73, 114, 82, 119, 70, 75, 115, 67, 73, 71, 88, 79, 74, 43, 118, 79, 67, 112,
                  121, 54, 66, 109, 112, 116, 113, 115, 71, 47, 10, 71, 74, 111, 99, 82, 113, 104,
                  69, 43, 76, 49, 71, 122, 104, 119, 110, 82, 109, 68, 52, 90, 51, 107, 81, 10, 45,
                  45, 45, 45, 45, 69, 78, 68, 32, 67, 69, 82, 84, 73, 70, 73, 67, 65, 84, 69, 45,
                  45, 45, 45, 45, 10,
                ]),
              },
              nonce: Buffer.from([
                109, 69, 100, 242, 22, 198, 128, 118, 109, 15, 209, 76, 0, 130, 209, 99, 179, 140,
                138, 15, 10, 152, 137, 128,
              ]),
            },
            signature: Buffer.from([
              48, 68, 2, 32, 2, 191, 176, 62, 169, 18, 117, 228, 229, 160, 199, 176, 104, 23, 166,
              27, 139, 228, 106, 188, 72, 33, 187, 110, 130, 180, 233, 102, 19, 207, 197, 101, 2,
              32, 82, 208, 68, 53, 93, 156, 132, 41, 174, 215, 133, 222, 167, 34, 95, 104, 23, 228,
              201, 91, 7, 163, 6, 169, 68, 119, 245, 238, 185, 169, 157, 238,
            ]),
          },
        ],
      },
      {},
      [0],
      {},
      Buffer.from([
        10, 32, 213, 120, 119, 143, 116, 204, 158, 175, 241, 40, 111, 196, 104, 121, 213, 122, 253,
        145, 53, 211, 75, 123, 101, 144, 141, 157, 86, 110, 20, 197, 6, 190,
      ]),
    ],
  },
};
