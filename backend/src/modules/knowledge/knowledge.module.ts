import { Module } from "@nestjs/common";
import { KnowledgeService } from "./knowledge.service";
import { KnowledgeController } from "./knowledge.controller";
import { EmbeddingService } from "./embedding/embedding.service";

@Module({
  controllers: [KnowledgeController],
  providers: [
    KnowledgeService,
    EmbeddingService,
  ],
  exports: [
    KnowledgeService, // ✅ OBRIGATÓRIO
  ],
})
export class KnowledgeModule {}
