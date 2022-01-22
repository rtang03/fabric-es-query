import Debug from 'debug';
import { Router } from 'express';
import Status from 'http-status';
import winston from 'winston';
import type { Repository } from '../../types';
import { MSG } from '../constants';
import {
  isCmdAppendParam,
  isCmdCreateParam,
  isCmdDeleteByEntityIdCommitIdParam,
  isCmdDeleteByEntityIdParam,
  isCmdGetByEntityNameEntityIdCommitIdParam,
  isCmdGetByEntityNameEntityIdParam,
  isCmdGetByEntityNameParam,
  isQueryCascadeDeleteParam,
  isQueryGetByEntNameEntICommitIddParam,
  isQueryGetByEntNameEntIdParam,
  isQueryGetByEntNameParam,
} from '../typeGuard';

type CreateActionsRouteOption = {
  repo: Repository;
  logger: winston.Logger;
};

export const createActionsRoute: (option: CreateActionsRouteOption) => Router = ({ repo }) => {
  const router = Router();
  const NS = 'routes:actions';

  router.post(`/cmd_append`, async (req, res) => {
    const body: unknown = req.body;
    if (isCmdAppendParam(body)) return res.status(Status.OK).send(await repo.cmd_append(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/cmd_create`, async (req, res) => {
    const body: unknown = req.body;
    if (isCmdCreateParam(body)) return res.status(Status.OK).send(await repo.cmd_create(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/cmd_deleteByEntityId`, async (req, res) => {
    const body: unknown = req.body;
    if (isCmdDeleteByEntityIdParam(body))
      return res.status(Status.OK).send(await repo.cmd_deleteByEntityId(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/cmd_deleteByEntityIdCommitId`, async (req, res) => {
    const body: unknown = req.body;
    if (isCmdDeleteByEntityIdCommitIdParam(body))
      return res.status(Status.OK).send(await repo.cmd_deleteByEntityIdCommitId(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/cmd_getByEntityName`, async (req, res) => {
    const body: unknown = req.body;
    if (isCmdGetByEntityNameParam(body))
      return res.status(Status.OK).send(await repo.cmd_getByEntityName(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/cmd_getByEntityNameEntityId`, async (req, res) => {
    const body: unknown = req.body;
    if (isCmdGetByEntityNameEntityIdParam(body))
      return res.status(Status.OK).send(await repo.cmd_getByEntityNameEntityId(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/cmd_getByEntityNameEntityIdCommitId`, async (req, res) => {
    const body: unknown = req.body;
    if (isCmdGetByEntityNameEntityIdCommitIdParam(body))
      return res.status(Status.OK).send(await repo.cmd_getByEntityNameEntityIdCommitId(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/query_getByEntityName`, async (req, res) => {
    const body: unknown = req.body;
    if (isQueryGetByEntNameParam(body))
      return res.status(Status.OK).send(await repo.query_getByEntityName(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/query_getByEntityNameEntityId`, async (req, res) => {
    const body: unknown = req.body;
    if (isQueryGetByEntNameEntIdParam(body))
      return res.status(Status.OK).send(await repo.query_getByEntityNameEntityId(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/query_getByEntityNameEntityIdCommitId`, async (req, res) => {
    const body: unknown = req.body;
    if (isQueryGetByEntNameEntICommitIddParam(body))
      return res.status(Status.OK).send(await repo.query_getByEntityNameEntityIdCommitId(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  router.post(`/query_cascadeDelete`, async (req, res) => {
    const body: unknown = req.body;
    if (isQueryCascadeDeleteParam(body))
      return res.status(Status.OK).send(await repo.query_cascadeDelete(body));

    Debug(NS)('input args, %O', body);

    res.status(Status.BAD_REQUEST).send({ error: MSG.INVALID_ARGS });
  });

  return router;
};
