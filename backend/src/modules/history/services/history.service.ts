import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HistoryEntity } from '../history.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryEntity)
    private readonly repository: Repository<HistoryEntity>,
  ) {}

  async save(data: Partial<HistoryEntity>) {
    const history = this.repository.create(data);
    return this.repository.save(history);
  }

  async getDashboard() {
    const total = await this.repository.count();
    return { totalAnalyses: total };
  }

  async listByClient(clientId: string) {
    return this.repository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const history = await this.repository.findOne({ where: { id } });
    if (!history) {
      throw new NotFoundException('Histórico não encontrado');
    }
    return history;
  }

  async compare(ids: string[]) {
    return this.repository.find({
      where: { id: In(ids) },
    });
  }

  async getRecommendations(id: string) {
    const history = await this.findById(id);
    return history.recommendations;
  }

  async generatePublicToken(id: string) {
    const history = await this.findById(id);
    history.publicToken = randomUUID();
    await this.repository.save(history);
    return { token: history.publicToken };
  }

  async findByPublicToken(token: string) {
    const history = await this.repository.findOne({
      where: { publicToken: token },
    });
    if (!history) {
      throw new NotFoundException('Link público inválido');
    }
    return history;
  }
}
