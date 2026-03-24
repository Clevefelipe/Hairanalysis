import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryEntity } from './history.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { HistoryPublicController } from './history.public.controller';
import { VisionModule } from '../vision/vision-ia.module';
import { HistoryAiService } from './services/history-ai.service';
import { SalonEntity } from '../salon/salon.entity';
import { UserEntity } from '../auth/user.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { NotificationReadEntity } from './entities/notification-read.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HistoryEntity,
      SalonEntity,
      UserEntity,
      Cliente,
      NotificationReadEntity,
    ]),
    forwardRef(() => VisionModule),
  ],
  controllers: [HistoryController, HistoryPublicController],
  providers: [HistoryService, HistoryAiService],
  exports: [HistoryService, HistoryAiService],
})
export class HistoryModule {}
