export enum RiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AnalysisMode {
  CAPILAR = 'capilar',
  TRICOLOGICA = 'tricologica',
}

export enum WeightProfileId {
  VIRGIN = 'VIRGIN',
  CHEMICALLY_TREATED = 'CHEMICALLY_TREATED',
  HIGH_STRUCTURAL_SENSITIVITY = 'HIGH_STRUCTURAL_SENSITIVITY',
}

export enum AptitudeClassification {
  NOT_APTO = 'NAO_APTO',
  CONDITIONAL = 'APTIDAO_CONDICIONADA',
  CAUTION = 'APTO_COM_CAUTELA',
  AESTHETIC = 'APTO_ESTETICO',
  BLOCKED_LOW_CONFIDENCE = 'BLOQUEADO_BAIXA_CONFIANCA',
  BLOCKED_TRICHOLOGICAL_MODE = 'BLOQUEADO_MODO_TRICOLOGICO',
}

export interface AnalysisInput {
  mode?: AnalysisMode;
  profileId?: WeightProfileId;
  elasticity?: number | null;
  porosity?: number | null;
  resistance?: number | null;
  chemicalHistoryImpact?: number | null;
  thermalDamage?: number | null;
  mechanicalDamage?: number | null;
  scalpSensitivity?: number | null;
  imageQuality?: number | null;
  lowLighting?: boolean;
  blurredImage?: boolean;
  partialCapture?: boolean;
  incompleteData?: boolean;
}

export interface AnalysisRiskResult {
  thermal: RiskLevel;
  chemical: RiskLevel;
  breakage: RiskLevel;
  elasticity: RiskLevel;
  scalpSensitivity: RiskLevel;
  scalpRiskIndex: number;
  overallIndex: number;
}

export interface AnalysisResult {
  score: number;
  riskIndex: number;
  risk: AnalysisRiskResult;
  aptitude: AptitudeClassification;
  aptitudeLabel: string;
  aptitudeMessage: string;
  confidence: number;
  canSuggestStraightening: boolean;
  weightProfileId: WeightProfileId;
  weightProfileVersion: string;
}
