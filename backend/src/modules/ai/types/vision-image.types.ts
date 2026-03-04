export type VisionImageAnalysisInput = {
  analysisType: 'capilar' | 'tricologica' | 'geral';
  imageBase64: string;
  mimeType: string;
  source?: string;
  notes?: string;
  knowledgeContext?: string;
  uvMode?: boolean;
  uvFlags?: string[];
  microscopyAlerts?: string[];
  imageSignals?: Record<string, any>;
  availableStraightenings?: Array<{
    name: string;
    criteria?: Record<string, any>;
    observations?: string;
  }>;
};

export type VisionImageAnalysisOutput = {
  score: number;
  analysis_confidence?: number;
  interpretation: string;
  flags: string[];
  signals: Record<string, any>;
  structured: {
    hairProfile: {
      hairType?: string;
      curlPattern?: string;
      volume?: string;
      porosity?: string;
      elasticity?: string;
      resistance?: string;
      thickness?: string;
      coloring?: string;
      grayHair?: string;
      lastChemicalInterval?: string;
    };
    damageAssessment: {
      mechanical: string[];
      thermal: string[];
      chemical: string[];
      severity: 'baixo' | 'medio' | 'alto';
    };
    scalpAssessment?: {
      oiliness?: string;
      scaling?: string;
      sensitivity?: string;
      thinning?: string;
      shedding?: string;
    };
    professionalGuidance: {
      procedureReadiness: 'apto' | 'restricoes' | 'nao_apto';
      immediateAlerts: string[];
      indications: string[];
      contraindications: string[];
      cutRecommendation: {
        needed: boolean;
        type: string;
        reason: string;
      };
    };
  };
};
