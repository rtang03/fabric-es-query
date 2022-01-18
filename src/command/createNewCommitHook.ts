import { Router } from 'express';
import Status from 'http-status';
import { isNewCommitNotify } from '../utils';
import type { EntityRepo } from './EntityRepo';

export const createNewCommitHook = (repo: EntityRepo) => {
  const router = Router();

  router.post('/new_commit', async (req, res) => {
    const notify: unknown = req.body;

    if (isNewCommitNotify(notify)) {
      // todo
      await repo.upsert();
    }
  });

  router.get('/new_commit/healthz', (req, res) => {
    res.status(Status.OK).send({ status: 'ok' });
  });

  return router;
};
