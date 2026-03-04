import {
  MIN_CONFIDENCE_FOR_AUTOMATIC_APTITUDE,
  SCORE_BANDS,
} from './analysis-engine.constants';
import {
  AnalysisMode,
  AptitudeClassification,
} from './analysis-engine.types';

export function calculateAptitudeClassification(params: {
  score: number;
  confidence: number;
  mode: AnalysisMode;
  scalpRiskIndex: number;
}): {
  aptitude: AptitudeClassification;
  aptitudeLabel: string;
  aptitudeMessage: string;
  canSuggestStraightening: boolean;
} {
  const { score, confidence, mode, scalpRiskIndex } = params;

  if (confidence < MIN_CONFIDENCE_FOR_AUTOMATIC_APTITUDE) {
    return {
      aptitude: AptitudeClassification.BLOCKED_LOW_CONFIDENCE,
      aptitudeLabel: 'Bloqueado por baixa confiabilidade',
      aptitudeMessage:
        'Análise com baixa confiabilidade técnica. Recomenda-se nova captura de imagem.',
      canSuggestStraightening: false,
    };
  }

  if (mode === AnalysisMode.TRICOLOGICA) {
    return {
      aptitude: AptitudeClassification.BLOCKED_TRICHOLOGICAL_MODE,
      aptitudeLabel: 'Sem aptidão de alisamento no modo tricológico',
      aptitudeMessage:
        'Modo tricológico estético: foco em cuidados do couro cabeludo e retorno de manutenção.',
      canSuggestStraightening: false,
    };
  }

  if (scalpRiskIndex >= 70) {
    return {
      aptitude: AptitudeClassification.NOT_APTO,
      aptitudeLabel: 'Não apto',
      aptitudeMessage:
        'Risco elevado no couro cabeludo. Aptidão estética para alisamento bloqueada até estabilização.',
      canSuggestStraightening: false,
    };
  }

  if (score <= SCORE_BANDS.NOT_APTO_MAX) {
    return {
      aptitude: AptitudeClassification.NOT_APTO,
      aptitudeLabel: 'Não apto',
      aptitudeMessage:
        'Não apresenta aptidão estética para procedimentos de alisamento no momento.',
      canSuggestStraightening: false,
    };
  }

  if (score <= SCORE_BANDS.CONDITIONAL_MAX) {
    return {
      aptitude: AptitudeClassification.CONDITIONAL,
      aptitudeLabel: 'Aptidão condicionada',
      aptitudeMessage:
        'Apresenta aptidão estética condicionada para procedimentos de alisamento, conforme parâmetros técnicos do sistema.',
      canSuggestStraightening: true,
    };
  }

  if (score <= SCORE_BANDS.CAUTION_MAX) {
    return {
      aptitude: AptitudeClassification.CAUTION,
      aptitudeLabel: 'Apto com cautela',
      aptitudeMessage:
        'Apresenta aptidão estética para procedimentos de alisamento, conforme parâmetros técnicos do sistema.',
      canSuggestStraightening: true,
    };
  }

  return {
    aptitude: AptitudeClassification.AESTHETIC,
    aptitudeLabel: 'Apto estético',
    aptitudeMessage:
      'Apresenta aptidão estética para procedimentos de alisamento, conforme parâmetros técnicos do sistema.',
    canSuggestStraightening: true,
  };
}
