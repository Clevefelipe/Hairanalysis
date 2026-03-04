import { Module } from '@nestjs/common';
import { AiAnalysisService } from './services/ai-analysis.service';

@Module({
  providers: [AiAnalysisService],
  exports: [AiAnalysisService],
})
export class AiModule {}
