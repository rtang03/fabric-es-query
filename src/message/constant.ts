export const MSG = {
  // notify by queryDb
  DB_CONNECTED: 'database connected',
  INSERT_BLOCK_OK: 'insert block ok',
  INSERT_BLOCK_FAIL: 'insert block fail',
  INSERT_TX_OK: 'insert tx ok',
  INSERT_TX_FAIL: 'insert tx fail',
  INSERT_COMMIT_OK: 'insert commit ok',
  INSERT_COMMIT_FAIL: 'insert commit fail',
  PARSE_WRITESET_FAIL: 'fail to parse write_set',
  UPDATE_KV_INSERTEDBLOCK_FAIL: 'fail to update key-value: insertedblock',
  UNVERIFIED_BLOCK_FOUND: 'unverified block found',
  UNVERIFIED_BLOCK_DELTED: 'unverified block deleted',
  // notify by fabricGateway
  CHANNEL_HEIGHT: 'latest channel height',
  BLOCK_ARRIVAL: 'block arrives',
  // notify by synchronizer
  SYNC_START: 'sync start',
  SYNC_STOP: 'sync stop',
  SYNCJOB_OK: 'sync job ok',
  SYNCJOB_FAIL: 'sync job fail',
};

export const KIND = {
  INFO: 'info',
  ERROR: 'error',
  SYSTEM: 'system',
};
