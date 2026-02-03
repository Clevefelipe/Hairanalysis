import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./audit.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(params: {
    action: string;
    userId?: string;
    salonId?: string;
    metadata?: Record<string, any>;
  }) {
    const entry = this.repo.create({
      action: params.action,
      userId: params.userId,
      salonId: params.salonId,
      metadata: params.metadata,
    });

    await this.repo.save(entry);
  }

  async findAll(params: {
    salonId: string;
    action?: string;
    userId?: string;
    page: number;
    limit: number;
  }) {
    const qb = this.repo
      .createQueryBuilder("audit")
      .where("audit.salonId = :salonId", {
        salonId: params.salonId,
      });

    if (params.action) {
      qb.andWhere("audit.action = :action", {
        action: params.action,
      });
    }

    if (params.userId) {
      qb.andWhere("audit.userId = :userId", {
        userId: params.userId,
      });
    }

    const [items, total] = await qb
      .orderBy("audit.createdAt", "DESC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();

    return {
      page: params.page,
      limit: params.limit,
      total,
      items,
    };
  }
}
