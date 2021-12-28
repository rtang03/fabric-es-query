import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blocks')
export class Blocks {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: true })
  blocknum: number;

  @Column({ type: 'varchar', length: 800, nullable: true })
  datahash: string;

  @Column({ type: 'varchar', length: 800, nullable: true })
  prehash: string;

  @Column({ type: 'int', nullable: true })
  txcount: number;

  @Column({ type: 'timestamp', nullable: true })
  createdt: Date;

  @Column({ type: 'varchar', length: 800, nullable: true })
  prevBlockhash: string;

  @Column({ type: 'varchar', length: 800, nullable: true })
  blockhash: string;

  @Column({ type: 'varchar', length: 800, nullable: true })
  channelGenesisHash: string;

  @Column({ type: 'int', nullable: true })
  blksize: number;

  @Column({ type: 'varchar' })
  networkName: string;
}
