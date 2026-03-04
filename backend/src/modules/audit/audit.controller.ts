import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('salonId') salonId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findPage(
      {
        salonId,
        userId,
        action,
      },
      Number(page ?? 1),
      Number(limit ?? 20),
    );
  }
}
