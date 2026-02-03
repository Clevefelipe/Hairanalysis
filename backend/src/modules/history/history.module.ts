import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HistoryEntity } from "./history.entity";
import { HistoryService } from "./history.service";
import { HistoryController } from "./history.controller";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { AuthModule } from "../auth/auth.module";
import { HistoryPublicController } from "./history.public.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryEntity]),
    KnowledgeModule,
    AuthModule,
  ],
  controllers: [HistoryController, HistoryPublicController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
