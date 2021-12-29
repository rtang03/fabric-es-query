import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('transactions')
export class Transactions {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: true })
  blockid: number;

  @Column({ type: 'character varying', length: 256, nullable: true })
  txhash: string;

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

  @Column({ type: 'simple-json', nullable: true })
  read_set: any;

  @Column({ type: 'simple-json', nullable: true })
  write_set: any;

  @Column({ type: 'character varying', length: 255, nullable: true })
  validation_code: string;

  @Column({ type: 'character varying', nullable: true })
  envelope_signature: string;

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
}
