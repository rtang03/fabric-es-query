import { Router } from 'express';
import Status from 'http-status';
import { isNewCommitNotify } from '../utils';
import { EntityRepo } from './types';

export const createNewCommitHook = (repo: EntityRepo) => {
  const router = Router();

  router.post('/new_commit', async (req, res) => {
    const notify: unknown = req.body;

    if (isNewCommitNotify(notify)) {
      // todo
      await repo.upsert(null);
    }
  });

  router.get('/new_commit/healthz', (req, res) => {
    res.status(Status.OK).send({ status: 'ok' });
  });

  return router;
};
