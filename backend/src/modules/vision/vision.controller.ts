import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import type { File as MulterFile } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { promises as fs } from 'fs';
import { VisionService } from './vision.service';
import { VisionRagService } from './vision-rag.service';
import { StraighteningService } from '../straightening/straightening.service';
import { HistoryAiService } from '../history/services/history-ai.service';
import { AiAnalysisService } from '../ai/services/ai-analysis.service';
import { UploadVisionDto } from './dto/upload-vision.dto';
import { StartVisionSessionDto } from './dto/start-vision-session.dto';
import { AuthGuard } from '@nestjs/passport';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Histogram } from 'prom-client';
import { AnalysisEngineService } from '../analysis-engine/analysis-engine.service';
import {
  AnalysisMode,
  WeightProfileId,
} from '../analysis-engine/analysis-engine.types';

@Controller('vision')
@UseGuards(AuthGuard('jwt')) // OBRIGATÓRIO
export class VisionController {
  constructor(
    private readonly visionService: VisionService,
    private readonly visionRagService: VisionRagService,
    private readonly straighteningService: StraighteningService,
    private readonly historyAiService: HistoryAiService,
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly analysisEngineService: AnalysisEngineService,
    @InjectMetric('vision_uploads_total')
    private readonly visionUploads: Counter<string>,
    @InjectMetric('vision_upload_duration_seconds')
    private readonly visionUploadDuration: Histogram<string>,
  ) {}

