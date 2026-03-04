export interface BuildPromptInput {
  hair_type?: string;
  density?: string;
  porosity_level?: number;
  elasticity?: string;
  chemical_history?: Record<string, any>;
  main_complaint?: string;
}

export interface SicInput {
  porosidade: number;
  elasticidade: number;
  resistencia: number;
  historico_quimico: number;
  dano_termico: number;
  dano_mecanico: number;
  instabilidade_pos_quimica: number;
  quimicas_incompativeis: number;
}

export interface SicResult {
  score_final: number;
  classificacao:
    | 'Saudável'
    | 'Leve comprometimento'
    | 'Comprometimento moderado'
    | 'Alto risco'
    | 'Crítico';
  penalidade_aplicada: boolean;
}

export type HairAnalysisRiskLevel = 'baixo' | 'medio' | 'alto';

export interface HairAnalysisPremiumInput {
  visionResult: Record<string, any>;
  clientContext?: Record<string, any>;
}

export interface HairAnalysisPremiumResponse {
  aiExplanation: {
    summary: string;
    riskLevel: HairAnalysisRiskLevel;
    technicalDetails: string;
    analysisConfidence?: number;
    knowledgeBase?: string;
    riskFactors?: string[];
    clinicalLimits?: string;
  };
  recommendations: {
    recommendedStraightenings: string[];
    restrictedProcedures: string[];
    proceduresJustification?: {
      recommended?: Record<string, string>;
      restricted?: Record<string, string>;
    };
    treatments: string[];
    scalpTreatments?: Array<{
      nome: string;
      indicacao: string;
      frequencia?: string;
    }>;
    treatmentProtocol?: {
      phase1?: string;
      phase2?: string;
      phase3?: string;
    };
    neutralization?: {
      obrigatoria: boolean;
      produto?: string;
      tempo?: string;
      justificativa: string;
    };
    returnPlan?: {
      periodo?: string;
      objetivo?: string;
    };
    maintenanceIntervalDays: number;
    homeCare: string[];
    medicalReferral?: {
      needed: boolean;
      reason: string;
      guidance: string;
    };
  };
  professionalAlert: string;
  prognosis?: {
    shortTerm?: string;
    mediumTerm?: string;
    longTerm?: string;
  };
}

export interface HairAnalysisAIResponse {
  quantitativeAnalysis: {
    density: string;
    morphology: string;
    canicieIndex: string;
  };
  straighteningProtocol: {
    chemicalAptitude: 'Sim' | 'Não' | 'Com Restrições';
    recommendedActives: string[];
    flatIronTemperature: number;
    pauseTimeMinutes: number;
  };
  recoveryPlan: {
    week1: string;
    week2: string;
    week3: string;
    week4: string;
    salonCare: string[];
    homeCare: string[];
  };
  evolutionPanel: {
    currentState: string;
    goal90Days: string;
  };
}

export interface AestheticDecisionInput {
  structuredData?: Record<string, any>;
  imageSignals?: Record<string, any>;
  evolutionHistory?: Record<string, any>;
  sicInput?: SicInput;
}

export interface AestheticRiskIndexes {
  termico: 'baixo' | 'moderado' | 'elevado' | 'critico';
  quimico: 'baixo' | 'moderado' | 'elevado' | 'critico';
  quebra: 'baixo' | 'moderado' | 'elevado' | 'critico';
  elasticidade: 'baixo' | 'moderado' | 'elevado' | 'critico';
  sensibilidade: 'baixo' | 'moderado' | 'elevado' | 'critico';
}

export interface AestheticDecisionResponse {
  resumoTecnico: string;
  scoreIntegridade: number;
  sicResult?: SicResult;
  indicesRisco: AestheticRiskIndexes;
  classificacaoAptidao: 'apto' | 'apto_com_restricoes' | 'nao_apto';
  alisamentoSelecionado: {
    nome: string;
    justificativa: string;
  };
  protocoloPersonalizado: {
    preQuimica: string[];
    alisamento: {
      produto: string;
      tempoEstimado: string;
      neutralizacao: {
        obrigatoria: boolean;
        produto?: string;
        tempo?: string;
        justificativa: string;
      };
    };
    posQuimica: string[];
    cronograma4Semanas: string[];
  };
  alertasTecnicos: string[];
  confiancaAnalise: number;
}
