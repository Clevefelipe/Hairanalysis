import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Cliente } from './entities/cliente.entity';
import { HistoryEntity } from '../modules/history/history.entity';
import { VisionTricologicaHistory } from '../modules/vision/vision-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      HistoryEntity,
      VisionTricologicaHistory,
    ]),
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
