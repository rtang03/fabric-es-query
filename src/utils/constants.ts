export const INVALID = 'INVALID';
export const METERS = {
  ENROLL_COUNT: 'enrollCount',
  QUERYBLOCK_COUNT: 'queryBlockCount',
};
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
