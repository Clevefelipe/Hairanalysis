import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ParseUUIDPipe } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { AdminGuard } from '../modules/auth/admin.guard';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Get()
  findAll(
    @Query('q') query?: string,
    @Query('scope') scope?: 'nome' | 'telefone' | 'cpf' | 'email' | 'codigo',
  ) {
    return this.clientesService.findAll(query, scope);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.clientesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.clientesService.remove(id);
  }
}
