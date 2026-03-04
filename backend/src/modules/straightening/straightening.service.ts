import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StraighteningEntity } from "./straightening.entity";

export interface CreateStraighteningDTO {
  name: string;
  description?: string;
  criteria?: Record<string, any>;
}

@Injectable()
export class StraighteningService {
  constructor(
    @InjectRepository(StraighteningEntity)
    private readonly repo: Repository<StraighteningEntity>
  ) {}

  async list(salonId: string) {
    return this.repo.find({
      where: { salonId },
      order: { createdAt: "DESC" },
    });
  }

  async listWithFilter(salonId: string, onlyEnabled = true) {
    // Sem coluna de habilitado ainda; reutiliza list
    void onlyEnabled;
    return this.list(salonId);
  }

  async getPreset(_salonId: string) {
    // Placeholder: retorna pesos neutros
    return { weights: {} };
  }

  recommendFromAnalysis(
    services: Array<Record<string, any>>,
    baseResult: Record<string, any>,
    weights: Record<string, number>,
  ) {
    void weights;
    const items = (services || []).map((service) => ({
      ...service,
      score: Number(service?.score ?? 0),
      criteria: service?.criteria || {},
    }));
    return { items, baseResult, stats: null };
  }

  async create(salonId: string, payload: CreateStraighteningDTO) {
    const entity = this.repo.create({
      salonId,
      name: payload.name,
      description: payload.description,
      criteria: payload.criteria ?? {},
    });
    return this.repo.save(entity);
  }
}
