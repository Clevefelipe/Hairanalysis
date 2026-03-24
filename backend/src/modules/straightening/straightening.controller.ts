import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StraighteningService } from './straightening.service';

@Controller('straightening')
@UseGuards(AuthGuard('jwt'))
export class StraighteningController {
  constructor(private readonly straighteningService: StraighteningService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const withInactive = includeInactive === 'true';
    return this.straighteningService.listWithFilter(
      req.user.salonId,
      withInactive,
    );
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.straighteningService.create(req.user.salonId, body);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.straighteningService.update(req.user.salonId, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.straighteningService.remove(req.user.salonId, id);
  }

  @Patch(':id/status')
  async setStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('active') active: boolean,
  ) {
    return this.straighteningService.setStatus(
      req.user.salonId,
      id,
      Boolean(active),
    );
  }
}
