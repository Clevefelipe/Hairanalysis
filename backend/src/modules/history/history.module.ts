import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HistoryEntity } from "./history.entity";
import { HistoryService } from "./history.service";
import { HistoryController } from "./history.controller";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { AuthModule } from "../auth/auth.module";
import { HistoryPublicController } from "./history.public.controller";
import { HistoryAiService } from "./services/history-ai.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryEntity]),
    KnowledgeModule,
    AuthModule,
  ],
  controllers: [HistoryController, HistoryPublicController],
  providers: [HistoryService, HistoryAiService],
  exports: [HistoryService, HistoryAiService],
})
export class HistoryModule {}
