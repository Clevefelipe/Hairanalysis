import { calculateAptitudeClassification } from './aptitude.engine';
import { AnalysisMode } from './analysis-engine.types';
import { MIN_CONFIDENCE_FOR_AUTOMATIC_APTITUDE } from './analysis-engine.constants';

describe('aptitude.engine - baixa confiabilidade', () => {
  it('bloqueia aptidão quando confidence < limiar, independentemente do score', () => {
    const below = MIN_CONFIDENCE_FOR_AUTOMATIC_APTITUDE - 1;
    const result = calculateAptitudeClassification({
      score: 90,
      confidence: below,
      mode: AnalysisMode.CAPILAR,
      scalpRiskIndex: 0,
    });

    expect(result.aptitudeMessage.toLowerCase()).toContain('baixa confiabilidade');
    expect(result.aptitude).toBeDefined();
    expect(result.canSuggestStraightening).toBe(false);
  });
});
