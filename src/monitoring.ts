import { MeterProvider, ConsoleMetricExporter } from '@opentelemetry/metrics';
import { Request, Response, NextFunction } from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const meter = new MeterProvider({
  exporter: new PrometheusExporter({ port: 9000 }) as any,
  interval: 1000,
}).getMeter('prometheus');

const requestCount = meter.createCounter('express_counter', {
  description: 'Count all incoming requests',
});

const boundInstruments = new Map();

export const countAllRequests = () => (req: Request, res: Response, next: NextFunction) => {
  if (!boundInstruments.has(req.path)) {
    const labels = { route: req.path };
    const boundCounter = requestCount.bind(labels);
    boundInstruments.set(req.path, boundCounter);
  }

  boundInstruments.get(req.path).add(1);
  next();
};
