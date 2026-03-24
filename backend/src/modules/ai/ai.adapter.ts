/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import OpenAI from 'openai';
import { buildHairAnalysisPrompt } from './builders/build-hair-analysis.prompt';
import { buildHairAnalysisPremiumPrompt } from './builders/build-hair-analysis-premium.prompt';
import { buildAestheticDecisionPrompt } from './builders/build-aesthetic-decision.prompt';
import { buildVisionImageAnalysisPrompt } from './builders/build-vision-image-analysis.prompt';
import {
  BuildPromptInput,
  HairAnalysisAIResponse,
  HairAnalysisPremiumInput,
  HairAnalysisPremiumResponse,
  AestheticDecisionInput,
  AestheticDecisionResponse,
} from './types/ai.types';
import { calculateSic } from './utils/sic-calculator';
import { sanitizePayload } from '../../common/middleware/legal-terms-sanitizer.middleware';

import {
  VisionImageAnalysisInput,
  VisionImageAnalysisOutput,
} from './types/vision-image.types';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY não configurada. IA indisponível neste ambiente.',
    );
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export async function runHairAnalysisAI(
  input: BuildPromptInput,
  knowledgeContext?: string,
): Promise<HairAnalysisAIResponse> {
  const prompt = buildHairAnalysisPrompt(input, knowledgeContext);
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const content = completion.choices[0].message.content;

  if (!content) {
    throw new Error('IA retornou resposta vazia');
  }

  return JSON.parse(content) as HairAnalysisAIResponse;
}

function normalizeRiskLevel(v: unknown): 'baixo' | 'medio' | 'alto' | null {
  if (typeof v !== 'string') return null;
  const normalized = v.trim().toLowerCase();

  if (normalized === 'baixo') return 'baixo';
  if (normalized === 'medio' || normalized === 'médio') return 'medio';
  if (normalized === 'alto') return 'alto';
  return null;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeAnalysisConfidence(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 1) return clamp(Math.round(value * 100), 0, 100);
    return clamp(Math.round(value), 0, 100);
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    const normalized = Number(raw.replace('%', '').replace(',', '.').trim());
    if (!Number.isFinite(normalized)) return null;
    if (normalized <= 1) return clamp(Math.round(normalized * 100), 0, 100);
    return clamp(Math.round(normalized), 0, 100);
  }

  return null;
}

function inferAnalysisConfidence(payload: any): number {
  let confidence = 64;

  const summary = String(payload?.aiExplanation?.summary || '').trim();
  const technicalDetails = String(
    payload?.aiExplanation?.technicalDetails || '',
  ).trim();
  const riskFactors = Array.isArray(payload?.aiExplanation?.riskFactors)
    ? payload.aiExplanation.riskFactors.length
    : 0;
  const treatments = Array.isArray(payload?.recommendations?.treatments)
    ? payload.recommendations.treatments.length
    : 0;
  const homeCare = Array.isArray(payload?.recommendations?.homeCare)
    ? payload.recommendations.homeCare.length
    : 0;
  const restrictions = Array.isArray(
    payload?.recommendations?.restrictedProcedures,
  )
    ? payload.recommendations.restrictedProcedures.length
    : 0;

  if (summary.length >= 80) confidence += 11;
  if (technicalDetails.length >= 120) confidence += 9;
  if (riskFactors > 0) confidence += 6;
  if (treatments > 0) confidence += 4;
  if (homeCare > 0) confidence += 3;
  if (restrictions >= 4) confidence -= 4;

  return clamp(Math.round(confidence), 45, 96);
}

function readTrimmedString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];
  if (typeof value !== 'string') return undefined;
  return value.trim();
}

