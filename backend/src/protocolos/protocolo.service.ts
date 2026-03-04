import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protocolo } from './protocolo.entity';

@Injectable()
export class ProtocoloService {
  constructor(
    @InjectRepository(Protocolo)
    private readonly protocoloRepo: Repository<Protocolo>,
  ) {}

  async create(data: Partial<Protocolo>) {
    const protocolo = this.protocoloRepo.create(data);
    return this.protocoloRepo.save(protocolo);
  }

  async update(id: string, data: Partial<Protocolo>) {
    await this.protocoloRepo.update(id, data);
    return this.protocoloRepo.findOne({ where: { id } });
  }

  async findByCliente(clienteId: string) {
    return this.protocoloRepo.find({ where: { clienteId } });
  }

  async findByAnalise(analiseId: string) {
    return this.protocoloRepo.find({ where: { analiseId } });
  }

  async remove(id: string) {
    return this.protocoloRepo.delete(id);
  }
}
