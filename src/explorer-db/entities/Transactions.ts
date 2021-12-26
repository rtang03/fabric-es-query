import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('transactions')
export class Transactions {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: true })
  blockid: number;

  @Column({ type: 'varchar', length: 256, nullable: true })
  txhash: string;

  @Column({ type: 'timestamp', nullable: true })
  createdt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  chaincodename: string;

  @Column({ type: 'int', nullable: true })
  status: number;

  @Column({ type: 'varchar', length: 256, nullable: true })
  creator_msp_id: string;

  @Column({ type: 'varchar', length: 800, nullable: true })
  endorser_msp_id: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  chaincode_id: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  type: string;

  @Column({ type: 'simple-array', nullable: true })
  read_set: any;

  @Column({ type: 'simple-array', nullable: true })
  write_set: any;

  @Column({ type: 'varchar', length: 256, nullable: true })
  channel_genesis_hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  validation_code: string;

  @Column({ type: 'varchar', nullable: true })
  envelope_signature: string;

  @Column({ type: 'varchar', nullable: true })
  payload_extension: string;

  @Column({ type: 'varchar', nullable: true })
  creator_id_bytes: string;

  @Column({ type: 'varchar', nullable: true })
  creator_nonce: string;

  @Column({ type: 'varchar', nullable: true })
  chaincode_proposal_input: string;

  @Column({ type: 'varchar', nullable: true })
  tx_response: string;

  @Column({ type: 'varchar', nullable: true })
  payload_proposal_hash: string;

  @Column({ type: 'varchar', nullable: true })
  endorser_id_bytes: string;

  @Column({ type: 'varchar', nullable: true })
  endorser_signature: string;

  @Column({ type: 'varchar' })
  network_name: string;
}
