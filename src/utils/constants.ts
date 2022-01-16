export const INVALID = 'INVALID';
export const METERS = {
  ENROLL_COUNT: 'enrollCount',
  QUERYBLOCK_COUNT: 'queryBlockCount',
  QUERYDB_CONNECTED_COUNT: 'queryDbConnected',
  QUERYDB_BLOCKHEIGHT: 'queryDbBlockHeight',
};

// used by connection profile
export const connectionOptions = {
  'grpc.max_receive_message_length': -1,
  'grpc.max_send_message_length': -1,
  'grpc.keepalive_time_ms': 120000,
  'grpc.http2.min_time_between_pings_ms': 120000,
  'grpc.keepalive_timeout_ms': 20000,
  'grpc.http2.max_pings_without_data': 0,
  'grpc.keepalive_permit_without_calls': 1,
  'grpc-wait-for-ready-timeout': 3000,
  'request-timeout': 45000,
};

// used to identify whether Transaction is QueryDb contains public-data commit, or private-data commit
export const CODE = {
  PUBLIC_COMMIT: 1,
  PRIVATE_COMMIT: 2,
  ERROR: 96,
  INVALID_RESPONSE: 97,
  TEST: 98,
  UNKNOWN: 99,
};
