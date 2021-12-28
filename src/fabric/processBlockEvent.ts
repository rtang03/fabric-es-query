import { common, protos } from 'fabric-protos';
import sha from 'js-sha256';
import winston from 'winston';
import type { TBlock } from '../types';
import { generateBlockHash } from './generateBlockHash';

const convertFormatOfValue = (prop: string, encoding: string, obj: any) => {
  if (Array.isArray(obj)) {
    obj.forEach((item) => convertFormatOfValue(prop, encoding, item));
  } else if (!Buffer.isBuffer(obj) && typeof obj === 'object') {
    // Each element of array of Buffer is excluded by the 1st condition

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.keys(obj).forEach((key) => {
      if (key === prop && Buffer.isBuffer(obj[key])) obj[key] = obj[key].toString(encoding);
      else if (obj[key]) convertFormatOfValue(prop, encoding, obj[key]);
    });
  }
};

export const processBlockEvent = (block: TBlock, logger?: winston.Logger) => {
  // Prepare _validation_codes
  const _validation_codes = {};
  // eslint-disable-next-line guard-for-in
  for (const key in protos.TxValidationCode) {
    const new_key = protos.TxValidationCode[key];
    _validation_codes[new_key] = key;
  }
  const convertValidationCode = (code: any) =>
    typeof code === 'string' ? code : _validation_codes[code];
  // END

  // Calculate data size of json object
  const jsonObjSize = (json): string => {
    let bytes = 0;
    const sizeOf = (obj): number => {
      if (obj !== null && obj !== undefined) {
        switch (typeof obj) {
          case 'number': {
            bytes += 8;
            break;
          }
          case 'string': {
            bytes += obj.length;
            break;
          }
          case 'boolean': {
            bytes += 4;
            break;
          }
          case 'object': {
            const objClass = Object.prototype.toString.call(obj).slice(8, -1);
            if (objClass === 'Object' || objClass === 'Array') {
              for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                sizeOf(obj[key]);
              }
            } else bytes += obj.length;

            break;
          }
          default:
            logger.debug(typeof obj);
            break;
        }
      }
      return bytes;
    };
    return (sizeOf(json) / 1024).toFixed(0);
  };
  // END

  // Convert value (of Buffer) to actual
  const convertFormatOfValue = (prop: string, encoding: string, obj) => {
    if (Array.isArray(obj)) {
      obj.forEach((item) => convertFormatOfValue(prop, encoding, item));
    } else if (!Buffer.isBuffer(obj) && typeof obj === 'object') {
      // Each element of array of Buffer is excluded by the 1st condition
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Object.entries(obj).forEach(([key, value]) => {
        if (key === prop && Buffer.isBuffer(value)) {
          obj[key] = obj[key].toString(encoding);
        } else if (obj[key]) {
          convertFormatOfValue(prop, encoding, obj[key]);
        }
      });
    }
  };

  const first_tx = block.data.data[0];
  const header = first_tx.payload.header;
  // const channel_name = header.channel_header.channel_id;
  const createdt = new Date(header.channel_header.timestamp);
  const blockhash = generateBlockHash(block.header);

  const block_row = {
    blocknum: block.header.number.toString(),
    datahash: block.header.data_hash.toString('hex'),
    prehash: block.header.previous_hash.toString('hex'),
    txcount: block.data.data.length,
    createdt,
    prev_blockhash: '',
    blockhash,
    blksize: jsonObjSize(block),
  };

  // Parse Transactions
  block.data.data.forEach((txObj, index) => {
    const txStr = JSON.stringify(txObj);
    // const size = Buffer.byteLength(txStr);
    let txid = txObj.payload.header.channel_header.tx_id;

    convertFormatOfValue('value', 'utf-8', txObj);

    const validation_code = txid?.length
      ? convertValidationCode(
          block.metadata.metadata[common.BlockMetadataIndex.TRANSACTIONS_FILTER][index]
        )
      : '';
    const envelope_signature = txObj?.signature?.toString('hex');

    const payload_extension = txObj.payload?.header?.channel_header?.extension?.toString('hex');

    const creator_nonce = txObj.payload?.header?.signature_header?.nonce?.toString('hex');

    const creator_id_bytes = txObj.payload?.header?.signature_header?.creator?.id_bytes?.toString();

    let chaincode = '';
    let status;
    let readSet;
    let writeSet;
    let mspId = [];
    let chaincode_proposal_input = '';
    let endorser_signature = '';
    let payload_proposal_hash = '';
    let endorser_id_bytes = '';

    // when it is Endorsement Transaction
    if (txObj.payload?.data?.actions) {
      const firstAction = txObj.payload?.data?.actions[0];

      chaincode =
        firstAction.payload?.action?.proposal_response_payload?.extension?.chaincode_id?.name;

      status = firstAction.payload?.action?.proposal_response_payload?.extension?.response?.status;

      mspId = firstAction.payload?.action?.endorsements?.map(
        (endorsement) => endorsement?.endorser?.mspid
      );

      const rwset =
        firstAction.payload?.action?.proposal_response_payload?.extension?.results?.ns_rwset;

      readSet = rwset.map((rw) => ({
        chaincode: rw?.namespace,
        set: rw?.rwset?.reads,
      }));

      writeSet = rwset.map((rw) => ({
        chaincode: rw.namespace,
        set: rw.rwset.writes,
      }));

      chaincode_proposal_input =
        firstAction.payload?.chaincode_proposal_payload?.input?.chaincode_spec?.input?.args
          ?.map((arg) => arg?.toString())
          .reduce((prev, curr) => `${prev === '' ? '' : prev + ','}${curr}`, '');

      endorser_signature =
        firstAction.payload?.action?.endorsements?.[0]?.signature?.toString('hex');

      payload_proposal_hash =
        firstAction.payload?.action?.proposal_response_payload?.proposal_hash?.toString('hex');

      endorser_id_bytes =
        firstAction.payload?.action?.endorsements[0]?.endorser.id_bytes?.toString();
    }

    // when it is Config
    if (txObj.payload.header.channel_header.typeString === 'CONFIG') {
      txid = sha.sha256(txStr);
      readSet = txObj.payload?.data?.last_update.payload?.data?.config_update?.read_set;
      writeSet = txObj.payload?.data?.last_update.payload?.data?.config_update?.write_set;
    }

    const read_set = JSON.stringify(readSet, null, 2);
    const write_set = JSON.stringify(writeSet, null, 2);

    const transaction_row = {
      blockid: block.header.number.toString(),
      txhash: txid,
      createdt: txObj.payload?.header?.channel_header?.timestamp,
      chaincodename: chaincode,
      status,
      creator_msp_id: txObj.payload?.header?.signature_header?.creator?.mspid,
      endorser_msp_id: mspId,
      type: txObj.payload?.header?.channel_header?.typeString,
      read_set,
      write_set,
      validation_code,
      envelope_signature,
      payload_extension,
      creator_nonce,
      chaincode_proposal_input,
      endorser_signature,
      creator_id_bytes,
      payload_proposal_hash,
      endorser_id_bytes,
    };

    console.log(transaction_row);

    // Save Tx
  });

  // Save Block
  console.log(block_row);

  // update blocksInProcess
  return true;
};