function validatePremiumResponse(
  obj: any,
): asserts obj is HairAnalysisPremiumResponse {
  if (!obj || typeof obj !== 'object') {
    throw new Error('IA premium retornou JSON inválido');
  }
  if (!obj.aiExplanation || typeof obj.aiExplanation !== 'object') {
    throw new Error('IA premium: aiExplanation ausente');
  }
  if (typeof obj.aiExplanation.summary !== 'string') {
    throw new Error('IA premium: aiExplanation.summary inválido');
  }
  const normalizedRisk = normalizeRiskLevel(obj.aiExplanation.riskLevel);
  if (!normalizedRisk) {
    throw new Error('IA premium: aiExplanation.riskLevel inválido');
  }
  obj.aiExplanation.riskLevel = normalizedRisk;
  if (typeof obj.aiExplanation.technicalDetails !== 'string') {
    throw new Error('IA premium: aiExplanation.technicalDetails inválido');
  }
  const confidenceRaw =
    obj.aiExplanation.analysisConfidence ?? obj.aiExplanation.confidence;
  obj.aiExplanation.analysisConfidence =
    normalizeAnalysisConfidence(confidenceRaw) ?? inferAnalysisConfidence(obj);

  if (!obj.recommendations || typeof obj.recommendations !== 'object') {
    throw new Error('IA premium: recommendations ausente');
  }
  if (!Array.isArray(obj.recommendations.recommendedStraightenings)) {
    throw new Error(
      'IA premium: recommendations.recommendedStraightenings inválido',
    );
  }
  if (!Array.isArray(obj.recommendations.restrictedProcedures)) {
    throw new Error(
      'IA premium: recommendations.restrictedProcedures inválido',
    );
  }
  if (!Array.isArray(obj.recommendations.treatments)) {
    throw new Error('IA premium: recommendations.treatments inválido');
  }
  const maintenanceIntervalDays = Number(
    obj.recommendations.maintenanceIntervalDays,
  );
  if (!Number.isFinite(maintenanceIntervalDays)) {
    throw new Error(
      'IA premium: recommendations.maintenanceIntervalDays inválido',
    );
  }
  obj.recommendations.maintenanceIntervalDays = Math.max(
    7,
    Math.min(180, Math.round(maintenanceIntervalDays)),
  );
  if (!Array.isArray(obj.recommendations.homeCare)) {
    throw new Error('IA premium: recommendations.homeCare inválido');
  }

  const neutralization = obj.recommendations.neutralization as
    | Record<string, unknown>
    | undefined;
  if (!neutralization || typeof neutralization !== 'object') {
    throw new Error('IA premium: recommendations.neutralization ausente');
  }
  const normalizedRequired =
    neutralization.obrigatoria ?? neutralization.required;
  obj.recommendations.neutralization = {
    obrigatoria:
      normalizedRequired === true ||
      String(normalizedRequired).trim().toLowerCase() === 'sim' ||
      String(normalizedRequired).trim().toLowerCase() === 'true',
    produto:
      readTrimmedString(neutralization, 'produto') ??
      readTrimmedString(neutralization, 'product'),
    tempo:
      readTrimmedString(neutralization, 'tempo') ??
      readTrimmedString(neutralization, 'time'),
    justificativa:
      readTrimmedString(neutralization, 'justificativa') ??
      readTrimmedString(neutralization, 'reason') ??
      '',
  };
  if (!obj.recommendations.neutralization.justificativa) {
    throw new Error(
      'IA premium: recommendations.neutralization.justificativa inválida',
    );
  }
  if (typeof obj.professionalAlert !== 'string') {
    throw new Error('IA premium: professionalAlert inválido');
  }
}

const riskSet = new Set(['baixo', 'moderado', 'elevado', 'critico']);
type RiskKey =
  | 'termico'
  | 'quimico'
  | 'quebra'
  | 'elasticidade'
  | 'sensibilidade';
type AestheticDecisionRaw = Partial<AestheticDecisionResponse> & {
  indicesRisco?: Partial<Record<RiskKey, unknown>>;
};

