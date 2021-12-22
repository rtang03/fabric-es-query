import {
  SpanKind,
  trace,
  context,
  Span,
  ROOT_CONTEXT,
  SpanStatusCode,
  propagation,
} from '@opentelemetry/api';
import fetch from 'isomorphic-unfetch';
import tracer from './tracing-client';

const makeRequest = () => {
  const span: Span = tracer.startSpan('client.makeRequest()', {
    kind: SpanKind.CLIENT,
  });

  void context.with(trace.setSpan(ROOT_CONTEXT, span), async () => {
    try {
      const res = await fetch('http://localhost:8080/run_test');

      console.log('status:', res.statusText);
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (e) {
      console.log('failed:', e.message);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
    }
    span.end();
    console.log('Sleeping 5 seconds before shutdown to ensure all records are flushed.');
    setTimeout(() => {
      console.log('Completed.');
    }, 5000);
  });
};

makeRequest();
