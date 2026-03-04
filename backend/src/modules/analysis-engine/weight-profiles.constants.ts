export const WEIGHT_PROFILE_VERSION = 'v1.0.0';

export const LEGAL_WEIGHT_PROFILES = {
  VIRGEM: {
    label: 'Perfil Técnico - Virgem',
    weights: {
      elasticity: 0.3,
      resistance: 0.3,
      porosity: 0.25,
      thermalMechanicalDamage: 0.15,
    },
  },
  QUIMICAMENTE_TRATADO: {
    label: 'Perfil Técnico - Quimicamente Tratado',
    weights: {
      elasticity: 0.4,
      resistance: 0.3,
      chemicalHistoryImpact: 0.2,
      porosity: 0.1,
    },
  },
  ALTA_SENSIBILIDADE: {
    label: 'Perfil Técnico - Alta Sensibilidade',
    weights: {
      elasticity: 0.45,
      resistance: 0.35,
      chemicalHistoryImpact: 0.2,
    },
  },
} as const;
