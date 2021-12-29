import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blocks')
export class Blocks {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: true })
  blocknum: number;

  @Column({ type: 'character varying', length: 256, nullable: true })
  datahash: string;

  @Column({ type: 'character varying', length: 256, nullable: true })
  prehash: string;

  @Column({ type: 'int', nullable: true })
  txcount: number;

  @Column({ type: 'timestamp', nullable: true })
  createdt: Date;

  @Column({ type: 'character varying', length: 256, nullable: true })
  blockhash: string;

  @Column({ type: 'int', nullable: true })
  blksize: number;
}
