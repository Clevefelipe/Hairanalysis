import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  ParseUUIDPipe,
  Patch,
  Body,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PDFDocument, StandardFonts, rgb, type RGB } from 'pdf-lib';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalonEntity } from '../salon/salon.entity';
import { UserEntity } from '../auth/user.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { isAbsolute, join } from 'path';
import { promises as fs } from 'fs';
// import QRCode from 'qrcode';

@Controller('history')
export class HistoryController {
  constructor(
    private readonly service: HistoryService,
    @InjectRepository(SalonEntity)
    private readonly salonRepo: Repository<SalonEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(
    @Req() req: any,
    @Query('salonId') salonId?: string,
    @Query('period') period?: '7d' | '30d' | '90d',
    @Query('professionalScope') professionalScope?: 'all' | 'me',
  ) {
    const resolvedSalonId = salonId || req.user?.salonId;
    const resolvedProfessionalId =
      professionalScope === 'me' ? req.user?.userId : undefined;
    if (!resolvedSalonId) {
      return [];
    }
    try {
      return this.service.getDashboard(resolvedSalonId, {
        period,
        professionalId: resolvedProfessionalId,
      });
    } catch {
      return {
        items: [],
        alerts: [],
        nextVisits: [],
        metrics: {
          totalAnalyses: 0,
          safeAnalyses: 0,
          flaggedAnalyses: 0,
          avgScore: 0,
          today: { count: 0, delta: 0, yesterday: 0 },
          score: { currentWeekAvg: 0, previousWeekAvg: 0 },
          upcoming: { next7d: 0 },
          alertsByType: {},
          week: {
            current: { total: 0, capilar: 0, tricologica: 0, alerts: 0 },
            previous: { total: 0, capilar: 0, tricologica: 0, alerts: 0 },
          },
        },
      };
    }
  }

  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard)
  listByClient(
    @Param('clientId', new ParseUUIDPipe({ version: '4' })) clientId: string,
    @Req() req: any,
  ) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.service.listByClient(salonId, clientId);
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  listAlerts(@Req() req: any, @Query('limit') limit?: string) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    const parsedLimit = Number(limit);
    return this.service.listAlerts(
      salonId,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }

  @Get('next-visits')
  @UseGuards(JwtAuthGuard)
  listNextVisits(@Req() req: any, @Query('rangeDays') rangeDays?: string) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    const parsedRange = Number(rangeDays);
    return this.service.listUpcomingVisits(
      salonId,
      Number.isFinite(parsedRange) ? parsedRange : 30,
    );
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  listNotifications(@Req() req: any, @Query('limit') limit?: string) {
    const salonId = req.user?.salonId;
    const userId = req.user?.userId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    const parsedLimit = Number(limit);
    try {
      return this.service.listNotificationsForUser(
        salonId,
        userId,
        Number.isFinite(parsedLimit) ? parsedLimit : 10,
      );
    } catch {
      return [];
    }
  }

  @Get('notifications/read')
  @UseGuards(JwtAuthGuard)
  listReadNotifications(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.service.listReadNotificationIds(userId);
  }

  @Post('notifications/mark-read')
  @UseGuards(JwtAuthGuard)
  async markNotificationsAsRead(
    @Req() req: any,
    @Body('notificationIds') notificationIds: string[],
  ) {
    const salonId = req.user?.salonId;
    const userId = req.user?.userId;
    if (!salonId || !userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.service.markNotificationsAsRead(userId, salonId, notificationIds);
  }

  @Get('compare')
  @UseGuards(JwtAuthGuard)
  async compare(
    @Query('baseId') baseId: string,
    @Query('targetId') targetId: string,
    @Req() req: any,
  ) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }

