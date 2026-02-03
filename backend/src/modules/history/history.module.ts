import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HistoryEntity } from "./history.entity";
import { HistoryService } from "./history.service";
import { HistoryController } from "./history.controller";
import { KnowledgeModule } from "../knowledge/knowledge.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryEntity]),
    KnowledgeModule,
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
