/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/prefer-as-const */
import { Injectable } from '@nestjs/common';
import type {
  AestheticDecisionInput,
  AestheticDecisionResponse,
  AestheticRiskIndexes,
  SicInput,
  SicResult,
} from '../types/ai.types';
import { calculateSic } from '../utils/sic-calculator';
import {
  computeAbsorptionMetrics,
  computeBreakRiskPercent,
  computeIptMetrics,
  deriveTreatmentBase,
  porosityLabelFromPercent,
} from '../utils/hair-metrics';

type RiskLevel = AestheticRiskIndexes[keyof AestheticRiskIndexes];

const DEFAULT_CRONOGRAM = [
  'Semana 1 - Hidratação funcional (1x na semana)',
  'Semana 2 - Nutrição lipídica (1x na semana)',
  'Semana 3 - Reconstrução estratégica (a cada 15 dias)',
  'Semana 4 - Manutenção e avaliação técnica',
];

function normalizeRiskText(value?: unknown): RiskLevel | null {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === 'baixo' ||
      normalized === 'moderado' ||
      normalized === 'elevado' ||
      normalized === 'critico' ||
      normalized === 'crítico'
    ) {
      return normalized.replace('í', 'i') as RiskLevel;
    }
  }
  return null;
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 80) return 'baixo';
  if (score >= 65) return 'moderado';
  if (score >= 45) return 'elevado';
  return 'critico';
}

function inferRiskFromIndicators(
  value: number | null,
  fallback: RiskLevel,
): RiskLevel {
  if (value === null || Number.isNaN(value)) {
    return fallback;
  }
  if (value >= 80) return 'critico';
  if (value >= 65) return 'elevado';
  if (value >= 45) return 'moderado';
  return 'baixo';
}

