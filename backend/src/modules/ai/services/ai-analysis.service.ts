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
}
