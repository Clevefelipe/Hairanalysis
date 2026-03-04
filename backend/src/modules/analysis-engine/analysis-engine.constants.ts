import { WeightProfileId } from './analysis-engine.types';

export const ANALYSIS_TOTAL_FIELDS = 8;

export const WEIGHT_PROFILE_VERSION = 'v1.2.0';

export const WEIGHT_PROFILES: Record<
  WeightProfileId,
  {
    label: string;
    weights: {
      elasticity: number;
      resistance: number;
      porosity?: number;
      chemicalHistoryImpact?: number;
      thermalMechanicalDamage?: number;
    };
  }
> = {
  [WeightProfileId.VIRGIN]: {
    label: 'Perfil 1 - Cabelo Virgem',
    weights: {
      elasticity: 0.3,
      resistance: 0.3,
      porosity: 0.25,
      thermalMechanicalDamage: 0.15,
    },
  },
  [WeightProfileId.CHEMICALLY_TREATED]: {
    label: 'Perfil 2 - Cabelo Quimicamente Tratado',
    weights: {
      elasticity: 0.4,
      resistance: 0.3,
      chemicalHistoryImpact: 0.2,
      porosity: 0.1,
    },
  },
  [WeightProfileId.HIGH_STRUCTURAL_SENSITIVITY]: {
    label: 'Perfil 3 - Alta Sensibilidade Estrutural',
    weights: {
      elasticity: 0.45,
      resistance: 0.35,
      chemicalHistoryImpact: 0.2,
    },
  },
} as const;

export const DEFAULT_WEIGHT_PROFILE = WeightProfileId.CHEMICALLY_TREATED;

export const SCORE_BANDS = {
  NOT_APTO_MAX: 39,
  CONDITIONAL_MAX: 59,
  CAUTION_MAX: 79,
} as const;

export const MIN_CONFIDENCE_FOR_AUTOMATIC_APTITUDE = 60;
