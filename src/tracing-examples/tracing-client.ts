// see https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/examples/express/tracer.js
import api, {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  SamplingDecision,
  SpanKind,
  trace,
  context,
} from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AlwaysOnSampler } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  SemanticAttributes,
  SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.VERBOSE);

const filterSampler = (filterFn, parent) => ({
  shouldSample: (ctx, tid, spanName, spanKind, attr, links) =>
    !filterFn(spanName, spanKind, attr)
      ? { decision: SamplingDecision.NOT_RECORD }
      : parent.shouldSample(ctx, tid, spanName, spanKind, attr, links),
  toString: () => `FilterSampler(${parent.toString()})`,
});

const ignoreHealthCheck = (spanName, spanKind, attributes) =>
  spanKind !== SpanKind.SERVER || attributes[SemanticAttributes.HTTP_ROUTE] !== '/health';

export const getTracer = (serviceName) => {
  const tracerProvider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    sampler: filterSampler(ignoreHealthCheck, new AlwaysOnSampler()),
  });

  // Configure span processor to send spans to the exporter
  tracerProvider.addSpanProcessor(
    new BatchSpanProcessor(
      new OTLPTraceExporter()
      // new JaegerExporter({
      //   endpoint: 'http://localhost:14268/api/traces',
      // })
    )
  );
  const propagator = new JaegerPropagator(); // 'uber-trace-id'

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  tracerProvider.register({ propagator });

  registerInstrumentations({
    tracerProvider,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  return trace.getTracer('express-example');
};

export const addTraceId = (req, res, next) => {
  const currentSpan = trace.getSpan(context.active());
  const spanContext = currentSpan.spanContext();

  req.traceId = spanContext && spanContext.traceId;
  next();
};

export default getTracer('my-app-client');
