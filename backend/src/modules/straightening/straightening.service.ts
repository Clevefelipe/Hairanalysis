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
