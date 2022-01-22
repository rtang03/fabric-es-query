import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Counter {
  static entityName = 'counter';

  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  value: number;
}
