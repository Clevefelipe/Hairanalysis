import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { EmbeddingService } from './embedding/embedding.service';
import { KnowledgeDocument } from './knowledge-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeDocument])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, EmbeddingService],
  exports: [
    KnowledgeService, // ✅ OBRIGATÓRIO
  ],
})
export class KnowledgeModule {}
