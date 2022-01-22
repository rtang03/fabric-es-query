import type { TBlock } from '../../../types';

export const block3: TBlock = {
  header: {
    number: 3,
    previous_hash: Buffer.from([
      196, 223, 185, 21, 201, 232, 73, 112, 234, 102, 61, 45, 174, 167, 13, 134, 177, 58, 148, 117,
      88, 190, 173, 166, 28, 111, 103, 67, 178, 106, 246, 182,
    ]),

    data_hash: Buffer.from([
      94, 35, 191, 133, 176, 242, 1, 59, 4, 72, 150, 26, 228, 58, 69, 92, 42, 120, 161, 79, 166,
      241, 244, 205, 113, 146, 8, 255, 12, 46, 192, 94,
    ]),
  },
  data: {
    data: [
      {
        signature: Buffer.from([
          48, 68, 2, 32, 7, 33, 161, 112, 202, 178, 8, 88, 126, 132, 103, 54, 24, 171, 155, 159, 4,
          166, 41, 7, 12, 220, 171, 18, 237, 34, 76, 35, 112, 103, 248, 202, 2, 32, 4, 253, 76, 111,
          169, 143, 130, 249, 24, 192, 154, 217, 102, 173, 100, 107, 62, 249, 197, 12, 62, 86, 251,
          101, 159, 199, 19, 118, 176, 174, 136, 111,
        ]),

        payload: {
          header: {
            channel_header: {
              type: 3,
              version: 0,
              timestamp: '2021-12-26T15:30:03.736Z',
              channel_id: 'loanapp',
              tx_id: '6f23b787a95d3170d0cc83cdae0dac7af983cdb3f7eda85b09047b2fc2338f2c',
              epoch: 0,
              extension: Buffer.from([
                18, 12, 18, 10, 95, 108, 105, 102, 101, 99, 121, 99, 108, 101,
              ]),

              typeString: 'ENDORSER_TRANSACTION',
            },
            signature_header: {
              creator: {
                mspid: 'Org1MSP',
                id_bytes: Buffer.from([
                  45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70, 73, 67, 65,
                  84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 67, 120, 122, 67, 67, 65, 109, 50,
                  103, 65, 119, 73, 66, 65, 103, 73, 85, 73, 112, 68, 73, 115, 52, 67, 116, 115, 86,
                  55, 79, 117, 65, 90, 102, 111, 122, 81, 121, 98, 89, 87, 99, 104, 49, 99, 119, 67,
                  103, 89, 73, 75, 111, 90, 73, 122, 106, 48, 69, 65, 119, 73, 119, 10, 89, 68, 69,
                  76, 77, 65, 107, 71, 65, 49, 85, 69, 66, 104, 77, 67, 86, 86, 77, 120, 70, 122,
                  65, 86, 66, 103, 78, 86, 66, 65, 103, 84, 68, 107, 53, 118, 99, 110, 82, 111, 73,
                  69, 78, 104, 99, 109, 57, 115, 97, 87, 53, 104, 77, 82, 81, 119, 69, 103, 89, 68,
                  86, 81, 81, 75, 10, 69, 119, 116, 73, 101, 88, 66, 108, 99, 109, 120, 108, 90, 71,
                  100, 108, 99, 106, 69, 80, 77, 65, 48, 71, 65, 49, 85, 69, 67, 120, 77, 71, 82,
                  109, 70, 105, 99, 109, 108, 106, 77, 82, 69, 119, 68, 119, 89, 68, 86, 81, 81, 68,
                  69, 119, 104, 121, 89, 50, 69, 116, 98, 51, 74, 110, 10, 77, 84, 65, 101, 70, 119,
                  48, 121, 77, 84, 69, 121, 77, 106, 89, 120, 78, 84, 73, 48, 77, 68, 66, 97, 70,
                  119, 48, 121, 77, 106, 69, 121, 77, 106, 89, 120, 78, 84, 73, 53, 77, 68, 66, 97,
                  77, 71, 85, 120, 67, 122, 65, 74, 66, 103, 78, 86, 66, 65, 89, 84, 65, 108, 86,
                  84, 10, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81, 81, 73, 69, 119, 53, 79, 98, 51,
                  74, 48, 97, 67, 66, 68, 89, 88, 74, 118, 98, 71, 108, 117, 89, 84, 69, 85, 77, 66,
                  73, 71, 65, 49, 85, 69, 67, 104, 77, 76, 83, 72, 108, 119, 90, 88, 74, 115, 90,
                  87, 82, 110, 90, 88, 73, 120, 10, 68, 106, 65, 77, 66, 103, 78, 86, 66, 65, 115,
                  84, 66, 87, 70, 107, 98, 87, 108, 117, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81,
                  81, 68, 69, 119, 53, 104, 90, 71, 49, 112, 98, 105, 49, 118, 99, 109, 99, 120, 76,
                  109, 53, 108, 100, 68, 66, 90, 77, 66, 77, 71, 66, 121, 113, 71, 10, 83, 77, 52,
                  57, 65, 103, 69, 71, 67, 67, 113, 71, 83, 77, 52, 57, 65, 119, 69, 72, 65, 48, 73,
                  65, 66, 74, 117, 102, 117, 107, 66, 104, 100, 78, 74, 76, 50, 48, 51, 74, 99, 65,
                  100, 118, 57, 111, 50, 119, 100, 55, 74, 75, 89, 51, 65, 56, 106, 111, 56, 80,
                  122, 107, 47, 51, 10, 57, 90, 66, 43, 48, 113, 66, 67, 81, 85, 70, 88, 49, 80,
                  107, 48, 67, 66, 87, 73, 99, 90, 84, 53, 104, 87, 55, 113, 76, 109, 54, 53, 108,
                  74, 76, 54, 106, 117, 100, 56, 108, 87, 85, 53, 105, 101, 54, 106, 103, 102, 56,
                  119, 103, 102, 119, 119, 68, 103, 89, 68, 86, 82, 48, 80, 10, 65, 81, 72, 47, 66,
                  65, 81, 68, 65, 103, 101, 65, 77, 65, 119, 71, 65, 49, 85, 100, 69, 119, 69, 66,
                  47, 119, 81, 67, 77, 65, 65, 119, 72, 81, 89, 68, 86, 82, 48, 79, 66, 66, 89, 69,
                  70, 78, 103, 107, 98, 88, 120, 99, 43, 122, 98, 51, 74, 49, 107, 101, 80, 54, 109,
                  106, 10, 89, 56, 53, 122, 78, 67, 110, 119, 77, 66, 56, 71, 65, 49, 85, 100, 73,
                  119, 81, 89, 77, 66, 97, 65, 70, 68, 75, 49, 104, 82, 69, 86, 86, 107, 107, 80,
                  67, 99, 109, 51, 110, 73, 106, 118, 69, 69, 49, 109, 78, 77, 108, 51, 77, 66, 99,
                  71, 65, 49, 85, 100, 69, 81, 81, 81, 10, 77, 65, 54, 67, 68, 71, 74, 107, 78, 106,
                  73, 51, 79, 84, 99, 48, 77, 68, 77, 48, 79, 84, 67, 66, 103, 103, 89, 73, 75, 103,
                  77, 69, 66, 81, 89, 72, 67, 65, 69, 69, 100, 110, 115, 105, 89, 88, 82, 48, 99,
                  110, 77, 105, 79, 110, 115, 105, 89, 87, 74, 104, 89, 121, 53, 112, 10, 98, 109,
                  108, 48, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73, 115, 73, 109, 70, 107,
                  98, 87, 108, 117, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73, 115, 73, 109,
                  104, 109, 76, 107, 70, 109, 90, 109, 108, 115, 97, 87, 70, 48, 97, 87, 57, 117,
                  73, 106, 111, 105, 73, 105, 119, 105, 10, 97, 71, 89, 117, 82, 87, 53, 121, 98,
                  50, 120, 115, 98, 87, 86, 117, 100, 69, 108, 69, 73, 106, 111, 105, 89, 87, 82,
                  116, 97, 87, 52, 116, 98, 51, 74, 110, 77, 83, 53, 117, 90, 88, 81, 105, 76, 67,
                  74, 111, 90, 105, 53, 85, 101, 88, 66, 108, 73, 106, 111, 105, 89, 87, 82, 116,
                  10, 97, 87, 52, 105, 102, 88, 48, 119, 67, 103, 89, 73, 75, 111, 90, 73, 122, 106,
                  48, 69, 65, 119, 73, 68, 83, 65, 65, 119, 82, 81, 73, 104, 65, 76, 100, 55, 75,
                  113, 43, 51, 118, 76, 104, 106, 74, 51, 66, 88, 84, 43, 100, 76, 106, 72, 80, 97,
                  48, 84, 115, 77, 97, 80, 112, 122, 10, 76, 73, 51, 76, 52, 110, 51, 73, 121, 67,
                  52, 120, 65, 105, 66, 110, 56, 119, 121, 110, 85, 105, 120, 66, 114, 47, 114, 49,
                  66, 121, 81, 66, 104, 86, 113, 79, 55, 113, 86, 113, 100, 79, 103, 102, 55, 99,
                  78, 117, 84, 103, 100, 57, 72, 115, 105, 89, 82, 65, 61, 61, 10, 45, 45, 45, 45,
                  45, 69, 78, 68, 32, 67, 69, 82, 84, 73, 70, 73, 67, 65, 84, 69, 45, 45, 45, 45,
                  45, 10,
                ]),
              },
              nonce: Buffer.from([
                242, 165, 113, 51, 27, 173, 43, 50, 239, 77, 44, 32, 116, 8, 194, 28, 212, 139, 112,
                186, 104, 105, 110, 26,
              ]),
            },
          },
          data: {
            actions: [
              {
                header: {
                  creator: {
                    mspid: 'Org1MSP',
                    id_bytes: Buffer.from([
                      45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70, 73, 67,
                      65, 84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 67, 120, 122, 67, 67, 65, 109,
                      50, 103, 65, 119, 73, 66, 65, 103, 73, 85, 73, 112, 68, 73, 115, 52, 67, 116,
                      115, 86, 55, 79, 117, 65, 90, 102, 111, 122, 81, 121, 98, 89, 87, 99, 104, 49,
                      99, 119, 67, 103, 89, 73, 75, 111, 90, 73, 122, 106, 48, 69, 65, 119, 73, 119,
                      10, 89, 68, 69, 76, 77, 65, 107, 71, 65, 49, 85, 69, 66, 104, 77, 67, 86, 86,
                      77, 120, 70, 122, 65, 86, 66, 103, 78, 86, 66, 65, 103, 84, 68, 107, 53, 118,
                      99, 110, 82, 111, 73, 69, 78, 104, 99, 109, 57, 115, 97, 87, 53, 104, 77, 82,
                      81, 119, 69, 103, 89, 68, 86, 81, 81, 75, 10, 69, 119, 116, 73, 101, 88, 66,
                      108, 99, 109, 120, 108, 90, 71, 100, 108, 99, 106, 69, 80, 77, 65, 48, 71, 65,
                      49, 85, 69, 67, 120, 77, 71, 82, 109, 70, 105, 99, 109, 108, 106, 77, 82, 69,
                      119, 68, 119, 89, 68, 86, 81, 81, 68, 69, 119, 104, 121, 89, 50, 69, 116, 98,
                      51, 74, 110, 10, 77, 84, 65, 101, 70, 119, 48, 121, 77, 84, 69, 121, 77, 106,
                      89, 120, 78, 84, 73, 48, 77, 68, 66, 97, 70, 119, 48, 121, 77, 106, 69, 121,
                      77, 106, 89, 120, 78, 84, 73, 53, 77, 68, 66, 97, 77, 71, 85, 120, 67, 122,
                      65, 74, 66, 103, 78, 86, 66, 65, 89, 84, 65, 108, 86, 84, 10, 77, 82, 99, 119,
                      70, 81, 89, 68, 86, 81, 81, 73, 69, 119, 53, 79, 98, 51, 74, 48, 97, 67, 66,
                      68, 89, 88, 74, 118, 98, 71, 108, 117, 89, 84, 69, 85, 77, 66, 73, 71, 65, 49,
                      85, 69, 67, 104, 77, 76, 83, 72, 108, 119, 90, 88, 74, 115, 90, 87, 82, 110,
                      90, 88, 73, 120, 10, 68, 106, 65, 77, 66, 103, 78, 86, 66, 65, 115, 84, 66,
                      87, 70, 107, 98, 87, 108, 117, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81, 81,
                      68, 69, 119, 53, 104, 90, 71, 49, 112, 98, 105, 49, 118, 99, 109, 99, 120, 76,
                      109, 53, 108, 100, 68, 66, 90, 77, 66, 77, 71, 66, 121, 113, 71, 10, 83, 77,
                      52, 57, 65, 103, 69, 71, 67, 67, 113, 71, 83, 77, 52, 57, 65, 119, 69, 72, 65,
                      48, 73, 65, 66, 74, 117, 102, 117, 107, 66, 104, 100, 78, 74, 76, 50, 48, 51,
                      74, 99, 65, 100, 118, 57, 111, 50, 119, 100, 55, 74, 75, 89, 51, 65, 56, 106,
                      111, 56, 80, 122, 107, 47, 51, 10, 57, 90, 66, 43, 48, 113, 66, 67, 81, 85,
                      70, 88, 49, 80, 107, 48, 67, 66, 87, 73, 99, 90, 84, 53, 104, 87, 55, 113, 76,
                      109, 54, 53, 108, 74, 76, 54, 106, 117, 100, 56, 108, 87, 85, 53, 105, 101,
                      54, 106, 103, 102, 56, 119, 103, 102, 119, 119, 68, 103, 89, 68, 86, 82, 48,
                      80, 10, 65, 81, 72, 47, 66, 65, 81, 68, 65, 103, 101, 65, 77, 65, 119, 71, 65,
                      49, 85, 100, 69, 119, 69, 66, 47, 119, 81, 67, 77, 65, 65, 119, 72, 81, 89,
                      68, 86, 82, 48, 79, 66, 66, 89, 69, 70, 78, 103, 107, 98, 88, 120, 99, 43,
                      122, 98, 51, 74, 49, 107, 101, 80, 54, 109, 106, 10, 89, 56, 53, 122, 78, 67,
                      110, 119, 77, 66, 56, 71, 65, 49, 85, 100, 73, 119, 81, 89, 77, 66, 97, 65,
                      70, 68, 75, 49, 104, 82, 69, 86, 86, 107, 107, 80, 67, 99, 109, 51, 110, 73,
                      106, 118, 69, 69, 49, 109, 78, 77, 108, 51, 77, 66, 99, 71, 65, 49, 85, 100,
                      69, 81, 81, 81, 10, 77, 65, 54, 67, 68, 71, 74, 107, 78, 106, 73, 51, 79, 84,
                      99, 48, 77, 68, 77, 48, 79, 84, 67, 66, 103, 103, 89, 73, 75, 103, 77, 69, 66,
                      81, 89, 72, 67, 65, 69, 69, 100, 110, 115, 105, 89, 88, 82, 48, 99, 110, 77,
                      105, 79, 110, 115, 105, 89, 87, 74, 104, 89, 121, 53, 112, 10, 98, 109, 108,
                      48, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73, 115, 73, 109, 70, 107, 98,
                      87, 108, 117, 73, 106, 111, 105, 100, 72, 74, 49, 90, 83, 73, 115, 73, 109,
                      104, 109, 76, 107, 70, 109, 90, 109, 108, 115, 97, 87, 70, 48, 97, 87, 57,
                      117, 73, 106, 111, 105, 73, 105, 119, 105, 10, 97, 71, 89, 117, 82, 87, 53,
                      121, 98, 50, 120, 115, 98, 87, 86, 117, 100, 69, 108, 69, 73, 106, 111, 105,
                      89, 87, 82, 116, 97, 87, 52, 116, 98, 51, 74, 110, 77, 83, 53, 117, 90, 88,
                      81, 105, 76, 67, 74, 111, 90, 105, 53, 85, 101, 88, 66, 108, 73, 106, 111,
                      105, 89, 87, 82, 116, 10, 97, 87, 52, 105, 102, 88, 48, 119, 67, 103, 89, 73,
                      75, 111, 90, 73, 122, 106, 48, 69, 65, 119, 73, 68, 83, 65, 65, 119, 82, 81,
                      73, 104, 65, 76, 100, 55, 75, 113, 43, 51, 118, 76, 104, 106, 74, 51, 66, 88,
                      84, 43, 100, 76, 106, 72, 80, 97, 48, 84, 115, 77, 97, 80, 112, 122, 10, 76,
                      73, 51, 76, 52, 110, 51, 73, 121, 67, 52, 120, 65, 105, 66, 110, 56, 119, 121,
                      110, 85, 105, 120, 66, 114, 47, 114, 49, 66, 121, 81, 66, 104, 86, 113, 79,
                      55, 113, 86, 113, 100, 79, 103, 102, 55, 99, 78, 117, 84, 103, 100, 57, 72,
                      115, 105, 89, 82, 65, 61, 61, 10, 45, 45, 45, 45, 45, 69, 78, 68, 32, 67, 69,
                      82, 84, 73, 70, 73, 67, 65, 84, 69, 45, 45, 45, 45, 45, 10,
                    ]),
                  },
                  nonce: Buffer.from([
                    242, 165, 113, 51, 27, 173, 43, 50, 239, 77, 44, 32, 116, 8, 194, 28, 212, 139,
                    112, 186, 104, 105, 110, 26,
                  ]),
                },
                payload: {
                  chaincode_proposal_payload: {
                    input: {
                      chaincode_spec: {
                        type: 0,
                        typeString: 'UNDEFINED',
                        input: {
                          args: [
                            Buffer.from([
                              65, 112, 112, 114, 111, 118, 101, 67, 104, 97, 105, 110, 99, 111, 100,
                              101, 68, 101, 102, 105, 110, 105, 116, 105, 111, 110, 70, 111, 114,
                              77, 121, 79, 114, 103,
                            ]),

                            Buffer.from([
                              8, 1, 18, 10, 101, 118, 101, 110, 116, 115, 116, 111, 114, 101, 26, 3,
                              49, 46, 48, 50, 42, 10, 40, 18, 12, 18, 10, 8, 2, 18, 2, 8, 0, 18, 2,
                              8, 1, 26, 11, 18, 9, 10, 7, 79, 114, 103, 49, 77, 83, 80, 26, 11, 18,
                              9, 10, 7, 79, 114, 103, 50, 77, 83, 80, 64, 1, 74, 79, 18, 77, 10, 75,
                              101, 118, 101, 110, 116, 115, 116, 111, 114, 101, 58, 54, 101, 54, 56,
                              98, 55, 100, 101, 55, 97, 56, 101, 51, 55, 100, 54, 53, 50, 99, 99,
                              51, 53, 51, 100, 98, 52, 49, 101, 56, 101, 48, 99, 49, 100, 51, 52,
                              54, 101, 52, 98, 49, 97, 97, 50, 48, 53, 53, 101, 55, 100, 101, 99,
                              99, 48, 50, 100, 99, 56, 97, 55, 55, 97, 98, 54,
                            ]),
                          ],
                          decorations: {},
                          is_init: false,
                        },
                        chaincode_id: {
                          name: '_lifecycle',
                        },
                        timeout: 0,
                      },
                    },
                  },
                  action: {
                    proposal_response_payload: {
                      proposal_hash: Buffer.from([
                        198, 201, 231, 116, 254, 137, 245, 200, 195, 152, 54, 199, 255, 57, 205,
                        161, 212, 31, 169, 204, 165, 188, 0, 192, 184, 178, 180, 130, 152, 24, 45,
                        127,
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
                                    key: 'namespaces/fields/eventstore/Sequence',
                                  },
                                  {
                                    key: 'namespaces/metadata/eventstore',
                                  },
                                ],
                                range_queries_info: [],
                                writes: [],
                                metadata_writes: [],
                              },
                              collection_hashed_rwset: [
                                {
                                  collection_name: '_implicit_org_Org1MSP',
                                  hashed_rwset: {
                                    hashed_reads: [
                                      {
                                        key_hash: Buffer.from([
                                          196, 65, 111, 33, 8, 86, 150, 88, 166, 174, 209, 4, 213,
                                          132, 251, 214, 5, 176, 193, 123, 12, 123, 103, 240, 142,
                                          118, 144, 231, 186, 121, 175, 75,
                                        ]),
                                      },
                                      {
                                        key_hash: Buffer.from([
                                          93, 124, 227, 164, 235, 68, 28, 146, 169, 173, 220, 210,
                                          97, 220, 238, 74, 18, 219, 102, 226, 60, 83, 242, 90, 238,
                                          174, 143, 195, 104, 33, 142, 222,
                                        ]),
                                      },
                                    ],
                                    hashed_writes: [
                                      {
                                        key_hash: Buffer.from([
                                          12, 39, 17, 12, 53, 74, 192, 181, 23, 64, 42, 98, 244,
                                          124, 100, 88, 230, 173, 157, 61, 156, 4, 114, 127, 202,
                                          202, 133, 145, 14, 230, 18, 112,
                                        ]),

                                        is_delete: false,
                                        value_hash: Buffer.from([
                                          171, 151, 252, 170, 0, 35, 65, 174, 5, 61, 45, 36, 161,
                                          70, 1, 73, 155, 5, 67, 113, 222, 191, 240, 35, 32, 243,
                                          153, 104, 102, 190, 129, 255,
                                        ]),
                                      },
                                      {
                                        key_hash: Buffer.from([
                                          196, 65, 111, 33, 8, 86, 150, 88, 166, 174, 209, 4, 213,
                                          132, 251, 214, 5, 176, 193, 123, 12, 123, 103, 240, 142,
                                          118, 144, 231, 186, 121, 175, 75,
                                        ]),

                                        is_delete: false,
                                        value_hash: Buffer.from([
                                          105, 82, 237, 224, 34, 203, 174, 149, 158, 27, 74, 160,
                                          218, 212, 126, 133, 188, 158, 30, 78, 157, 141, 252, 240,
                                          136, 80, 121, 52, 136, 11, 190, 117,
                                        ]),
                                      },
                                      {
                                        key_hash: Buffer.from([
                                          188, 173, 178, 219, 144, 128, 50, 10, 92, 245, 67, 252,
                                          248, 247, 195, 4, 62, 231, 3, 250, 110, 3, 162, 105, 105,
                                          35, 147, 240, 119, 143, 50, 216,
                                        ]),

                                        is_delete: false,
                                        value_hash: Buffer.from([
                                          8, 218, 124, 69, 203, 32, 67, 119, 231, 228, 34, 73, 205,
                                          165, 113, 63, 168, 101, 17, 109, 219, 180, 203, 90, 25,
                                          73, 178, 229, 180, 56, 166, 171,
                                        ]),
                                      },
                                      {
                                        key_hash: Buffer.from([
                                          214, 121, 250, 61, 148, 134, 100, 102, 90, 110, 225, 87,
                                          46, 41, 198, 161, 234, 85, 54, 84, 189, 54, 52, 117, 102,
                                          168, 241, 246, 77, 43, 154, 1,
                                        ]),

                                        is_delete: false,
                                        value_hash: Buffer.from([
                                          243, 254, 97, 252, 160, 253, 42, 203, 166, 129, 248, 26,
                                          120, 197, 43, 157, 75, 167, 42, 108, 187, 252, 196, 211,
                                          150, 104, 45, 50, 92, 0, 189, 226,
                                        ]),
                                      },
                                      {
                                        key_hash: Buffer.from([
                                          217, 125, 124, 39, 7, 73, 224, 114, 121, 224, 127, 49, 38,
                                          252, 27, 250, 214, 1, 191, 204, 110, 18, 197, 117, 227,
                                          42, 184, 64, 24, 61, 75, 172,
                                        ]),

                                        is_delete: false,
                                        value_hash: Buffer.from([
                                          230, 42, 171, 65, 87, 40, 203, 24, 237, 56, 94, 23, 190,
                                          200, 123, 77, 108, 219, 247, 15, 26, 163, 201, 145, 239,
                                          34, 35, 40, 249, 19, 146, 212,
                                        ]),
                                      },
                                      {
                                        key_hash: Buffer.from([
                                          93, 124, 227, 164, 235, 68, 28, 146, 169, 173, 220, 210,
                                          97, 220, 238, 74, 18, 219, 102, 226, 60, 83, 242, 90, 238,
                                          174, 143, 195, 104, 33, 142, 222,
                                        ]),

                                        is_delete: false,
                                        value_hash: Buffer.from([
                                          153, 20, 50, 219, 115, 254, 222, 19, 237, 189, 42, 97,
                                          176, 224, 233, 43, 177, 47, 60, 72, 75, 224, 182, 96, 202,
                                          248, 176, 195, 30, 241, 71, 6,
                                        ]),
                                      },
                                    ],
                                    metadata_writes: [],
                                  },
                                  pvt_rwset_hash: Buffer.from([
                                    194, 115, 46, 114, 71, 199, 19, 59, 91, 36, 104, 17, 196, 26,
                                    245, 210, 205, 76, 186, 188, 9, 208, 122, 123, 133, 197, 113,
                                    58, 148, 247, 148, 226,
                                  ]),
                                },
                              ],
                            },
                            {
                              namespace: 'lscc',
                              rwset: {
                                reads: [
                                  {
                                    key: 'eventstore',
                                  },
                                ],
                                range_queries_info: [],
                                writes: [],
                                metadata_writes: [],
                              },
                              collection_hashed_rwset: [],
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
                          payload: Buffer.from([]),
                        },
                        chaincode_id: {
                          path: '',
                          name: '_lifecycle',
                          version: 'syscc',
                        },
                      },
                    },
                    endorsements: [
                      {
                        endorser: {
                          mspid: 'Org1MSP',
                          id_bytes: Buffer.from([
                            45, 45, 45, 45, 45, 66, 69, 71, 73, 78, 32, 67, 69, 82, 84, 73, 70, 73,
                            67, 65, 84, 69, 45, 45, 45, 45, 45, 10, 77, 73, 73, 67, 111, 106, 67,
                            67, 65, 107, 105, 103, 65, 119, 73, 66, 65, 103, 73, 85, 72, 101, 89,
                            102, 102, 51, 80, 104, 100, 109, 48, 119, 107, 52, 75, 70, 106, 122, 49,
                            89, 65, 55, 80, 90, 117, 53, 115, 119, 67, 103, 89, 73, 75, 111, 90, 73,
                            122, 106, 48, 69, 65, 119, 73, 119, 10, 89, 68, 69, 76, 77, 65, 107, 71,
                            65, 49, 85, 69, 66, 104, 77, 67, 86, 86, 77, 120, 70, 122, 65, 86, 66,
                            103, 78, 86, 66, 65, 103, 84, 68, 107, 53, 118, 99, 110, 82, 111, 73,
                            69, 78, 104, 99, 109, 57, 115, 97, 87, 53, 104, 77, 82, 81, 119, 69,
                            103, 89, 68, 86, 81, 81, 75, 10, 69, 119, 116, 73, 101, 88, 66, 108, 99,
                            109, 120, 108, 90, 71, 100, 108, 99, 106, 69, 80, 77, 65, 48, 71, 65,
                            49, 85, 69, 67, 120, 77, 71, 82, 109, 70, 105, 99, 109, 108, 106, 77,
                            82, 69, 119, 68, 119, 89, 68, 86, 81, 81, 68, 69, 119, 104, 121, 89, 50,
                            69, 116, 98, 51, 74, 110, 10, 77, 84, 65, 101, 70, 119, 48, 121, 77, 84,
                            69, 121, 77, 106, 89, 120, 78, 84, 73, 48, 77, 68, 66, 97, 70, 119, 48,
                            121, 77, 106, 69, 121, 77, 106, 89, 120, 78, 84, 73, 53, 77, 68, 66, 97,
                            77, 71, 81, 120, 67, 122, 65, 74, 66, 103, 78, 86, 66, 65, 89, 84, 65,
                            108, 86, 84, 10, 77, 82, 99, 119, 70, 81, 89, 68, 86, 81, 81, 73, 69,
                            119, 53, 79, 98, 51, 74, 48, 97, 67, 66, 68, 89, 88, 74, 118, 98, 71,
                            108, 117, 89, 84, 69, 85, 77, 66, 73, 71, 65, 49, 85, 69, 67, 104, 77,
                            76, 83, 72, 108, 119, 90, 88, 74, 115, 90, 87, 82, 110, 90, 88, 73, 120,
                            10, 68, 84, 65, 76, 66, 103, 78, 86, 66, 65, 115, 84, 66, 72, 66, 108,
                            90, 88, 73, 120, 70, 122, 65, 86, 66, 103, 78, 86, 66, 65, 77, 84, 68,
                            110, 66, 108, 90, 88, 73, 119, 76, 109, 57, 121, 90, 122, 69, 117, 98,
                            109, 86, 48, 77, 70, 107, 119, 69, 119, 89, 72, 75, 111, 90, 73, 10,
                            122, 106, 48, 67, 65, 81, 89, 73, 75, 111, 90, 73, 122, 106, 48, 68, 65,
                            81, 99, 68, 81, 103, 65, 69, 84, 109, 106, 101, 117, 102, 81, 110, 113,
                            52, 80, 72, 85, 43, 110, 72, 51, 50, 108, 70, 108, 102, 67, 56, 106,
                            100, 121, 82, 97, 86, 82, 121, 109, 77, 48, 116, 117, 84, 110, 43, 10,
                            81, 71, 48, 89, 81, 106, 118, 77, 83, 77, 81, 114, 81, 88, 97, 72, 118,
                            112, 97, 98, 101, 68, 55, 70, 80, 65, 73, 112, 78, 74, 115, 70, 77, 121,
                            115, 119, 89, 84, 68, 114, 70, 113, 57, 89, 47, 113, 79, 66, 50, 122,
                            67, 66, 50, 68, 65, 79, 66, 103, 78, 86, 72, 81, 56, 66, 10, 65, 102,
                            56, 69, 66, 65, 77, 67, 66, 52, 65, 119, 68, 65, 89, 68, 86, 82, 48, 84,
                            65, 81, 72, 47, 66, 65, 73, 119, 65, 68, 65, 100, 66, 103, 78, 86, 72,
                            81, 52, 69, 70, 103, 81, 85, 105, 111, 43, 80, 97, 84, 112, 120, 115,
                            112, 57, 87, 75, 116, 100, 80, 111, 70, 43, 79, 10, 76, 111, 119, 82,
                            74, 47, 65, 119, 72, 119, 89, 68, 86, 82, 48, 106, 66, 66, 103, 119, 70,
                            111, 65, 85, 77, 114, 87, 70, 69, 82, 86, 87, 83, 81, 56, 74, 121, 98,
                            101, 99, 105, 79, 56, 81, 84, 87, 89, 48, 121, 88, 99, 119, 70, 119, 89,
                            68, 86, 82, 48, 82, 66, 66, 65, 119, 10, 68, 111, 73, 77, 77, 68, 65,
                            48, 89, 106, 86, 109, 77, 84, 78, 105, 77, 122, 108, 104, 77, 70, 56,
                            71, 67, 67, 111, 68, 66, 65, 85, 71, 66, 119, 103, 66, 66, 70, 78, 55,
                            73, 109, 70, 48, 100, 72, 74, 122, 73, 106, 112, 55, 73, 109, 104, 109,
                            76, 107, 70, 109, 90, 109, 108, 115, 10, 97, 87, 70, 48, 97, 87, 57,
                            117, 73, 106, 111, 105, 73, 105, 119, 105, 97, 71, 89, 117, 82, 87, 53,
                            121, 98, 50, 120, 115, 98, 87, 86, 117, 100, 69, 108, 69, 73, 106, 111,
                            105, 99, 71, 86, 108, 99, 106, 65, 117, 98, 51, 74, 110, 77, 83, 53,
                            117, 90, 88, 81, 105, 76, 67, 74, 111, 10, 90, 105, 53, 85, 101, 88, 66,
                            108, 73, 106, 111, 105, 99, 71, 86, 108, 99, 105, 74, 57, 102, 84, 65,
                            75, 66, 103, 103, 113, 104, 107, 106, 79, 80, 81, 81, 68, 65, 103, 78,
                            73, 65, 68, 66, 70, 65, 105, 69, 65, 107, 56, 111, 100, 120, 108, 75,
                            100, 88, 75, 57, 109, 73, 111, 75, 113, 10, 114, 100, 113, 106, 116, 55,
                            82, 87, 53, 120, 77, 79, 67, 122, 117, 122, 47, 97, 103, 82, 98, 122,
                            106, 108, 85, 84, 119, 67, 73, 70, 86, 66, 76, 117, 119, 117, 84, 66,
                            116, 86, 117, 105, 115, 89, 101, 55, 80, 76, 83, 110, 89, 69, 111, 56,
                            108, 83, 70, 104, 110, 97, 97, 101, 67, 72, 10, 72, 114, 53, 54, 76, 67,
                            114, 84, 10, 45, 45, 45, 45, 45, 69, 78, 68, 32, 67, 69, 82, 84, 73, 70,
                            73, 67, 65, 84, 69, 45, 45, 45, 45, 45, 10,
                          ]),
                        },
                        signature: Buffer.from([
                          48, 68, 2, 32, 35, 45, 61, 154, 154, 56, 70, 199, 69, 11, 25, 104, 237,
                          130, 210, 108, 6, 49, 93, 145, 21, 170, 70, 133, 37, 39, 107, 238, 198,
                          17, 196, 243, 2, 32, 34, 154, 0, 63, 164, 223, 199, 49, 9, 44, 252, 158,
                          251, 151, 98, 102, 108, 112, 249, 87, 220, 33, 40, 181, 207, 193, 232, 4,
                          175, 23, 125, 240,
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
        value: Buffer.from([10, 2, 8, 2, 18, 13, 10, 11, 10, 5, 1, 2, 3, 4, 5, 16, 6, 24, 9]),
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
                95, 99, 16, 136, 32, 98, 22, 117, 103, 244, 239, 59, 213, 233, 225, 84, 251, 112,
                18, 35, 29, 35, 6, 98,
              ]),
            },
            signature: Buffer.from([
              48, 68, 2, 32, 41, 167, 4, 51, 191, 103, 129, 249, 135, 84, 250, 18, 254, 15, 195,
              210, 90, 250, 220, 106, 147, 16, 42, 43, 70, 67, 212, 202, 184, 130, 228, 101, 2, 32,
              59, 223, 125, 85, 14, 216, 13, 216, 100, 13, 205, 155, 2, 153, 4, 164, 150, 208, 56,
              191, 253, 78, 81, 51, 152, 180, 166, 139, 207, 120, 115, 207,
            ]),
          },
        ],
      },
      {},
      [0],
      {},
      Buffer.from([
        10, 32, 135, 61, 103, 151, 50, 91, 135, 7, 26, 186, 10, 1, 149, 150, 80, 146, 51, 33, 126,
        69, 141, 87, 190, 250, 251, 79, 184, 14, 157, 229, 82, 0,
      ]),
    ],
  },
};
