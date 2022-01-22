import { Connection } from 'typeorm';
import { EntityRepo } from '../../types';
import { Counter } from './entities/Counter';

type CreatePsqlRepoOption = {
  connection: Connection;
};

export const createPsqlRepo: (option: CreatePsqlRepoOption) => EntityRepo = ({ connection }) => {
  const repo = connection.getRepository(Counter);

  return {
    upsert: async () => {
      return null;
    },
  };
};