    if (!baseId || !targetId) {
      throw new BadRequestException('baseId e targetId são obrigatórios');
    }

    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4.test(baseId) || !uuidV4.test(targetId)) {
      throw new BadRequestException('IDs inválidos');
    }

    const items = await this.service.compareBySalonIds(salonId, [
      baseId,
      targetId,
    ]);
    if (items.length < 2) {
      throw new ForbiddenException('Acesso negado');
    }

    return items;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
  ) {
    const salonId = req.user?.salonId;
    const history = await this.service.findById(id);
    if (!salonId || history.salonId !== salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    return history;
  }

  @Get(':id/recommendations')
  @UseGuards(JwtAuthGuard)
  async recommendations(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
  ) {
    const salonId = req.user?.salonId;
    const history = await this.service.findById(id);
    if (!salonId || history.salonId !== salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.service.getRecommendations(id);
  }

  @Patch(':id/next-visit')
  @UseGuards(JwtAuthGuard)
  async updateNextVisit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
    @Body()
    body: {
      action: 'confirm' | 'reschedule';
      nextDate?: string;
      notes?: string;
    },
  ) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    if (!body?.action) {
      throw new BadRequestException('Ação é obrigatória (confirm/reschedule)');
    }
    return this.service.updateNextVisit(salonId, id, body);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  async share(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
  ) {
    const salonId = req.user?.salonId;
    const history = await this.service.findById(id);
    if (!salonId || history.salonId !== salonId) {
      throw new ForbiddenException('Acesso negado');
    }
    const generated = await this.service.generatePublicToken(id);
    const token = String(generated?.token || '').trim();
    return {
      token,
      url: token ? `/publico/${encodeURIComponent(token)}` : '',
    };
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async pdf(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const sanitizePdfTextKeepNewlines = (input: unknown) => {
        const raw = String(input ?? '')
          .replace(/\r\n/g, '\n')
          .replace(/[\u2010-\u2015]/g, '-')
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/\u2026/g, '...')
          .replace(/\u2022/g, '*')
          .replace(/[\u00A0]/g, ' ');

        let out = '';
        for (const ch of raw) {
          const code = ch.codePointAt(0) ?? 0;
          if (code === 9 || code === 10 || code === 13) {
            out += ch;
            continue;
          }
          if (code >= 32 && code <= 255) {
            out += ch;
            continue;
          }
          out += ' ';
        }
        return out.trimEnd();
      };

      const sanitizePdfTextSingleLine = (input: unknown) =>
        sanitizePdfTextKeepNewlines(input)
          .replace(/[\r\n]+/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();

      const toList = (value: unknown): string[] =>
        Array.isArray(value)
          ? value.map((item) => sanitizePdfTextSingleLine(item)).filter(Boolean)
          : [];

      const toNumber = (value: unknown): number | undefined => {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };

      const formatDate = (value: unknown) => {
        const date = value instanceof Date ? value : new Date(String(value));
        if (Number.isNaN(date.getTime())) return 'Data indisponível';
        return date.toLocaleDateString('pt-BR');
      };

      const formatDateTime = (value: unknown) => {
        const date = value instanceof Date ? value : new Date(String(value));
        if (Number.isNaN(date.getTime())) return 'Data indisponível';
        return date.toLocaleString('pt-BR');
      };

      const loadLogoBytes = async (
        logoRef: string | undefined,
      ): Promise<Uint8Array | null> => {
        const ref = String(logoRef || '').trim();
        if (!ref) return null;

        if (ref.startsWith('data:image/')) {
          const base64 = ref.split(',')[1];
          if (!base64) return null;
          return new Uint8Array(Buffer.from(base64, 'base64'));
        }

        if (/^https?:\/\//i.test(ref)) {
          try {
            const response = await fetch(ref);
            if (!response.ok) return null;
            const data = await response.arrayBuffer();
            return new Uint8Array(data);
          } catch {
            return null;
          }
        }

        const normalized = ref.replace(/\\/g, '/');
        const directPath = isAbsolute(normalized)
          ? normalized
          : join(process.cwd(), normalized);

        try {
          const file = await fs.readFile(directPath);
          return new Uint8Array(file);
        } catch {
          return null;
        }
      };

      const drawLabelValue = (
        label: string,
        value: string,
        options?: { size?: number; valueBold?: boolean },
      ) => {
        const safeLabel = sanitizePdfTextSingleLine(label);
        const safeValue = sanitizePdfTextKeepNewlines(value);
        const composed = `${safeLabel}: ${safeValue}`;
        drawWrapped(composed, {
          size: options?.size,
          boldText: options?.valueBold,
        });
      };

      const salonId = req.user?.salonId;
      const history = await this.service.findById(id);
      if (!salonId || history.salonId !== salonId) {
        throw new ForbiddenException('Acesso negado');
      }

      const resolvePublicBaseUrl = (): string => {
        const preferred = String(
          process.env.PUBLIC_REPORT_BASE_URL ||
            process.env.PUBLIC_APP_URL ||
            '',
        )
          .trim()
          .replace(/\/+$/, '');
        if (/^https?:\/\//i.test(preferred)) {
          return preferred;
        }

        const fromFrontendUrl = String(process.env.FRONTEND_URL || '')
          .split(',')
          .map((item) => item.trim().replace(/\/+$/, ''))
          .find((item) => /^https?:\/\//i.test(item));
        if (fromFrontendUrl) {
          return fromFrontendUrl;
        }

        const fromRequestOrigin = String(req.headers?.origin || '')
          .trim()
          .replace(/\/+$/, '');
        if (/^https?:\/\//i.test(fromRequestOrigin)) {
          return fromRequestOrigin;
        }

        return 'http://localhost:5173';
      };

      let publicToken = sanitizePdfTextSingleLine(
        (history as any)?.publicToken,
      );
      if (!publicToken) {
        try {
          const generated = await this.service.generatePublicToken(id);
          publicToken = sanitizePdfTextSingleLine(generated?.token || '');
        } catch {
          publicToken = '';
        }
      }

      const publicReportUrl = publicToken
        ? `${resolvePublicBaseUrl()}/publico/${encodeURIComponent(publicToken)}`
        : '';
      void publicReportUrl;

      const safeClientNameFromHistory = sanitizePdfTextSingleLine(
        (history as any)?.clientName,
      );
      let clientName = safeClientNameFromHistory || 'Cliente';
      try {
        const client = await this.clienteRepo.findOne({
          where: { id: history.clientId },
        });
        if (client?.nome && client.nome.trim()) {
          clientName = client.nome.trim();
        }
      } catch {
        // Mantem fallback amigavel sem expor identificador tecnico
      }
      if (!clientName || !clientName.trim())
        clientName = 'Cliente não identificado';

      let salonName = 'Salão';
      let salonLogoRef = '';
      let salonRaw: any = null;
      let salonBranding: any = null;
      let salonEntity: SalonEntity | null = null;
      const readBrandField = (...keys: string[]) => {
        const sources = [
          salonEntity,
          salonRaw,
          salonBranding,
          salonBranding?.pdf,
          salonBranding?.header,
        ];
        for (const source of sources) {
          if (!source || typeof source !== 'object') continue;
          for (const key of keys) {
            const value = source?.[key];
            if (value !== undefined && value !== null && String(value).trim()) {
              return value;
            }
          }
        }
        return undefined;
      };
      try {
        const salon = history.salonId
          ? await this.salonRepo.findOne({ where: { id: history.salonId } })
          : null;
        salonEntity = salon;
        if (salon?.name) salonName = salon.name;
        const salonRawRows =
          history.salonId &&
          (await this.salonRepo.query('SELECT * FROM salons WHERE id = $1', [
            history.salonId,
          ]));
        salonRaw = Array.isArray(salonRawRows) ? salonRawRows[0] : null;
        const brandingCandidate =
          salonRaw?.branding ||
          salonRaw?.brandConfig ||
          salonRaw?.brand_config ||
          null;
        salonBranding =
          brandingCandidate && typeof brandingCandidate === 'object'
            ? brandingCandidate
            : null;
        salonLogoRef = String(
          readBrandField(
            'logoUrl',
            'logo_url',
            'logo',
            'logoPath',
            'logo_path',
          ) || '',
        );
      } catch {
        salonName = history.salonId || salonName;
      }

      let professionalName = history.professionalId;
      let professionalRole = 'Profissional';
      try {
        const professional = await this.userRepo.findOne({
          where: { id: history.professionalId },
        });
        if (professional?.fullName) {
          professionalName = professional.fullName;
        } else if (professional?.name) {
          professionalName = professional.name;
        }
        if (professional?.role === 'ADMIN') {
          professionalRole = 'Administrador(a)';
        }
      } catch {
        // mantém fallback por ID
      }

      const logoBytes = await loadLogoBytes(salonLogoRef);

      const normalizeHexColor = (value: unknown, fallback: string): string => {
        const color = String(value || '').trim();
        if (!color) return fallback;
        const withHash = color.startsWith('#') ? color : `#${color}`;
        return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash : fallback;
      };

      const hexToRgb = (hexColor: string) => {
        const clean = hexColor.replace('#', '');
        const r = parseInt(clean.slice(0, 2), 16) / 255;
        const g = parseInt(clean.slice(2, 4), 16) / 255;
        const b = parseInt(clean.slice(4, 6), 16) / 255;
        return rgb(r, g, b);
      };

      const hashString = (value: string) => {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
          hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
        }
        return hash;
      };

      const palettePresets = [
        { primary: '#0F172A', secondary: '#E2E8F0', accent: '#0EA5A4' },
        { primary: '#12355B', secondary: '#E6EEF8', accent: '#1E88E5' },
        { primary: '#0B3D2E', secondary: '#E8F5EF', accent: '#22A06B' },
        { primary: '#3A1E5D', secondary: '#EFE9F8', accent: '#8B5CF6' },
      ];
      const tenantHash = hashString(String(history.salonId || salonName || ''));
      const fallbackPalette =
        palettePresets[tenantHash % palettePresets.length] || palettePresets[0];

      const brandPrimaryHex = normalizeHexColor(
        readBrandField(
          'brandPrimaryColor',
          'brand_primary_color',
          'primaryColor',
          'primary_color',
        ),
        fallbackPalette.primary,
      );
      const brandSecondaryHex = normalizeHexColor(
        readBrandField(
          'brandSecondaryColor',
          'brand_secondary_color',
          'secondaryColor',
          'secondary_color',
        ),
        fallbackPalette.secondary,
      );
      const brandAccentHex = normalizeHexColor(
        readBrandField(
          'brandAccentColor',
          'brand_accent_color',
          'accentColor',
          'accent_color',
        ),
        fallbackPalette.accent,
      );

      const brandColors = {
        primary: hexToRgb(brandPrimaryHex),
        secondary: hexToRgb(brandSecondaryHex),
        accent: hexToRgb(brandAccentHex),
      };

      const vision =
        history.visionResult && typeof history.visionResult === 'object'
          ? history.visionResult
          : {};
      const premium =
        history.aiExplanation && typeof history.aiExplanation === 'object'
          ? history.aiExplanation
          : {};
      const recommendations =
        history.recommendations && typeof history.recommendations === 'object'
          ? history.recommendations
          : {};

      const rawScore =
        toNumber(vision?.score) ?? toNumber(recommendations?.score);
      const score = Math.max(0, Math.min(100, Math.round(rawScore ?? 0)));
      const analysisTypeRaw = String(
        vision?.analysisType || vision?.type || '',
      ).toLowerCase();
      const analysisType =
        analysisTypeRaw.includes('combin') ||
        analysisTypeRaw.includes('complet') ||
        analysisTypeRaw.includes('geral')
          ? 'Geral'
          : analysisTypeRaw.includes('tricolog')
            ? 'Tricológica'
            : 'Capilar';
      const flags = toList(vision?.flags);

      const summary = sanitizePdfTextKeepNewlines(
        premium?.summary || vision?.interpretation || '',
      );
      const technicalDetails = sanitizePdfTextKeepNewlines(
        premium?.technicalDetails || '',
      );
      const analysisConfidence = Math.max(
        0,
        Math.min(100, toNumber(premium?.analysisConfidence) ?? 0),
      );
      const riskLevelRaw = sanitizePdfTextSingleLine(premium?.riskLevel || '');
      const riskLevel =
        riskLevelRaw === 'medio'
          ? 'Médio'
          : riskLevelRaw === 'baixo'
            ? 'Baixo'
            : riskLevelRaw === 'alto'
              ? 'Alto'
              : riskLevelRaw || 'Não informado';
      const professionalAlert = sanitizePdfTextKeepNewlines(
        recommendations?.professionalAlert || '',
      );
      const riskFactors = toList(premium?.riskFactors || vision?.riskFactors);
      const clinicalLimits = sanitizePdfTextKeepNewlines(
        premium?.clinicalLimits || vision?.clinicalLimits || '',
      );

      const scoreRaw = toNumber(vision?.score ?? recommendations?.score);
      const hasFlags = Array.isArray(vision?.flags) && vision.flags.length > 0;
      const hasAlert = professionalAlert.trim().length > 0;
      const scoreSafe =
        typeof scoreRaw === 'number' && Number.isFinite(scoreRaw)
          ? scoreRaw
          : undefined;
      const safeRiskLevel =
        !hasFlags && !hasAlert && scoreSafe === undefined
          ? 'Não informado'
          : riskLevel;

      const detectNeutralizationHints = (items: string[]): string[] => {
        const keywords = ['neutraliz', 'ph', 'pH', 'acid', 'alcal'];
        return items.filter((item) => {
          const text = item.toLowerCase();
          return keywords.some((k) => text.includes(k.toLowerCase()));
        });
      };

      const treatments = toList(recommendations?.treatments);
      const homeCare = toList(recommendations?.homeCare);
      const restrictedProcedures = toList(
        recommendations?.restrictedProcedures,
      );

      const hasScalp = Array.isArray(recommendations?.scalpTreatments)
        ? recommendations.scalpTreatments.length > 0
        : false;
      const hasHair = treatments.length > 0 || homeCare.length > 0;
      const resolvedAnalysisType = (() => {
        // Prioriza o tipo declarado: se vier Capilar, não força Geral mesmo com dados mistos.
        if (analysisType === 'Capilar') return 'Capilar';
        if (analysisType === 'Tricológica') {
          return 'Tricológica';
        }
        if (analysisType === 'Geral') return 'Geral';
        // Fallback por dados presentes
        if (hasHair && hasScalp) return 'Geral';
        if (hasHair) return 'Capilar';
        if (hasScalp) return 'Tricológica';
        return analysisType;
      })();

      const maintenanceIntervalDays = toNumber(
        recommendations?.maintenanceIntervalDays,
      );
      const nextVisitDate =
        typeof maintenanceIntervalDays === 'number' &&
        !Number.isNaN(new Date(history.createdAt).getTime())
          ? new Date(
              new Date(history.createdAt).getTime() +
                maintenanceIntervalDays * 24 * 60 * 60 * 1000,
            )
          : null;

      const returnPlanPeriod = sanitizePdfTextSingleLine(
        recommendations?.returnPlan?.periodo || '',
      );
      const returnPlanGoal = sanitizePdfTextKeepNewlines(
        recommendations?.returnPlan?.objetivo || '',
      );

      const scalpTreatments = Array.isArray(recommendations?.scalpTreatments)
        ? recommendations.scalpTreatments
            .map((item: any) => {
              if (typeof item === 'string') {
                return sanitizePdfTextSingleLine(item);
              }
              if (!item || typeof item !== 'object') return '';
              const nome = sanitizePdfTextSingleLine(item.nome || '');
              const indicacao = sanitizePdfTextSingleLine(item.indicacao || '');
              const frequencia = sanitizePdfTextSingleLine(
                item.frequencia || '',
              );
              return [nome, indicacao, frequencia]
                .filter(Boolean)
                .join(' | ')
                .trim();
            })
            .filter(Boolean)
        : [];

      const detailedStraightenings = Array.isArray(
        recommendations?.recommendedStraighteningsDetailed,
      )
        ? recommendations.recommendedStraighteningsDetailed
            .map((item: any) => {
              const name = sanitizePdfTextSingleLine(item?.name || '');
              if (!name) return '';
              const scoreValue = toNumber(item?.score);
              const warnings = toList(item?.warnings);
              const reasons = toList(item?.reasons);
              const scoreLabel =
                typeof scoreValue === 'number'
                  ? `Score ${scoreValue.toFixed(2)}`
                  : '';
              const details = [...reasons, ...warnings].join(' | ');
              return [name, scoreLabel, details].filter(Boolean).join(' | ');
            })
            .filter(Boolean)
        : [];

      const fallbackStraightenings = toList(
        recommendations?.recommendedStraightenings,
      );
      const straighteningRecommendations =
        detailedStraightenings.length > 0
          ? detailedStraightenings
          : fallbackStraightenings;

      const straighteningStatus = (() => {
        const hasRecommendations = straighteningRecommendations.length > 0;
        const hasRestrictions = restrictedProcedures.length > 0;
        const alertText = professionalAlert.toLowerCase();
        const blocked =
          alertText.includes('sem alisamento') ||
          alertText.includes('nao apto') ||
          alertText.includes('não apto');

        if (blocked || (!hasRecommendations && (hasRestrictions || blocked))) {
          return 'Não apto no momento';
        }
        if (hasRecommendations && (hasRestrictions || blocked)) {
          return 'Apto com restrições';
        }
        if (hasRecommendations && !hasRestrictions && !blocked) {
          return 'Apto';
        }
        return 'Avaliar presencialmente';
      })();
      const straighteningBlocked =
        professionalAlert.toLowerCase().includes('sem alisamento') ||
        professionalAlert.toLowerCase().includes('nao apto') ||
        professionalAlert.toLowerCase().includes('não apto');
      const eligibleStraighteningRecommendations = straighteningBlocked
        ? []
        : straighteningRecommendations;

      const neutralizationFromTreatments = detectNeutralizationHints([
        ...treatments,
        ...homeCare,
        ...scalpTreatments,
      ]);
      const explicitNeutralization =
        recommendations?.neutralization &&
        typeof recommendations.neutralization === 'object'
          ? {
              obrigatoria:
                recommendations.neutralization.obrigatoria === true ||
                String(recommendations.neutralization.obrigatoria)
                  .toLowerCase()
                  .trim() === 'sim' ||
                String(recommendations.neutralization.obrigatoria)
                  .toLowerCase()
                  .trim() === 'true',
              produto: sanitizePdfTextSingleLine(
                recommendations.neutralization.produto ||
                  recommendations.neutralization.product ||
                  '',
              ),
              tempo: sanitizePdfTextSingleLine(
                recommendations.neutralization.tempo ||
                  recommendations.neutralization.time ||
                  '',
              ),
              justificativa: sanitizePdfTextKeepNewlines(
                recommendations.neutralization.justificativa ||
                  recommendations.neutralization.reason ||
                  '',
              ),
            }
          : null;

      const medicalReferral =
        recommendations?.medicalReferral &&
        typeof recommendations.medicalReferral === 'object'
          ? {
              needed: Boolean(recommendations.medicalReferral.needed),
              reason: sanitizePdfTextSingleLine(
                recommendations.medicalReferral.reason || '',
              ),
              guidance: sanitizePdfTextKeepNewlines(
                recommendations.medicalReferral.guidance || '',
              ),
            }
          : null;

      const clientHistory = await this.service.listByClient(
        salonId,
        history.clientId,
      );
      const evolutionPoints = clientHistory
        .map((item) => {
          const createdAt = new Date(item.createdAt);
          const pointScore = Number(item?.visionResult?.score);
          return {
            id: item.id,
            createdAt,
            score: Number.isFinite(pointScore)
              ? Math.max(0, Math.min(100, Math.round(pointScore)))
              : null,
          };
        })
        .filter(
          (
            item,
          ): item is {
            id: string;
            createdAt: Date;
            score: number;
          } =>
            item.createdAt instanceof Date &&
            !Number.isNaN(item.createdAt.getTime()) &&
            typeof item.score === 'number',
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(-12);

      const resolveFontFamily = (
        value: unknown,
      ): {
        regular: StandardFonts;
        bold: StandardFonts;
      } => {
        const raw = String(value || '')
          .trim()
          .toLowerCase();
        if (
          raw.includes('times') ||
          raw.includes('serif') ||
          raw.includes('roman')
        ) {
          return {
            regular: StandardFonts.TimesRoman,
            bold: StandardFonts.TimesRomanBold,
          };
        }
        if (raw.includes('courier') || raw.includes('mono')) {
          return {
            regular: StandardFonts.Courier,
            bold: StandardFonts.CourierBold,
          };
        }
        return {
          regular: StandardFonts.Helvetica,
          bold: StandardFonts.HelveticaBold,
        };
      };

      const fontFamily = resolveFontFamily(
        readBrandField(
          'brandFontFamily',
          'brand_font_family',
          'fontFamily',
          'font_family',
        ) ||
          (tenantHash % 3 === 1
            ? 'times'
            : tenantHash % 3 === 2
              ? 'courier'
              : 'helvetica'),
      );

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(fontFamily.regular);
      const bold = await pdfDoc.embedFont(fontFamily.bold);

      const pageSize: [number, number] = [595.28, 841.89]; // A4 1:1 em pontos
      const marginX = 42;
      const topY = 806;
      const bottomY = 64;
      const contentWidth = pageSize[0] - marginX * 2;
      const baseFontSize = 10;
      const lineHeight = 15;

      let page = pdfDoc.addPage(pageSize);
      let y = topY;

      const addNewPage = () => {
        page = pdfDoc.addPage(pageSize);
        y = topY;
      };

      const ensureSpace = (heightNeeded: number) => {
        if (y - heightNeeded < bottomY) {
          page = pdfDoc.addPage(pageSize);
          y = topY;
        }
      };

      const drawDivider = () => {
        ensureSpace(10);
        page.drawLine({
          start: { x: marginX + 6, y: y - 3 },
          end: { x: marginX + contentWidth - 6, y: y - 3 },
          thickness: 0.5,
          color: brandColors.secondary,
        });
        y -= 10;
      };

      const wrapText = (
        text: string,
        size = baseFontSize,
        max = contentWidth,
      ) => {
        const paragraphs = sanitizePdfTextKeepNewlines(text)
          .split('\n')
          .map((p) => p.trim());
        const lines: string[] = [];

        for (const paragraph of paragraphs) {
          if (!paragraph) {
            lines.push('');
            continue;
          }
          const words = paragraph.split(/\s+/);
          let current = '';
          for (const word of words) {
            const candidate = current ? `${current} ${word}` : word;
            const width = font.widthOfTextAtSize(candidate, size);
            if (width > max && current) {
              lines.push(current);
              current = word;
            } else {
              current = candidate;
            }
          }
          if (current) lines.push(current);
        }
        return lines;
      };

      const drawLine = (
        text: string,
        options?: { size?: number; boldText?: boolean; indent?: number },
      ) => {
        const size = options?.size ?? baseFontSize;
        const indent = options?.indent ?? 0;
        ensureSpace(lineHeight);
        page.drawText(sanitizePdfTextSingleLine(text), {
          x: marginX + indent,
          y,
          size,
          font: options?.boldText ? bold : font,
          color: brandColors.primary,
        });
        y -= lineHeight;
      };

      const drawWrapped = (
        text: string,
        options?: { size?: number; boldText?: boolean; indent?: number },
      ) => {
        const size = options?.size ?? baseFontSize;
        const indent = options?.indent ?? 0;
        const lines = wrapText(text, size, Math.max(50, contentWidth - indent));
        for (const line of lines) {
          drawLine(line || ' ', {
            size,
            boldText: options?.boldText,
            indent,
          });
        }
      };

      const drawSectionTitle = (
        title: string,
        options?: { keepWithNextHeight?: number; startOnNewPage?: boolean },
      ) => {
        if (options?.startOnNewPage) {
          addNewPage();
        }
        const keepWithNextHeight =
          typeof options?.keepWithNextHeight === 'number'
            ? Math.max(0, options.keepWithNextHeight)
            : 0;
        ensureSpace(20 + keepWithNextHeight);
        page.drawText(sanitizePdfTextSingleLine(title), {
          x: marginX,
          y,
          size: 13,
          font: bold,
          color: brandColors.primary,
        });
        y -= 18;
      };

      const drawList = (items: string[]) => {
        if (!items.length) {
          drawLine('Sem dados disponíveis');
          return;
        }
        for (const item of items) {
          const bulletLines = wrapText(`* ${item}`, baseFontSize, contentWidth);
          const minHeight = Math.max(
            lineHeight,
            bulletLines.length * lineHeight,
          );
          ensureSpace(minHeight);
          for (const line of bulletLines) {
            drawLine(line);
          }
          y -= 1;
        }
      };

      const drawFooter = (
        targetPage: any,
        pageIndex: number,
        pageCount: number,
      ) => {
        const footerY = 24;
        targetPage.drawLine({
          start: { x: marginX, y: footerY + 12 },
          end: { x: marginX + contentWidth, y: footerY + 12 },
          thickness: 0.6,
          color: brandColors.secondary,
        });
        targetPage.drawText(
          sanitizePdfTextSingleLine(
            `Relatório técnico • ${salonName} • ${formatDateTime(new Date().toISOString())}`,
          ),
          {
            x: marginX,
            y: footerY,
            size: 8,
            font,
            color: brandColors.primary,
          },
        );
        targetPage.drawText(`Página ${pageIndex} de ${pageCount}`, {
          x: marginX + contentWidth - 68,
          y: footerY,
          size: 8,
          font: bold,
          color: brandColors.primary,
        });
      };

      const drawEvolutionChart = (
        points: Array<{ createdAt: Date; score: number; id: string }>,
      ) => {
        if (!points.length) return;

        const chartHeight = 118;
        const labelArea = 18;
        ensureSpace(chartHeight + labelArea + 20);

        const chartX = marginX;
        const chartY = y - chartHeight;
        const chartWidth = contentWidth;

        page.drawRectangle({
          x: chartX,
          y: chartY,
          width: chartWidth,
          height: chartHeight,
          borderColor: brandColors.secondary,
          borderWidth: 1,
          color: rgb(1, 1, 1),
        });

        const yTicks = [0, 25, 50, 75, 100];
        for (const tick of yTicks) {
          const yPos = chartY + (tick / 100) * chartHeight;
          page.drawLine({
            start: { x: chartX, y: yPos },
            end: { x: chartX + chartWidth, y: yPos },
            thickness: tick === 0 ? 1 : 0.5,
            color: tick === 0 ? brandColors.secondary : brandColors.secondary,
          });
          page.drawText(String(tick), {
            x: chartX + 4,
            y: yPos + 2,
            size: 8,
            font,
            color: brandColors.primary,
          });
        }

        const pointCount = points.length;
        const getX = (index: number) =>
          chartX +
          (pointCount <= 1
            ? chartWidth / 2
            : (index / (pointCount - 1)) * chartWidth);
        const getY = (value: number) => chartY + (value / 100) * chartHeight;

        const coords = points.map((point, index) => ({
          x: getX(index),
          y: getY(point.score),
          score: point.score,
          createdAt: point.createdAt,
        }));

        for (let i = 1; i < coords.length; i++) {
          page.drawLine({
            start: { x: coords[i - 1].x, y: coords[i - 1].y },
            end: { x: coords[i].x, y: coords[i].y },
            thickness: 1.8,
            color: brandColors.accent,
          });
        }

        for (const point of coords) {
          page.drawCircle({
            x: point.x,
            y: point.y,
            size: 2.8,
            color: brandColors.accent,
            borderColor: rgb(1, 1, 1),
            borderWidth: 0.8,
          });
        }

        const labelIndexes = Array.from(
          new Set([0, Math.floor((pointCount - 1) / 2), pointCount - 1]),
        );
        for (const index of labelIndexes) {
          const point = coords[index];
          if (!point) continue;
          page.drawText(formatDate(point.createdAt), {
            x: Math.max(chartX + 2, point.x - 24),
            y: chartY - 12,
            size: 8,
            font,
            color: brandColors.primary,
          });
        }

        const latest = points[points.length - 1];
        if (latest) {
          page.drawText(`Atual: ${latest.score}/100`, {
            x: chartX + chartWidth - 78,
            y: chartY + chartHeight - 12,
            size: 8,
            font: bold,
            color: brandColors.primary,
          });
        }

        y = chartY - labelArea;
      };

      const drawBrandHeader = async () => {
        const headerHeight = 92;
        ensureSpace(headerHeight + 12);

        const top = y;
        const bottom = y - headerHeight;

        page.drawRectangle({
          x: marginX,
          y: bottom,
          width: contentWidth,
          height: headerHeight,
          color: rgb(1, 1, 1),
          borderColor: rgb(1, 1, 1),
          borderWidth: 0,
        });

        page.drawRectangle({
          x: marginX,
          y: top - 8,
          width: contentWidth,
          height: 8,
          color: brandColors.primary,
          borderColor: brandColors.primary,
          borderWidth: 0,
        });

        const logoSize = 48;
        const logoX = marginX + 18;
        const logoY = bottom + 30;

        if (logoBytes) {
          try {
            const image = await pdfDoc.embedPng(logoBytes);
            page.drawImage(image, {
              x: logoX,
              y: logoY,
              width: logoSize,
              height: logoSize,
            });
          } catch {
            try {
              const image = await pdfDoc.embedJpg(logoBytes);
              page.drawImage(image, {
                x: logoX,
                y: logoY,
                width: logoSize,
                height: logoSize,
              });
            } catch {
              page.drawRectangle({
                x: logoX,
                y: logoY,
                width: logoSize,
                height: logoSize,
                color: brandColors.primary,
              });
            }
          }
        } else {
          const initials = sanitizePdfTextSingleLine(salonName)
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();
          page.drawRectangle({
            x: logoX,
            y: logoY,
            width: logoSize,
            height: logoSize,
            color: brandColors.primary,
          });
          page.drawText(initials || 'S', {
            x: logoX + 16,
            y: logoY + 21,
            size: 13,
            font: bold,
            color: rgb(1, 1, 1),
          });
        }

        const textStartX = logoX + logoSize + 20;

        const isTrichology = String(resolvedAnalysisType || '')
          .toLowerCase()
          .includes('tricol');
        const reportTitle =
          resolvedAnalysisType === 'Geral'
            ? 'RELATÓRIO EXECUTIVO CAPILAR E TRICOLÓGICO'
            : isTrichology
              ? 'RELATÓRIO EXECUTIVO TRICOLÓGICO'
              : 'RELATÓRIO EXECUTIVO CAPILAR';

        page.drawText(reportTitle, {
          x: textStartX,
          y: top - 20,
          size: 8.8,
          font: bold,
          color: brandColors.accent,
        });
        page.drawText(sanitizePdfTextSingleLine(salonName), {
          x: textStartX,
          y: top - 38,
          size: 16,
          font: bold,
          color: brandColors.primary,
        });
        page.drawText(
          'Relatório técnico-estético para conduta profissional em salão/clínica.',
          {
            x: textStartX,
            y: top - 52,
            size: 9,
            font,
            color: brandColors.primary,
          },
        );

        page.drawLine({
          start: { x: marginX + 12, y: bottom + 18 },
          end: { x: marginX + contentWidth - 12, y: bottom + 18 },
          thickness: 0.7,
          color: brandColors.secondary,
        });

        y -= headerHeight + 10;
      };

      const drawExecutiveProtocolBlock = () => {
        const cardHeight = 122;
        const gap = 10;
        const cardWidth = (contentWidth - gap * 2) / 3;
        ensureSpace(cardHeight + 20);

        const protocolPrimary =
          treatments[0] ||
          scalpTreatments[0] ||
          homeCare[0] ||
          summary ||
          'Definir tratamento principal em sessão';
        const protocolSecondary =
          scalpTreatments[0] ||
          homeCare[0] ||
          returnPlanGoal ||
          'Sem complemento registrado';

        const straighteningPrimary =
          eligibleStraighteningRecommendations[0] ||
          (straighteningStatus ? `Status: ${straighteningStatus}` : '') ||
          'Sem alisamento indicado';
        const straighteningSecondary = restrictedProcedures[0]
          ? `Restrição: ${restrictedProcedures[0]}`
          : professionalAlert || 'Sem restrição crítica registrada';

        const cards = [
          {
            title: 'RETORNO',
            lines: [
              typeof maintenanceIntervalDays === 'number'
                ? `${maintenanceIntervalDays} dias`
                : returnPlanPeriod || 'Conforme avaliação',
              nextVisitDate ? `Previsão: ${formatDate(nextVisitDate)}` : '',
            ],
          },
          {
            title: 'PROTOCOLO BASE',
            lines: [protocolPrimary, protocolSecondary],
          },
          {
            title: 'ALISAMENTO',
            lines: [straighteningPrimary, straighteningSecondary],
          },
        ];

        cards.forEach((card, idx) => {
          const x = marginX + idx * (cardWidth + gap);
          const cardTop = y;
          page.drawRectangle({
            x,
            y: cardTop - cardHeight,
            width: cardWidth,
            height: cardHeight,
            color: rgb(0.99, 0.99, 0.995),
            borderColor: brandColors.secondary,
            borderWidth: 0.8,
          });
          page.drawText(card.title, {
            x: x + 10,
            y: cardTop - 18,
            size: 9,
            font: bold,
            color: brandColors.primary,
          });
          const lineOne = wrapText(card.lines[0], 9, cardWidth - 22);
          const lineTwo = wrapText(card.lines[1], 8.8, cardWidth - 22);
          let textY = cardTop - 30;
          for (const line of lineOne.slice(0, 3)) {
            page.drawText(line, {
              x: x + 10,
              y: textY,
              size: 9,
              font: bold,
              color: brandColors.primary,
            });
            textY -= 10;
          }
          for (const line of lineTwo.slice(0, 4)) {
            page.drawText(line, {
              x: x + 10,
              y: textY,
              size: 8.8,
              font,
              color: brandColors.primary,
            });
            textY -= 9;
          }
        });

        y -= cardHeight + 10;
      };

      await drawBrandHeader();
      drawLabelValue('Tipo de sessão', resolvedAnalysisType, { size: 10 });
      drawLabelValue('Cliente', clientName);
      drawLabelValue('Profissional responsável', professionalName);
      drawLabelValue('Registro', formatDateTime(history.createdAt));
      drawLabelValue('Score técnico', `${score}/100`);
      drawLabelValue('Risco técnico', riskLevel);
      drawLabelValue('Confiança da IA', `${analysisConfidence}%`);
      drawLabelValue(
        'Sinalizações críticas',
        flags.length
          ? flags.join(', ')
          : 'Nenhuma sinalização crítica registrada.',
      );
      if (typeof maintenanceIntervalDays === 'number') {
        const scheduleLabel = nextVisitDate
          ? `${maintenanceIntervalDays} dias (previsão: ${formatDate(nextVisitDate)})`
          : `${maintenanceIntervalDays} dias`;
        drawLine(`Período de retorno: ${scheduleLabel}`, { boldText: true });
      } else if (returnPlanPeriod) {
        drawLine(`Período de retorno: ${returnPlanPeriod}`, {
          boldText: true,
        });
      }
      drawDivider();

      drawSectionTitle('Bloco executivo de protocolo');
      drawExecutiveProtocolBlock();
      drawDivider();

      drawSectionTitle('Resumo técnico da análise', { keepWithNextHeight: 36 });
      drawWrapped(summary || 'Sem resumo técnico disponível.');
      drawDivider();

      const drawRiskCard = () => {
        const cardHeight = 110;
        const barHeight = 10;
        const innerPadding = 16;
        ensureSpace(cardHeight + 16);

        const cardY = y - cardHeight;
        page.drawRectangle({
          x: marginX,
          y: cardY,
          width: contentWidth,
          height: cardHeight,
          borderColor: brandColors.secondary,
          borderWidth: 0.8,
          color: rgb(0.985, 0.99, 0.995),
        });

        const riskColor = (() => {
          const level = String(riskLevel || '').toLowerCase();
          if (level.includes('alto')) return brandColors.accent;
          if (level.includes('médio') || level.includes('medio'))
            return rgb(0.95, 0.67, 0.2); // âmbar
          return rgb(0.15, 0.65, 0.36); // verde
        })();

        const headerY = cardY + cardHeight - 18;
        page.drawText(`Score global: ${score}/100`, {
          x: marginX + innerPadding,
          y: headerY,
          size: 9,
          font: bold,
          color: brandColors.primary,
        });
        page.drawText(`Risco: ${riskLevel}`, {
          x: marginX + innerPadding + 170,
          y: headerY,
          size: 9,
          font: bold,
          color: riskColor,
        });
        page.drawText(`Confiança: ${analysisConfidence}%`, {
          x: marginX + innerPadding,
          y: headerY - 12,
          size: 8.8,
          font,
          color: brandColors.primary,
        });
        page.drawText(`Alertas: ${flags.length || 0}`, {
          x: marginX + innerPadding + 170,
          y: headerY - 12,
          size: 8.8,
          font,
          color: brandColors.primary,
        });

        const drawLabeledBar = (
          label: string,
          value: number,
          color: RGB,
          offsetY: number,
        ) => {
          const clamped = Math.max(0, Math.min(100, value));
          const barWidth = contentWidth - innerPadding * 2;
          const filledWidth = barWidth * (clamped / 100);
          const barX = marginX + innerPadding;
          const barY = cardY + offsetY;
          page.drawText(label, {
            x: barX,
            y: barY + barHeight + 2,
            size: 8.5,
            font: bold,
            color: brandColors.primary,
          });
          page.drawRectangle({
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight,
            borderColor: brandColors.secondary,
            borderWidth: 0.6,
            color: rgb(1, 1, 1),
          });
          page.drawRectangle({
            x: barX,
            y: barY,
            width: filledWidth,
            height: barHeight,
            color,
          });
          page.drawText(`${clamped}%`, {
            x: barX + barWidth - 36,
            y: barY + 1.5,
            size: 8,
            font,
            color: brandColors.primary,
          });
        };

        drawLabeledBar('Score global', score, riskColor, 44);
        drawLabeledBar(
          'Confiança da IA',
          analysisConfidence,
          brandColors.secondary,
          24,
        );

        y = cardY - 12;
      };

      drawSectionTitle('Mapa de risco e integridade', {
        keepWithNextHeight: 130,
      });
      drawRiskCard();

      const isGenericAlertLabel = (value: string) =>
        /sinais? de alerta/i.test(value);
      const filteredRiskFactors = (riskFactors || []).filter(
        (item) => !isGenericAlertLabel(item),
      );
      const riskFactorsToShow =
        filteredRiskFactors.length > 0
          ? filteredRiskFactors
          : Array.isArray(flags)
            ? flags
            : [];

      if (riskFactorsToShow.length) {
        drawLine('Fatores identificados:', { boldText: true });
        drawList(riskFactorsToShow);
      }
      drawDivider();

      const hasClinicalGuidance = Boolean(clinicalLimits);
      if (hasClinicalGuidance) {
        drawSectionTitle('Riscos e limites clínicos', {
          keepWithNextHeight: 36,
        });
        drawLine('Limites clínicos e orientações:', { boldText: true });
        drawWrapped(clinicalLimits);
        drawDivider();
      }

      drawSectionTitle('Gráfico de evolução (score)', {
        keepWithNextHeight: evolutionPoints.length ? 190 : 30,
      });
      drawEvolutionChart(evolutionPoints);
      if (evolutionPoints.length >= 2) {
        const first = evolutionPoints[0];
        const last = evolutionPoints[evolutionPoints.length - 1];
        const delta = last.score - first.score;
        drawLine(
          `Evolução no período: ${delta >= 0 ? '+' : ''}${delta} ponto(s), de ${first.score} para ${last.score}.`,
          { boldText: true },
        );
      } else {
        drawLine('Evolução ainda sem base comparativa suficiente.');
      }
      drawDivider();

      if (professionalAlert || flags.length) {
        drawSectionTitle('Sinais de alerta e decisão profissional', {
          keepWithNextHeight: 36,
        });
        if (professionalAlert) {
          drawWrapped(professionalAlert);
        }
        if (flags.length) {
          drawList(flags);
        }
        drawDivider();
      }

      if (technicalDetails) {
        drawSectionTitle('Detalhamento técnico capilar/tricológico', {
          keepWithNextHeight: 24,
        });
        drawWrapped(technicalDetails);
        drawDivider();
      }

      drawSectionTitle('Tratamentos recomendados (salão)', {
        keepWithNextHeight: 24,
      });
      drawList(treatments);
      drawDivider();

      drawSectionTitle('Tratamentos recomendados para couro cabeludo', {
        keepWithNextHeight: 24,
      });
      drawList(scalpTreatments);
      drawDivider();

      drawSectionTitle('Home care e frequência', { keepWithNextHeight: 24 });
      drawList(homeCare);
      if (returnPlanGoal) {
        drawWrapped(`Objetivo no retorno: ${returnPlanGoal}`, {
          boldText: true,
        });
      }
      drawDivider();

      drawSectionTitle('Aptidão para alisamento', {
        keepWithNextHeight: 24,
      });
      drawLine(`Status: ${straighteningStatus}`, { boldText: true });
      if (professionalAlert) {
        drawWrapped(`Alerta profissional: ${professionalAlert}`);
      }
      if (restrictedProcedures.length) {
        drawLine('Restrições registradas:', { boldText: true });
        drawList(restrictedProcedures);
      }
      if (eligibleStraighteningRecommendations.length) {
        drawLine('Elegíveis do catálogo:', { boldText: true });
        drawList(eligibleStraighteningRecommendations);
      }
      drawDivider();

      if (explicitNeutralization || neutralizationFromTreatments.length) {
        drawSectionTitle('Neutralização / estabilização de pH', {
          keepWithNextHeight: 24,
        });
        if (explicitNeutralization) {
          drawLine(
            `Obrigatória: ${explicitNeutralization.obrigatoria ? 'Sim' : 'Não'}`,
            { boldText: true },
          );
          if (explicitNeutralization.produto) {
            drawLine(`Produto sugerido: ${explicitNeutralization.produto}`);
          }
          if (explicitNeutralization.tempo) {
            drawLine(`Tempo sugerido: ${explicitNeutralization.tempo}`);
          }
          if (explicitNeutralization.justificativa) {
            drawWrapped(
              `Justificativa técnica: ${explicitNeutralization.justificativa}`,
            );
          }
          if (neutralizationFromTreatments.length) {
            drawLine('Pontos correlacionados no plano:', { boldText: true });
            drawList(neutralizationFromTreatments);
          }
        } else {
          drawWrapped(
            'Recomendações indicaram necessidade de neutralização ou cuidado com pH. Avaliar produto/tempo e executar conforme protocolo técnico.',
          );
          drawList(neutralizationFromTreatments);
        }
        drawDivider();
      }

      drawSectionTitle('Orientação de segurança estética', {
        keepWithNextHeight: 36,
      });
      drawWrapped(
        'Esta análise tem finalidade estética e não substitui avaliação médica.',
      );
      if (medicalReferral?.needed) {
        drawWrapped(
          `Encaminhamento sugerido: ${medicalReferral.reason || 'Sinais fora do escopo estético.'}`,
          {
            boldText: true,
          },
        );
      }
      if (medicalReferral?.guidance) {
        drawWrapped(medicalReferral.guidance);
      } else {
        drawWrapped(
          'Na presença de dor, inflamação intensa, lesão, secreção ou queda abrupta, orientar avaliação com dermatologista/tricologista médico.',
        );
      }
      drawDivider();

      drawSectionTitle('Assinatura técnica', { keepWithNextHeight: 100 });
      ensureSpace(100);
      page.drawRectangle({
        x: marginX,
        y: y - 82,
        width: contentWidth,
        height: 82,
        color: rgb(1, 1, 1),
        borderColor: brandColors.secondary,
        borderWidth: 1,
      });
      page.drawText(
        sanitizePdfTextSingleLine(`Profissional: ${professionalName}`),
        {
          x: marginX + 12,
          y: y - 22,
          size: 10,
          font: bold,
          color: brandColors.primary,
        },
      );
      page.drawText(sanitizePdfTextSingleLine(`Função: ${professionalRole}`), {
        x: marginX + 12,
        y: y - 36,
        size: 9.5,
        font,
        color: brandColors.primary,
      });
      page.drawText(sanitizePdfTextSingleLine(`Salão/Clínica: ${salonName}`), {
        x: marginX + 12,
        y: y - 50,
        size: 9.5,
        font,
        color: brandColors.primary,
      });
      page.drawText(
        sanitizePdfTextSingleLine(
          `Emissão: ${formatDateTime(new Date().toISOString())}`,
        ),
        {
          x: marginX + 12,
          y: y - 64,
          size: 9,
          font,
          color: brandColors.primary,
        },
      );
      page.drawLine({
        start: { x: marginX + contentWidth - 190, y: y - 63 },
        end: { x: marginX + contentWidth - 16, y: y - 63 },
        thickness: 0.9,
        color: brandColors.accent,
      });
      page.drawText('Assinatura técnica', {
        x: marginX + contentWidth - 130,
        y: y - 76,
        size: 8.5,
        font,
        color: brandColors.primary,
      });
      y -= 92;

      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      pages.forEach((currentPage, index) => {
        drawFooter(currentPage, index + 1, totalPages);
      });

      const bytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=relatorio-${history.id}.pdf`,
      );
      res.send(Buffer.from(bytes));
    } catch (e: any) {
      throw new BadRequestException(e?.message || 'Falha ao gerar PDF');
    }
  }
}
