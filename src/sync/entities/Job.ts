import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm';

@Entity('job')
export class Job {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  alias: string;

  @Column({ type: 'varchar', nullable: false })
  kind: string;

  @Column({ type: 'simple-array', nullable: true })
  args: string[];

  @Column({ type: 'varchar', nullable: false })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  logs: any;
}
