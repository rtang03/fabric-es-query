import Status from 'http-status';
import winston from 'winston';
import { FabricGateway, QueryDb } from '../../types';
import { createRestRoute } from '../../utils';

type RouterOption = {
  fabric: FabricGateway;
  queryDb: QueryDb;
  logger: winston.Logger;
};

const NOT_SUPPORTED = 'This method is not supported';

export const getCommitRoute = ({ fabric, queryDb, logger }: RouterOption) =>
  createRestRoute({
    GET: async (req) => {
    },
    GET_ALL: async (req) => {},
    POST: async (req) => {},
    DELETE: async (req) => {

    },
    PUT: async (_, res) => {
      logger.error(NOT_SUPPORTED);
      res.status(Status.FORBIDDEN).send({ status: 'ERROR', error: NOT_SUPPORTED });
    },
  });
