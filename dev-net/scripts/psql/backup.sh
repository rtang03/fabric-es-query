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

  CREATE TABLE IF NOT EXISTS incident
  (
    id SERIAL PRIMARY KEY,
    kind character varying(256) DEFAULT NULL,
    desc character varying DEFAULT NULL,
    status character varying(256) DEFAULT NULL,
    data json DEFAULT NULL,
    errormsg character varying(256) DEFAULT NULL,
    errorstack character varying DEFAULT NULL
    timestamp timestamp DEFAULT NULL,
    read boolean DEFAULT FALSE,
    expired boolean DEFAULT FALSE
  );

  CREATE TABLE IF NOT EXISTS commit
  (
    key character varying PRIMARY KEY,
    id character varying(256),
    entityName character varying(256),
    entityId character varying(256),
    commitId character varying(256),
    mspId character varying(256),
    version integer DEFAULT NULL,
    events json DEFAULT NULL,
    blocknum integer DEFAULT NULL,
    hash character varying DEFAULT NULL,
    raw character varying DEFAULT NULL,
    signedRequest character varying DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS keyvalue
  (
    key character varying PRIMARY KEY,
    modified timestamp,
    value character varying DEFAULT NULL
  );

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

  CREATE INDEX ON Commit
  (id);

  CREATE INDEX ON Commit
  (entityName);

  CREATE INDEX ON Commit
  (commitId);

  CREATE INDEX ON Commit
  (entityId);

  CREATE INDEX ON Commit
  (blocknum);
EOSQL
