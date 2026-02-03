import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HistoryEntity } from "./history.entity";

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryEntity)
    private readonly historyRepo: Repository<HistoryEntity>
  ) {}

  /**
   * ⚠️ MÉTODO JÁ EXISTENTE
   * Usado pelo VisionService
   * NÃO REMOVER
   */
  async save(data: Partial<HistoryEntity>) {
    const entity = this.historyRepo.create(data);
    return this.historyRepo.save(entity);
  }

  /**
   * ✅ NOVO MÉTODO
   * Dashboard agregado por salão
   */
  async dashboard(salonId: string) {
    const total = await this.historyRepo.count({
      where: { salonId },
    });

    const capilar = await this.historyRepo.count({
      where: { salonId, domain: "capilar" },
    });

    const tricologia = await this.historyRepo.count({
      where: { salonId, domain: "tricologia" },
    });

    const latest = await this.historyRepo.find({
      where: { salonId },
      order: { createdAt: "DESC" },
      take: 5,
    });

    return {
      total,
      capilar,
      tricologia,
      latest: latest.map((item) => ({
        id: item.id,
        domain: item.domain,
        createdAt: item.createdAt,
      })),
    };
  }
}
