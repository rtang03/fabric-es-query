import { Entity, ObjectID, ObjectIdColumn, Column, Index } from 'typeorm';

@Entity('keyvalue')
export class KeyValue {
  @ObjectIdColumn()
  id: ObjectID;
}
