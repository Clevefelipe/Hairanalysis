import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { HistoryEntity } from '../modules/history/history.entity';
import { VisionTricologicaHistory } from '../modules/vision/vision-history.entity';

type ClienteSearchScope = 'nome' | 'telefone' | 'cpf' | 'email' | 'codigo';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repository: Repository<Cliente>,
    @InjectRepository(HistoryEntity)
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectRepository(VisionTricologicaHistory)
    private readonly visionHistoryRepository: Repository<VisionTricologicaHistory>,
  ) {}

  async create(dto: CreateClienteDto) {
    const payload: DeepPartial<Cliente> = {
      nome: dto.nome,
      telefone: dto.telefone || '',
      email: dto.email || undefined,
      cpf: dto.cpf || undefined,
      codigo: dto.codigo || undefined,
      dataNascimento: this.normalizeDateInput(dto.dataNascimento),
      observacoes: dto.observacoes || undefined,
    };

    return this.repository.save(this.repository.create(payload));
  }

  async findAll(query?: string, scope?: ClienteSearchScope) {
    try {
      const q = (query || '').trim().toLowerCase();
      const qb = this.repository
        .createQueryBuilder('cliente')
        .orderBy('cliente.createdAt', 'DESC');

      if (q) {
        const term = `%${q}%`;
        switch (scope) {
          case 'nome':
            qb.andWhere('LOWER(cliente.nome) LIKE :term', { term });
            break;
          case 'telefone':
            qb.andWhere("LOWER(COALESCE(cliente.telefone, '')) LIKE :term", {
              term,
            });
            break;
          case 'cpf':
            qb.andWhere("LOWER(COALESCE(cliente.cpf, '')) LIKE :term", {
              term,
            });
            break;
          case 'email':
            qb.andWhere("LOWER(COALESCE(cliente.email, '')) LIKE :term", {
              term,
            });
            break;
          case 'codigo':
            qb.andWhere(
              'LOWER(cliente.id) LIKE :term OR LOWER(COALESCE(cliente.codigo, "")) LIKE :term',
              { term },
            );
            break;
          default:
            qb.andWhere(
              `(
                LOWER(cliente.nome) LIKE :term
                OR LOWER(COALESCE(cliente.telefone, '')) LIKE :term
                OR LOWER(COALESCE(cliente.cpf, '')) LIKE :term
                OR LOWER(COALESCE(cliente.email, '')) LIKE :term
                OR LOWER(cliente.id) LIKE :term
                OR LOWER(COALESCE(cliente.codigo, '')) LIKE :term
              )`,
              { term },
            );
            break;
        }
      }

      return await qb.getMany();
    } catch {
      return [];
    }
  }

  async findOne(id: string) {
    const cliente = await this.repository.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return cliente;
  }

  async update(id: string, dto: UpdateClienteDto) {
    const cliente = await this.repository.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    cliente.nome = dto.nome ?? cliente.nome;
    cliente.telefone = dto.telefone ?? cliente.telefone;
    cliente.email = dto.email ?? cliente.email;
    cliente.cpf = dto.cpf ?? cliente.cpf;
    cliente.codigo = dto.codigo ?? cliente.codigo;
    cliente.dataNascimento = this.normalizeDateInput(
      dto.dataNascimento ?? cliente.dataNascimento,
    );
    cliente.observacoes = dto.observacoes ?? cliente.observacoes;

    return this.repository.save(cliente);
  }

  async remove(id: string) {
    const cliente = await this.repository.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.historyRepository.delete({ clientId: id });
    await this.visionHistoryRepository.delete({ clientId: id });
    await this.repository.delete(id);
  }

  private normalizeDateInput(value?: string | null): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    const slashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const compactPattern = /^(\d{2})(\d{2})(\d{4})$/;

    let year: string;
    let month: string;
    let day: string;

    if (isoPattern.test(trimmed)) {
      [year, month, day] = trimmed.split('-');
    } else if (slashPattern.test(trimmed)) {
      const match = slashPattern.exec(trimmed)!;
      [day, month, year] = [match[1], match[2], match[3]];
    } else if (compactPattern.test(trimmed)) {
      const match = compactPattern.exec(trimmed)!;
      [day, month, year] = [match[1], match[2], match[3]];
    } else {
      throw new BadRequestException(
        'dataNascimento deve estar no formato DD/MM/AAAA, DDMMYYYY ou AAAA-MM-DD',
      );
    }

    const normalized = `${year}-${month}-${day}`;
    const date = new Date(normalized + 'T00:00:00Z');
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() + 1 !== Number(month) ||
      date.getUTCDate() !== Number(day)
    ) {
      throw new BadRequestException('dataNascimento inválida');
    }

    return normalized;
  }
}