function validateAestheticDecisionResponse(
  payload: unknown,
): asserts payload is AestheticDecisionResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('IA estética: resposta inválida');
  }
  const obj = payload as AestheticDecisionRaw;
  const resumoTecnico = obj.resumoTecnico;
  if (typeof resumoTecnico !== 'string' || !resumoTecnico.trim()) {
    throw new Error('IA estética: resumoTecnico inválido');
  }

  const normalizedScore = Number(obj.scoreIntegridade);
  if (!Number.isFinite(normalizedScore)) {
    throw new Error('IA estética: scoreIntegridade inválido');
  }
  obj.scoreIntegridade = clamp(Math.round(normalizedScore), 0, 100);

  // Normalizar coeficiente de absorção
  if (obj.absorptionCoefficient) {
    const coef = obj.absorptionCoefficient as any;
    const idx = Number(coef.index);
    const label = typeof coef.label === 'string' ? coef.label.trim().toLowerCase() : '';
    if (!Number.isFinite(idx)) delete (obj as any).absorptionCoefficient;
    else if (!riskSet.has(label) && !['baixa', 'media', 'alta'].includes(label)) {
      delete (obj as any).absorptionCoefficient;
    } else {
      obj.absorptionCoefficient = { index: Math.round(idx), label } as any;
    }
  }

  // Normalizar diagnóstico de cutícula (IPT)
  if (obj.cuticleDiagnostic) {
    const diag = obj.cuticleDiagnostic as any;
    const ipt = Number(diag.ipt ?? diag.score);
    const label = typeof diag.label === 'string' ? diag.label.trim().toLowerCase() : '';
    if (!Number.isFinite(ipt) || !['baixa', 'media', 'alta'].includes(label)) {
      delete (obj as any).cuticleDiagnostic;
    } else {
      obj.cuticleDiagnostic = {
        ipt: Math.round(ipt),
        label,
        toque: Number.isFinite(diag.toque) ? Number(diag.toque) : undefined,
        brilho: Number.isFinite(diag.brilho) ? Number(diag.brilho) : undefined,
        elasticidade: Number.isFinite(diag.elasticidade)
          ? Number(diag.elasticidade)
          : undefined,
        historico: Number.isFinite(diag.historico) ? Number(diag.historico) : undefined,
      } as any;
    }
  }

  // Normalizar risco de quebra
  if (obj.breakRiskPercentual !== undefined && obj.breakRiskPercentual !== null) {
    const br = Number(obj.breakRiskPercentual);
    obj.breakRiskPercentual = Number.isFinite(br) ? clamp(Math.round(br), 0, 100) : undefined;
  }

  const indicesRaw = obj.indicesRisco;
  if (!indicesRaw || typeof indicesRaw !== 'object') {
    throw new Error('IA estética: indicesRisco ausente');
  }
  const indices = indicesRaw as Partial<Record<RiskKey, unknown>>;
  const riskKeys: RiskKey[] = [
    'termico',
    'quimico',
    'quebra',
    'elasticidade',
    'sensibilidade',
  ];

  for (const key of riskKeys) {
    const rawValue = indices[key];
    const value =
      typeof rawValue === 'string'
        ? rawValue.trim().toLowerCase()
        : typeof rawValue === 'number'
          ? String(rawValue).trim().toLowerCase()
          : '';

    if (!riskSet.has(value)) {
      throw new Error(`IA estética: indice ${key} inválido`);
    }
    indices[key] = value;
  }

  const apt = String(obj.classificacaoAptidao || '').trim();
  if (!['apto', 'apto_com_restricoes', 'nao_apto'].includes(apt)) {
    throw new Error('IA estética: classificacaoAptidao inválida');
  }
  obj.classificacaoAptidao = apt as any;

  if (
    !obj.alisamentoSelecionado ||
    typeof obj.alisamentoSelecionado !== 'object'
  ) {
    throw new Error('IA estética: alisamentoSelecionado ausente');
  }
  obj.alisamentoSelecionado.nome = String(
    obj.alisamentoSelecionado.nome || '',
  ).trim();
  obj.alisamentoSelecionado.justificativa = String(
    obj.alisamentoSelecionado.justificativa || '',
  ).trim();

  const proto = obj.protocoloPersonalizado;
  if (!proto || typeof proto !== 'object') {
    throw new Error('IA estética: protocoloPersonalizado ausente');
  }
  if (!Array.isArray(proto.preQuimica)) proto.preQuimica = [];
  if (!Array.isArray(proto.posQuimica)) proto.posQuimica = [];
  if (!Array.isArray(proto.cronograma4Semanas)) proto.cronograma4Semanas = [];
  if (!proto.alisamento || typeof proto.alisamento !== 'object') {
    throw new Error('IA estética: protocoloPersonalizado.alisamento ausente');
  }
  const neut = proto.alisamento.neutralizacao as
    | Record<string, unknown>
    | undefined;
  if (!neut || typeof neut !== 'object') {
    throw new Error('IA estética: neutralizacao ausente');
  }
  const obrigatoria =
    neut.obrigatoria === true ||
    String(neut.obrigatoria).trim().toLowerCase() === 'true' ||
    String(neut.obrigatoria).trim().toLowerCase() === 'sim';
  proto.alisamento.neutralizacao = {
    obrigatoria,
    produto: readTrimmedString(neut, 'produto'),
    tempo: readTrimmedString(neut, 'tempo'),
    justificativa: readTrimmedString(neut, 'justificativa') || '',
  };
  if (!proto.alisamento.neutralizacao.justificativa) {
    throw new Error('IA estética: neutralizacao.justificativa obrigatória');
  }

  if (!Array.isArray(obj.alertasTecnicos)) {
    obj.alertasTecnicos = [];
  }

  // Base de tratamento opcional
  if (obj.protocoloPersonalizado?.baseTratamento) {
    const base = obj.protocoloPersonalizado.baseTratamento as any;
    const foco = typeof base.foco === 'string' ? base.foco.trim().toLowerCase() : '';
    const descricao = typeof base.descricao === 'string' ? base.descricao.trim() : '';
    if (!descricao || !['baixa', 'media', 'alta'].includes(foco)) {
      delete (obj.protocoloPersonalizado as any).baseTratamento;
    } else {
      obj.protocoloPersonalizado.baseTratamento = {
        foco: foco as any,
        descricao,
      };
    }
  }

  obj.confiancaAnalise = clamp(
    Number(obj.confiancaAnalise) || inferAnalysisConfidence(obj),
    0,
    100,
  );
}

