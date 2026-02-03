import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./modules/auth/auth.module";
import { SalonModule } from "./modules/salon/salon.module";
import { HistoryModule } from "./modules/history/history.module";
import { VisionModule } from "./modules/vision/vision.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { AuditModule } from "./modules/audit/audit.module";

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
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "postgres",
      database: "hair_analysis",
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuditModule,
    AuthModule,
    SalonModule,
    HistoryModule,
    VisionModule,
    KnowledgeModule,
  ],
})
export class AppModule {}
