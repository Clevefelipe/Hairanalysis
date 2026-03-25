import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HistoryEntity } from './history.entity';
import { NotificationReadEntity } from './entities/notification-read.entity';
import { SalonEntity } from '../salon/salon.entity';
import { UserEntity } from '../auth/user.entity';
import { randomUUID } from 'crypto';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { parseJsonField } from '../../utils/json-helpers';

type DashboardHistory = {
  id: string;
  clientId: string;
  professionalId?: string;
  clientName?: string;
  createdAt: string;
  analysisType: 'capilar' | 'tricologica' | 'geral';
  score?: number;
  flags: string[];
  interpretation: string;
  aiExplanation?: any;
  recommendations?: any;
  chemicalProfile?: any;
};

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryEntity)
    private readonly repository: Repository<HistoryEntity>,
    @InjectRepository(SalonEntity)
    private readonly salonRepository: Repository<SalonEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(NotificationReadEntity)
    private readonly notificationReadRepo: Repository<NotificationReadEntity>,
  ) {}

  async save(data: Partial<HistoryEntity>) {
    const history = this.repository.create(data);
    return this.repository.save(history);
  }

  async getDashboard(
    salonId: string,
    filters?: {
      period?: '7d' | '30d' | '90d';
      professionalId?: string;
      userId?: string;
    },
  ) {
    let histories: HistoryEntity[] = [];
    try {
      histories = await this.repository.find({
        where: { salonId },
        order: { createdAt: 'DESC' },
      });
    } catch {
      histories = [];
    }

    const clientNameMap = await this.buildClientNameMap(
      histories.map((item) => item.clientId),
    );

    const normalized = histories
      .filter((item) => clientNameMap.has(item.clientId))
      .map((item) => this.normalizeHistory(item, clientNameMap));

    const periodDays =
      filters?.period === '30d' ? 30 : filters?.period === '90d' ? 90 : 7;
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    const filtered = normalized.filter((item) => {
      const createdAt = new Date(item.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      if (createdAt < periodStart) return false;
      if (
        filters?.professionalId &&
        item.professionalId !== filters.professionalId
      ) {
        return false;
      }
      return true;
    });

    const total = filtered.length;
    const flagged = filtered.filter((item) => (item.flags?.length ?? 0) > 0);
    const safeAnalyses = total - flagged.length;

    const avgScore = total
      ? Math.round(
          filtered.reduce((sum, item) => sum + (item.score ?? 0), 0) / total,
        )
      : 0;

    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const todayCount = filtered.filter(
      (item) => new Date(item.createdAt).toDateString() === todayStr,
    ).length;
    const yesterdayCount = filtered.filter(
      (item) => new Date(item.createdAt).toDateString() === yesterdayStr,
    ).length;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const currentWeekData = filtered.filter(
      (item) => new Date(item.createdAt) >= sevenDaysAgo,
    );
    const previousWeekData = filtered.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
    });

    const computeAverage = (items: DashboardHistory[]) =>
      items.length
        ? Math.round(
            items.reduce((sum, item) => sum + (item.score ?? 0), 0) /
              items.length,
          )
        : 0;

    const currentWeekScoreAvg = computeAverage(currentWeekData);
    const previousWeekScoreAvg = computeAverage(previousWeekData);

    const buildTypeCount = (
      items: DashboardHistory[],
      type: 'capilar' | 'tricologica',
    ) => items.filter((item) => item.analysisType === type).length;

    const currentWeekAlerts = currentWeekData.filter(
      (item) => (item.flags?.length ?? 0) > 0,
    );
    const previousWeekAlerts = previousWeekData.filter(
      (item) => (item.flags?.length ?? 0) > 0,
    );

    const nextVisits = filtered
      .map((item) => {
        const interval =
          item.recommendations?.maintenanceIntervalDays ??
          item.recommendations?.nextVisitDays;
        if (!interval || typeof interval !== 'number') {
          return null;
        }

        const nextDate = new Date(item.createdAt);
        nextDate.setDate(nextDate.getDate() + interval);

        return {
          id: item.id,
          clientId: item.clientId,
          clientName: item.clientName,
          analysisType: item.analysisType,
          interval,
          nextDate: nextDate.toISOString(),
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(a!.nextDate).getTime() - new Date(b!.nextDate).getTime(),
      ) as {
      id: string;
      clientId: string;
      clientName?: string;
      analysisType: 'capilar' | 'tricologica' | 'geral';
      interval: number;
      nextDate: string;
    }[];

    const next7d = nextVisits.filter((visit) => {
      const diff = new Date(visit.nextDate).getTime() - now.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000 && diff >= 0;
    }).length;

    const alertsByType = this.buildAlertsByType(flagged);

    return {
      items: filtered,
      alerts: flagged,
      nextVisits,
      metrics: {
        totalAnalyses: total,
        safeAnalyses,
        flaggedAnalyses: flagged.length,
        avgScore,
        today: {
          count: todayCount,
          delta: todayCount - yesterdayCount,
          yesterday: yesterdayCount,
        },
        score: {
          currentWeekAvg: currentWeekScoreAvg,
          previousWeekAvg: previousWeekScoreAvg,
        },
        upcoming: {
          next7d,
        },
        alertsByType,
        week: {
          current: {
            total: currentWeekData.length,
            capilar: buildTypeCount(currentWeekData, 'capilar'),
            tricologica: buildTypeCount(currentWeekData, 'tricologica'),
            alerts: currentWeekAlerts.length,
          },
          previous: {
            total: previousWeekData.length,
            capilar: buildTypeCount(previousWeekData, 'capilar'),
            tricologica: buildTypeCount(previousWeekData, 'tricologica'),
            alerts: previousWeekAlerts.length,
          },
        },
      },
    };
  }

  async listByClient(salonId: string, clientId: string) {
    const items = await this.repository.find({
      where: { salonId, clientId },
      order: { createdAt: 'DESC' },
    });
    const clientNameMap = await this.buildClientNameMap([clientId]);
    return items.map((item) => this.attachClientName(item, clientNameMap));
  }

  async listAlerts(salonId: string, limit = 20) {
    let histories: HistoryEntity[] = [];
    try {
      histories = await this.repository.find({
        where: { salonId },
        order: { createdAt: 'DESC' },
      });
    } catch {
      histories = [];
    }

    const clientNameMap = await this.buildClientNameMap(
      histories.map((item) => item.clientId),
    );
    const normalized = histories.map((item) =>
      this.normalizeHistory(item, clientNameMap),
    );

    return normalized
      .filter((item) => {
        const hasFlags = (item.flags?.length ?? 0) > 0;
        const hasProfessionalAlert = Boolean(
          item.recommendations?.professionalAlert,
        );
        return hasFlags || hasProfessionalAlert;
      })
      .slice(0, limit);
  }

  async listUpcomingVisits(
    salonId: string,
    rangeDays = 30,
  ): Promise<
    Array<{
      id: string;
      clientId: string;
      clientName?: string;
      analysisType: 'capilar' | 'tricologica';
      interval: number;
      nextDate: Date;
    }>
  > {
    let histories: HistoryEntity[] = [];
    try {
      histories = await this.repository.find({
        where: { salonId },
        order: { createdAt: 'DESC' },
      });
    } catch {
      histories = [];
    }

    const clientNameMap = await this.buildClientNameMap(
      histories.map((item) => item.clientId),
    );
    const normalized = histories.map((item) =>
      this.normalizeHistory(item, clientNameMap),
    );
    const now = new Date();
    const futureLimit = new Date(now);
    futureLimit.setDate(futureLimit.getDate() + Math.max(rangeDays, 1));

    return normalized
      .map((item) => {
        const interval =
          item.recommendations?.maintenanceIntervalDays ??
          item.recommendations?.nextVisitDays;

        if (!interval || typeof interval !== 'number') {
          return null;
        }

        const nextDate = new Date(item.createdAt);
        nextDate.setDate(nextDate.getDate() + interval);

        return {
          id: item.id,
          clientId: item.clientId,
          clientName: item.clientName || undefined,
          analysisType: item.analysisType,
          interval,
          nextDate,
        };
      })
      .filter(
        (
          visit,
        ): visit is {
          id: string;
          clientId: string;
          clientName: string | undefined;
          analysisType: 'capilar' | 'tricologica';
          interval: number;
          nextDate: Date;
        } => {
          if (!visit) return false;
          return visit.nextDate >= now && visit.nextDate <= futureLimit;
        },
      )
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }

  async listNotifications(salonId: string, limit = 10) {
    try {
      const alerts = await this.listAlerts(salonId, limit);
      const visits = await this.listUpcomingVisits(salonId, 14);

      const notifications = [
        ...alerts.map((alert) => ({
          id: `alert-${alert.id}`,
          type: 'alert' as const,
          title: `${alert.clientName || 'Cliente'}: ${
            alert.flags?.join(', ') || 'Revisar análise com risco'
          }`,
          createdAt: alert.createdAt,
          relatedId: alert.id,
          clientId: alert.clientId,
          clientName: alert.clientName,
          analysisType: alert.analysisType,
        })),
        ...visits.map((visit) => ({
          id: `visit-${visit.id}`,
          type: 'visit' as const,
          title: `${visit.clientName || 'Cliente'}: retorno recomendado em ${
            visit.interval
          } dias`,
          createdAt: visit.nextDate.toISOString(),
          relatedId: visit.id,
          clientId: visit.clientId,
          clientName: visit.clientName,
          analysisType: visit.analysisType,
        })),
      ]
        .sort((a, b) => this.safeTime(b.createdAt) - this.safeTime(a.createdAt))
        .slice(0, limit);

      return notifications;
    } catch {
      return [];
    }
  }

  async listReadNotificationIds(userId: string): Promise<string[]> {
    const rows = await this.notificationReadRepo.find({
      select: ['notificationId'],
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 500,
    });
    return rows.map((row) => row.notificationId);
  }

  async markNotificationsAsRead(
    userId: string,
    salonId: string,
    notificationIds: string[],
  ) {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return { updated: 0 };
    }

    const uniqueIds = Array.from(new Set(notificationIds.map(String).filter(Boolean)));
    if (uniqueIds.length === 0) {
      return { updated: 0 };
    }

    const rows = uniqueIds.map((id) =>
      this.notificationReadRepo.create({
        notificationId: id,
        userId,
        salonId,
      }),
    );

    try {
      await this.notificationReadRepo
        .createQueryBuilder()
        .insert()
        .into(NotificationReadEntity)
        .values(rows)
        .orIgnore()
        .execute();
      return { updated: uniqueIds.length };
    } catch {
      return { updated: 0 };
    }
  }

  async listNotificationsForUser(
    salonId: string,
    userId: string,
    limit = 10,
  ) {
    const [notifications, readIds] = await Promise.all([
      this.listNotifications(salonId, limit * 2),
      this.listReadNotificationIds(userId),
    ]);

    const readSet = new Set(readIds);
    const filtered = notifications.filter((n) => !readSet.has(n.id)).slice(0, limit);

    return {
      notifications: filtered,
      readIds,
    };
  }

  async findById(id: string) {
    const history = await this.repository.findOne({
      where: { id },
    });

    if (!history) {
      throw new NotFoundException('Histórico não encontrado');
    }

    const clientNameMap = await this.buildClientNameMap([history.clientId]);
    return this.attachClientName(history, clientNameMap);
  }

  async compare(ids: string[]) {
    const items = await this.repository.find({
      where: { id: In(ids) },
    });
    const clientNameMap = await this.buildClientNameMap(
      items.map((item) => item.clientId),
    );
    return items.map((item) => this.attachClientName(item, clientNameMap));
  }

  async compareBySalonIds(salonId: string, ids: string[]) {
    const items = await this.repository.find({
      where: { id: In(ids), salonId },
      order: { createdAt: 'DESC' },
    });
    const clientNameMap = await this.buildClientNameMap(
      items.map((item) => item.clientId),
    );
    return items.map((item) => this.attachClientName(item, clientNameMap));
  }

  async getRecommendations(id: string) {
    const history = await this.findById(id);
    return {
      recommendations: history.recommendations,
      chemicalProfile: history.chemicalProfile || null,
    };
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

    const clientNameMap = await this.buildClientNameMap([history.clientId]);
    return this.attachClientName(history, clientNameMap);
  }

  async updateNextVisit(
    salonId: string,
    id: string,
    payload: {
      action: 'confirm' | 'reschedule';
      nextDate?: string;
      notes?: string;
    },
  ) {
    const history = await this.findById(id);
    if (history.salonId !== salonId) {
      throw new NotFoundException('Histórico não encontrado neste salão');
    }

    const recommendations = parseJsonField(history.recommendations);

    if (payload.action === 'confirm') {
      recommendations.nextVisitConfirmedAt = new Date().toISOString();
      if (payload.notes) {
        recommendations.nextVisitNotes = payload.notes;
      }
    } else if (payload.action === 'reschedule') {
      if (!payload.nextDate) {
        throw new BadRequestException('nextDate é obrigatório para remarcar');
      }
      const parsedDate = new Date(payload.nextDate);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new BadRequestException('Data inválida para remarcação');
      }
      recommendations.nextVisitCustomDate = parsedDate.toISOString();
      recommendations.nextVisitConfirmedAt = null;
    }

    await this.repository.update(id, { recommendations });
    const clientNameMap = await this.buildClientNameMap([history.clientId]);
    return this.normalizeHistory(
      {
        ...history,
        recommendations,
      } as HistoryEntity,
      clientNameMap,
    );
  }

  private buildAlertsByType(items: DashboardHistory[]) {
    const bucket: Record<string, number> = {};
    const categorize = (flag: string) => {
      const lower = flag.toLowerCase();
      if (lower.includes('quim')) return 'chemical';
      if (lower.includes('mec')) return 'mechanical';
      if (lower.includes('term')) return 'thermal';
      return 'other';
    };

    items.forEach((item) => {
      (item.flags || []).forEach((flag) => {
        const key = categorize(flag);
        bucket[key] = (bucket[key] || 0) + 1;
      });
    });

    return bucket;
  }

  private normalizeHistory(
    item: HistoryEntity,
    clientNameMap?: Map<string, string>,
  ): DashboardHistory {
    const vision = this.normalizeVisionResultForDisplay(
      parseJsonField(item?.visionResult),
    );
    const analysisType = this.resolveDisplayAnalysisType(
      vision,
      item?.recommendations,
    );
    const recommendationsData = parseJsonField(item?.recommendations);
    const normalizedRecommendations = this.normalizeRecommendationsForDisplay(
      analysisType === 'capilar'
        ? { ...recommendationsData, scalpTreatments: [] }
        : analysisType === 'tricologica'
          ? {
              ...recommendationsData,
              treatments: [],
              homeCare: [],
              treatmentProtocol: undefined,
              neutralization: undefined,
            }
          : recommendationsData,
    );
    normalizedRecommendations.professionalAlert =
      this.filterProfessionalAlertByMode(
        normalizedRecommendations?.professionalAlert,
        analysisType,
      );
    normalizedRecommendations.flags = this.filterFlagsByMode(
      this.humanizeLabelList(normalizedRecommendations?.flags),
      analysisType,
    );
    if (Array.isArray(normalizedRecommendations?.riskFactors)) {
      normalizedRecommendations.riskFactors = this.filterRiskFactorsByMode(
        this.humanizeLabelList(normalizedRecommendations.riskFactors),
        analysisType,
      );
    }
    const normalizedAiExplanation =
      this.normalizeAiExplanationForDisplay(parseJsonField(item?.aiExplanation)) || {};
    normalizedAiExplanation.professionalAlert =
      this.filterProfessionalAlertByMode(
        normalizedAiExplanation?.professionalAlert,
        analysisType,
      );
    if (typeof normalizedAiExplanation?.riskFactors === 'undefined') {
      normalizedAiExplanation.riskFactors = this.filterFlagsByMode(
        this.humanizeLabelList(vision?.flags),
        analysisType,
      );
    }
    const normalizedFlags = this.filterFlagsByMode(
      this.humanizeLabelList(vision?.flags),
      analysisType,
    );
    const normalizedAiFlags = this.filterFlagsByMode(
      this.humanizeLabelList(normalizedAiExplanation?.flags),
      analysisType,
    );
    const modeGovernedRecommendations = this.enforceModeGovernance(
      normalizedRecommendations,
      analysisType === 'tricologica' ? 'tricologica' : 'capilar',
    );
    if (analysisType === 'capilar') {
      modeGovernedRecommendations.scalpTreatments = [];
      modeGovernedRecommendations.professionalAlert =
        this.filterProfessionalAlertByMode(
          modeGovernedRecommendations?.professionalAlert,
          analysisType,
        );
    }

    const score = this.normalizeScore(
      typeof vision?.score === 'undefined'
        ? recommendationsData?.score
        : vision?.score,
    );
    const flags = this.filterFlagsByMode(
      this.humanizeLabelList(vision?.flags),
      analysisType,
    );

    const premiumSummary =
      typeof normalizedAiExplanation?.summary === 'string'
        ? normalizedAiExplanation.summary
        : undefined;
    const interpretation =
      premiumSummary ||
      this.humanizeInlineTokens(
        typeof vision?.interpretation === 'string' ? vision.interpretation : '',
      );

    return {
      id: item.id,
      clientId: item.clientId,
      clientName:
        clientNameMap?.get(item.clientId) ||
        (item as any).clientName ||
        undefined,
      createdAt: this.safeDateIso(item.createdAt),
      analysisType,
      score,
      flags,
      interpretation,
      aiExplanation: normalizedAiExplanation,
      recommendations: this.ensureRecommendationScore(
        modeGovernedRecommendations,
        score,
      ),
      chemicalProfile: item?.chemicalProfile || null,
    };
  }

  private async buildClientNameMap(
    clientIds: string[],
  ): Promise<Map<string, string>> {
    const isValidUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      );

    const uniqueIds = Array.from(
      new Set(
        (clientIds || [])
          .map((item) => String(item || '').trim())
          .filter((id) => id && isValidUuid(id)),
      ),
    );

    if (!uniqueIds.length) {
      return new Map<string, string>();
    }

    try {
      const clientes = await this.clienteRepository.find({
        where: { id: In(uniqueIds) },
      });
      const entries: Array<[string, string]> = clientes
        .map((cliente): [string, string] => [
          cliente.id,
          this.humanizeInlineTokens(String(cliente.nome || '').trim()),
        ])
        .filter((entry): entry is [string, string] => Boolean(entry[1]));

      return new Map<string, string>(entries);
    } catch {
      return new Map<string, string>();
    }
  }

  private attachClientName(
    history: HistoryEntity,
    clientNameMap: Map<string, string>,
  ) {
    const clientName = clientNameMap.get(history.clientId);
    const normalizedVisionResult = this.normalizeVisionResultForDisplay(
      parseJsonField(history.visionResult),
    );
    const normalizedAiExplanation = this.normalizeAiExplanationForDisplay(
      parseJsonField(history.aiExplanation),
    );
    const analysisType = this.resolveDisplayAnalysisType(
      normalizedVisionResult,
      history.recommendations,
    );
    const recommendationsData = parseJsonField(history.recommendations);
    const normalizedRecommendations = this.normalizeRecommendationsForDisplay(
      analysisType === 'capilar'
        ? { ...recommendationsData, scalpTreatments: [] }
        : recommendationsData,
    );
    normalizedRecommendations.professionalAlert =
      this.filterProfessionalAlertByMode(
        normalizedRecommendations?.professionalAlert,
        analysisType,
      );
    normalizedRecommendations.flags = this.filterFlagsByMode(
      this.humanizeLabelList(normalizedRecommendations?.flags),
      analysisType,
    );
    if (Array.isArray(normalizedRecommendations?.riskFactors)) {
      normalizedRecommendations.riskFactors = this.filterRiskFactorsByMode(
        this.humanizeLabelList(normalizedRecommendations.riskFactors),
        analysisType,
      );
    }
    const modeGovernedRecommendations = this.enforceModeGovernance(
      normalizedRecommendations,
      analysisType === 'tricologica' ? 'tricologica' : 'capilar',
    );
    if (analysisType === 'capilar') {
      modeGovernedRecommendations.scalpTreatments = [];
      modeGovernedRecommendations.professionalAlert =
        this.filterProfessionalAlertByMode(
          modeGovernedRecommendations?.professionalAlert,
          analysisType,
        );
    }
    const filteredFlags = this.filterFlagsByMode(
      this.humanizeLabelList(normalizedVisionResult?.flags),
      analysisType,
    );
    const normalizedScore = this.normalizeScore(
      typeof normalizedVisionResult?.score === 'undefined'
        ? normalizedRecommendations?.score
        : normalizedVisionResult?.score,
    );

    return {
      ...history,
      visionResult: normalizedVisionResult,
      aiExplanation: normalizedAiExplanation,
      recommendations: this.ensureRecommendationScore(
        modeGovernedRecommendations,
        normalizedScore,
      ),
      chemicalProfile: history.chemicalProfile || null,
      clientName: clientName || undefined,
    } as HistoryEntity & { clientName?: string };
  }

  private humanizeTokenLabel(value: unknown): string {
    const text = String(value ?? '').trim();
    if (!text) return '';

    const isTokenLike = /^[\p{L}\p{N}]+(?:[_-][\p{L}\p{N}]+)+$/u.test(text);
    if (!isTokenLike) return text;

    return text
      .replace(/[_-]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private humanizeInlineTokens(value: unknown): string {
    const text = String(value ?? '').trim();
    if (!text) return '';

    return text
      .replace(/\b[\p{L}\p{N}]+(?:[_-][\p{L}\p{N}]+)+\b/gu, (token) =>
        token
          .replace(/[_-]+/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      )
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private humanizeLabelList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => this.humanizeInlineTokens(item))
      .filter((item) => item.length > 0);
  }

  private normalizeListStringish(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => this.humanizeInlineTokens(item))
      .filter((item) => item.length > 0);
  }

  private filterFlagsByMode(
    flags: string[] | undefined,
    analysisType: 'capilar' | 'tricologica' | 'geral',
  ) {
    if (!Array.isArray(flags) || !flags.length) return [];
    if (analysisType !== 'capilar') return flags;

    const scalpKeywords = [
      'couro',
      'eritem',
      'sensibil',
      'inflam',
      'descam',
      'coceira',
      'prurido',
      'oleos',
      'seborr',
    ];

    return flags.filter((flag) => {
      const text = String(flag || '').toLowerCase();
      return !scalpKeywords.some((kw) => text.includes(kw));
    });
  }

  private filterRiskFactorsByMode(
    factors: string[] | undefined,
    analysisType: 'capilar' | 'tricologica' | 'geral',
  ) {
    return this.filterFlagsByMode(factors, analysisType);
  }

  private normalizeVisionResultForDisplay(visionResult: any) {
    if (!visionResult || typeof visionResult !== 'object') {
      return visionResult;
    }

    const normalized = { ...visionResult };
    normalized.flags = this.humanizeLabelList(normalized.flags);

    if (typeof normalized.interpretation === 'string') {
      normalized.interpretation = this.humanizeInlineTokens(
        normalized.interpretation,
      );
    }

    if (Array.isArray(normalized.findings)) {
      normalized.findings = normalized.findings
        .map((item: any) => this.humanizeInlineTokens(item))
        .filter(Boolean);
    }

    return normalized;
  }

  private sanitizeClinicalLanguage(value: unknown): string {
    const text = this.humanizeInlineTokens(value);
    if (!text) return '';

    return text
      .replace(/\bdiagn[oó]stic[oa]s?\b/gi, 'avaliações estéticas')
      .replace(/\bdoen[cç]as?\b/gi, 'desequilíbrios')
      .replace(/\bpatologi(?:a|as)\b/gi, 'alterações estéticas')
      .replace(
        /\bdermatites?\b/gi,
        'sensibilidades estéticas do couro cabeludo',
      )
      .replace(/\balopeci(?:a|as)\b/gi, 'redução de densidade aparente')
      .replace(
        /\binflama[cç][aã]o cr[oô]nic[ao]\b/gi,
        'ambiente sensibilizado persistente',
      );
  }

  private resolveDisplayAnalysisType(
    visionResult: any,
    recommendations: any,
  ): 'capilar' | 'tricologica' | 'geral' {
    const rawType = String(
      visionResult?.analysisType || visionResult?.type || '',
    ).toLowerCase();

    const declaresGeral =
      rawType.includes('geral') ||
      rawType.includes('completo') ||
      rawType.includes('combin');
    if (declaresGeral) return 'geral';

    const isTricologica = rawType.includes('tricolog');
    const isCapilar = rawType.includes('capilar');
    if (isTricologica) return 'tricologica';
    if (isCapilar) return 'capilar';

    const hasScalpTreatments = Array.isArray(recommendations?.scalpTreatments)
      ? recommendations.scalpTreatments.length > 0
      : false;
    const hasHairTreatments =
      (Array.isArray(recommendations?.treatments)
        ? recommendations.treatments.length
        : 0) > 0 ||
      (Array.isArray(recommendations?.homeCare)
        ? recommendations.homeCare.length
        : 0) > 0;

    // Preferir capilar quando há qualquer tratamento de haste (dados antigos com scalp misturado)
    if (hasHairTreatments) return 'capilar';
    if (hasScalpTreatments) return 'tricologica';
    return 'capilar';
  }

  private filterProfessionalAlertByMode(
    alert: string | undefined,
    analysisType: 'capilar' | 'tricologica' | 'geral',
  ) {
    if (analysisType !== 'capilar') return alert;
    if (!alert) return alert;

    const scalpKeywords = [
      'couro',
      'eritem',
      'sensibil',
      'inflam',
      'descam',
      'coceira',
      'prurido',
      'oleos',
      'seborr',
    ];

    const lower = alert.toLowerCase();
    const hasScalp = scalpKeywords.some((kw) => lower.includes(kw));
    return hasScalp ? '' : alert;
  }

  private enforceModeGovernance(
    recommendations: any,
    analysisType: 'tricologica' | 'capilar',
  ) {
    if (!recommendations || typeof recommendations !== 'object') {
      return recommendations;
    }

    const normalized = { ...recommendations };
    if (analysisType === 'tricologica') {
      normalized.recommendedStraightenings = [];
      normalized.recommendedStraighteningsDetailed = [];
      normalized.rejectedStraighteningsDetailed = [];
      normalized.restrictedProcedures = Array.from(
        new Set([
          ...(Array.isArray(normalized.restrictedProcedures)
            ? normalized.restrictedProcedures
            : []),
          'Alisamentos (fora do escopo da análise tricológica estética)',
        ]),
      );
      normalized.professionalAlert =
        'Modo tricológico estético: foco em equilíbrio do couro cabeludo. Alisamentos não são recomendados neste escopo.';
    }

    if (typeof normalized.professionalAlert === 'string') {
      normalized.professionalAlert = this.sanitizeClinicalLanguage(
        normalized.professionalAlert,
      );
    }

    return normalized;
  }

  private ensureRecommendationScore(
    recommendations: any,
    fallbackScore?: number,
  ) {
    if (!recommendations || typeof recommendations !== 'object') {
      return recommendations;
    }

    if (typeof recommendations.score === 'number') {
      return recommendations;
    }

    const flags = Array.isArray(recommendations?.flags)
      ? recommendations.flags.filter(Boolean)
      : [];
    const alertText =
      typeof recommendations?.professionalAlert === 'string'
        ? recommendations.professionalAlert.toLowerCase()
        : '';
    const hasAlert =
      alertText.includes('nao apto') ||
      alertText.includes('não apto') ||
      alertText.includes('sem alisamento');

    if (typeof fallbackScore === 'number' && Number.isFinite(fallbackScore)) {
      return {
        ...recommendations,
        score: fallbackScore,
        flags,
      };
    }

    // Sem score válido e sem flags/alerta: manter score indefinido e limpar flags herdadas
    if (!flags.length && !hasAlert) {
      const { score: _omit, flags: _omit2, ...rest } = recommendations || {};
      return rest;
    }

    return {
      ...recommendations,
      flags,
    };
  }

  private normalizeScore(raw: any): number | undefined {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }

    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }

    return undefined;
  }

  private normalizeAiExplanationForDisplay(aiExplanation: any) {
    if (!aiExplanation || typeof aiExplanation !== 'object') {
      return aiExplanation;
    }

    const normalized = { ...aiExplanation };
    const rawConfidence =
      normalized.analysisConfidence ?? normalized.confidence;
    const parsedConfidence =
      typeof rawConfidence === 'number'
        ? rawConfidence <= 1
          ? Math.round(rawConfidence * 100)
          : Math.round(rawConfidence)
        : typeof rawConfidence === 'string'
          ? Math.round(
              Number(rawConfidence.replace('%', '').replace(',', '.').trim()),
            )
          : null;
    if (
      typeof parsedConfidence === 'number' &&
      Number.isFinite(parsedConfidence)
    ) {
      normalized.analysisConfidence = Math.max(
        0,
        Math.min(100, parsedConfidence),
      );
    }
    if (typeof normalized.summary === 'string') {
      normalized.summary = this.humanizeInlineTokens(normalized.summary);
    }
    if (typeof normalized.technicalDetails === 'string') {
      normalized.technicalDetails = this.humanizeInlineTokens(
        normalized.technicalDetails,
      );
    }
    if (typeof normalized.ragSupport === 'string') {
      normalized.ragSupport = this.humanizeInlineTokens(normalized.ragSupport);
    }
    if (typeof normalized.clinicalLimits === 'string') {
      normalized.clinicalLimits = this.humanizeInlineTokens(
        normalized.clinicalLimits,
      );
    }
    if (Array.isArray(normalized.riskFactors)) {
      normalized.riskFactors = normalized.riskFactors
        .map((item: any) => this.humanizeInlineTokens(item))
        .filter(Boolean);
    }

    return normalized;
  }

  private normalizeRecommendationsForDisplay(recommendations: any) {
    if (!recommendations || typeof recommendations !== 'object') {
      return recommendations;
    }

    const normalized = { ...recommendations };
    normalized.treatments = this.humanizeLabelList(normalized.treatments);
    normalized.homeCare = this.humanizeLabelList(normalized.homeCare);
    normalized.recommendedStraightenings = Array.from(
      new Set(
        this.normalizeListStringish(normalized.recommendedStraightenings),
      ),
    );
    normalized.restrictedProcedures = Array.from(
      new Set(this.normalizeListStringish(normalized.restrictedProcedures)),
    );

    const professionalAlertRaw =
      typeof normalized.professionalAlert === 'string'
        ? normalized.professionalAlert
        : '';
    const hasRecommendations =
      Array.isArray(normalized.recommendedStraightenings) &&
      normalized.recommendedStraightenings.length > 0;
    const hasRecommendationsDetailed =
      Array.isArray(normalized.recommendedStraighteningsDetailed) &&
      normalized.recommendedStraighteningsDetailed.length > 0;
    const hasRestrictions =
      Array.isArray(normalized.restrictedProcedures) &&
      normalized.restrictedProcedures.length > 0;

    // Se há recomendação detalhada e nenhuma restrição, mas o alerta traz termos de bloqueio,
    // substituímos por um alerta de manutenção com cautela para não bloquear o frontend.
    const alertLower = professionalAlertRaw.toLowerCase();
    const hasBlockingAlert =
      alertLower.includes('nao apto') ||
      alertLower.includes('não apto') ||
      alertLower.includes('sem alisamento');
    const hasCriticalFlags =
      Array.isArray(normalized.flags) && normalized.flags.length > 0;
    const lowScore =
      typeof normalized.score === 'number' && normalized.score < 55;

    // Se veio "sem alisamento" mas não há flags críticas nem score baixo, suavizar para manutenção
    if (hasBlockingAlert && !hasCriticalFlags && !lowScore) {
      normalized.professionalAlert =
        'Avaliar presencialmente: manutenção/selagem leve com hidratação e nutrição; evitar ativos agressivos.';
    }
    // Se tem bloqueio E recomendações detalhadas sem restrição, não remover todas
    if (hasBlockingAlert && hasRecommendationsDetailed && !hasRestrictions) {
      normalized.professionalAlert ||=
        'Apto para manutenção de alisamento, com reforço de hidratação e nutrição.';
    }

    // Remover da lista de recomendados qualquer item que também está restrito
    if (hasRecommendations && hasRestrictions) {
      const restrictedSet = new Set(
        normalized.restrictedProcedures.map((item: string) =>
          item.toLowerCase(),
        ),
      );
      normalized.recommendedStraightenings =
        normalized.recommendedStraightenings.filter(
          (item: string) => !restrictedSet.has(String(item).toLowerCase()),
        );
    }

    // Restrições para alisamentos com composição ácida/"orgânica"
    const hairProfile = normalized.hairProfile || {};
    const coloredHair = Boolean(hairProfile?.colored || hairProfile?.bleached);
    const grayHair = Boolean(hairProfile?.gray || hairProfile?.grisalho);
    const hasRecentChemical = Boolean(hairProfile?.recentChemical);
    const compositionIsAcidic = (text: string) => {
      const t = text.toLowerCase();
      return (
        t.includes('ácido') ||
        t.includes('acido') ||
        t.includes('orgânico') ||
        t.includes('organico') ||
        t.includes('orgânica') ||
        t.includes('organica') ||
        t.includes('ácida') ||
        t.includes('acida')
      );
    };

    const shouldRestrictComposition = Boolean(
      coloredHair || grayHair || hasRecentChemical,
    );

    const compositionRestrictionLabel =
      'Ativo ácido/orgânico - restringir em cor/descoloração/grisalho ou química recente';

    if (Array.isArray(normalized.recommendedStraighteningsDetailed)) {
      const keepDetailed: any[] = [];
      const restrictByComposition: string[] = [];

      for (const item of normalized.recommendedStraighteningsDetailed) {
        const compositionHints = [
          ...(Array.isArray(item?.reasons) ? item.reasons : []),
          ...(Array.isArray(item?.warnings) ? item.warnings : []),
          item?.name,
        ]
          .filter(Boolean)
          .map((v: any) => String(v));

        const hasAcidicMarker = compositionHints.some((hint) =>
          compositionIsAcidic(String(hint)),
        );

        if (shouldRestrictComposition && hasAcidicMarker) {
          restrictByComposition.push(compositionRestrictionLabel);
        } else {
          keepDetailed.push(item);
        }
      }

      if (restrictByComposition.length) {
        const existingRestricted = Array.isArray(
          normalized.restrictedProcedures,
        )
          ? normalized.restrictedProcedures
          : [];
        normalized.restrictedProcedures = Array.from(
          new Set([...existingRestricted, ...restrictByComposition]),
        );
        normalized.recommendedStraighteningsDetailed = keepDetailed;
        if (!professionalAlertRaw) {
          normalized.professionalAlert =
            'Restringir alisamentos de composição ácida/orgânica para perfis com cor/descoloração/grisalho ou química recente.';
        }
      }
    }

    // Também aplicar filtro textual nas recomendações simples, mas sem cor/ácido => manter para cabelo natural
    if (Array.isArray(normalized.recommendedStraightenings)) {
      const keep: string[] = [];
      const restrictByComposition: string[] = [];
      for (const item of normalized.recommendedStraightenings) {
        const isAcidic = compositionIsAcidic(String(item));
        if (shouldRestrictComposition && isAcidic) {
          restrictByComposition.push(compositionRestrictionLabel);
        } else {
          keep.push(item);
        }
      }

      if (restrictByComposition.length) {
        const existingRestricted = Array.isArray(
          normalized.restrictedProcedures,
        )
          ? normalized.restrictedProcedures
          : [];
        normalized.restrictedProcedures = Array.from(
          new Set([...existingRestricted, ...restrictByComposition]),
        );
        normalized.recommendedStraightenings = keep;
        if (!professionalAlertRaw) {
          normalized.professionalAlert =
            'Restringir alisamentos ácidos/orgânicos para perfis com cor/descoloração/grisalho ou química recente.';
        }
      }
    }

    const hasRecommendationsFiltered =
      Array.isArray(normalized.recommendedStraightenings) &&
      normalized.recommendedStraightenings.length > 0;

    // Fallback de aptidão: se há recomendação e nenhum alerta, registrar apto
    if (
      !professionalAlertRaw &&
      hasRecommendationsFiltered &&
      !hasRestrictions
    ) {
      normalized.professionalAlert = 'Apto para alisamento do catálogo.';
    }

    // Se todas as recomendações foram removidas por conflito com restrições, sinalizar
    if (!hasRecommendationsFiltered && hasRestrictions) {
      if (!professionalAlertRaw) {
        normalized.professionalAlert =
          'Não apto para alisamento do catálogo neste momento. Avaliar presencialmente.';
      }
    }

    // Se veio alerta genérico sem restrição nem recomendação, manter vazio (avaliar presencialmente)

    // Se a IA enviou alisamentos dentro de "treatments", movemos para o bloco correto
    const STRAIGHTENING_KEYWORDS = [
      'alisamento',
      'selagem',
      'progressiva',
      'definitiva',
      'botox capilar',
      'botox',
      'enzimatic',
      'gradual',
      'liso',
    ];
    const isStraightening = (value: string) => {
      const text = value.toLowerCase();
      return STRAIGHTENING_KEYWORDS.some((kw) => text.includes(kw));
    };

    if (Array.isArray(normalized.treatments)) {
      const moved: string[] = [];
      normalized.treatments = normalized.treatments.filter((item: string) => {
        if (typeof item !== 'string') return false;
        const candidate = this.humanizeInlineTokens(item);
        if (isStraightening(candidate)) {
          moved.push(candidate);
          return false;
        }
        return Boolean(candidate);
      });
      if (moved.length) {
        const current = Array.isArray(normalized.recommendedStraightenings)
          ? normalized.recommendedStraightenings
          : [];
        normalized.recommendedStraightenings = Array.from(
          new Set([...current, ...moved].filter(Boolean)),
        );
      }
    }

    if (Array.isArray(normalized.scalpTreatments)) {
      normalized.scalpTreatments = normalized.scalpTreatments
        .map((item: any) => {
          if (typeof item === 'string') {
            return this.humanizeInlineTokens(item);
          }
          if (!item || typeof item !== 'object') return null;
          return {
            ...item,
            nome: this.humanizeTokenLabel(item.nome),
            indicacao:
              typeof item.indicacao === 'string'
                ? this.humanizeInlineTokens(item.indicacao)
                : item.indicacao,
            frequencia:
              typeof item.frequencia === 'string'
                ? this.humanizeInlineTokens(item.frequencia)
                : item.frequencia,
          };
        })
        .filter(Boolean);
    }

    const normalizeDetailed = (items: unknown) => {
      if (!Array.isArray(items)) return [];
      return items.map((item: any) => {
        if (!item || typeof item !== 'object') return item;
        return {
          ...item,
          name: this.humanizeTokenLabel(item.name),
          reasons: Array.isArray(item.reasons)
            ? item.reasons
                .map((reason: any) => this.humanizeInlineTokens(reason))
                .filter(Boolean)
            : item.reasons,
          warnings: Array.isArray(item.warnings)
            ? item.warnings
                .map((warning: any) => this.humanizeInlineTokens(warning))
                .filter(Boolean)
            : item.warnings,
        };
      });
    };

    normalized.recommendedStraighteningsDetailed = normalizeDetailed(
      normalized.recommendedStraighteningsDetailed,
    );

    const normalizeProcedureKey = (value: unknown) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const restrictedSet = new Set(
      (Array.isArray(normalized.restrictedProcedures)
        ? normalized.restrictedProcedures
        : []
      ).map((item: string) => normalizeProcedureKey(item)),
    );

    if (Array.isArray(normalized.recommendedStraighteningsDetailed)) {
      const remainingDetailed: any[] = [];
      const autoRestrictedFromWarnings: string[] = [];
      const blockedDetailedKeys = new Set<string>();

      for (const item of normalized.recommendedStraighteningsDetailed) {
        const name = item?.name;
        const key = normalizeProcedureKey(name);
        const warnings = Array.isArray(item?.warnings)
          ? item.warnings.map((w: unknown) => String(w ?? '').toLowerCase())
          : [];
        const hasExplicitRestriction = warnings.some(
          (warning: string) =>
            warning.includes('restri') ||
            warning.includes('nao recomendado') ||
            warning.includes('não recomendado') ||
            warning.includes('evitar'),
        );

        if (restrictedSet.has(key) || hasExplicitRestriction) {
          if (typeof name === 'string' && name.trim()) {
            autoRestrictedFromWarnings.push(name);
            restrictedSet.add(key);
            blockedDetailedKeys.add(key);
          }
          continue;
        }

        remainingDetailed.push(item);
      }

      normalized.recommendedStraighteningsDetailed = remainingDetailed;

      if (autoRestrictedFromWarnings.length > 0) {
        normalized.restrictedProcedures = Array.from(
          new Set([
            ...(Array.isArray(normalized.restrictedProcedures)
              ? normalized.restrictedProcedures
              : []),
            ...autoRestrictedFromWarnings,
          ]),
        );
      }

      if (Array.isArray(normalized.recommendedStraightenings)) {
        normalized.recommendedStraightenings =
          normalized.recommendedStraightenings.filter(
            (item: string) =>
              !blockedDetailedKeys.has(normalizeProcedureKey(item)),
          );
      }
    }

    if (
      (!normalized.recommendedStraighteningsDetailed ||
        normalized.recommendedStraighteningsDetailed.length === 0) &&
      Array.isArray(normalized.recommendedStraightenings) &&
      normalized.recommendedStraightenings.length > 0
    ) {
      normalized.recommendedStraighteningsDetailed =
        normalized.recommendedStraightenings.map((name: string) => ({
          name,
          score: undefined,
          reasons: [],
          warnings: [],
        }));
    }
    normalized.rejectedStraighteningsDetailed = normalizeDetailed(
      normalized.rejectedStraighteningsDetailed,
    );

    if (typeof normalized.professionalAlert === 'string') {
      normalized.professionalAlert = this.humanizeInlineTokens(
        normalized.professionalAlert,
      );
    }

    if (normalized.returnPlan && typeof normalized.returnPlan === 'object') {
      normalized.returnPlan = {
        ...normalized.returnPlan,
        periodo: this.humanizeInlineTokens(normalized.returnPlan.periodo),
        objetivo: this.humanizeInlineTokens(normalized.returnPlan.objetivo),
      };
    }

    if (
      normalized.treatmentProtocol &&
      typeof normalized.treatmentProtocol === 'object'
    ) {
      normalized.treatmentProtocol = Object.entries(
        normalized.treatmentProtocol,
      ).reduce(
        (acc, [key, value]) => {
          acc[key] =
            typeof value === 'string'
              ? this.humanizeInlineTokens(value)
              : value;
          return acc;
        },
        {} as Record<string, any>,
      );
    }

    if (
      normalized.medicalReferral &&
      typeof normalized.medicalReferral === 'object'
    ) {
      normalized.medicalReferral = {
        ...normalized.medicalReferral,
        reason: this.humanizeInlineTokens(normalized.medicalReferral.reason),
        guidance: this.humanizeInlineTokens(
          normalized.medicalReferral.guidance,
        ),
      };
    }

    return normalized;
  }

  private safeDateIso(input: unknown) {
    const date = input instanceof Date ? input : new Date(String(input ?? ''));
    if (Number.isNaN(date.getTime())) {
      return new Date(0).toISOString();
    }
    return date.toISOString();
  }

  private safeTime(input: unknown) {
    const date = new Date(String(input ?? ''));
    const time = date.getTime();
    return Number.isFinite(time) ? time : 0;
  }
}
