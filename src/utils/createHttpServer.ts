import http from 'http';
import util from 'util';
import terminus from '@godaddy/terminus';
import bodyParser from 'body-parser';
import express, { type Express, type Response, type Request } from 'express';
import helmet from 'helmet';
import { logger } from './logger';

export const createHttpServer: () => Promise<{ app: http.Server }> = async () => {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(helmet());
  app.use(helmet.xssFilter());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.referrerPolicy());
  app.use(helmet.noSniff());
  app.use(helmet.frameguard({ action: 'SAMEORIGIN' }));
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
        objectSrc: ['\'self\''],
        frameSrc: ['\'self\''],
        fontSrc: ['\'self\''],
        imgSrc: ['\'self\' data: https:; '],
      },
    })
  );

  const onHealthCheck = async () => {
    return Promise.resolve(true);
  };

  const onSignal = () =>
    new Promise<void>((resolve) => {
      logger.info('〽️  I am going to shut down');

      // TODO: do something

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
