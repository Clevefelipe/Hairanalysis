import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { VisionModule } from './modules/vision/vision-ia.module';
import { HistoryModule } from './modules/history/history.module';
import { SalonModule } from './modules/salon/salon.module';
import { AuditModule } from './modules/audit/audit.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ClientesModule } from './clientes/clientes.module';
import { ObservabilityModule } from './observability/observability.module';
import { ReportsModule } from './reports/reports.module';

// Entities (para migrations)
import { UserEntity } from './modules/auth/user.entity';
import { SalonEntity } from './modules/salon/salon.entity';
import { HistoryEntity } from './modules/history/history.entity';
import { KnowledgeDocument } from './modules/knowledge/knowledge-document.entity';
import { StraighteningEntity } from './modules/straightening/straightening.entity';
import { ReportEntity } from './reports/report.entity';
import { Cliente } from './clientes/entities/cliente.entity';
import { AuditLogEntity } from './modules/audit/audit-log.entity';

// Configuração validada de ambiente
import { env, getDatabaseConfig } from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: env.RATE_LIMIT_TTL,
        limit: env.RATE_LIMIT_LIMIT,
      },
    ]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: env.DATABASE_URL,
      ...getDatabaseConfig(),
      autoLoadEntities: true,
      entities: [
        UserEntity,
        SalonEntity,
        HistoryEntity,
        KnowledgeDocument,
        StraighteningEntity,
        Cliente,
        AuditLogEntity,
        ReportEntity,
      ],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: false,
      synchronize: env.NODE_ENV !== 'production',
      logging: env.NODE_ENV === 'development',
    }),

    AuthModule,
    SalonModule,
    HistoryModule,
    VisionModule,
    AuditModule,
    KnowledgeModule,
    ClientesModule,
    ObservabilityModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
