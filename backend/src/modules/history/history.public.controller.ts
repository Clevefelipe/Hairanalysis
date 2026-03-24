import { Controller, Get, Param } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history/public')
export class HistoryPublicController {
  constructor(private readonly service: HistoryService) {}

  @Get(':token')
  getPublic(@Param('token') token: string) {
    return this.service.findByPublicToken(token);
  }
}
