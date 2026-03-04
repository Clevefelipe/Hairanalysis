import { HistoryEntity } from './history.entity';

export function generateHistoryPdf(history: HistoryEntity) {
  return {
    title: 'Relatório de Análise Capilar',
    clientId: history.clientId,
    analysis: history.visionResult,
    explanation: history.aiExplanation,
    recommendations: history.recommendations,
    createdAt: history.createdAt,
  };
}
