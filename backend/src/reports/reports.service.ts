/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { REPORTS_STORAGE_PROVIDER } from './reports.storage';
import type { StorageProvider } from './reports.storage';
import { ReportPayload } from './report.types';
import { ReportEntity, ReportStatus } from './report.entity';
import { Repository } from 'typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly renderTimeoutMs = Math.max(
    5000,
    Number(process.env.REPORTS_RENDER_TIMEOUT_MS ?? 30000),
  );
  private readonly maxRetries = Math.max(
    0,
    Number(process.env.REPORTS_RENDER_RETRIES ?? 2),
  );

  constructor(
    @Inject(REPORTS_STORAGE_PROVIDER)
    private readonly storage: StorageProvider,
    @InjectRepository(ReportEntity)
    private readonly repo: Repository<ReportEntity>,
    @InjectMetric('reports_created_total')
    private readonly reportsCreated: Counter<string>,
    @InjectMetric('reports_failed_total')
    private readonly reportsFailed: Counter<string>,
    @InjectMetric('reports_generation_duration_seconds')
    private readonly reportsDuration: Histogram<string>,
    @InjectMetric('reports_backlog_total')
    private readonly reportsBacklog: Gauge<string>,
  ) {}

  async enqueue(analysisId: string): Promise<ReportEntity> {
    const entity = this.repo.create({
      id: uuidv4(),
      analysisId,
      status: 'pending' as ReportStatus,
    });
    const saved = await this.repo.save(entity);
    this.reportsCreated.inc({ status: 'pending' });
    await this.refreshBacklogGauge();
    return saved;
  }

  async getStatus(id: string): Promise<ReportEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async markReady(id: string, storageKey: string): Promise<void> {
    await this.repo.update(id, {
      status: 'ready',
      storageKey,
      finishedAt: new Date(),
    });
    await this.refreshBacklogGauge();
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.repo.update(id, {
      status: 'failed',
      error,
      finishedAt: new Date(),
    });
    await this.refreshBacklogGauge();
  }

  async generateAndStore(
    id: string,
    payload: ReportPayload,
    htmlRenderer: (payload: ReportPayload) => Promise<Buffer>,
  ): Promise<void> {
    const end = this.reportsDuration.startTimer();
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const buffer = await this.runWithTimeout(
          htmlRenderer(payload),
          this.renderTimeoutMs,
        );
        const version = new Date().toISOString().replace(/[:.]/g, '-');
        const storageKey = `${payload.salao?.nome || 'salao'}/${id}/${version}.pdf`;
        await this.storage.save(storageKey, buffer, 'application/pdf');
        await this.markReady(id, storageKey);
        this.reportsCreated.inc({ status: 'ready' });
        end({ result: 'success' });
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `Falha ao gerar PDF ${id} (tentativa ${attempt + 1}/${this.maxRetries + 1}): ${err}`,
        );
      }
    }

    this.logger.error(`Erro ao gerar PDF ${id}: ${lastError}`);
    await this.markFailed(
      id,
      lastError instanceof Error ? lastError.message : String(lastError),
    );
    this.reportsFailed.inc();
    end({ result: 'error' });
  }

  async getDownloadUrl(id: string): Promise<string | undefined> {
    const meta = await this.repo.findOne({ where: { id } });
    if (!meta || meta.status !== 'ready' || !meta.storageKey) return undefined;
    return this.storage.getSignedUrl(meta.storageKey);
  }

  private async refreshBacklogGauge(): Promise<void> {
    const pending = await this.repo.count({ where: { status: 'pending' } });
    this.reportsBacklog.set(pending);
  }

  private async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout ao gerar PDF após ${timeoutMs}ms`));
      }, timeoutMs);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}
