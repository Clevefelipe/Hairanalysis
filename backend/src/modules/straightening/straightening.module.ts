import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StraighteningController } from './straightening.controller';
import { StraighteningService } from './straightening.service';
import { StraighteningEntity } from './straightening.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StraighteningEntity])],
  controllers: [StraighteningController],
  providers: [StraighteningService],
  exports: [StraighteningService], // 🔑 usado pelo VisionModule
})
export class StraighteningModule {}
