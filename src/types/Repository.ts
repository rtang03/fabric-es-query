import { type Commit } from '../fabric/services/Commit';

export type FabricResponse = {
  status: string;
  message: string;
  result: any;
};

export type HandlerResponse<TData = any> = {
  data?: TData;
  message?: string;
  error?: any;
  errors?: Error[];
  status: string;
};

type SaveFcn<TEvent> = (payload: {
  events: TEvent[];
  signedRequest?: string;
}) => Promise<HandlerResponse<Commit>>;

type RepoFcn<TResponse> = () => Promise<HandlerResponse<TResponse>>;

type RepoFcn_Id<TResponse> = (payload: { id: string }) => Promise<HandlerResponse<TResponse>>;

export type RepoFcn_IdCommitId<TResponse> = (payload: {
  id: string;
  commitId: string;
}) => Promise<HandlerResponse<TResponse>>;

export type Repository<TEntity = any, TOutputEntity = any, TEvent = any> = {
  command_deleteByEntityId: (payload: { id: string }) => Promise<HandlerResponse>;
};
