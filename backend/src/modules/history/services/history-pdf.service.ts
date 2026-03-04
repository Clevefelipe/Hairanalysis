import { HistoryEntity } from '../history.entity';

export function buildHistoryPdfPayload(history: HistoryEntity) {
  return {
    title: 'Relatório de Análise Capilar',
    clientId: history.clientId,
    professionalId: history.professionalId,
    analysis: history.visionResult,
    explanation: history.aiExplanation,
    recommendations: history.recommendations,
    createdAt: history.createdAt,
  };
}