  @Post('session')
  async startSession(@Req() req: any, @Body() body: StartVisionSessionDto) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new BadRequestException('salonId ausente no token');
    }
    if (!body?.clientId) {
      throw new BadRequestException('clientId é obrigatório');
    }

    const requestedType = body.analysisType || body.type;
    if (!requestedType) {
      throw new BadRequestException('analysisType é obrigatório');
    }

    const session = await this.visionService.startSession(
      salonId,
      body.clientId,
      requestedType,
    );

    return {
      id: session.sessionId,
      ...session,
    };
  }

  @Get('status/:sessionId')
  async getStatus(@Param('sessionId') sessionId: string) {
    const status = this.visionService.getStatus(sessionId);
    if (!status) {
      throw new BadRequestException('Sessão não encontrada ou expirada');
    }
    return status;
  }

  private deriveHairProfile(signals: Record<string, any>) {
    const entries = Object.entries(signals || {}).map(
      ([k, v]) => [String(k).toLowerCase(), String(v).toLowerCase()] as const,
    );
    const has = (term: string) =>
      entries.some(([k, v]) => k.includes(term) || v.includes(term));
    const read = (...terms: string[]) => {
      const hit = entries.find(([k]) => terms.some((term) => k.includes(term)));
      return hit ? hit[1] : '';
    };

    const hairTypeRaw = read('tipo_fio', 'hair_type', 'curvatura');
    const hairType = hairTypeRaw.includes('cache')
      ? 'Cacheado'
      : hairTypeRaw.includes('cres')
        ? 'Crespo'
        : hairTypeRaw.includes('afro')
          ? 'Afro'
          : hairTypeRaw.includes('ond')
            ? 'Ondulado'
            : hairTypeRaw.includes('liso')
              ? 'Liso'
              : has('cache')
                ? 'Cacheado'
                : has('cres')
                  ? 'Crespo'
                  : has('afro')
                    ? 'Afro'
                    : has('ond')
                      ? 'Ondulado'
                      : has('liso')
                        ? 'Liso'
                        : undefined;

    const volumeRaw = read('volume', 'densidade');
    const volumeLevel = volumeRaw.includes('alto')
      ? 'Alto'
      : volumeRaw.includes('medio') || volumeRaw.includes('médio')
        ? 'Médio'
        : volumeRaw.includes('baixo')
          ? 'Baixo'
          : undefined;

    const structureRaw = read('espessura_fio', 'estrutura', 'fiber_structure');
    const fiberStructure = structureRaw.includes('fina')
      ? 'Fina'
      : structureRaw.includes('grossa')
        ? 'Grossa'
        : structureRaw.includes('media') || structureRaw.includes('média')
          ? 'Média'
          : undefined;

    const damageLevel =
      has('dano') || has('quebra') || has('elastic')
        ? 0.7
        : has('ressec')
          ? 0.5
          : undefined;
    const porosity = has('poros') ? 0.6 : undefined;
    const elasticity = has('elastic') ? 0.5 : undefined;

    const coloringRaw = read('coloracao_descoloracao', 'colora', 'descolora');
    const colored =
      has('colora') ||
      has('tinta') ||
      has('tonal') ||
      coloringRaw.includes('color')
        ? true
        : undefined;
    const bleached =
      has('descol') ||
      has('luzes') ||
      has('mechas') ||
      coloringRaw.includes('descolor') ||
      coloringRaw.includes('claread')
        ? true
        : undefined;
    const grayHair = has('branco') || has('grisal') ? true : undefined;
    const lastChemicalInterval = read(
      'tempo_ultima_quimica',
      'last_chemical',
      'ultima_quimica',
    );
    const recentChemical =
      lastChemicalInterval.includes('menos de 1') ||
      lastChemicalInterval.includes('1-2 mes') ||
      lastChemicalInterval.includes('1 a 2 mes') ||
      lastChemicalInterval.includes('ate 2 mes');

    return {
      hairType,
      fiberStructure,
      volumeLevel,
      damageLevel,
      porosity,
      elasticity,
      colored,
      bleached,
      grayHair,
      lastChemicalInterval,
      recentChemical,
    };
  }

  private hasHardRestriction(text: string, terms: string[]) {
    const lower = text.toLowerCase();
    return terms.some((term) => lower.includes(term));
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

  private sanitizeClinicalList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => this.sanitizeClinicalLanguage(item))
      .filter(Boolean);
  }

  private isInconclusiveSignal(value: unknown): boolean {
    const text = String(value ?? '')
      .trim()
      .toLowerCase();
    if (!text) return true;
    return (
      text === '-' ||
      text === '--' ||
      text.includes('nao observ') ||
      text.includes('não observ') ||
      text.includes('avaliar presencialmente') ||
      text.includes('nao aplicavel') ||
      text.includes('não aplicável')
    );
  }

  private assessVisionSignalQuality(
    analysisType: 'tricologica' | 'capilar',
    signals: Record<string, any>,
  ) {
    const criticalKeys =
      analysisType === 'tricologica'
        ? ['oleosidade', 'descamacao', 'sensibilidade']
        : [
            'tipo_fio',
            'curvatura',
            'porosidade',
            'elasticidade',
            'resistencia',
          ];

    const availableCritical = criticalKeys.filter((key) => {
      const value = signals?.[key];
      return !this.isInconclusiveSignal(value);
    }).length;

    const completeness = Math.round(
      (availableCritical / Math.max(criticalKeys.length, 1)) * 100,
    );

    return {
      criticalKeys,
      availableCritical,
      completeness,
    };
  }

  private toSignalNumber(
    value: unknown,
    kind: 'positive' | 'damage',
  ): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      if (value <= 3) return Math.round((value / 3) * 100);
      return Math.max(0, Math.min(100, Math.round(value)));
    }

    const text = String(value ?? '')
      .trim()
      .toLowerCase();
    if (!text) return undefined;
    if (
      text.includes('avaliar') ||
      text.includes('nao aplicavel') ||
      text.includes('não aplicável')
    ) {
      return undefined;
    }

    const has = (...terms: string[]) => terms.some((term) => text.includes(term));

    if (kind === 'positive') {
      if (has('muito alto', 'excelente')) return 92;
      if (has('alto', 'boa')) return 78;
      if (has('medio', 'médio', 'regular')) return 56;
      if (has('baixo', 'fraco')) return 32;
      return undefined;
    }

    if (has('severo', 'critico', 'crítico')) return 90;
    if (has('alto', 'intensa', 'intenso')) return 78;
    if (has('medio', 'médio', 'moderad')) return 56;
    if (has('baixo', 'leve')) return 28;
    return undefined;
  }

  private toDamageFromArray(value: unknown): number | undefined {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    const size = value.length;
    if (size >= 4) return 85;
    if (size === 3) return 70;
    if (size === 2) return 55;
    return 35;
  }

  private detectImageIssues(
    input: Record<string, any>,
    qualityCompleteness: number,
  ) {
    const flags = Array.isArray(input?.flags) ? input.flags : [];
    const joined = flags
      .map((item: unknown) => String(item).toLowerCase())
      .join(' | ');
    return {
      blurredImage: joined.includes('borrad') || joined.includes('foco'),
      lowLighting:
        joined.includes('ilumin') ||
        joined.includes('escur') ||
        joined.includes('luz'),
      partialCapture:
        joined.includes('corte parcial') ||
        joined.includes('parcial') ||
        qualityCompleteness < 60,
      incompleteData: qualityCompleteness < 60,
    };
  }

  private resolveWeightProfile(signals: Record<string, any>): WeightProfileId {
    const chemicalHistory = this.toSignalNumber(
      signals?.historico_quimico ?? signals?.tempo_ultima_quimica_estimado,
      'damage',
    );
    const elasticity = this.toSignalNumber(signals?.elasticidade, 'positive');
    const resistance = this.toSignalNumber(signals?.resistencia, 'positive');

    if (typeof chemicalHistory === 'number' && chemicalHistory >= 60) {
      return WeightProfileId.CHEMICALLY_TREATED;
    }

    if (
      (typeof elasticity === 'number' && elasticity < 45) ||
      (typeof resistance === 'number' && resistance < 45)
    ) {
      return WeightProfileId.HIGH_STRUCTURAL_SENSITIVITY;
    }

    return WeightProfileId.VIRGIN;
  }

  private buildDeterministicInput(
    analysisType: 'tricologica' | 'capilar' | 'geral',
    signals: Record<string, any>,
    quality: { completeness: number },
    sourcePayload: Record<string, any>,
  ) {
    const thermalDamage =
      this.toSignalNumber(signals?.danos_termicos, 'damage') ??
      this.toDamageFromArray(signals?.danos_termicos);
    const mechanicalDamage =
      this.toSignalNumber(signals?.danos_mecanicos, 'damage') ??
      this.toDamageFromArray(signals?.danos_mecanicos);
    const chemicalDamage =
      this.toSignalNumber(
        signals?.historico_quimico ?? signals?.danos_quimicos,
        'damage',
      ) ?? this.toDamageFromArray(signals?.danos_quimicos);
    const imageIssues = this.detectImageIssues(sourcePayload, quality.completeness);

    return {
      mode:
        analysisType === 'tricologica'
          ? AnalysisMode.TRICOLOGICA
          : AnalysisMode.CAPILAR,
      profileId: this.resolveWeightProfile(signals),
      elasticity: this.toSignalNumber(signals?.elasticidade, 'positive'),
      resistance: this.toSignalNumber(signals?.resistencia, 'positive'),
      porosity: this.toSignalNumber(signals?.porosidade, 'damage'),
      chemicalHistoryImpact: chemicalDamage,
      thermalDamage,
      mechanicalDamage,
      scalpSensitivity: this.toSignalNumber(signals?.sensibilidade, 'damage'),
      imageQuality:
        this.toSignalNumber(signals?.qualidade_imagem, 'positive') ??
        quality.completeness,
      ...imageIssues,
    };
  }

  private enforceModeGovernance(
    recommendations: any,
    analysisType: 'tricologica' | 'capilar',
  ) {
    if (!recommendations || typeof recommendations !== 'object') {
      return recommendations;
    }

    const normalized = { ...recommendations };
    normalized.treatments = this.sanitizeClinicalList(normalized.treatments);
    normalized.homeCare = this.sanitizeClinicalList(normalized.homeCare);

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

      normalized.treatments = (
        Array.isArray(normalized.treatments) ? normalized.treatments : []
      ).filter((item: string) => {
        const lower = String(item || '').toLowerCase();
        return (
          !lower.includes('alisamento') &&
          !lower.includes('progressiva') &&
          !lower.includes('selagem')
        );
      });

      normalized.professionalAlert =
        'Modo tricológico estético: foco em equilíbrio do couro cabeludo. Alisamentos não são recomendados neste escopo.';
      return normalized;
    }

    if (typeof normalized.professionalAlert === 'string') {
      normalized.professionalAlert = this.sanitizeClinicalLanguage(
        normalized.professionalAlert,
      );
    }

    return normalized;
  }

  private ensureNeutralizationFromSignals(
    recommendations: any,
    signals: Record<string, any> | null | undefined,
  ) {
    if (!recommendations || typeof recommendations !== 'object') {
      return recommendations;
    }

    const signalNeutralization =
      signals?.neutralizacao_ph && typeof signals.neutralizacao_ph === 'object'
        ? signals.neutralizacao_ph
        : signals?.neutralization_ph &&
            typeof signals.neutralization_ph === 'object'
          ? signals.neutralization_ph
          : null;

    if (!signalNeutralization) {
      return recommendations;
    }

    const existing = recommendations.neutralization;
    const hasExistingJustification =
      existing &&
      typeof existing === 'object' &&
      typeof existing.justificativa === 'string' &&
      existing.justificativa.trim().length > 0;
    if (hasExistingJustification) {
      return recommendations;
    }

    const requiredRaw =
      signalNeutralization.obrigatoria ?? signalNeutralization.required;
    const obrigatoria =
      requiredRaw === true ||
      String(requiredRaw ?? '')
        .trim()
        .toLowerCase() === 'sim' ||
      String(requiredRaw ?? '')
        .trim()
        .toLowerCase() === 'true';

    recommendations.neutralization = {
      obrigatoria,
      produto:
        typeof signalNeutralization.produto === 'string'
          ? signalNeutralization.produto.trim()
          : typeof signalNeutralization.product === 'string'
            ? signalNeutralization.product.trim()
            : undefined,
      tempo:
        typeof signalNeutralization.tempo === 'string'
          ? signalNeutralization.tempo.trim()
          : typeof signalNeutralization.time === 'string'
            ? signalNeutralization.time.trim()
            : undefined,
      justificativa:
        (typeof signalNeutralization.motivo === 'string' &&
          signalNeutralization.motivo.trim()) ||
        (typeof signalNeutralization.justificativa === 'string' &&
          signalNeutralization.justificativa.trim()) ||
        (typeof signalNeutralization.reason === 'string' &&
          signalNeutralization.reason.trim()) ||
        'Neutralização inferida a partir dos sinais técnicos observados na imagem.',
    };

    return recommendations;
  }

  private normalizeRecommendationsForDisplay(
    recommendations: any,
    analysisType?: 'tricologica' | 'capilar' | 'geral',
  ) {
    if (!recommendations || typeof recommendations !== 'object') {
      return recommendations;
    }

    const normalized = this.enforceModeGovernance(
      recommendations,
      analysisType === 'tricologica' ? 'tricologica' : 'capilar',
    );
    normalized.treatments = this.humanizeLabelList(normalized.treatments);
    normalized.homeCare = this.humanizeLabelList(normalized.homeCare);
    normalized.recommendedStraightenings = this.humanizeLabelList(
      normalized.recommendedStraightenings,
    );
    normalized.restrictedProcedures = this.humanizeLabelList(
      normalized.restrictedProcedures,
    );

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
    normalized.rejectedStraighteningsDetailed = normalizeDetailed(
      normalized.rejectedStraighteningsDetailed,
    );

    if (typeof normalized.professionalAlert === 'string') {
      normalized.professionalAlert = this.sanitizeClinicalLanguage(
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

  private computeStraighteningCompatibility(
    service: any,
    baseResult: any,
  ): { warnings: string[]; scoreMultiplier: number; blocked: boolean } {
    const warnings: string[] = [];
    let scoreMultiplier = 1;
    let blocked = false;

    const criteria = service?.criteria || {};
    const obs = String(criteria?.observations || '').toLowerCase();

    if (
      baseResult?.hairType &&
      Array.isArray(criteria?.hairTypes) &&
      criteria.hairTypes.length > 0
    ) {
      if (!criteria.hairTypes.includes(baseResult.hairType)) {
        warnings.push(
          `Tipo de fio não indicado: esperado ${criteria.hairTypes.join(', ')}.`,
        );
        blocked = true;
      }
    }

    if (
      baseResult?.fiberStructure &&
      Array.isArray(criteria?.structures) &&
      criteria.structures.length > 0 &&
      !criteria.structures.includes(baseResult.fiberStructure)
    ) {
      warnings.push(
        `Estrutura do fio não indicada: esperado ${criteria.structures.join(', ')}.`,
      );
      blocked = true;
    }

    if (
      baseResult?.volumeLevel &&
      Array.isArray(criteria?.volume) &&
      criteria.volume.length > 0 &&
      !criteria.volume.includes(baseResult.volumeLevel)
    ) {
      warnings.push(
        `Volume não indicado: esperado ${criteria.volume.join(', ')}.`,
      );
      blocked = true;
    }

    if (
      typeof baseResult?.damageLevel === 'number' &&
      typeof service?.maxDamageTolerance === 'number' &&
      baseResult.damageLevel > service.maxDamageTolerance
    ) {
      warnings.push('Nível de dano acima do tolerado para este protocolo.');
      blocked = true;
    }

    if (obs) {
      if (
        (obs.includes('descol') ||
          obs.includes('luzes') ||
          obs.includes('mechas')) &&
        this.hasHardRestriction(obs, [
          'não recomendado',
          'nao recomendado',
          'contraindicado',
          'evitar',
        ])
      ) {
        if (baseResult?.bleached) {
          warnings.push('Contraindicado em cabelo descolorido/clareado.');
          blocked = true;
        }
      }
      if (
        (obs.includes('color') ||
          obs.includes('tinta') ||
          obs.includes('tonal')) &&
        baseResult?.colored
      ) {
        warnings.push(
          'Atenção: observações indicam cautela/ajuste em cabelo com coloração.',
        );
        scoreMultiplier *= 0.8;
      }
      if (
        (obs.includes('branc') || obs.includes('grisal')) &&
        baseResult?.grayHair
      ) {
        warnings.push('Atenção: observações citam fios brancos/grisalhos.');
        scoreMultiplier *= 0.85;
      }
      if (
        (obs.includes('quimica recente') ||
          obs.includes('química recente') ||
          obs.includes('aguardar') ||
          obs.includes('apos quimica') ||
          obs.includes('após química')) &&
        baseResult?.recentChemical
      ) {
        warnings.push('Contraindicado por química recente.');
        blocked = true;
      }
    }

    if (blocked) {
      scoreMultiplier = 0;
    }

    return { warnings, scoreMultiplier, blocked };
  }

  @Post('process')
  async process(@Req() req: any, @Body() body: any) {
    const salonId = req.user?.salonId;
    const professionalId = req.user?.userId;
    const clientId = body?.clientId;

    if (!salonId || !professionalId || !clientId) {
      throw new BadRequestException(
        'Dados obrigatórios ausentes: user.salonId (no JWT), user.userId (no JWT) e clientId são obrigatórios',
      );
    }

    const rawType = String(body?.analysisType || body?.type || '').trim();
    const allowedTypes = ['tricologica', 'capilar', 'geral'];
    const analysisType = allowedTypes.includes(rawType)
      ? (rawType as 'tricologica' | 'capilar' | 'geral')
      : (() => {
          throw new BadRequestException(
            'analysisType inválido: use tricologica, capilar ou geral',
          );
        })();

    const timer = this.visionUploadDuration.startTimer();

    const bodySignals = body?.signals || body?.visionResult?.signals;
    const findings: string[] =
      body?.findings || body?.visionResult?.findings || [];

    const derivedSignals: Record<string, string> =
      bodySignals && typeof bodySignals === 'object'
        ? bodySignals
        : (findings || []).reduce(
            (acc: Record<string, string>, item: string) => {
              const key = String(item || '').trim();
              if (key) acc[key] = 'observado';
              return acc;
            },
            {},
          );

    const qualityProbe = this.assessVisionSignalQuality(
      analysisType === 'tricologica' ? 'tricologica' : 'capilar',
      derivedSignals,
    );
    const deterministicInput = this.buildDeterministicInput(
      analysisType,
      derivedSignals,
      qualityProbe,
      body,
    );
    const deterministicResult =
      this.analysisEngineService.calculateAnalysisResult(deterministicInput);

    body.score = deterministicResult.score;
    body.deterministicResult = deterministicResult;
    body.recommendations = {
      ...(body.recommendations || {}),
      score: deterministicResult.score,
      confidenceScore: deterministicResult.confidence,
      aptitudeClassification: deterministicResult.aptitude,
      aptitudeLabel: deterministicResult.aptitudeLabel,
      aptitudeText: deterministicResult.aptitudeMessage,
      weightProfileVersion: deterministicResult.weightProfileVersion,
      weightProfileId: deterministicResult.weightProfileId,
    };

    const hasPremiumExplanation =
      typeof body?.aiExplanation?.summary === 'string' &&
      typeof body?.aiExplanation?.riskLevel === 'string' &&
      typeof body?.aiExplanation?.technicalDetails === 'string';

    if (!hasPremiumExplanation) {
      const visionResult = body?.visionResult || body;
      const clientContext = body?.clientContext;

      const premium = await this.aiAnalysisService.analyzePremium(
        {
          visionResult,
          clientContext,
        },
        salonId,
      );

      body.aiExplanation = premium.aiExplanation;
      body.recommendations = {
        ...(body.recommendations || {}),
        ...premium.recommendations,
        professionalAlert: premium.professionalAlert,
      };
    }

    // RAG agora é suporte adicional (opcional) e pode ser usado como apêndice técnico
    const shouldAddRagSupport =
      typeof body?.aiExplanation?.ragSupport !== 'string';

    if (shouldAddRagSupport) {
      const baseInterpretation =
        typeof body?.aiExplanation?.summary === 'string'
          ? body.aiExplanation.summary
          : 'Análise concluída.';
      const ragAnalysisType =
        analysisType === 'tricologica' ? 'tricologica' : 'capilar';

      const ragText = await this.visionRagService.enrichInterpretation({
        salonId,
        analysisType: ragAnalysisType,
        signals:
          Object.keys(derivedSignals || {}).length > 0
            ? derivedSignals
            : { observacao: 'sem sinais estruturados' },
        baseInterpretation,
      });

      body.aiExplanation = {
        ...body.aiExplanation,
        ragSupport: ragText,
      };
    }

    {
      const baseResult = this.deriveHairProfile(derivedSignals || {});
      const services = await this.straighteningService.listWithFilter(
        salonId,
        false,
      );
      const preset = await this.straighteningService.getPreset(salonId);
      const ranked = this.straighteningService.recommendFromAnalysis(
        services,
        baseResult,
        preset.weights,
      );

      const explained = (ranked.items || []).map((s: any) => {
        const compat = this.computeStraighteningCompatibility(s, baseResult);
        const exp = this.historyAiService.buildStraighteningExplanation(
          s,
          baseResult,
        );
        const missingCriteria = !(
          Array.isArray(s?.criteria?.hairTypes) &&
          s.criteria.hairTypes.length > 0 &&
          Array.isArray(s?.criteria?.structures) &&
          s.criteria.structures.length > 0 &&
          Array.isArray(s?.criteria?.volume) &&
          s.criteria.volume.length > 0 &&
          Array.isArray(s?.criteria?.damageLevel) &&
          s.criteria.damageLevel.length > 0
        );
        if (missingCriteria) {
          compat.warnings.push(
            'Critérios técnicos incompletos neste alisamento; revise cadastro para melhor precisão.',
          );
        }
        return {
          id: s.id,
          name: s.name,
          score:
            Math.round((Number(s.score) || 0) * compat.scoreMultiplier * 1000) /
            1000,
          reasons: exp.reasons,
          warnings: compat.warnings,
          recommended: !compat.blocked,
          missingCriteria,
        };
      });

      const recommendedStraighteningsDetailed = explained
        .filter((item) => item.recommended && item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const rejectedStraighteningsDetailed = explained
        .filter((item) => !item.recommended || item.score <= 0)
        .slice(0, 5);

      const shouldBlockStraightening =
        !deterministicResult.canSuggestStraightening ||
        analysisType === 'tricologica';

      body.recommendations = {
        ...(body.recommendations || {}),
        recommendedStraighteningsDetailed: shouldBlockStraightening
          ? []
          : recommendedStraighteningsDetailed,
        rejectedStraighteningsDetailed,
        hairProfile: baseResult,
        straighteningStats: ranked.stats || null,
      };

      if (shouldBlockStraightening) {
        body.recommendations.recommendedStraightenings = [];
        body.recommendations.restrictedProcedures = Array.from(
          new Set([
            ...(Array.isArray(body.recommendations.restrictedProcedures)
              ? body.recommendations.restrictedProcedures
              : []),
            analysisType === 'tricologica'
              ? 'Alisamentos (fora do escopo da análise tricológica estética)'
              : 'Aptidão automática bloqueada por baixa confiabilidade técnica',
          ]),
        );
      }
      body.recommendations.professionalAlert = deterministicResult.aptitudeMessage;
    }

    body.recommendations = this.normalizeRecommendationsForDisplay(
      body.recommendations,
      analysisType,
    );
    body.recommendations = this.ensureNeutralizationFromSignals(
      body.recommendations,
      body?.signals && typeof body.signals === 'object'
        ? body.signals
        : derivedSignals,
    );
    body.legalAudit = {
      modelVersion: String(body?.aiMeta?.modelVersion || 'gpt-4o-mini'),
      weightProfileVersion: deterministicResult.weightProfileVersion,
      promptVersion: String(
        body?.aiMeta?.promptVersion || 'vision-image-analysis.prompt.v1',
      ),
      temperature: Number(body?.aiMeta?.temperature ?? 0.1),
      rawIAOutput: body?.rawIAOutput || body?.visionResult || body || null,
      scoreCalculado: deterministicResult.score,
      confidenceScore: deterministicResult.confidence,
      salonId,
      professionalId,
      previousAnalysisId: body?.previousAnalysisId || null,
      timestamp: new Date().toISOString(),
    };
    body.analysisQuality = {
      criticalCompleteness: qualityProbe.completeness,
      availableCritical: qualityProbe.availableCritical,
      totalCritical: qualityProbe.criticalKeys.length,
      confidenceScore: deterministicResult.confidence,
    };

    try {
      const result = await this.visionService.process(
        salonId,
        professionalId,
        clientId,
        body,
      );
      this.visionUploads.inc({
        status: 'processed',
        analysis_type: analysisType,
      });
      timer({ result: 'success', analysis_type: analysisType });
      return result;
    } catch (error) {
      this.visionUploads.inc({ status: 'error', analysis_type: analysisType });
      timer({ result: 'error', analysis_type: analysisType });
      throw error;
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Apenas imagens PNG ou JPG são permitidas'),
            false,
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: async (req, file, cb) => {
          const dir = process.env.UPLOADS_DIR || './uploads/vision';
          try {
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
          } catch (_err) {
            void _err;
            cb(_err, dir);
          }
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async upload(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 8 * 1024 * 1024,
            message: 'Arquivo deve ter até 8MB',
          }),
          // Tipagem já garantida no fileFilter do multer; removido FileTypeValidator para evitar falso negativo
        ],
      }),
    )
    file: MulterFile,
    @Body() body: UploadVisionDto,
  ) {
    const { sessionId, type, source, notes, uvMode, uvFlags, microscopy } =
      body;

    if (!sessionId) {
      throw new BadRequestException('sessionId é obrigatório');
    }

    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new BadRequestException('salonId ausente no token');
    }

    const session = this.visionService.assertUploadSession(sessionId, salonId);

    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const requestedType =
      typeof type === 'string' ? type.trim().toLowerCase() : undefined;
    if (
      requestedType &&
      session.analysisType &&
      requestedType !== session.analysisType &&
      !(
        session.analysisType === 'geral' &&
        (requestedType === 'capilar' || requestedType === 'tricologica')
      )
    ) {
      throw new BadRequestException('type não corresponde à sessão iniciada');
    }

    const resolvedType = (requestedType || session.analysisType || '').toLowerCase();
    const analysisType =
      resolvedType === 'tricologica'
        ? 'tricologica'
        : resolvedType === 'capilar' || resolvedType === 'geral'
          ? 'capilar'
          : null;
    if (!analysisType) {
      throw new BadRequestException('type deve ser capilar ou tricologica');
    }

    const normalizedSource =
      typeof source === 'string' &&
      ['imagem', 'video', 'tempo-real', 'microscopio'].includes(
        source.trim().toLowerCase(),
      )
        ? source.trim().toLowerCase()
        : 'imagem';

    const parsedUvFlags: string[] = (() => {
      if (!uvFlags) return [];
      try {
        const parsed = JSON.parse(uvFlags);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
      } catch {
        return [];
      }
    })();
    const parsedMicroscopyAlerts: string[] = (() => {
      if (!microscopy) return [];
      try {
        const parsed = JSON.parse(microscopy);
        const alerts = parsed?.alerts;
        return Array.isArray(alerts)
          ? alerts.map((item: any) => String(item))
          : [];
      } catch {
        return [];
      }
    })();

    const timer = this.visionUploadDuration.startTimer();
    let aiResult: any;
    let usedFallback = false;
    try {
      const fileBuffer = await fs.readFile(file.path);
      const imageBase64 = fileBuffer.toString('base64');
      const availableStraightenings = (
        await this.straighteningService.listWithFilter(salonId, false)
      ).map((service: any) => ({
        name: service?.name,
        criteria: service?.criteria || {},
        observations: String(service?.criteria?.observations || ''),
      }));
      const enrichedKnowledgeContext =
        await this.visionRagService.buildPromptKnowledgeContext({
          salonId,
          analysisType,
          notes,
          extraSignals: {
            uvMode: uvMode === 'true' ? 'ativo' : 'inativo',
            uvFlags: parsedUvFlags.join(', '),
            microscopyAlerts: parsedMicroscopyAlerts.join(', '),
          },
          limit: 6,
        });

      aiResult = await this.aiAnalysisService.analyzeVisionImage(
        {
          imageBase64,
          mimeType: file.mimetype,
          analysisType,
          source: normalizedSource,
          notes,
          uvMode: uvMode === 'true',
          uvFlags: parsedUvFlags,
          microscopyAlerts: parsedMicroscopyAlerts,
          knowledgeContext: enrichedKnowledgeContext,
          availableStraightenings: availableStraightenings,
        },
        salonId,
      );
      this.visionUploads.inc({
        status: 'uploaded',
        analysis_type: analysisType,
      });
    } catch (err) {
      void err;
      usedFallback = true;
      const fallbackScore = 50;
      const fallbackFlags = [
        'Leitura inconclusiva: recapturar com melhor foco e iluminação.',
      ];
      if (uvMode === 'true') {
        fallbackFlags.push('Análise UV realizada');
      }
      const fallbackSignals = {
        tipo_fio: 'Avaliar presencialmente',
        curvatura: 'Avaliar presencialmente',
        volume: 'Avaliar presencialmente',
        porosidade: 'Avaliar presencialmente',
        elasticidade: 'Avaliar presencialmente',
        resistencia: 'Avaliar presencialmente',
        danos_mecanicos: [] as string[],
        danos_termicos: [] as string[],
        danos_quimicos: [] as string[],
        necessidade_corte: 'Avaliar',
        corte_recomendado: 'Revisão técnica presencial',
        analysis_quality: {
          criticalCompleteness: 0,
          availableCritical: 0,
          totalCritical: analysisType === 'tricologica' ? 3 : 5,
        },
      };
      const fallbackInterpretation =
        await this.visionRagService.enrichInterpretation({
          salonId,
          analysisType,
          signals: {
            observacao: 'análise com fallback',
            tipo_fio: String(fallbackSignals.tipo_fio),
            volume: String(fallbackSignals.volume),
          },
          baseInterpretation: `Análise ${analysisType} concluída com fallback técnico. Score ${fallbackScore}/100.`,
        });

      aiResult = {
        score: fallbackScore,
        analysis_confidence: 35,
        flags: fallbackFlags,
        interpretation: fallbackInterpretation,
        signals: fallbackSignals,
        structured: {
          hairProfile: {},
          damageAssessment: {
            mechanical: [],
            thermal: [],
            chemical: [],
            severity: 'medio',
          },
          scalpAssessment: {},
          professionalGuidance: {
            procedureReadiness: 'restricoes',
            immediateAlerts: [],
            indications: [],
            contraindications: [],
            cutRecommendation: { needed: false, type: '', reason: '' },
          },
        },
      };
      this.visionUploads.inc({
        status: 'fallback',
        analysis_type: analysisType,
      });
    }

    const normalizedSignals =
      aiResult?.signals && typeof aiResult.signals === 'object'
        ? aiResult.signals
        : {};
    const quality = this.assessVisionSignalQuality(analysisType, normalizedSignals);
    normalizedSignals.analysis_quality = {
      criticalCompleteness: quality.completeness,
      availableCritical: quality.availableCritical,
      totalCritical: quality.criticalKeys.length,
    };
    aiResult.signals = normalizedSignals;

    if (quality.completeness < 60) {
      const existingFlags = Array.isArray(aiResult.flags) ? aiResult.flags : [];
      if (
        !existingFlags.some((flag: string) =>
          String(flag).toLowerCase().includes('leitura inconclusiva'),
        )
      ) {
        existingFlags.push(
          `Leitura inconclusiva (${quality.completeness}% de completude crítica). Refaça a captura com foco, distância 20-30cm e iluminação frontal difusa.`,
        );
      }
      aiResult.flags = existingFlags;
      aiResult.analysis_confidence = Math.min(
        Number(aiResult.analysis_confidence ?? 45),
        50,
      );
    }

    timer({
      result: usedFallback ? 'fallback' : 'success',
      analysis_type: analysisType,
    });
    return {
      success: true,
      sessionId,
      type,
      source: normalizedSource,
      score: aiResult.score,
      analysis_confidence: aiResult.analysis_confidence,
      flags: Array.isArray(aiResult.flags) ? aiResult.flags : [],
      signals: aiResult.signals || {},
      interpretation: aiResult.interpretation || 'Análise concluída.',
      structured: aiResult.structured || {},
      filePath: file.path,
      analyzedAt: new Date().toISOString(),
    };
  }

  @Get('status/:sessionId')
  async status(@Param('sessionId') sessionId: string) {
    const status = this.visionService.getStatus(sessionId);
    if (!status) {
      throw new BadRequestException('Sessão não encontrada');
    }

    return status;
  }
}
