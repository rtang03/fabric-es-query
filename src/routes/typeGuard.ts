import type { Repository } from '../types';

export const isCmdAppendParam = (input: any): input is Parameters<Repository['cmd_append']>[0] =>
  input?.entityName !== undefined && input?.id !== undefined && input?.events !== undefined;

export const isCmdCreateParam = (input: any): input is Parameters<Repository['cmd_create']>[0] =>
  input?.entityName !== undefined &&
  input?.id !== undefined &&
  input?.version !== undefined &&
  input?.events !== undefined;

export const isCmdDeleteByEntityIdParam = (
  input: any
): input is Parameters<Repository['cmd_deleteByEntityId']>[0] =>
  input?.entityName !== undefined && input?.id !== undefined;

export const isCmdDeleteByEntityIdCommitIdParam = (
  input: any
): input is Parameters<Repository['cmd_deleteByEntityIdCommitId']>[0] =>
  input?.entityName !== undefined && input?.id !== undefined && input?.commitId !== undefined;

export const isCmdGetByEntityNameParam = (
  input: any
): input is Parameters<Repository['cmd_getByEntityName']>[0] => input?.entityName !== undefined;

export const isCmdGetByEntityNameEntityIdParam = (
  input: any
): input is Parameters<Repository['cmd_getByEntityNameEntityId']>[0] =>
  input?.entityName !== undefined && input?.id !== undefined;

export const isCmdGetByEntityNameEntityIdCommitIdParam = (
  input: any
): input is Parameters<Repository['cmd_getByEntityNameEntityIdCommitId']>[0] =>
  input?.entityName !== undefined && input?.id !== undefined && input?.commitId !== undefined;

export const isQueryGetByEntNameParam = (
  input: any
): input is Parameters<Repository['query_getByEntityName']>[0] =>
  input?.entityName !== undefined;

export const isQueryGetByEntNameEntIdParam = (
  input: any
): input is Parameters<Repository['query_getByEntityNameEntityId']>[0] =>
  input?.entityName !== undefined && input?.entityId !== undefined;

export const isQueryGetByEntNameEntICommitIddParam = (
  input: any
): input is Parameters<Repository['query_getByEntityNameEntityIdCommitId']>[0] =>
  input?.entityName !== undefined && input?.entityId !== undefined && input?.commitId !== undefined;

export const isQueryCascadeDeleteParam = (
  input: any
): input is Parameters<Repository['query_cascadeDelete']>[0] =>
  input?.entityName !== undefined;
