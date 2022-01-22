import api, { Counter, Meter, UpDownCounter, ObservableGauge } from '@opentelemetry/api-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics-base';
import winston from 'winston';

export type MetricServerOptions = {
  interval?: number;
  logger?: winston.Logger;
  exporterHost?: string;
  exporterPort?: number;
  exporterEndpoint?: string;
  exporterPrefix?: string;
  filterMeters?: string[];
};

export type Meters = {
  queryBlockCount: Counter;
  enrollCount: Counter;
  queryDbConnected: UpDownCounter;
  queryDbBlockHeight: ObservableGauge;
};

export const createMetricServer: (
  name: string,
  option: MetricServerOptions
) => {
  meters: Partial<Meters>;
  exporter: PrometheusExporter;
  meterProvider: MeterProvider;
} = (
  name,
  { interval, logger, exporterPort, exporterHost, exporterPrefix, exporterEndpoint, filterMeters }
) => {
  logger.info('=== Preparing metric server === ');

  const port = exporterPort || 9000;
  const host = exporterHost || 'localhost';
  const exporter = new PrometheusExporter(
    {
      port,
      host,
      prefix: exporterPrefix,
      endpoint: exporterEndpoint,
    },
    () => {
      logger.info(`🚀 start PrometheusExporter at ${host}:${port}`);
    }
  );

  const meterProvider = new MeterProvider({ exporter, interval: interval || 1000 });
  const meter: Meter = meterProvider.getMeter(name);

  const $counter = meter.createObservableCounter('simplecounter');
  $counter.observation(1, { label: 'x' });

  /**
   * Registering the provider with the API allows it to be discovered
   * and used by instrumentation libraries.
   */

  const allMeters = {
    enrollCount: meter.createCounter('enrollment', {
      description: 'Count number of enrolled',
      component: 'fabric-gateway',
    }),
    queryBlockCount: meter.createCounter('queryBlock', {
      description: 'Count number of queryBlock executed',
      component: 'fabric-gateway',
    }),
    queryDbConnected: meter.createUpDownCounter('queryDbConnected', {
      description: 'Count number of successful queryDb connected',
      component: 'querydb',
    }),
    queryDbBlockHeight: meter.createObservableGauge('queryDbBlockHeight', {
      description: 'Query max-block-height',
      component: 'querydb',
    }),
  };

  const filtered = {};
  filterMeters && filterMeters.forEach((m) => allMeters[m] && (filtered[m] = allMeters[m]));

  const meters = filterMeters ? filtered : allMeters;

  logger.info(`meters: ${Object.keys(meters).toString()}`);

  logger.info('=== metric server ok === ');
  return { meters, exporter, meterProvider };
};
