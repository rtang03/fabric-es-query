require('dotenv').config();

import fs from 'fs';
import { context, ROOT_CONTEXT, Span, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import yaml from 'js-yaml';
import tracer from './tracer';
import { logger } from './utils';

const start = () => {
  const span: Span = tracer.startSpan('client.sync()', {
    kind: SpanKind.CLIENT,
  });

  void context.with(trace.setSpan(ROOT_CONTEXT, span), async () => {
    logger.info('===== sync start =====');

    // step 1: load config
    const file = fs.readFileSync(process.env.CONNECTION_PROFILE);
    const connectionProfile = yaml.load(file);
    console.log(connectionProfile);

    span.setStatus({ code: SpanStatusCode.OK });

    span.end();

    console.log('Sleeping 5 seconds before shutdown to ensure all records are flushed.');

    setTimeout(() => {
      logger.info('===== sync end =====');
    }, 5000);
  });
};

void start();
