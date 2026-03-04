import type { AnalysisInput, AnalysisRiskResult } from './analysis-engine.types';
import {
  hasValue,
  invertPercent,
  mapRiskLevel,
  normalizePercent,
  weightedAverage,
  round,
} from './analysis-engine.utils';

export function calculateRiskLevels(input: AnalysisInput): AnalysisRiskResult {
  const thermalRisk = hasValue(input.thermalDamage)
    ? normalizePercent(input.thermalDamage)
    : 50;

  const chemicalRisk = weightedAverage([
    ...(hasValue(input.chemicalHistoryImpact)
      ? [{ score: normalizePercent(input.chemicalHistoryImpact), weight: 0.7 }]
      : []),
    ...(hasValue(input.porosity)
      ? [{ score: normalizePercent(input.porosity), weight: 0.3 }]
      : []),
  ]);

  const breakageRisk = weightedAverage([
    ...(hasValue(input.mechanicalDamage)
      ? [{ score: normalizePercent(input.mechanicalDamage), weight: 0.45 }]
      : []),
    ...(hasValue(input.resistance)
      ? [{ score: invertPercent(input.resistance), weight: 0.4 }]
      : []),
    ...(hasValue(input.elasticity)
      ? [{ score: invertPercent(input.elasticity), weight: 0.15 }]
      : []),
  ]);

  const elasticityRisk = hasValue(input.elasticity)
    ? invertPercent(input.elasticity)
    : 50;

  const scalpRisk = hasValue(input.scalpSensitivity)
    ? normalizePercent(input.scalpSensitivity)
    : 50;

  const overallIndex = round(
    weightedAverage([
      { score: thermalRisk, weight: 0.15 },
      { score: chemicalRisk, weight: 0.25 },
      { score: breakageRisk, weight: 0.25 },
      { score: elasticityRisk, weight: 0.2 },
      { score: scalpRisk, weight: 0.15 },
    ]),
  );

  return {
    thermal: mapRiskLevel(thermalRisk),
    chemical: mapRiskLevel(chemicalRisk),
    breakage: mapRiskLevel(breakageRisk),
    elasticity: mapRiskLevel(elasticityRisk),
    scalpSensitivity: mapRiskLevel(scalpRisk),
    scalpRiskIndex: round(scalpRisk),
    overallIndex,
  };
}
