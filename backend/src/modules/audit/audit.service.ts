import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  // ➕ REGISTRAR LOG
  async log(data: {
    action: string;
    userId?: string;
    salonId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const log = this.auditLogRepository.create(data);
      return await this.auditLogRepository.save(log);
    } catch {
      return null;
    }
  }

  // 📄 LISTAR LOGS (USADO PELO CONTROLLER)
  async findAll(filters: {
    salonId?: string;
    userId?: string;
    action?: string;
  }) {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.salonId) {
      query.andWhere('audit.salonId = :salonId', {
        salonId: filters.salonId,
      });
    }

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.action) {
      query.andWhere('audit.action = :action', {
        action: filters.action,
      });
    }

    return query.orderBy('audit.createdAt', 'DESC').getMany();
  }

  async findPage(
    filters: {
      salonId?: string;
      userId?: string;
      action?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.salonId) {
      query.andWhere('audit.salonId = :salonId', {
        salonId: filters.salonId,
      });
    }

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.action) {
      query.andWhere('audit.action = :action', {
        action: filters.action,
      });
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;

    const [items, total] = await query
      .orderBy('audit.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    return {
      page: safePage,
      limit: safeLimit,
      total,
      items,
    };
  }
}
