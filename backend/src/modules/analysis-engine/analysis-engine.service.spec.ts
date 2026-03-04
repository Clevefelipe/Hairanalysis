import {
  calculateAnalysisResult,
  AnalysisEngineService,
} from './analysis-engine.service';
import {
  AnalysisMode,
  AptitudeClassification,
  type AnalysisInput,
  WeightProfileId,
} from './analysis-engine.types';

describe('analysis-engine', () => {
  const completeHealthyInput: AnalysisInput = {
    mode: AnalysisMode.CAPILAR,
    profileId: WeightProfileId.CHEMICALLY_TREATED,
    porosity: 25,
    elasticity: 84,
    resistance: 80,
    chemicalHistoryImpact: 30,
    thermalDamage: 22,
    mechanicalDamage: 18,
    scalpSensitivity: 20,
    imageQuality: 88,
  };

  it('calculates deterministic result for complete input', () => {
    const result = calculateAnalysisResult(completeHealthyInput);

    expect(result.score).toBe(79);
    expect(result.riskIndex).toBe(21);
    expect(result.aptitude).toBe(AptitudeClassification.CAUTION);
    expect(result.weightProfileVersion).toBe('v1.2.0');
    expect(result.confidence).toBe(95);
  });

  it('blocks aptitude when confidence is below legal threshold', () => {
    const lowConfidenceInput: AnalysisInput = {
      mode: AnalysisMode.CAPILAR,
      profileId: WeightProfileId.CHEMICALLY_TREATED,
      elasticity: 84,
      resistance: 80,
      imageQuality: 35,
      blurredImage: true,
      lowLighting: true,
      partialCapture: true,
      incompleteData: true,
    };

    const result = calculateAnalysisResult(lowConfidenceInput);

    expect(result.confidence).toBeLessThan(60);
    expect(result.aptitude).toBe(
      AptitudeClassification.BLOCKED_LOW_CONFIDENCE,
    );
    expect(result.canSuggestStraightening).toBe(false);
  });

  it('blocks straightening aptitude in trichological mode', () => {
    const trichologicalInput: AnalysisInput = {
      ...completeHealthyInput,
      mode: AnalysisMode.TRICOLOGICA,
      imageQuality: 90,
    };

    const result = calculateAnalysisResult(trichologicalInput);

    expect(result.aptitude).toBe(
      AptitudeClassification.BLOCKED_TRICHOLOGICAL_MODE,
    );
    expect(result.canSuggestStraightening).toBe(false);
  });

  it('supports service usage in Nest providers', () => {
    const service = new AnalysisEngineService();
    const result = service.calculateAnalysisResult(completeHealthyInput);
    expect(result.score).toBe(79);
  });

  it('is mathematically repeatable for identical input', () => {
    const a = calculateAnalysisResult(completeHealthyInput);
    const b = calculateAnalysisResult(completeHealthyInput);
    expect(a).toEqual(b);
  });
});
