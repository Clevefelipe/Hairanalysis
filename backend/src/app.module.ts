import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { SalonModule } from './modules/salon/salon.module';
import { HistoryModule } from './modules/history/history.module';
import { VisionModule } from './modules/vision/vision.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AuditModule } from './modules/audit/audit.module';
import { StraighteningModule } from './modules/straightening/straightening.module';
import { AppLogger } from './logger/app-logger.service';
import { ClientesModule } from './clientes/clientes.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProtocoloModule } from './protocolos/protocolo.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ API compatível com sua versão
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'hair_analysis',
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNC === 'true',
    }),

    AuditModule,
    AuthModule,
    SalonModule,
    HistoryModule,
    VisionModule,
    KnowledgeModule,
    StraighteningModule,
    ClientesModule,
    ReportsModule,
    DashboardModule,
    ProtocoloModule,
    ObservabilityModule,
  ],
  providers: [AppLogger],
})
export class AppModule {}
