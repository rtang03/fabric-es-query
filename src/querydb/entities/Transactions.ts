import { Index, Column, Entity, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';
import { CODE } from '../../utils';

@Entity('transactions')
export class Transactions {
  @PrimaryColumn({ type: 'character varying', length: 256 })
  txhash: string;

  @Index()
  @Column({ type: 'int', nullable: true })
  code: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  blockid: number;

  @Column({ type: 'timestamp', nullable: true })
  createdt: Date;

  @Column({ type: 'character varying', length: 255, nullable: true })
  chaincodename: string;

  @Column({ type: 'int', nullable: true })
  status: number;

  @Column({ type: 'character varying', length: 256, nullable: true })
  creator_msp_id: string;

  @Column({ type: 'character varying', length: 800, nullable: true })
  endorser_msp_id: string[];

  @Column({ type: 'character varying', length: 256, nullable: true })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  read_set: string;

  @Column({ type: 'varchar', nullable: true })
  write_set: string;

  @Column({ type: 'character varying', length: 255, nullable: true })
  validation_code: string;

  // @Column({ type: 'character varying', nullable: true })
  // envelope_signature: string;

  @Column({ type: 'character varying', nullable: true })
  payload_extension: string;

  @Column({ type: 'character varying', nullable: true })
  creator_id_bytes: string;

  @Column({ type: 'character varying', nullable: true })
  creator_nonce: string;

  @Column({ type: 'character varying', nullable: true })
  chaincode_proposal_input: string;

  @Column({ type: 'character varying', nullable: true })
  payload_proposal_hash: string;

  @Column({ type: 'character varying', nullable: true })
  endorser_id_bytes: string;

  @Column({ type: 'character varying', nullable: true })
  endorser_signature: string;

  setData?(data) {
    this.code =
      data.validation_code === 'VALID' && data.status === 200
        ? (data.chaincode_proposal_input as string).startsWith('createCommit')
          ? CODE.PUBLIC_COMMIT
          : (data.chaincode_proposal_input as string).startsWith('privatedata:createCommit')
          ? CODE.PRIVATE_COMMIT
          : CODE.UNKNOWN
        : CODE.UNKNOWN;
    this.blockid = data.blockid;
    this.txhash = data.txhash;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.createdt = new Date(data.createdt);
    this.chaincodename = data?.chaincodename || '';
    this.status = data?.status || 0;
    this.creator_msp_id = data?.creator_msp_id || '';
    this.endorser_msp_id = data?.endorser_msp_id || '';
    this.type = data.type;
    this.read_set = data.read_set;
    this.write_set = data.write_set;
    this.validation_code = data.validation_code;
    // this.envelope_signature = data.envelope_signature;
    this.payload_extension = data.payload_extension;
    this.creator_id_bytes = data.creator_id_bytes;
    this.creator_nonce = data.creator_nonce;
    this.chaincode_proposal_input = data.chaincode_proposal_input;
    this.payload_proposal_hash = data.payload_proposal_hash;
    this.endorser_id_bytes = data.endorser_id_bytes;
    this.endorser_signature = data.endorser_signature;
  }
}
