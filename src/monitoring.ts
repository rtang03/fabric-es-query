import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import { Request, Response, NextFunction } from 'express';

const meter = new MeterProvider({
  exporter: new PrometheusExporter({ port: 9000 }),
  interval: 1000,
}).getMeter('my-meter');

const requestCount = meter.createCounter('visits', {
  description: 'Count all incoming requests',
  component: 'query-handler',
});

export const countAllRequests = () => (req: Request, res: Response, next: NextFunction) => {
  requestCount.add(1, {
    pid: `${process.pid}`,
    route: req.path,
    environment: 'dev',
  });

  next();
};
