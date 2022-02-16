import { Entity, ObjectID, ObjectIdColumn, Column, Index } from 'typeorm';

@Entity('commit')
export class Commit {
  @ObjectIdColumn()
  id: ObjectID;
}
