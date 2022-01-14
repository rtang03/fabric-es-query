import Debug from 'debug';
import Status from 'http-status';
import winston from 'winston';
import type { Repository } from '../../types';
import { createRestRoute } from '../../utils';
import { MSG } from '../constants';

type RouterOption = {
  repo: Repository;
  logger: winston.Logger;
};

export const getCommitRoute = ({ repo, logger }: RouterOption) => {
  const NS = 'route:commit';

  return createRestRoute({
    GET: async (req) => {},
    GET_ALL: async (req) => {},
    POST: async (req) => {},
    /**
     * delete all commits by entityName and entityId. Mainly used for dev/test
     */
    DELETE: async (req, res) => {
      const entityName: string = req.body?.entityName;
      const entityId: string = req.body?.entityId;

      if (!entityName || !entityId)
        return res.status(Status.BAD_REQUEST).send({ error: MSG.NULL_ARGS });

      Debug(`${NS}:delete`)('entityName: %s, entityId: %s', entityName, entityId);

      const result = await repo.cmd_deleteByEntityId(entityName, entityId);

      result.status === 'ok'
        ? res.status(Status.OK).send(result)
        : res.status(Status.BAD_REQUEST).send(result);
    },
    PUT: async (_, res) =>
      res.status(Status.FORBIDDEN).send({ status: 'ERROR', error: MSG.NOT_SUPPORTED }),
  });
};
