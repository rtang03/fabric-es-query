import { PrimaryGeneratedColumn, Column, Entity, Index } from 'typeorm';

@Entity('keyvalue')
export class KeyValue {
  @PrimaryGeneratedColumn()
  id: string;

  @Index()
  @Column({ type: 'varchar', nullable: false, unique: true })
  key: string;

  @Column({ type: 'varchar', nullable: false })
  value: string;

  @Column({ type: 'timestamp' })
  modified: Date;
}
