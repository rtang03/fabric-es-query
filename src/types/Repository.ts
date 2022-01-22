import { type Commit } from '../fabric/services/Commit';
import { type PaginatedCommit } from './index';

export type FabricResponse = {
  status: string;
  message: string;
  result: any;
};

export type RepoResponse<TData = any> = {
  data?: TData;
  message?: string;
  error?: any;
  errors?: Error[];
  status: string;
};

export type AppendCommitPayload<TEvent> = {
  entityName: string;
  id: string;
  events: TEvent[];
};

export type CreateCommitPayload<TEvent> = {
  entityName: string;
  id: string;
  version: number;
  events: TEvent[];
};

export type DeleteByEntityIdPayload = {
  entityName: string;
  id: string;
};

export type DeleteByEntityIdCommitIdPayload = {
  entityName: string;
  id: string;
  commitId: string;
};

export type GetByEntityNamePayload = {
  entityName: string;
};

export type GetByEntityNameEntityIdPayload = {
  entityName: string;
  id: string;
};

export type GetByEntityNameEntityIdCommitIdPayload = {
  entityName: string;
  id: string;
  commitId: string;
};

export type QueryGetByEntityNameEntityIdPayload = {
  entityName: string;
  entityId: string;
  take?: number;
  skip?: number;
  orderBy?: 'commitId' | 'entityId';
  sort?: 'ASC' | 'DESC';
};

export type QueryGetByEntityNamePayload = {
  entityName: string;
  take?: number;
  skip?: number;
  orderBy?: 'commitId' | 'entityId';
  sort?: 'ASC' | 'DESC';
};

export type QueryGetByEntNameEntIdCommitIdPayload = {
  entityName: string;
  entityId: string;
  commitId: string;
  take?: number;
  skip?: number;
  orderBy?: 'commitId' | 'entityId';
  sort?: 'ASC' | 'DESC';
};

export type QueryCascadeDeletePayload = {
  entityName: string;
  entityId?: string;
};

export type Repository<TEvent = any> = {
  cmd_append: (
    payload: AppendCommitPayload<TEvent>,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit>>;
  cmd_create: (
    payload: CreateCommitPayload<TEvent>,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit>>;
  cmd_deleteByEntityId: (payload: DeleteByEntityIdPayload) => Promise<RepoResponse>;
  cmd_deleteByEntityIdCommitId: (
    payload: DeleteByEntityIdCommitIdPayload,
    isPrivateData?: boolean
  ) => Promise<RepoResponse>;
  cmd_getByEntityName: (
    payload: GetByEntityNamePayload,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit[]>>;
  cmd_getByEntityNameEntityId: (
    payload: GetByEntityNameEntityIdPayload,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit[]>>;
  cmd_getByEntityNameEntityIdCommitId: (
    payload: GetByEntityNameEntityIdCommitIdPayload,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit[]>>;
  query_getByEntityName: (
    payload: QueryGetByEntityNamePayload
  ) => Promise<RepoResponse<PaginatedCommit>>;
  query_getByEntityNameEntityId: (
    payload: QueryGetByEntityNameEntityIdPayload
  ) => Promise<RepoResponse<PaginatedCommit>>;
  query_getByEntityNameEntityIdCommitId: (
    payload: QueryGetByEntNameEntIdCommitIdPayload
  ) => Promise<RepoResponse<PaginatedCommit>>;
  query_cascadeDelete: (payload: QueryCascadeDeletePayload) => Promise<RepoResponse<number[]>>;
};
