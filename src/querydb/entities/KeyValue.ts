import { PrimaryColumn, Column, Entity } from 'typeorm';

@Entity('keyvalue')
export class KeyValue {
  @PrimaryColumn({ type: 'varchar' })
  key: string;

  @Column({ type: 'varchar', nullable: true })
  value: string;

  @Column({ type: 'timestamp', nullable: false})
  modified: Date;
}
