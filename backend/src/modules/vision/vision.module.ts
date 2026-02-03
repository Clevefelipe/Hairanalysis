import { Module } from "@nestjs/common";
import { VisionController } from "./vision.controller";
import { VisionService } from "./vision.service";
import { VisionRagService } from "./vision-rag.service";
import { HistoryModule } from "../history/history.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";

@Module({
  imports: [
    HistoryModule,
    KnowledgeModule, // 🔑 NECESSÁRIO para VisionRagService
  ],
  controllers: [VisionController],
  providers: [VisionService, VisionRagService],
  exports: [VisionService],
})
export class VisionModule {}
