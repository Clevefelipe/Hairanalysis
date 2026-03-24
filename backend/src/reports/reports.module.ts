import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesModule } from '../clientes/clientes.module';
import { HistoryModule } from '../modules/history/history.module';
import { ObservabilityModule } from '../observability/observability.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsWorker } from './reports.worker';
import { ReportsHardeningWorker } from './reports.hardening.worker';
import {
  REPORTS_STORAGE_PROVIDER,
  LocalStorageProvider,
  S3StorageProvider,
} from './reports.storage';
import { ReportEntity } from './report.entity';
import { SalonEntity } from '../modules/salon/salon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity, SalonEntity]),
    ClientesModule,
    HistoryModule,
    ObservabilityModule,
  ],
  providers: [
    ReportsService,
    ReportsWorker,
    ReportsHardeningWorker,
    {
      provide: REPORTS_STORAGE_PROVIDER,
      useFactory: () => {
        const provider = process.env.REPORTS_STORAGE_PROVIDER?.toLowerCase();
        if (provider === 's3') return new S3StorageProvider();
        return new LocalStorageProvider();
      },
    },
  ],
  controllers: [ReportsController],
  exports: [ReportsService, ReportsWorker, ReportsHardeningWorker],
})
export class ReportsModule {}
