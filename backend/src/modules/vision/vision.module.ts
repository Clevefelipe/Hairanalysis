import { Module } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';
import { VisionPublicController } from './vision-public.controller';
import { HistoryModule } from '../history/history.module';
import { ObservabilityModule } from '../../observability/observability.module';

@Module({
  imports: [HistoryModule, ObservabilityModule],
  controllers: [VisionController, VisionPublicController],
  providers: [VisionService],
})
export class VisionModule {}
