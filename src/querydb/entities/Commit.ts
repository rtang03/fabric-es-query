import { PrimaryColumn, Column, Entity } from 'typeorm';

/**
 * **Lifecycle**
 * Entity lifecycle markers
 * BEGIN  - start of lifecycle, only appear once as the first event
 * END    - end of lifecycle, only appear once as the last event
 * NORMAL - other events without restriction
 * @ignore
 */
export enum Lifecycle {
  NORMAL,
  BEGIN,
  END,
}

export type BaseEvent = {
  /** event type **/
  readonly type?: string;

  /** lifecycle type **/
  readonly lifeCycle?: Lifecycle;

  /** event payload **/
  payload?: any;
};

@Entity('commit')
export class Commit {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id: string;

  @Column({ type: 'varchar', length: 256, nullable: false })
  entityName: string;

  @Column({ type: 'int', nullable: true })
  version?: number;

  @Column({ type: 'varchar', length: 256, nullable: false })
  commitId: string;

  @Column({ type: 'varchar', length: 256, nullable: false })
  entityId: string;

  @Column({ type: 'varchar', length: 256, nullable: false })
  mspId: string;

  @Column({ type: 'simple-json', nullable: true })
  events: BaseEvent[];

  @Column({ type: 'varchar', nullable: true })
  hash?: string;

  @Column({ type: 'varchar', nullable: true })
  raw?: string;

  @Column({ type: 'varchar', nullable: true })
  signedRequest?: string;
}

