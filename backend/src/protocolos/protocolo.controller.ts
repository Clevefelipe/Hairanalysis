import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ProtocoloService } from './protocolo.service';
import { Protocolo } from './protocolo.entity';

@Controller('protocolos')
export class ProtocoloController {
  constructor(private readonly protocoloService: ProtocoloService) {}

  @Post()
  async create(@Body() data: Partial<Protocolo>) {
    return this.protocoloService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Protocolo>) {
    return this.protocoloService.update(id, data);
  }

  @Get('cliente/:clienteId')
  async findByCliente(@Param('clienteId') clienteId: string) {
    return this.protocoloService.findByCliente(clienteId);
  }

  @Get('analise/:analiseId')
  async findByAnalise(@Param('analiseId') analiseId: string) {
    return this.protocoloService.findByAnalise(analiseId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.protocoloService.remove(id);
  }
}
