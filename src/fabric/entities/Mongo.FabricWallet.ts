import { Entity, ObjectID, ObjectIdColumn, Column, Index } from 'typeorm';

@Entity('fabricwallet')
export class FabricWallet {
  @ObjectIdColumn()
  id: ObjectID;

  @Index()
  @Column()
  label: string;

  @Column()
  data: string;
}