export async function runHairAnalysisPremiumAI(
  input: HairAnalysisPremiumInput,
  knowledgeContext?: string,
  availableStraightenings?: any[],
): Promise<HairAnalysisPremiumResponse> {
  try {
    const catalogSize = Array.isArray(availableStraightenings)
      ? availableStraightenings.length
      : 0;
    const knowledgeSize =
      typeof knowledgeContext === 'string' ? knowledgeContext.length : 0;
    console.info('[AI][premium] prompt inputs', {
      catalogSize,
      knowledgeSize,
    });
  } catch {
    // não falha fluxo de IA por causa de log
  }

  const prompt = buildHairAnalysisPremiumPrompt(
    input,
    knowledgeContext,
    availableStraightenings,
  );
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('IA premium retornou resposta vazia');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(
      'IA premium retornou conteúdo não-JSON (verifique o prompt)',
    );
  }

  validatePremiumResponse(parsed);
  return sanitizePayload(parsed) as HairAnalysisPremiumResponse;
}

export async function runAestheticDecisionAI(
  input: AestheticDecisionInput,
  knowledgeContext?: string,
  availableStraightenings?: any[],
): Promise<AestheticDecisionResponse> {
  try {
    const catalogSize = Array.isArray(availableStraightenings)
      ? availableStraightenings.length
      : 0;
    const knowledgeSize =
      typeof knowledgeContext === 'string' ? knowledgeContext.length : 0;
    console.info('[AI][aesthetic] prompt inputs', {
      catalogSize,
      knowledgeSize,
    });
  } catch {
    // log best-effort
  }

  const prompt = buildAestheticDecisionPrompt(
    input,
    knowledgeContext,
    availableStraightenings,
  );
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('IA estética retornou resposta vazia');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('IA estética retornou conteúdo não-JSON');
  }

  validateAestheticDecisionResponse(parsed);

  if (input?.sicInput) {
    const sic = calculateSic(input.sicInput);
    parsed.sicResult = sic;
    if (Number.isFinite(parsed.scoreIntegridade)) {
      parsed.scoreIntegridade = clamp(
        Math.round((Number(parsed.scoreIntegridade) + sic.score_final) / 2),
        0,
        100,
      );
    } else {
      parsed.scoreIntegridade = sic.score_final;
    }
  }

  return sanitizePayload(parsed) as AestheticDecisionResponse;
}

