import { Entity, ObjectID, ObjectIdColumn, Column, Index } from 'typeorm';

@Entity('incident')
export class Incident {
  @ObjectIdColumn()
  id: ObjectID;

  @Index()
  @Column()
  kind: string;

  @Index()
  @Column()
  title: string;

  @Column()
  desc: string;

  @Column()
  status: string;

  @Column()
  data: any;

  @Column()
  errormsg: string;

  @Column()
  errorstack: string;

  @Column()
  timestamp: Date;

  @Column()
  read: boolean;

  @Column()
  expired: boolean;
}
