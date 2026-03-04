import {
  DEFAULT_WEIGHT_PROFILE,
  WEIGHT_PROFILES,
} from './analysis-engine.constants';
import type { AnalysisInput, WeightProfileId } from './analysis-engine.types';
import {
  hasValue,
  invertPercent,
  normalizePercent,
  round,
  weightedAverage,
} from './analysis-engine.utils';

export function calculateFiberIntegrityScore(
  input: AnalysisInput,
): { score: number; profileId: WeightProfileId } {
  const profileId = input.profileId || DEFAULT_WEIGHT_PROFILE;
  const profile = WEIGHT_PROFILES[profileId];

  const thermalMechanicalDamage =
    hasValue(input.thermalDamage) || hasValue(input.mechanicalDamage)
      ? round(
          weightedAverage([
            ...(hasValue(input.thermalDamage)
              ? [{ score: input.thermalDamage, weight: 0.5 }]
              : []),
            ...(hasValue(input.mechanicalDamage)
              ? [{ score: input.mechanicalDamage, weight: 0.5 }]
              : []),
          ]),
          2,
        )
      : null;

  const entries: Array<{ score: number; weight: number }> = [];
  const weights = profile.weights;

  if (hasValue(input.elasticity)) {
    entries.push({ score: normalizePercent(input.elasticity), weight: weights.elasticity });
  }

  if (hasValue(input.resistance)) {
    entries.push({ score: normalizePercent(input.resistance), weight: weights.resistance });
  }

  if (hasValue(input.porosity) && typeof weights.porosity === 'number') {
    entries.push({ score: invertPercent(input.porosity), weight: weights.porosity });
  }

  if (
    hasValue(input.chemicalHistoryImpact) &&
    typeof weights.chemicalHistoryImpact === 'number'
  ) {
    entries.push({
      score: invertPercent(input.chemicalHistoryImpact),
      weight: weights.chemicalHistoryImpact,
    });
  }

  if (
    hasValue(thermalMechanicalDamage) &&
    typeof weights.thermalMechanicalDamage === 'number'
  ) {
    entries.push({
      score: invertPercent(thermalMechanicalDamage),
      weight: weights.thermalMechanicalDamage,
    });
  }

  const score = round(weightedAverage(entries));

  return {
    score: normalizePercent(score),
    profileId,
  };
}