export async function runVisionImageAnalysisAI(
  input: VisionImageAnalysisInput,
): Promise<VisionImageAnalysisOutput> {
  const prompt = buildVisionImageAnalysisPrompt(input);
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${input.mimeType};base64,${input.imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('IA de visão retornou resposta vazia');
  }

  let parsed: any;
  try {
    parsed = sanitizePayload(JSON.parse(content));
  } catch {
    throw new Error('IA de visão retornou JSON inválido');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('IA de visão retornou objeto inválido');
  }

  if (!Array.isArray(parsed.flags)) parsed.flags = [];
  if (!parsed.signals || typeof parsed.signals !== 'object')
    parsed.signals = {};
  if (!parsed.structured || typeof parsed.structured !== 'object') {
    parsed.structured = {
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
    };
  }

  parsed.score = Number(parsed.score);
  if (!Number.isFinite(parsed.score)) {
    parsed.score = 65;
  }
  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

  const rawConfidence = parsed?.analysis_confidence;
  let normalizedConfidence: number | undefined;
  if (Number.isFinite(Number(rawConfidence))) {
    normalizedConfidence = Math.max(
      0,
      Math.min(100, Math.round(Number(rawConfidence))),
    );
  } else {
    // Heurística simples: base na completude de campos
    let confidence = 60;
    const interp = String(parsed.interpretation || '').trim();
    if (interp.length > 80) confidence += 8;
    const flagsCount = Array.isArray(parsed.flags) ? parsed.flags.length : 0;
    if (flagsCount > 0) confidence += 4;
    const signalsCount = parsed.signals
      ? Object.keys(parsed.signals).length
      : 0;
    if (signalsCount > 8) confidence += 6;
    normalizedConfidence = Math.max(45, Math.min(95, Math.round(confidence)));
  }
  if (typeof parsed.interpretation !== 'string') {
    parsed.interpretation = 'Análise concluída.';
  }

  const normalizeTextValue = (value: unknown): string | null => {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    if (!text) return null;
    return text;
  };

  const isInconclusiveValue = (value: unknown): boolean => {
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
  };

  const normalizedSignals: Record<string, unknown> =
    parsed.signals && typeof parsed.signals === 'object'
      ? { ...parsed.signals }
      : {};
  const hairProfile =
    parsed?.structured?.hairProfile &&
    typeof parsed.structured.hairProfile === 'object'
      ? parsed.structured.hairProfile
      : {};

  const setSignalIfMissing = (key: string, value: unknown) => {
    const current = normalizeTextValue(normalizedSignals[key]);
    const incoming = normalizeTextValue(value);
    if (!incoming) return;
    if (!current || isInconclusiveValue(current)) {
      normalizedSignals[key] = incoming;
    }
  };

  setSignalIfMissing(
    'tipo_fio',
    hairProfile.hairType ?? normalizedSignals.hair_type,
  );
  setSignalIfMissing(
    'curvatura',
    hairProfile.curlPattern ?? normalizedSignals.curl_type,
  );
  setSignalIfMissing('volume', hairProfile.volume);
  setSignalIfMissing('porosidade', hairProfile.porosity);
  setSignalIfMissing('elasticidade', hairProfile.elasticity);
  setSignalIfMissing(
    'resistencia',
    hairProfile.resistance ?? normalizedSignals.strength,
  );
  setSignalIfMissing('espessura_fio', hairProfile.thickness);
  setSignalIfMissing('coloracao_descoloracao', hairProfile.coloring);
  setSignalIfMissing('fios_brancos', hairProfile.grayHair);
  setSignalIfMissing(
    'tempo_ultima_quimica_estimado',
    hairProfile.lastChemicalInterval,
  );

  const criticalKeys =
    input.analysisType === 'tricologica'
      ? ['oleosidade', 'descamacao', 'sensibilidade']
      : [
          'tipo_fio',
          'curvatura',
          'porosidade',
          'elasticidade',
          'resistencia',
        ];
  const availableCritical = criticalKeys.filter(
    (key) => !isInconclusiveValue(normalizedSignals[key]),
  ).length;
  const criticalCompleteness =
    criticalKeys.length > 0
      ? Math.round((availableCritical / criticalKeys.length) * 100)
      : 0;

  normalizedSignals.analysis_quality = {
    criticalCompleteness,
    availableCritical,
    totalCritical: criticalKeys.length,
  };

  parsed.signals = normalizedSignals;

  const confidenceFloor = criticalCompleteness > 0 ? 35 : 10;
  const boundedConfidence = Math.min(
    normalizedConfidence ?? 0,
    criticalCompleteness || confidenceFloor,
    100,
  );
  parsed.analysis_confidence = Math.max(confidenceFloor, boundedConfidence);

  return sanitizePayload(parsed) as VisionImageAnalysisOutput;
}
