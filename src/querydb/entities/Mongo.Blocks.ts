import { Entity, ObjectID, ObjectIdColumn, Column, Index } from 'typeorm';

@Entity('blocks')
export class Blocks {
  @ObjectIdColumn()
  id: ObjectID;

  @Index()
  @Column()
  blocknum: number;

  @Column()
  datahash: string;

  @Column()
  prehash: string;

  @Column()
  txcount: number;

  @Index()
  @Column()
  createdt: Date;

  @Column()
  blockhash: string;

  @Column()
  blksize: number;

  @Index()
  @Column()
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
