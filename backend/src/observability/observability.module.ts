import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { HealthController } from './health.controller';

const METRIC_PROVIDERS = [
  makeCounterProvider({
    name: 'vision_uploads_total',
    help: 'Total de uploads/processamentos de visão por status e tipo',
    labelNames: ['status', 'analysis_type'],
  }),
  makeHistogramProvider({
    name: 'vision_upload_duration_seconds',
    help: 'Duração dos fluxos de visão em segundos',
    labelNames: ['result', 'analysis_type'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 30],
  }),
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total de requisições HTTP',
    labelNames: ['method', 'path', 'status'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
  }),
  makeCounterProvider({
    name: 'reports_created_total',
    help: 'Total de relatórios criados por status',
    labelNames: ['status'],
  }),
  makeCounterProvider({
    name: 'reports_failed_total',
    help: 'Total de falhas na geração de relatórios',
  }),
  makeHistogramProvider({
    name: 'reports_generation_duration_seconds',
    help: 'Duração da geração de relatórios em segundos',
    labelNames: ['result'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60],
  }),
  makeGaugeProvider({
    name: 'reports_backlog_total',
    help: 'Tamanho da fila de relatórios pendentes',
  }),
];

@Module({
  imports: [PrometheusModule.register()],
  controllers: [HealthController],
  providers: METRIC_PROVIDERS,
  exports: [PrometheusModule, ...METRIC_PROVIDERS],
})
export class ObservabilityModule {}
