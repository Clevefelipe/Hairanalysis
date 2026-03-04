import { WeightProfileId } from './analysis-engine.types';
import {
  LEGAL_WEIGHT_PROFILES,
  WEIGHT_PROFILE_VERSION,
} from './weight-profiles.constants';
export { WEIGHT_PROFILE_VERSION };

export const ANALYSIS_TOTAL_FIELDS = 8;

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
    label: LEGAL_WEIGHT_PROFILES.VIRGEM.label,
    weights: LEGAL_WEIGHT_PROFILES.VIRGEM.weights,
  },
  [WeightProfileId.CHEMICALLY_TREATED]: {
    label: LEGAL_WEIGHT_PROFILES.QUIMICAMENTE_TRATADO.label,
    weights: LEGAL_WEIGHT_PROFILES.QUIMICAMENTE_TRATADO.weights,
  },
  [WeightProfileId.HIGH_STRUCTURAL_SENSITIVITY]: {
    label: LEGAL_WEIGHT_PROFILES.ALTA_SENSIBILIDADE.label,
    weights: LEGAL_WEIGHT_PROFILES.ALTA_SENSIBILIDADE.weights,
  },
} as const;

export const DEFAULT_WEIGHT_PROFILE = WeightProfileId.CHEMICALLY_TREATED;

export const SCORE_BANDS = {
  NOT_APTO_MAX: 39,
  CONDITIONAL_MAX: 59,
  CAUTION_MAX: 79,
} as const;

export const MIN_CONFIDENCE_FOR_AUTOMATIC_APTITUDE = 60;
