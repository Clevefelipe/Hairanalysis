import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StraighteningEntity } from './straightening.entity';

type StraighteningPreset = {
  weights: {
    damage: number;
    porosity: number;
    elasticity: number;
  };
};

@Injectable()
export class StraighteningService {
  private readonly canonical = {
    hairTypes: ['Liso', 'Ondulado', 'Cacheado', 'Crespo', 'Afro'],
    structures: ['Fina', 'Média', 'Grossa'],
    volume: ['Baixo', 'Médio', 'Alto'],
    damageLevel: ['Leve', 'Moderado', 'Severo'],
  } as const;

  private normalizeCriteria(raw: any) {
    const normalizeList = (list: unknown, allowed: readonly string[]) => {
      if (!Array.isArray(list)) return [] as string[];
      return list
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .map((item) => {
          const found = allowed.find(
            (allowedItem) => allowedItem.toLowerCase() === item.toLowerCase(),
          );
          return found ?? item;
        })
        .filter((item) =>
          allowed.some((a) => a.toLowerCase() === item.toLowerCase()),
        );
    };

    if (!raw || typeof raw !== 'object') return {};

    const normalized: any = { ...raw };
    normalized.hairTypes = normalizeList(
      raw.hairTypes,
      this.canonical.hairTypes,
    );
    normalized.structures = normalizeList(
      raw.structures,
      this.canonical.structures,
    );
    normalized.volume = normalizeList(raw.volume, this.canonical.volume);
    normalized.damageLevel = normalizeList(
      raw.damageLevel,
      this.canonical.damageLevel,
    );

    const obs =
      typeof raw.observations === 'string'
        ? raw.observations.trim()
        : raw.observations;
    if (typeof obs === 'string') {
      normalized.observations = obs;
    }

    return normalized;
  }

  constructor(
    @InjectRepository(StraighteningEntity)
    private readonly repo: Repository<StraighteningEntity>,
  ) {}

  /* =====================================================
   * CRUD BÁSICO
   * ===================================================== */

