import { calculateAptitudeClassification } from './aptitude.engine';
import { AnalysisMode, AptitudeClassification } from './analysis-engine.types';

describe('aptitude-block-trichology', () => {
  it('blocks straightening aptitude in trichological mode', () => {
    const result = calculateAptitudeClassification({
      score: 92,
      confidence: 88,
      mode: AnalysisMode.TRICOLOGICA,
      scalpRiskIndex: 20,
    });

    expect(result.aptitude).toBe(
      AptitudeClassification.BLOCKED_TRICHOLOGICAL_MODE,
    );
    expect(result.canSuggestStraightening).toBe(false);
    expect(result.aptitudeMessage.toLowerCase()).toContain('modo tricol');
  });
});
