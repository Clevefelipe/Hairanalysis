import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';
import { HistoryModule } from '../history/history.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { VisionRagService } from './vision-rag.service';
import { StraighteningModule } from '../straightening/straightening.module';
import { AiModule } from '../ai/ai.module';
import { UploadCleanerService } from './upload-cleaner.service';
import { ObservabilityModule } from '../../observability/observability.module';
import { VisionSession } from './vision-session.entity';
import { AnalysisEngineModule } from '../analysis-engine/analysis-engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VisionSession]),
    forwardRef(() => HistoryModule),
    KnowledgeModule,
    StraighteningModule,
    AiModule,
    ObservabilityModule,
    AnalysisEngineModule,
  ],
  controllers: [VisionController],
  providers: [VisionService, VisionRagService, UploadCleanerService],
  exports: [VisionRagService],
})
export class VisionModule {}
