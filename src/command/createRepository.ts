import winston from 'winston';
import type { EntityRepo, BaseEntity, BaseEvent } from './types';

export type Reducer<TEntity = any, TEvent = any> = (
  history: TEvent[],
  initial?: TEntity
) => TEntity;

export interface EntityType<TEntity extends BaseEntity> {
  new (...args: any[]): TEntity;
  parentName?: string;
  entityName: string;
}

/**
 * @about domain entity specific callback function used in reducer
 */
export type ReducerCallback<TEntity extends BaseEntity, TEvent extends BaseEvent> = (
  entity: TEntity,
  event: TEvent
) => TEntity;

export type CreateEntityRepOption = {
  logger: winston.Logger;
};

export const createRepository: <TEntity = any, TOutputEntity = any, TEvent = any>(
  entity: EntityType<TEntity>,
  callback: ReducerCallback<TEntity, TEvent>,
  option: CreateEntityRepOption
) => EntityRepo<TEntity> = (entity, callback, { logger }) => {
  return {
    upsert: async (payload) => {
      return null;
    },
  };
};
