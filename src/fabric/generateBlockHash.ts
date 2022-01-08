import asn from 'asn1.js';
import sha from 'js-sha256';
import type { TBlock } from '../types';

// TODO: asn1.js does not work with jest
// We shall remove BlockHash, where is no actual use
export const generateBlockHash = (header: TBlock['header']) => {
  const headerAsn = asn.define('headerAsn', function () {
    this.seq().obj(
      this.key('Number').int(),
      this.key('PreviousHash').octstr(),
      this.key('DataHash').octstr()
    );
  });

  const output = headerAsn.encode(
    {
      Number: header.number,
      PreviousHash: header.previous_hash,
      DataHash: header.data_hash,
    },
    'der'
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return sha.sha256(output);
};
