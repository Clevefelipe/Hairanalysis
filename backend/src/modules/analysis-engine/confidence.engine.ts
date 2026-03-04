import { ANALYSIS_TOTAL_FIELDS } from './analysis-engine.constants';
import type { AnalysisInput } from './analysis-engine.types';
import { hasValue, normalizePercent, round } from './analysis-engine.utils';

export function calculateConfidence(input: AnalysisInput): number {
  const fields = [
    input.porosity,
    input.elasticity,
    input.resistance,
    input.chemicalHistoryImpact,
    input.thermalDamage,
    input.mechanicalDamage,
    input.scalpSensitivity,
    input.imageQuality,
  ];

  const availableCount = fields.filter((value) => hasValue(value)).length;
  const completeness = (availableCount / ANALYSIS_TOTAL_FIELDS) * 100;

  let confidence = completeness;

  if (hasValue(input.imageQuality)) {
    confidence = confidence * 0.6 + normalizePercent(input.imageQuality) * 0.4;
  }

  if (input.blurredImage) confidence -= 15;
  if (input.lowLighting) confidence -= 12;
  if (input.partialCapture) confidence -= 10;
  if (input.incompleteData) confidence -= 10;

  return Math.max(0, Math.min(100, round(confidence)));
}
