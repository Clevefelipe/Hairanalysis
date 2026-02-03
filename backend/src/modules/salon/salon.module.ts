import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from './salon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Salon])],
  exports: [TypeOrmModule],
})
export class SalonModule {}
