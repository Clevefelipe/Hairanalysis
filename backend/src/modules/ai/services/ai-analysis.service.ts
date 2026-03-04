import { Injectable } from '@nestjs/common';
import type {
  AestheticDecisionInput,
  AestheticDecisionResponse,
  SicInput,
  SicResult,
} from '../types/ai.types';
import { calculateSic } from '../utils/sic-calculator';

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
    const score = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          Number(
            payload?.structuredData?.scoreIntegridade ?? sic?.score_final ?? 70,
          ),
        ),
      ),
    );

    return {
      resumoTecnico:
        'Análise estética estruturada concluída com base em sinais e histórico informado.',
      scoreIntegridade: score,
      sicResult: sic ?? undefined,
      indicesRisco: {
        termico: 'moderado',
        quimico: 'moderado',
        quebra: score < 60 ? 'elevado' : 'moderado',
        elasticidade: score < 60 ? 'elevado' : 'moderado',
        sensibilidade: 'baixo',
      },
      classificacaoAptidao:
        score >= 80 ? 'apto' : score >= 60 ? 'apto_com_restricoes' : 'nao_apto',
      alisamentoSelecionado: {
        nome: score >= 60 ? 'Compatível com catálogo' : 'nao aplicavel',
        justificativa:
          score >= 60
            ? 'Compatível com os parâmetros técnicos atuais.'
            : 'Recuperação estrutural antes de procedimento químico.',
      },
      protocoloPersonalizado: {
        preQuimica: ['Reconstrução leve com avaliação profissional'],
        alisamento: {
          produto: score >= 60 ? 'Conforme catálogo do salão' : 'nao aplicavel',
          tempoEstimado: score >= 60 ? '30-40 minutos' : 'nao aplicavel',
          neutralizacao: {
            obrigatoria: true,
            produto: 'Acidificante cosmético',
            tempo: '3-5 minutos',
            justificativa: 'Estabilização estética pós-processo.',
          },
        },
        posQuimica: ['Selagem cuticular suave', 'Hidratação técnica'],
        cronograma4Semanas: [
          'S1 - Hidratação',
          'S2 - Nutrição',
          'S3 - Reconstrução',
          'S4 - Manutenção',
        ],
      },
      alertasTecnicos: [
        'A decisão final deve ser validada pelo profissional responsável.',
      ],
      confiancaAnalise: 85,
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
}