function pickNumber(
  sources: Record<string, unknown>[],
  ...keys: string[]
): number | null {
  for (const source of sources) {
    for (const key of keys) {
      const raw = (source as Record<string, unknown>)?.[key];
      if (raw === undefined || raw === null) continue;
      const num = Number(raw);
      if (Number.isFinite(num)) {
        return num;
      }
      if (typeof raw === 'string') {
        const parsed = Number(raw.replace(',', '.'));
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
  }
  return null;
}

function pickText(
  sources: Record<string, unknown>[],
  ...keys: string[]
): string | null {
  for (const source of sources) {
    for (const key of keys) {
      const raw = (source as Record<string, unknown>)?.[key];
      if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
      }
    }
  }
  return null;
}

function buildCronogram(
  hydrationPriority: boolean,
  nutritionPriority: boolean,
  reconstructionPriority: boolean,
): string[] {
  const cronogram = [...DEFAULT_CRONOGRAM];
  if (hydrationPriority) {
    cronogram[0] = 'Semana 1 - Hidratação profunda (2x na semana)';
  }
  if (nutritionPriority) {
    cronogram[1] = 'Semana 2 - Nutrição lipídica + blindagem (1-2x na semana)';
  }
  if (reconstructionPriority) {
    cronogram[2] = 'Semana 3 - Reconstrução proteica com intervalo de 15 dias';
  }
  return cronogram;
}

@Injectable()
export class AiAnalysisService {
  calculateSic(input: SicInput): SicResult {
    return calculateSic(input);
  }

  async analyzeAestheticDecision(
    payload: AestheticDecisionInput,
    _salonId?: string,
  ): Promise<AestheticDecisionResponse> {
    const sic = payload?.sicInput ? calculateSic(payload.sicInput) : null;
    const structured = payload?.structuredData ?? {};
    const signals = payload?.imageSignals ?? {};
    const history = payload?.evolutionHistory ?? {};
    const sources = [structured, signals, history];

    const scoreCandidate = pickNumber(
      sources,
      'scoreIntegridade',
      'score',
      'integrityScore',
    );
    const score = Math.round(
      Math.max(0, Math.min(100, scoreCandidate ?? sic?.score_final ?? 70)),
    );

    let porosity = pickNumber(sources, 'porosidade', 'porosity');
    const elasticity = pickNumber(sources, 'elasticidade', 'elasticity');
    const damage = pickNumber(sources, 'nivel_dano', 'damage', 'damageLevel');
    const scalpSensitivity = pickNumber(
      sources,
      'sensibilidade',
      'sensibilidade_couro',
      'scalpSensitivity',
    );
    const scalpOil = pickNumber(sources, 'oleosidade', 'oiliness');
    const instability = pickNumber(
      sources,
      'instabilidade_pos_quimica',
      'postChemicalInstability',
    );
    const thermalLoad = pickNumber(sources, 'exposicao_termica', 'thermalLoad');

    // Novos cálculos estruturais
    let absorptionCoefficient: ReturnType<typeof computeAbsorptionMetrics> | null = null;
    if (payload.absorptionTest) {
      absorptionCoefficient = computeAbsorptionMetrics(payload.absorptionTest);
      if (absorptionCoefficient?.label && porosity === null) {
        if (absorptionCoefficient.label === 'baixa') porosity = 20;
        else if (absorptionCoefficient.label === 'media') porosity = 50;
        else if (absorptionCoefficient.label === 'alta') porosity = 80;
      }
    }

    let cuticleDiagnostic: ReturnType<typeof computeIptMetrics> | null = null;
    if (payload.cuticleDiagnostic) {
      cuticleDiagnostic = computeIptMetrics(payload.cuticleDiagnostic);
      if (cuticleDiagnostic?.label && porosity === null) {
        if (cuticleDiagnostic.label === 'baixa') porosity = 20;
        else if (cuticleDiagnostic.label === 'media') porosity = 50;
        else if (cuticleDiagnostic.label === 'alta') porosity = 80;
      }
    }

    const breakRiskPercentual = computeBreakRiskPercent(
      payload?.straighteningRiskContext?.porosityPercent ?? porosity,
      payload?.straighteningRiskContext?.elasticityPercent ?? elasticity,
    );

    const resolveRisk = (
      textKeys: string[],
      numericKeys: string[],
      fallback: RiskLevel,
    ): RiskLevel => {
      const text = pickText(sources, ...textKeys);
      const normalized = normalizeRiskText(text ?? undefined);
      if (normalized) return normalized;
      const value = pickNumber(sources, ...numericKeys);
      return inferRiskFromIndicators(value, fallback);
    };

    const fallbackRisk = riskFromScore(score);
    const indices: AestheticRiskIndexes = {
      termico: resolveRisk(
        ['risco_termico', 'termico', 'thermalRisk'],
        ['risco_termico', 'thermalRisk', 'termico'],
        fallbackRisk,
      ),
      quimico: resolveRisk(
        ['risco_quimico', 'quimico', 'chemicalRisk'],
        ['risco_quimico', 'chemicalRisk'],
        fallbackRisk,
      ),
      quebra: resolveRisk(
        ['risco_quebra', 'breakRisk'],
        ['risco_quebra', 'breakRisk'],
        fallbackRisk,
      ),
      elasticidade: resolveRisk(
        ['risco_elasticidade', 'elasticRisk'],
        ['risco_elasticidade', 'elasticRisk'],
        fallbackRisk,
      ),
      sensibilidade: resolveRisk(
        ['risco_sensibilidade', 'scalpRisk'],
        ['risco_sensibilidade', 'scalpRisk'],
        fallbackRisk,
      ),
    };

    if (breakRiskPercentual !== null && breakRiskPercentual > 70) {
      indices.quebra = 'critico';
    } else if (breakRiskPercentual !== null && breakRiskPercentual > 40) {
      if (indices.quebra !== 'critico') indices.quebra = 'elevado';
    }

    const breakCritical = indices.quebra === 'critico';
    const elasticCritical = indices.elasticidade === 'critico';
    const chemicalCritical = indices.quimico === 'critico';
    const sensitivityHigh = indices.sensibilidade === 'critico';

    const classification: 'apto' | 'apto_com_restricoes' | 'nao_apto' = (() => {
      if (
        score < 50 ||
        breakCritical ||
        elasticCritical ||
        chemicalCritical ||
        (instability ?? 0) > 60
      ) {
        return 'nao_apto';
      }
      if (
        score >= 75 &&
        indices.quimico !== 'elevado' &&
        indices.termico !== 'critico'
      ) {
        return 'apto';
      }
      return 'apto_com_restricoes';
    })();

    let allowStraightening = classification !== 'nao_apto' && !chemicalCritical;
    const straighteningReasons: string[] = [];
    if (!allowStraightening) {
      straighteningReasons.push(
        'Priorizar recuperação estrutural e estabilidade antes de química.',
      );
      if (breakCritical || elasticCritical) {
        straighteningReasons.push('Risco de quebra/elasticidade elevado.');
      }
      if ((instability ?? 0) > 60) {
        straighteningReasons.push('Instabilidade pós-química ativa.');
      }
    } else {
      if (indices.quimico === 'elevado') {
        straighteningReasons.push(
          'Aplicar somente formulação de baixa alcalinidade com monitoramento contínuo.',
        );
      } else {
        straighteningReasons.push(
          'Compatível com catálogo do salão seguindo limite de tempo/temperatura.',
        );
      }
    }

    // Bloqueio adicional por risco de quebra
    if (breakRiskPercentual !== null && breakRiskPercentual > 70) {
      allowStraightening = false;
      straighteningReasons.push(
        `Risco de quebra elevado (${breakRiskPercentual}%). Alisamento ácido bloqueado.`,
      );
    }

    const hydrationPriority = (porosity ?? 0) >= 60 || (damage ?? 0) >= 50;
    const nutritionPriority = (scalpOil ?? 0) >= 50 || (porosity ?? 0) >= 50;
    const reconstructionPriority = (elasticity ?? 100) < 55 || (damage ?? 0) >= 60;
    const cronograma4Semanas = buildCronogram(
      hydrationPriority,
      nutritionPriority,
      reconstructionPriority,
    );

    const preQuimicaSteps: string[] = [];
    if (reconstructionPriority) {
      preQuimicaSteps.push(
        'Reconstrução técnica + teste de mecha 7 dias antes do procedimento',
      );
    }
    if ((scalpSensitivity ?? 0) >= 50 || (scalpOil ?? 0) >= 55) {
      preQuimicaSteps.push(
        'Detox/controlador de couro cabeludo 48h antes para equilibrar sensibilidade',
      );
    }
    if (!preQuimicaSteps.length) {
      preQuimicaSteps.push('Check-up técnico completo e assinatura de segurança');
    }

    const posQuimicaSteps = allowStraightening
      ? [
          'Acidificação imediata + selagem cuticular',
          'Blindagem térmica e reposição lipídica leve',
        ]
      : [
          'Ciclo de recuperação intensiva (hidratação + reconstrução) por 30 dias',
          'Reavaliação técnica antes de qualquer nova química',
        ];

    const phText = pickText(sources, 'ph_estimado', 'ph');
    const phValue = pickNumber(sources, 'ph_estimado', 'ph');
    const phSuggestsAlkaline =
      (phValue !== null && phValue > 7) ||
      /alcalin/.test((phText ?? '').toLowerCase());
    const neutralizationRequired =
      phSuggestsAlkaline ||
      (elasticity ?? 100) < 45 ||
      (instability ?? 0) > 40 ||
      !allowStraightening;

    const neutralizationJustification = neutralizationRequired
      ? 'Fibra/couro indicam necessidade de estabilizar pH após processo (elasticidade/instabilidade).'
      : 'Fibra já acidificada e estável; manter apenas manutenção leve.';

    const maintenanceIntervalDays =
      classification === 'apto'
        ? 60
        : classification === 'apto_com_restricoes'
          ? 45
          : 30;

    const scalpTreatments = [] as Array<{
      nome: string;
      indicacao: string;
      frequencia: string;
    }>;
    if ((scalpSensitivity ?? 0) >= 50) {
      scalpTreatments.push({
        nome: 'Calmante dérmico em cabine',
        indicacao: 'Sensibilidade/descamação aparente',
        frequencia: '1x a cada 10 dias',
      });
    }
    if ((scalpOil ?? 0) >= 50) {
      scalpTreatments.push({
        nome: 'Detox enzimático suave',
        indicacao: 'Oleosidade/resíduos antes de protocolos',
        frequencia: '1x por semana',
      });
    }

    const homeCare = allowStraightening
      ? [
          'Home care: shampoo equilibrante + máscara nutritiva 1-2x/semana',
          'Leave-in com proteção térmica diária',
        ]
      : [
          'Programa de hidratação e nutrição alternada (2x/semana)',
          'Protetor térmico e blindagem de pontas até liberar química',
        ];

    const alertasTecnicos: string[] = [];
    if (classification === 'nao_apto') {
      alertasTecnicos.push('Bloquear química até completar ciclo de recuperação.');
    }
    if (thermalLoad && thermalLoad > 60) {
      alertasTecnicos.push('Reduzir fonte térmica e aplicar protetor em todas as escovas.');
    }
    if (neutralizationRequired) {
      alertasTecnicos.push('Neutralização/pH obrigatória para evitar instabilidade.');
    }

    const medicalReferralNeeded =
      sensitivityHigh || (scalpSensitivity ?? 0) >= 80;

    const confidenceBase =
      60 +
      [porosity, elasticity, damage, scalpSensitivity, scalpOil]
        .filter((value) => value !== null)
        .length * 4 -
      (classification === 'nao_apto' ? 5 : 0);
    const confiancaAnalise = Math.max(55, Math.min(95, confidenceBase));

    const resumoTecnicoParts = [
      'Resultado conservador baseado em sinais estruturais/couro informados.',
      `Score estimado: ${score}/100 (${classification.replace('_', ' ')}).`,
    ];
    if (porosity !== null) {
      resumoTecnicoParts.push(`Porosidade estimada: ${Math.round(porosity)}%.`);
    }
    if (elasticity !== null) {
      resumoTecnicoParts.push(
        `Elasticidade observada: ${Math.round(elasticity)}%.`,
      );
    }
    if (absorptionCoefficient) {
      resumoTecnicoParts.push(
        `Coeficiente de Absorção: ${absorptionCoefficient.index} (${absorptionCoefficient.label}).`,
      );
    }
    if (cuticleDiagnostic) {
      resumoTecnicoParts.push(
        `Diagnóstico de Cutícula (IPT): ${cuticleDiagnostic.score} (${cuticleDiagnostic.label}).`,
      );
    }
    if (breakRiskPercentual !== null) {
      resumoTecnicoParts.push(`Risco de quebra estimado: ${breakRiskPercentual}%.`);
    }

    // Derivar base de tratamento a partir da porosidade consolidada
    let baseTratamento: { foco: 'baixa' | 'media' | 'alta'; descricao: string } | undefined = undefined;
    if (porosity !== null) {
      const porosityLabel = porosityLabelFromPercent(porosity);
      if (porosityLabel) {
        const derived = deriveTreatmentBase(porosityLabel);
        baseTratamento = {
          foco: derived.label,
          descricao: derived.description,
        };
      }
    }

    return {
      resumoTecnico: resumoTecnicoParts.join(' '),
      scoreIntegridade: score,
      sicResult: sic ?? undefined,
      indicesRisco: indices,
      classificacaoAptidao: classification,
      absorptionCoefficient: absorptionCoefficient ?? undefined,
      cuticleDiagnostic: cuticleDiagnostic
        ? {
            ipt: cuticleDiagnostic.score,
            label: cuticleDiagnostic.label,
            toque: cuticleDiagnostic.components.toque,
            brilho: cuticleDiagnostic.components.brilho,
            elasticidade: cuticleDiagnostic.components.elasticidade,
            historico: cuticleDiagnostic.components.historico,
          }
        : undefined,
      breakRiskPercentual: breakRiskPercentual ?? undefined,
      alisamentoSelecionado: {
        nome: allowStraightening ? 'Alisamento compatível (baixa alcalinidade)' : 'nao aplicavel',
        justificativa: straighteningReasons.join(' '),
      },
      protocoloPersonalizado: {
        baseTratamento: baseTratamento ?? undefined,
        preQuimica: preQuimicaSteps,
        alisamento: {
          produto: allowStraightening ? 'Catalogado conforme matriz do salão' : 'nao aplicavel',
          tempoEstimado: allowStraightening ? '30-40 minutos com controle de mecha' : 'nao aplicavel',
          neutralizacao: {
            obrigatoria: neutralizationRequired,
            produto: neutralizationRequired
              ? 'Acidificante/neutralizante pH 3,5-4,5'
              : 'Manutenção leve',
            tempo: neutralizationRequired ? '3-5 minutos' : '2-3 minutos',
            justificativa: neutralizationJustification,
          },
        },
        posQuimica: posQuimicaSteps,
        cronograma4Semanas,
      },
      alertasTecnicos,
      confiancaAnalise,
      // Extra context so frontend consegue derivar protocolos complementares
      // mesmo em fallback
      // (mantido em propriedades já conhecidas do response)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ...({
        maintenanceIntervalDays,
        scalpTreatments,
        homeCare,
        medicalReferral: {
          needed: medicalReferralNeeded,
          reason: medicalReferralNeeded
            ? 'Sensibilidade do couro acima do limite estético.'
            : 'Sem indicação clínica no momento.',
          guidance: medicalReferralNeeded
            ? 'Orientar avaliação dermatológica/tricológica antes de novas químicas.'
            : 'Manter acompanhamento estético regular.',
        },
        returnPlan: {
          periodo: `Retorno em ${maintenanceIntervalDays} dias`,
          objetivo:
            classification === 'nao_apto'
              ? 'Validar recuperação estrutural e liberar química com segurança'
              : 'Ajustar combo, reforçar neutralização e conferir estabilidade',
        },
      } as Partial<AestheticDecisionResponse>),
    };
  }

  async analyzePremium(payload: any, _salonId: string) {
    const summary =
      payload?.visionResult?.summary || 'Análise concluída com sucesso.';
    return {
      aiExplanation: {
        summary,
        riskLevel: payload?.visionResult?.riskLevel || 'moderado',
        technicalDetails:
          payload?.visionResult?.technicalDetails || 'Detalhes não fornecidos.',
      },
      recommendations: payload?.visionResult?.recommendations || {},
      professionalAlert: payload?.visionResult?.professionalAlert || null,
    };
  }

  async analyzeVisionImage(payload: any, _salonId: string) {
    return {
      deterministicResult: payload?.deterministicResult || null,
      aiExplanation: payload?.aiExplanation || {
        summary: 'Análise automática concluída.',
        riskLevel: 'moderado',
      },
      recommendations: payload?.availableStraightenings || [],
      visionResult: payload || {},
    };
  }

  async analyzeAestheticDecision(payload: any, salonId?: string) {
    // fallback para compatibilidade: reutiliza analyzePremium para evitar duplicação
    const base = await this.analyzePremium(payload, salonId || '');
    return {
      ...base,
      decisionType: 'aesthetic',
    };
  }

  async calculateSic(body: any) {
    const requiredKeys = [
      'porosidade',
      'elasticidade',
      'resistencia',
      'historico_quimico',
      'dano_termico',
      'dano_mecanico',
      'instabilidade_pos_quimica',
      'quimicas_incompativeis',
    ];

    const valid = requiredKeys.every((key) =>
      Number.isFinite((body as any)[key]),
    );

    if (!valid) {
      throw new Error('Entrada SIC inválida');
    }

    const score = Math.max(
      0,
      100 -
        [
          body.porosidade,
          body.elasticidade,
          body.resistencia,
          body.dano_termico,
          body.dano_mecanico,
          body.instabilidade_pos_quimica,
          body.quimicas_incompativeis,
        ].reduce((acc: number, val: number) => acc + Number(val || 0), 0),
    );

    return {
      sicScore: Number(score.toFixed(2)),
      status:
        score >= 80 ? 'baixo' : score >= 50 ? 'moderado' : score >= 20 ? 'elevado' : 'critico',
    };
  }
}
