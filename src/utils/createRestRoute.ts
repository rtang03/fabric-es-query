import { Request, Response, Router } from 'express';
import Status from 'http-status';

type Action = {
  GET_ALL?: (req: Request, res: Response, skip: number, take: number) => Promise<any>;
  GET?: (req: Request, res: Response) => Promise<any>;
  POST?: (req: Request, res: Response) => Promise<any>;
  DELETE?: (req: Request, res: Response) => Promise<any>;
  PUT?: (req: Request, res: Response) => Promise<any>;
};

export const createRestRoute = ({ GET, GET_ALL, POST, DELETE, PUT }: Action) => {
  const router = Router();

  const catchErrors =
    (fn: (req: Request, res: Response) => Promise<void>) => async (req: Request, res: Response) => {
      try {
        await fn(req, res);
      } catch (error) {
        res.status(Status.BAD_REQUEST).send({ status: 'ERROR', message: error.message });
      }
    };

  router.get(
    '/',
    catchErrors(async (req, res) => {
      let skip = 0;
      let take = 10;

      try {
        const cursor = req.query?.cursor as string;
        const pagesize = req.query?.pagesize as string;
        skip = cursor ? parseInt(cursor, 10) : 0;
        take = pagesize ? parseInt(pagesize, 10) : 10;
      } catch {
        res
          .status(Status.BAD_REQUEST)
          .send({ status: 'ERROR', message: 'fail to parse cursor / pagesize' });
        return;
      }

      return GET_ALL(req, res, skip, take);
    })
  );

  router.get(
    '/:id',
    catchErrors(async (req, res) => GET(req, res))
  );

  router.post(
    '/',
    catchErrors(async (req, res) => POST(req, res))
  );

  router.delete(
    '/:id',
    catchErrors(async (req, res) => DELETE(req, res))
  );

  router.put(
    '/:id',
    catchErrors(async (req, res) => PUT(req, res))
  );

  router.all('/', (req, res) => {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'POST']);
    res.status(Status.METHOD_NOT_ALLOWED).end(`Method ${req.method} Not Allowed`);
  });

  return router;
};
