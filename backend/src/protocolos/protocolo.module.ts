import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Protocolo } from './protocolo.entity';
import { ProtocoloService } from './protocolo.service';
import { ProtocoloController } from './protocolo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Protocolo])],
  providers: [ProtocoloService],
  controllers: [ProtocoloController],
  exports: [ProtocoloService],
})
export class ProtocoloModule {}
