import { calculateAnalysisResult } from './analysis-engine.service';
import { AnalysisMode, WeightProfileId } from './analysis-engine.types';

describe('deterministic-score', () => {
  it('keeps deterministic score for identical input', () => {
    const input = {
      mode: AnalysisMode.CAPILAR,
      profileId: WeightProfileId.CHEMICALLY_TREATED,
      elasticity: 80,
      resistance: 70,
      porosity: 30,
      chemicalHistoryImpact: 40,
      imageQuality: 95,
    };

    const resultA = calculateAnalysisResult(input);
    const resultB = calculateAnalysisResult(input);

    expect(resultA).toEqual(resultB);
    expect(resultA.score).toBe(72);
    expect(resultA.weightProfileVersion).toBe('v1.2.0');
  });
});
