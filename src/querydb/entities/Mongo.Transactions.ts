import { Entity, ObjectID, ObjectIdColumn, Column, Index } from 'typeorm';

@Entity('transactions')
export class Transactions {
  @ObjectIdColumn()
  id: ObjectID;
}
