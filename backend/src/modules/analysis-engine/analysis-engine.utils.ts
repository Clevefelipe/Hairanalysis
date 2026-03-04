import { RiskLevel } from './analysis-engine.types';

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const round = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const hasValue = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

export const normalizePercent = (value: number): number => clamp(value, 0, 100);

export const invertPercent = (value: number): number => 100 - normalizePercent(value);

export const weightedAverage = (
  entries: Array<{ score: number; weight: number }>,
): number => {
  if (entries.length === 0) {
    return 0;
  }

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const weightedSum = entries.reduce(
    (sum, entry) => sum + normalizePercent(entry.score) * entry.weight,
    0,
  );
  return weightedSum / totalWeight;
};

export const mapRiskLevel = (riskScore: number): RiskLevel => {
  const safe = normalizePercent(riskScore);

  if (safe >= 80) return RiskLevel.CRITICAL;
  if (safe >= 60) return RiskLevel.HIGH;
  if (safe >= 35) return RiskLevel.MODERATE;
  return RiskLevel.LOW;
};
