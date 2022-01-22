import http from 'http';
import terminus from '@godaddy/terminus';
import bodyParser from 'body-parser';
import express from 'express';
import helmet from 'helmet';
import { type ConnectionOptions } from 'typeorm';
import winston from 'winston';
import { createActionsRoute } from '../routes/actions';
import { type Platform } from '../types';

type CreateHttpServerOption = {
  platform: Platform;
  logger: winston.Logger;
};

export const createHttpServer: (
  option?: CreateHttpServerOption
) => Promise<{ app: http.Server }> = async ({ platform, logger }) => {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(helmet());
  app.use(helmet.xssFilter());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.referrerPolicy());
  app.use(helmet.noSniff());
  app.use(helmet.frameguard({ action: 'SAMEORIGIN' }));

  app.use('/actions', createActionsRoute({ repo: platform.getRepository(), logger }));

  const onHealthCheck = async () => {
    return Promise.resolve(true);
  };

  const onSignal = () =>
    new Promise<void>((resolve) => {
      logger.info('〽️  I am going to shut down');

      // TODO: do something
      // see this: https://github.com/rtang03/auth-server/blob/main/src/app.ts

      resolve();
    });

  // Required for k8s : given your readiness probes run every 5 second
  // may be worth using a bigger number, so you won't run into any race conditions
  const beforeShutdown = () =>
    new Promise((resolve) => {
      logger.info('cleanup finished, I am shutting down');
      setTimeout(resolve, 5000);
    });

  const _app = terminus.createTerminus(http.createServer(app), {
    timeout: 3000,
    logger: console.log,
    signals: ['SIGINT', 'SIGTERM'],
    healthChecks: {
      '/healthz': onHealthCheck,
    },
    onSignal,
    beforeShutdown,
  });

  return { app: _app };
};
