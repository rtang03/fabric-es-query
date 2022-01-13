import { type Commit } from '../fabric/services/Commit';
import { PaginatedCommit } from './index';

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

export type CreateCommitPayload<TEvent> = {
  entityName: string;
  id: string;
  version: number;
  events: TEvent[];
};

export type AppendCommitPayload<TEvent> = {
  entityName: string;
  id: string;
  events: TEvent[];
};

export type Repository<TEntity = any, TOutputEntity = any, TEvent = any> = {
  cmd_append: (
    payload: AppendCommitPayload<TEvent>,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<any>>;
  cmd_create: (
    payload: CreateCommitPayload<TEvent>,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<any>>;
  cmd_deleteByEntityId: (entityName: string, id: string) => Promise<RepoResponse>;
  cmd_deleteByEntityIdCommitId: (
    entityName: string,
    id: string,
    commitId: string,
    isPrivateData?: boolean
  ) => Promise<RepoResponse>;
  cmd_getByEntityName: (
    entityName: string,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit[]>>;
  cmd_getByEntityNameEntityId: (
    entityName: string,
    id: string,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit[]>>;
  cmd_getByEntityNameEntityIdCommitId: (
    entityName: string,
    id: string,
    commitId: string,
    isPrivateData?: boolean
  ) => Promise<RepoResponse<Commit[]>>;
  query_getByEntityName: (payload: {
    entityName: string;
    take?: number;
    skip?: number;
    orderBy?: 'commitId' | 'entityId';
    sort?: 'ASC' | 'DESC';
  }) => Promise<RepoResponse<PaginatedCommit>>;
  query_getByEntityNameEntityId: (payload: {
    entityName: string;
    entityId: string;
    take?: number;
    skip?: number;
    orderBy?: 'commitId' | 'entityId';
    sort?: 'ASC' | 'DESC';
  }) => Promise<RepoResponse<PaginatedCommit>>;
  query_getByEntityNameEntityIdCommitId: (payload: {
    entityName: string;
    entityId: string;
    commitId: string;
    take?: number;
    skip?: number;
    orderBy?: 'commitId' | 'entityId';
    sort?: 'ASC' | 'DESC';
  }) => Promise<RepoResponse<PaginatedCommit>>;
  query_cascadeDelete: (entityName: string, entityId?: string) => Promise<RepoResponse<number[]>>;
};
