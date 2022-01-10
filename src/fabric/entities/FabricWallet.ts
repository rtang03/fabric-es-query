import { Column, PrimaryColumn, Entity, Index } from 'typeorm';

@Entity('fabricwallet')
export class FabricWallet {
  @PrimaryColumn({ type: 'varchar', length: 256 })
  id: string;

  @Column({ nullable: false })
  data: string;
}
