import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('message')
export class Incident {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: true })
  kind: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  desc: string;

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  data: any;

  @Column({ type: 'varchar', nullable: true })
  errormsg: string;

  @Column({ type: 'varchar', nullable: true })
  errorstack: string;

  @Column({ type: 'timestamp', nullable: false })
  timestamp: Date;

  @Column({ type: 'boolean', nullable: true })
  read: boolean;

  @Column({ type: 'boolean', nullable: true })
  expired: boolean;
}
