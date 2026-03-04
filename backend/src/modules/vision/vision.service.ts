import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { HistoryService } from '../history/history.service';

@Injectable()
export class VisionService {
  private readonly sessions = new Map<
    string,
    {
      salonId: string;
      clientId: string;
      analysisType: string;
      startedAt: number;
      expiresAt: number;
    }
  >();
  private readonly sessionTtlMs: number;

  constructor(
    @Inject(forwardRef(() => HistoryService))
    private readonly historyService: HistoryService,
  ) {
    const envTtl = Number(process.env.VISION_SESSION_TTL_MS);
    const fifteenMinutes = 15 * 60 * 1000;
    this.sessionTtlMs = Number.isFinite(envTtl) && envTtl > 0 ? envTtl : fifteenMinutes;
  }

  async startSession(
    salonId: string | undefined,
    clientId: string | undefined,
    analysisType: 'tricologica' | 'capilar' | 'geral',
  ) {
    const normalizedType = this.normalizeAnalysisType(analysisType);
    if (!normalizedType) {
      throw new BadRequestException('analysisType inválido');
    }

    const normalizedSalonId = String(salonId || '').trim();
    if (!normalizedSalonId) {
      throw new BadRequestException('salonId é obrigatório');
    }

    const normalizedClientId = String(clientId || '').trim();
    if (!normalizedClientId) {
      throw new BadRequestException('clientId é obrigatório');
    }

    this.pruneExpiredSessions();
    const sessionId = randomUUID();
    const now = Date.now();
    this.sessions.set(sessionId, {
      salonId: normalizedSalonId,
      clientId: normalizedClientId,
      analysisType: normalizedType,
      startedAt: now,
      expiresAt: now + this.sessionTtlMs,
    });

    return {
      sessionId,
      salonId: normalizedSalonId,
      clientId: normalizedClientId,
      analysisType: normalizedType,
      startedAt: new Date(now),
      expiresAt: new Date(now + this.sessionTtlMs),
    };
  }

  async process(
    salonId: string,
    professionalId: string,
    clientId: string,
    payload: any,
  ) {
    const { visionResult, aiExplanation, recommendations } = payload || {};
    const normalizedDomain: 'capilar' | 'tricologia' =
      String(payload?.analysisType || payload?.type || '')
        .toLowerCase()
        .includes('trico')
        ? 'tricologia'
        : 'capilar';
    const legalAudit =
      payload?.legalAudit && typeof payload.legalAudit === 'object'
        ? payload.legalAudit
        : null;
    const deterministicScore = this.normalizeScore(
      payload?.deterministicResult?.score ?? recommendations?.score,
    );
    const requestedScore = this.normalizeScore(payload?.score);

    if (
      typeof deterministicScore === 'number' &&
      typeof requestedScore === 'number' &&
      Math.abs(deterministicScore - requestedScore) > 1
    ) {
      throw new BadRequestException(
        'Alteração manual de score não permitida. O score deve ser calculado pelo motor determinístico.',
      );
    }

    // Garantir score persistido: tenta extrair do payload/vision/recommendations.
    const extractedScore = this.normalizeScore(
      deterministicScore ??
        visionResult?.score ??
        recommendations?.score ??
        payload?.score,
    );

    const visionToSave = {
      ...(visionResult || payload || {}),
      ...(typeof extractedScore === 'number' ? { score: extractedScore } : {}),
      deterministicResult: payload?.deterministicResult || null,
      legalAudit: payload?.legalAudit || null,
      analysisQuality: payload?.analysisQuality || null,
    };

    const recommendationsToSave = {
      ...(recommendations || null),
      ...(typeof extractedScore === 'number' ? { score: extractedScore } : {}),
      confidenceScore: payload?.deterministicResult?.confidence,
      aptitudeClassification: payload?.deterministicResult?.aptitude,
      aptitudeText: payload?.deterministicResult?.aptitudeMessage,
      weightProfileVersion: payload?.deterministicResult?.weightProfileVersion,
      weightProfileId: payload?.deterministicResult?.weightProfileId,
    };

    return this.historyService.save({
      clientId,
      salonId,
      professionalId,
      domain: normalizedDomain,
      visionResult: visionToSave,
      aiExplanation: aiExplanation || null,
      recommendations: recommendationsToSave,
      modelVersion:
        typeof legalAudit?.modelVersion === 'string'
          ? legalAudit.modelVersion
          : null,
      weightProfileVersion:
        typeof legalAudit?.weightProfileVersion === 'string'
          ? legalAudit.weightProfileVersion
          : null,
      promptVersion:
        typeof legalAudit?.promptVersion === 'string'
          ? legalAudit.promptVersion
          : null,
      temperature:
        typeof legalAudit?.temperature === 'number'
          ? legalAudit.temperature
          : null,
      rawIAOutput: legalAudit?.rawIAOutput ?? null,
      scoreCalculado:
        typeof legalAudit?.scoreCalculado === 'number'
          ? legalAudit.scoreCalculado
          : typeof extractedScore === 'number'
            ? extractedScore
            : null,
      confidenceScore:
        typeof legalAudit?.confidenceScore === 'number'
          ? legalAudit.confidenceScore
          : typeof payload?.deterministicResult?.confidence === 'number'
            ? payload.deterministicResult.confidence
            : null,
      previousAnalysisId:
        typeof legalAudit?.previousAnalysisId === 'string'
          ? legalAudit.previousAnalysisId
          : null,
    });
  }

  getStatus(sessionId: string) {
    const session = this.getActiveSession(sessionId);
    if (!session) return null;

    const now = Date.now();
    const elapsed = now - session.startedAt;
    // progresso fictício baseado no tempo: até 95% em ~15s
    const progress = Math.min(95, Math.round((elapsed / 15000) * 100));
    return {
      sessionId,
      progress,
      analysisType: session.analysisType,
      expiresInMs: Math.max(0, session.expiresAt - now),
    };
  }

  assertUploadSession(sessionId: string, salonId: string) {
    const session = this.getActiveSession(sessionId);
    if (!session) {
      throw new BadRequestException('Sessão não encontrada ou expirada');
    }
    if (session.salonId !== salonId) {
      throw new BadRequestException('Sessão não pertence ao salão autenticado');
    }
    return session;
  }

  completeSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  private normalizeScore(raw: any): number | undefined {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private pruneExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(id);
      }
    }
  }

  private getActiveSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  private normalizeAnalysisType(type: string | undefined | null) {
    const allowed: Array<'tricologica' | 'capilar' | 'geral'> = [
      'tricologica',
      'capilar',
      'geral',
    ];
    const normalized = String(type || '')
      .trim()
      .toLowerCase()
      .replace('tricológica', 'tricologica');
    return allowed.find((item) => item === normalized) ?? null;
  }
}
