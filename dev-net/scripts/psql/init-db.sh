#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "eventstore" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS blocks
  (
    blocknum integer PRIMARY KEY,
    datahash character varying(256) DEFAULT NULL,
    prehash character varying(256) DEFAULT NULL,
    txcount integer DEFAULT NULL,
    createdt Timestamp DEFAULT NULL,
    blockhash character varying(256) DEFAULT NULL,
    blksize integer DEFAULT NULL,
    verified boolean DEFAULT FALSE
  );

  CREATE TABLE IF NOT EXISTS transactions
  (
    id SERIAL PRIMARY KEY,
    code integer DEFAULT NULL,
    blockid integer DEFAULT NULL,
    txhash character varying(256) DEFAULT NULL,
    createdt timestamp DEFAULT NULL,
    chaincodename character varying(255) DEFAULT NULL,
    status integer DEFAULT NULL,
    creator_msp_id character varying(256) DEFAULT NULL,
    endorser_msp_id character varying(800) DEFAULT NULL,
    type character varying(256) DEFAULT NULL,
    read_set json default NULL,
    write_set json default NULL,
    channel_genesis_hash character varying(256) DEFAULT NULL,
    validation_code character varying(255) DEFAULT NULL,
    payload_extension character varying DEFAULT NULL,
    creator_id_bytes character varying DEFAULT NULL,
    creator_nonce character varying DEFAULT NULL,
    chaincode_proposal_input character varying DEFAULT NULL,
    payload_proposal_hash character varying DEFAULT NULL,
    endorser_id_bytes character varying DEFAULT NULL,
    endorser_signature character varying DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS fabricwallet
  (
    id VARCHAR(255) PRIMARY KEY,
    data TEXT NOT NULl
  );

  Alter sequence transactions_id_seq restart with 6;

  CREATE INDEX ON Blocks
  (blocknum);

  CREATE INDEX ON Blocks
  (verified);

  CREATE INDEX ON Blocks
  (createdt);

  CREATE INDEX ON Transactions
  (txhash);

  CREATE INDEX ON Transactions
  (chaincodename);

  CREATE INDEX ON Transactions
  (createdt);

  CREATE INDEX ON Transactions
  (code);

  CREATE INDEX ON Transactions
  (blockid);

  CREATE INDEX ON Transactions
  ((md5
  (chaincode_proposal_input)));
EOSQL
