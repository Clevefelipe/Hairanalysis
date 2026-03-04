import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  NotFoundException,
  ForbiddenException,
  ParseUUIDPipe,
  Logger,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter } from 'prom-client';
import { ReportsService } from './reports.service';
import { ReportsWorker } from './reports.worker';
import type { ReportPayload } from './report.types';
import { HistoryService } from '../modules/history/history.service';
import type { HistoryEntity } from '../modules/history/history.entity';
import { ClientesService } from '../clientes/clientes.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalonEntity } from '../modules/salon/salon.entity';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

interface CreateReportDto {
  analysisId: string;
  payload?: ReportPayload;
}

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportsWorker: ReportsWorker,
    private readonly historyService: HistoryService,
    private readonly clientesService: ClientesService,
    @InjectMetric('reports_created_total')
    private readonly reportsCreated: Counter<string>,
    @InjectRepository(SalonEntity)
    private readonly salonRepo: Repository<SalonEntity>,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() body: CreateReportDto,
    @Req() req: any,
  ): Promise<{ id: string; status: string }> {
    try {
      const salonId = req.user?.salonId;
      if (!salonId) {
        throw new ForbiddenException('Acesso negado');
      }

      const { analysisId } = body;
      if (!analysisId) throw new NotFoundException('analysisId Ã© obrigatÃ³rio');

      const history = await this.historyService.findById(analysisId);
      if (!history) throw new NotFoundException('HistÃ³rico nÃ£o encontrado');
      if (history.salonId !== salonId) {
        throw new ForbiddenException('Acesso negado');
      }

      // Se houver usuÃ¡rio autenticado com salonId, validar pertencimento
      const payload: ReportPayload =
        body.payload || (await this.mapHistoryToPayload(history));

      const meta = await this.reportsService.enqueue(analysisId);
      // Dispara geraÃ§Ã£o imediata (sem fila) utilizando o worker PDFKit.
      void this.reportsService.generateAndStore(meta.id, payload, (p) =>
        this.reportsWorker.renderPdf(p),
      );
      this.reportsCreated.inc({ status: 'accepted' });
      return { id: meta.id, status: meta.status };
    } catch (err) {
      this.logger.error(
        `Falha ao criar relatÃ³rio: ${err}`,
        err instanceof Error ? err.stack : undefined,
      );
      this.reportsCreated.inc({ status: 'rejected' });
      throw err;
    }
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async status(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
  ) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }

    const meta = await this.reportsService.getStatus(id);
    if (!meta) return { status: 'not_found' };
    if (!meta.analysisId) return { status: 'not_found' };

    try {
      const history = await this.historyService.findById(meta.analysisId);
      if (history.salonId !== salonId) {
        return { status: 'not_found' };
      }
    } catch {
      return { status: 'not_found' };
    }

    return meta;
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async download(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: any,
  ) {
    const salonId = req.user?.salonId;
    if (!salonId) {
      throw new ForbiddenException('Acesso negado');
    }

    const meta = await this.reportsService.getStatus(id);
    if (!meta) return { status: 'not_ready' };
    if (!meta.analysisId) return { status: 'not_ready' };

    try {
      const history = await this.historyService.findById(meta.analysisId);
      if (history.salonId !== salonId) {
        return { status: 'not_ready' };
      }
    } catch {
      return { status: 'not_ready' };
    }

    const url = await this.reportsService.getDownloadUrl(id);
    if (!url) return { status: 'not_ready' };
    return { url };
  }

  private async mapHistoryToPayload(
    history: HistoryEntity,
  ): Promise<ReportPayload> {
    const vision = history.visionResult || {};
    const rec = history.recommendations || {};
    const ai = history.aiExplanation || {};
    const toList = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.map((item) => String(item ?? '').trim()).filter(Boolean);
      }
      if (value === undefined || value === null) return [];
      return String(value)
        .split(/[,;|]/g)
        .map((item) => item.trim())
        .filter(Boolean);
    };
    const normalizeKey = (value: unknown) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const resolveAnalysisType = () => {
      const raw = String(
        vision?.analysisType || vision?.type || '',
      ).toLowerCase();
      if (raw.includes('geral')) return 'geral' as const;
      if (raw.includes('tricolog')) return 'tricologica' as const;
      if (raw.includes('capilar')) return 'capilar' as const;
      return 'capilar' as const;
    };

    const analysisType = resolveAnalysisType();

    // Enriquecer cliente
    let clienteNome =
      typeof (history as any)?.clientName === 'string' &&
      (history as any).clientName.trim()
        ? (history as any).clientName.trim()
        : 'Cliente nÃ£o identificado';
    let clienteContato: string | undefined = undefined;
    try {
      const cliente = await this.clientesService.findOne(history.clientId);
      if ((cliente as any)?.nome) clienteNome = (cliente as any).nome;
      if ((cliente as any)?.telefone) clienteContato = (cliente as any).telefone;
    } catch {
      // mantÃ©m fallback por ID
    }

    // Enriquecer salÃ£o
    let salaoNome = history.salonId || 'SalÃ£o';
    let salaoLogo: string | undefined = undefined;
    try {
      if (history.salonId) {
        const salao = await this.salonRepo.findOne({
          where: { id: history.salonId },
        });
        if (salao?.name) salaoNome = salao.name;
        if ((salao as any)?.logoUrl) salaoLogo = (salao as any).logoUrl;
      }
    } catch {
      // fallback
    }

    const professionalAlertRaw =
      typeof rec?.professionalAlert === 'string' ? rec.professionalAlert : '';
    const professionalAlert = this.sanitizeAestheticAlert(
      professionalAlertRaw,
      analysisType,
    );
    const blockedByAlert = (() => {
      const alert = professionalAlert.toLowerCase();
      return (
        alert.includes('sem alisamento') ||
        alert.includes('nao apto') ||
        alert.includes('nÃ£o apto')
      );
    })();

    const restrictedProcedures = toList(rec?.restrictedProcedures);
    const restrictedSet = new Set(restrictedProcedures.map(normalizeKey));

    const recommendedDetailedRaw: any[] = Array.isArray(
      rec.recommendedStraighteningsDetailed,
    )
      ? rec.recommendedStraighteningsDetailed
      : [];
    const rejectedDetailedRaw: any[] = Array.isArray(
      rec.rejectedStraighteningsDetailed,
    )
      ? rec.rejectedStraighteningsDetailed
      : [];

    const hasRestrictionWarning = (warnings: unknown) =>
      toList(warnings)
        .map((w) => w.toLowerCase())
        .some(
          (warning) =>
            warning.includes('restri') ||
            warning.includes('nao recomendado') ||
            warning.includes('nÃ£o recomendado') ||
            warning.includes('evitar'),
        );

    const detailedEligible = recommendedDetailedRaw.filter((item) => {
      const name = String(
        item?.name || item?.nome || item?.serviceName || item?.label || '',
      ).trim();
      if (!name) return false;
      const key = normalizeKey(name);
      if (restrictedSet.has(key)) return false;
      if (hasRestrictionWarning(item?.warnings)) return false;
      return true;
    });

    const cronogramaBase = [
      {
        semana: 1,
        foco: 'Hidratacao' as const,
        observacoes: 'Repor Ã¡gua perdida em processos quÃ­micos/tÃ©rmicos.',
      },
      {
        semana: 2,
        foco: 'Nutricao' as const,
        observacoes: 'LipÃ­dios para maciez e reduÃ§Ã£o de frizz.',
      },
      {
        semana: 3,
        foco: 'Reconstrucao' as const,
        observacoes: 'AminoÃ¡cidos/queratina para fibra sensibilizada.',
      },
      {
        semana: 4,
        foco: 'IntervaloSeguro' as const,
        observacoes: 'RevisÃ£o tÃ©cnica e ajuste de protocolo.',
      },
    ];

    const treatmentsSalaoRaw: string[] = Array.isArray(rec.treatments)
      ? rec.treatments
      : [];
    const homeCareRaw: string[] = Array.isArray(rec.homeCare)
      ? rec.homeCare
      : [];
    const couroCabeludo: string[] = Array.isArray(rec.scalpTreatments)
      ? rec.scalpTreatments
      : Array.isArray(rec.scalpCare)
        ? rec.scalpCare
        : [];

    const mapTreatment = (t: string) => {
      const label = t.toLowerCase();
      if (label.includes('hidr')) return 'Hidratacao' as const;
      if (label.includes('nutr')) return 'Nutricao' as const;
      if (label.includes('recon')) return 'Reconstrucao' as const;
      if (label.includes('neutr')) return 'Neutralizacao' as const;
      return 'Hidratacao' as const;
    };

    const tratamentosSalao =
      analysisType === 'tricologica'
        ? []
        : treatmentsSalaoRaw.map((t) => ({
            tipo: mapTreatment(t),
            descricao: t,
            prioridade: 'Alta' as const,
          }));

    const homeCare =
      analysisType === 'tricologica'
        ? []
        : homeCareRaw.map((t) => ({
            tipo: mapTreatment(t),
            descricao: t,
            intervaloDias:
              typeof rec?.homeCareIntervalDays === 'number'
                ? rec.homeCareIntervalDays
                : undefined,
            modoUso: rec?.homeCareModoUso,
          }));

    const fallbackRecommended = toList(rec?.recommendedStraightenings)
      .filter((name) => !restrictedSet.has(normalizeKey(name)))
      .map((name) => ({ name, reasons: [], warnings: [] }));

    const recommended =
      detailedEligible.length > 0 ? detailedEligible : fallbackRecommended;

    const rejected = rejectedDetailedRaw;

    const alisamentosBase = [
      ...recommended.map((s) => ({
        serviceId: s?.id || s?.serviceId || 'alisamento',
        nome: s?.name || s?.nome || s?.serviceName || s?.label || 'Alisamento',
        aptidao: 'Apto' as const,
        justificativa:
          (s?.reasons || s?.warnings || []).join('; ') ||
          'CompatÃ­vel com perfil tÃ©cnico.',
      })),
      ...rejected.map((s) => ({
        serviceId: s?.id || s?.serviceId || 'alisamento',
        nome: s?.name || s?.nome || s?.serviceName || s?.label || 'Alisamento',
        aptidao: 'NaoApto' as const,
        justificativa:
          (s?.warnings || []).join('; ') || 'Riscos identificados.',
      })),
    ];

    const alisamentos =
      analysisType === 'tricologica'
        ? []
        : blockedByAlert
          ? alisamentosBase.filter((item) => item.aptidao === 'NaoApto')
          : alisamentosBase;

    const anyEligible = alisamentos.some((item) => item.aptidao === 'Apto');
    const anyRejected = alisamentos.some((item) => item.aptidao === 'NaoApto');
    const hasRestrictions = restrictedSet.size > 0;

    const aptidao =
      analysisType === 'tricologica'
        ? undefined
        : blockedByAlert || (!anyEligible && (anyRejected || hasRestrictions))
          ? {
              status: 'NaoApto' as const,
              justificativa:
                professionalAlert ||
                'NÃ£o apto para alisamento neste momento. Avaliar presencialmente.',
            }
          : anyEligible && (anyRejected || hasRestrictions || blockedByAlert)
            ? {
                status: 'AptoComRestricoes' as const,
                justificativa:
                  professionalAlert ||
                  'HÃ¡ restriÃ§Ãµes para alisamentos; siga protocolos seguros.',
              }
            : anyEligible
              ? {
                  status: 'Apto' as const,
                  justificativa:
                    'Alisamentos compatÃ­veis cadastrados no salÃ£o.',
                }
              : undefined;

    const neutralizacaoRule = rec?.neutralization || ai?.neutralization;
    const neutralizacao =
      analysisType === 'tricologica'
        ? undefined
        : neutralizacaoRule
          ? {
              obrigatoria: Boolean(
                neutralizacaoRule.obrigatoria ?? neutralizacaoRule.required,
              ),
              produto: neutralizacaoRule.produto || neutralizacaoRule.product,
              tempo: neutralizacaoRule.tempo || neutralizacaoRule.time,
              justificativa:
                neutralizacaoRule.justificativa ||
                neutralizacaoRule.reason ||
                'NeutralizaÃ§Ã£o conforme avaliaÃ§Ã£o tÃ©cnica.',
            }
          : {
              obrigatoria: false,
              justificativa:
                'AvaliaÃ§Ã£o nÃ£o indicou necessidade adicional de neutralizaÃ§Ã£o; aplicar somente se pH alcalino ou instabilidade pÃ³s-quÃ­mica.',
            };

    const hairProfile =
      analysisType === 'tricologica'
        ? undefined
        : rec?.hairProfile || vision?.hairProfile || vision?.profile || {};
    const inferFlag = (flag: string) =>
      Array.isArray(vision?.flags) &&
      vision.flags.some((f: string) => (f || '').toLowerCase().includes(flag));
    const danos = {
      termico: inferFlag('term'),
      mecanico: inferFlag('mec'),
      quimico: inferFlag('quim'),
      observacoes: Array.isArray(vision?.flags) ? vision.flags : undefined,
    };

    const perfil =
      analysisType === 'tricologica'
        ? undefined
        : {
            tipo: hairProfile?.type || hairProfile?.tipo,
            volume: hairProfile?.volume,
            estrutura:
              hairProfile?.thickness ||
              hairProfile?.espessura ||
              hairProfile?.estrutura,
            danos,
          };

    return {
      cliente: { nome: clienteNome, contato: clienteContato },
      salao: { nome: salaoNome, logoUrl: salaoLogo },
      profissional: history.professionalId,
      dataAnalise: history.createdAt
        ? new Date(history.createdAt).toISOString()
        : new Date().toISOString(),
      sumario: ai?.summary,
      aptidao,
      perfil,
      protocolos: {
        alisamentos,
        tratamentosSalao,
        homeCare,
        couroCabeludo: analysisType === 'capilar' ? [] : couroCabeludo,
        neutralizacao,
        cronograma: cronogramaBase,
        manutencao: undefined,
      },
      alertas:
        analysisType === 'tricologica'
          ? (Array.isArray(vision.flags) ? vision.flags : []).filter(
              (flag) => flag && flag.toLowerCase().includes('couro'),
            )
          : Array.isArray(vision.flags)
            ? vision.flags
            : [],
      cuidadosPrePos: professionalAlert ? [professionalAlert] : [],
    };
  }

  private sanitizeAestheticAlert(
    text: string,
    analysisType: 'capilar' | 'tricologica' | 'geral',
  ): string {
    if (!text || typeof text !== 'string') return '';
    const lower = text.toLowerCase();
    const clinicalTerms = [
      'diagnÃ³stico',
      'diagnostico',
      'patologia',
      'doenÃ§a',
      'doenca',
      'inflamaÃ§Ã£o',
      'inflamacao',
      'infecÃ§Ã£o',
      'infeccao',
      'lesÃ£o',
      'lesao',
    ];
    const softened = clinicalTerms.reduce((acc, term) => {
      const regex = new RegExp(term, 'gi');
      return acc.replace(regex, 'sinal fora do escopo estÃ©tico');
    }, text);

    const trimmed = softened.trim();
    if (!trimmed) return '';

    const modeLabel =
      analysisType === 'tricologica'
        ? 'Modo tricolÃ³gico estÃ©tico'
        : analysisType === 'capilar'
          ? 'Modo capilar estÃ©tico'
          : 'Modo geral estÃ©tico';

    return `${modeLabel}: ${trimmed}`;
  }
}

