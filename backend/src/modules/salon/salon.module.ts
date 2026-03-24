import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalonEntity } from './salon.entity';
import { SalonController } from './salon.controller';
import { SalonService } from './salon.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalonEntity])],
  controllers: [SalonController],
  providers: [SalonService],
  exports: [SalonService],
})
export class SalonModule {}
