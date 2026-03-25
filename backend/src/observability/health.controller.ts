import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
// import { REPORTS_STORAGE_PROVIDER } from '../reports/reports.storage'; // Temporarily disabled
// import type { StorageProvider } from '../reports/reports.storage'; // Temporarily disabled

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    // @Optional()
    // @Inject(REPORTS_STORAGE_PROVIDER)
    // private readonly storage?: StorageProvider,
  ) {}

  @Get()
  async check() {
    return this.readiness();
  }

  // Alias /healthz
  @Get('/z')
  async healthz() {
    return this.readiness();
  }

  @Get('/readiness')
  async readiness() {
    const rssLimit =
      Number(process.env.HEALTH_RSS_LIMIT_MB || 1024) * 1024 * 1024;
    const heapLimit =
      Number(process.env.HEALTH_HEAP_LIMIT_MB || 512) * 1024 * 1024;

    const dbStatus = await this.checkDatabase();
    const memoryRss = process.memoryUsage().rss;
    const memoryHeap = process.memoryUsage().heapUsed;

    // const storageStatus = await this.checkStorage();

    return {
      status:
        dbStatus.status === 'up' &&
        memoryRss < rssLimit &&
        memoryHeap < heapLimit
        // && storageStatus.status !== 'down'
          ? 'ok'
          : 'degraded',
      checks: {
        database: dbStatus,
        // storage: storageStatus,
        memory_rss: {
          status: memoryRss < rssLimit ? 'up' : 'down',
          value: memoryRss,
          limit: rssLimit,
        },
        memory_heap: {
          status: memoryHeap < heapLimit ? 'up' : 'down',
          value: memoryHeap,
          limit: heapLimit,
        },
        app: {
          status: 'up',
          info: {
            uptime_seconds: process.uptime(),
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version,
          },
        },
      },
    };
  }

  @Get('/liveness')
  liveness() {
    return {
      status: 'ok',
      checks: {
        app: {
          status: 'up',
          info: {
            uptime_seconds: process.uptime(),
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version,
          },
        },
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    error?: string;
  }> {
    const timeout = Number(process.env.HEALTH_DB_TIMEOUT_MS || 300);
    try {
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout),
        ),
      ]);
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  // private async checkStorage(): Promise<{
//   status: 'up' | 'down' | 'unknown';
//   error?: string;
//   info?: Record<string, unknown>;
// }> {
//   if (!this.storage)
//     return {
//       status: 'unknown',
//       error: 'storage provider not configured in ObservabilityModule',
//     };
//   try {
//     const providerName = this.storage.constructor?.name ?? 'unknown';

//     if (typeof this.storage.getPath === 'function') {
//       const probePath = await this.storage.getPath('.health-check');
//       const dir = path.dirname(String(probePath));
//       await fs.mkdir(dir, { recursive: true });
//       await fs.access(dir);
//       return { status: 'up', info: { provider: providerName, dir } };
//     }

//     // Fallback para providers sem getPath (e.g. S3)
//     return { status: 'up', info: { provider: providerName } };
//   } catch (error) {
//     return { status: 'down', error: (error as Error).message };
//   }
// }
}
