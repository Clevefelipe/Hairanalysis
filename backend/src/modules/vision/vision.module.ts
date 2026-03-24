import { Module } from '@nestjs/common';
import { VisionService } from './vision.service';
import { VisionController } from './vision.controller';
import { HistoryModule } from '../history/history.module';
import { ObservabilityModule } from '../../observability/observability.module';

@Module({
  imports: [HistoryModule, ObservabilityModule],
  controllers: [VisionController],
  providers: [VisionService],
})
export class VisionModule {}
