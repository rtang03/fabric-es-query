import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  @Column({ type: 'varchar', nullable: false })
  id: string;

  entityName: string;

  version?: number;

  commitId?: string;

  entityId?: string;

  mspId?: string;

  events?: BaseEvent[];

  hash?: string;

  raw?: string;

  signedRequest?: string;
}

// export type Commit = {
//   /** (same as entityId) **/
//   id: string;
//
//   /** entity name **/
//   entityName: string;
//
//   /** version number **/
//   version?: number;
//
//   /** commit Id **/
//   commitId?: string;
//
//   /** entity Id **/
//   entityId?: string;
//
//   /** organization Id **/
//   mspId?: string;
//
//   /** RESERVED FIELD: events array **/
//   events?: BaseEvent[];
//
//   /** RESERVED FIELD: hash of privatedata's events string **/
//   hash?: string;
//
//   /** RESERVED FIELD: stringified events **/
//   eventsString?: string;
//
//   /** RESERVED FIELD: signed request **/
//   signedRequest?: string;
// };
