import { Column, PrimaryColumn, Entity, Index } from 'typeorm';

@Entity('blocks')
export class Blocks {
  @PrimaryColumn({ type: 'int' })
  blocknum: number;

  @Column({ type: 'character varying', length: 256, nullable: true })
  datahash: string;

  @Column({ type: 'character varying', length: 256, nullable: true })
  prehash: string;

  @Column({ type: 'int', nullable: true })
  txcount: number;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  createdt: Date;

  @Column({ type: 'character varying', length: 256, nullable: true })
  blockhash: string;

  @Column({ type: 'int', nullable: true })
  blksize: number;

  @Index()
  @Column({ type: 'boolean', nullable: false, default: false })
  verified?: boolean;

  setData?(data) {
    this.blocknum = data.blocknum;
    this.datahash = data.datahash;
    this.prehash = data.prehash;
    this.txcount = data.txcount;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.createdt = new Date(data.createdt);
    this.blockhash = data.blockhash;
    this.blksize = data.blksize;
  }
}
