import { Router } from 'express';
import Status from 'http-status';

type PostAction = {
  action: string;
};

const PostActions: PostAction[] = [{ action: 'cmd_create' }];

export const actions = () => {
  const router = Router();

  PostActions.map(({ action }) => {
    router.post(action, (req, res) => {
      const result = '';

      res.status(Status.OK).send(result);
    });
  });
};
