import { Injectable } from '@nestjs/common';

@Injectable()
export class AiAnalysisService {
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
