import { Column, PrimaryGeneratedColumn, Entity } from 'typeorm';

/**
 * Command side to record his submission
 * NOT implemented yet
 */
@Entity('fabrictx')
export class FabricTransaction {
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

  @Column({ type: 'varchar', nullable: true })
  txid: any;

  @Column({ type: 'timestamp', nullable: true })
  submit_at: Date;
}