  async findAll(salonId: string) {
    return this.repo.find({
      where: { salonId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(salonId: string, data: Partial<StraighteningEntity>) {
    const incomingCriteria: any = (data as any)?.criteria;
    const normalizedCriteria = this.normalizeCriteria(incomingCriteria);
    const damageLevels: string[] = Array.isArray(incomingCriteria?.damageLevel)
      ? incomingCriteria.damageLevel
      : [];

    const maxDamageTolerance = damageLevels.includes('Severo')
      ? 1
      : damageLevels.includes('Moderado')
        ? 0.7
        : damageLevels.includes('Leve')
          ? 0.4
          : undefined;

    const active =
      typeof (data as any)?.active === 'boolean'
        ? (data as any).active
        : typeof (data as any)?.isActive === 'boolean'
          ? (data as any).isActive
          : true;

    const entity = this.repo.create({
      ...data,
      salonId,
      active,
      maxDamageTolerance:
        typeof maxDamageTolerance === 'number'
          ? maxDamageTolerance
          : (data as any)?.maxDamageTolerance,
      criteria: normalizedCriteria,
    });
    return this.repo.save(entity);
  }

  async update(
    salonId: string,
    id: string,
    data: Partial<StraighteningEntity>,
  ) {
    const current = await this.repo.findOne({
      where: { id, salonId },
    });

    if (!current) {
      throw new NotFoundException('Alisamento não encontrado');
    }

    const incomingCriteria: any =
      (data as any)?.criteria !== undefined
        ? (data as any).criteria
        : current.criteria;
    const normalizedCriteria = this.normalizeCriteria(incomingCriteria);

    const damageLevels: string[] = Array.isArray(incomingCriteria?.damageLevel)
      ? incomingCriteria.damageLevel
      : [];

    const computedTolerance = damageLevels.includes('Severo')
      ? 1
      : damageLevels.includes('Moderado')
        ? 0.7
        : damageLevels.includes('Leve')
          ? 0.4
          : undefined;

    const active =
      typeof (data as any)?.active === 'boolean'
        ? (data as any).active
        : typeof (data as any)?.isActive === 'boolean'
          ? (data as any).isActive
          : current.active;

    const merged = this.repo.merge(current, {
      ...data,
      active,
      criteria: normalizedCriteria,
      maxDamageTolerance:
        typeof computedTolerance === 'number'
          ? computedTolerance
          : ((data as any)?.maxDamageTolerance ?? current.maxDamageTolerance),
    });

    return this.repo.save(merged);
  }

  async remove(salonId: string, id: string) {
    const current = await this.repo.findOne({
      where: { id, salonId },
    });

    if (!current) {
      throw new NotFoundException('Alisamento não encontrado');
    }

    await this.repo.remove(current);
    return { success: true };
  }

  async setStatus(salonId: string, id: string, active: boolean) {
    return this.update(salonId, id, { active } as Partial<StraighteningEntity>);
  }

  /* =====================================================
   * IA / RECOMENDAÇÃO
   * ===================================================== */

  /**
   * 🔹 Preset de pesos por salão
   * (futuramente customizável no painel)
   */
  async getPreset(_salonId: string): Promise<StraighteningPreset> {
    void _salonId;
    // 🔧 MVP: pesos padrão
    return {
      weights: {
        damage: 0.5,
        porosity: 0.3,
        elasticity: 0.2,
      },
    };
  }

  /**
   * 🔹 Lista serviços com filtros (ativos / inativos)
   */
  async listWithFilter(
    salonId: string,
    includeInactive = false,
  ): Promise<StraighteningEntity[]> {
    return this.repo.find({
      where: {
        salonId,
        ...(includeInactive ? {} : { active: true }),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 🔹 Recomendação baseada na análise capilar
   */
  recommendFromAnalysis(
    services: StraighteningEntity[],
    baseResult: any,
    weights: StraighteningPreset['weights'],
  ) {
    if (!services?.length) return { items: [], stats: null };

    const stats = {
      blockedHairType: 0,
      blockedStructure: 0,
      blockedVolume: 0,
      blockedDamageRange: 0,
      blockedDamageTolerance: 0,
      penalizedVolume: 0,
      penalizedDamageRange: 0,
      totalServices: services.length,
    };

    const scoreService = (service: StraighteningEntity) => {
      const criteria: any = service.criteria || {};
      const hairTypes = Array.isArray(criteria?.hairTypes)
        ? criteria.hairTypes
        : [];
      const structures = Array.isArray(criteria?.structures)
        ? criteria.structures
        : [];
      const volumes = Array.isArray(criteria?.volume) ? criteria.volume : [];
      const damageLevels = Array.isArray(criteria?.damageLevel)
        ? criteria.damageLevel
        : [];

      // Determina faixa de dano do resultado para cruzamento com critério
      const targetDamage =
        baseResult?.damageLevel >= 0.8
          ? 'Severo'
          : baseResult?.damageLevel >= 0.6
            ? 'Moderado'
            : 'Leve';

      // 🔒 Bloqueios imediatos para respeitar protocolo cadastrado
      if (hairTypes.length > 0 && baseResult?.hairType) {
        if (!hairTypes.includes(baseResult.hairType)) {
          stats.blockedHairType += 1;
          return null;
        }
      }

      if (structures.length > 0 && baseResult?.fiberStructure) {
        if (!structures.includes(baseResult.fiberStructure)) {
          stats.blockedStructure += 1;
          return null;
        }
      }

      if (volumes.length > 0 && baseResult?.volumeLevel) {
        if (!volumes.includes(baseResult.volumeLevel)) {
          stats.penalizedVolume += 1;
        }
      }

      if (damageLevels.length > 0 && targetDamage) {
        if (!damageLevels.includes(targetDamage)) {
          stats.penalizedDamageRange += 1;
        }
      }

      if (
        typeof baseResult?.damageLevel === 'number' &&
        typeof service?.maxDamageTolerance === 'number' &&
        baseResult.damageLevel > service.maxDamageTolerance
      ) {
        stats.blockedDamageTolerance += 1;
        return null;
      }

      // Se passou pelas restrições duras, aplica pontuação de afinidade
      let score = 0;

      if (baseResult?.hairType && hairTypes.length > 0) {
        score += 0.2;
      }
      if (baseResult?.fiberStructure && structures.length > 0) {
        score += 0.15;
      }
      if (baseResult?.volumeLevel && volumes.length > 0) {
        score += volumes.includes(baseResult.volumeLevel) ? 0.15 : -0.03;
      }
      if (targetDamage && damageLevels.length > 0) {
        score += damageLevels.includes(targetDamage) ? 0.2 : -0.05;
      }

      if (baseResult?.damageLevel !== undefined) {
        score += (service.maxDamageTolerance || 0) * weights.damage;
      }

      if (baseResult?.porosity !== undefined) {
        score += (service.porositySupport || 0) * weights.porosity;
      }

      if (baseResult?.elasticity !== undefined) {
        score += (service.elasticitySupport || 0) * weights.elasticity;
      }

      return Math.max(0, score);
    };

    const scored = services
      .map((service) => ({
        ...service,
        score: scoreService(service),
      }))
      .filter((service) => service.score !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3); // 🔝 Top 3 recomendações

    try {
      console.info('[STRAIGHTENING][recommendation] stats', {
        ...stats,
        returned: scored.length,
      });
    } catch {
      // logging best-effort
    }

    return { items: scored, stats: { ...stats, returned: scored.length } };
  }
}
