import { PrimaryColumn, Column, Entity } from 'typeorm';

@Entity('keyvalue')
export class KeyValue {
  @PrimaryColumn({ type: 'varchar' })
  key: string;

  @Column({ type: 'varchar', nullable: false })
  value: string;

  @Column({ type: 'timestamp' })
  modified: Date;
}
