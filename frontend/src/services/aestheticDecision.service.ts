import api from "./api";

export type AbsorptionTestInput = {
  volumeMl?: number | null;
  weightGainMl?: number | null;
  timeSeconds?: number | null;
  dryingTimeSeconds?: number | null;
};

export type CuticleDiagnosticInput = {
  toquePoints?: number | null;
  toqueText?: string | null;
  brilhoPoints?: number | null;
  brilhoText?: string | null;
  elasticidadePoints?: number | null;
  elasticidadeText?: string | null;
  chemicalEvents?: number | null;
};

export type BreakRiskContext = {
  porosityPercent?: number | null;
  elasticityPercent?: number | null;
};

export type AestheticDecisionInputFrontend = {
  structuredData?: Record<string, unknown>;
  imageSignals?: Record<string, unknown>;
  evolutionHistory?: Record<string, unknown>;
  sicInput?: Record<string, unknown>;
  absorptionTest?: AbsorptionTestInput;
  cuticleDiagnostic?: CuticleDiagnosticInput;
  straighteningRiskContext?: BreakRiskContext;
};

export type AestheticDecisionResponseFrontend = {
  resumoTecnico: string;
  scoreIntegridade: number;
  indicesRisco?: Record<string, string>;
  classificacaoAptidao?: "apto" | "apto_com_restricoes" | "nao_apto";
  absorptionCoefficient?: { index: number; label: string };
  cuticleDiagnostic?: {
    ipt: number;
    label: string;
    toque?: number;
    brilho?: number;
    elasticidade?: number;
    historico?: number;
  };
  breakRiskPercentual?: number;
  alisamentoSelecionado?: { nome: string; justificativa: string };
  protocoloPersonalizado?: {
    baseTratamento?: { foco: string; descricao: string };
    preQuimica?: string[];
    alisamento?: {
      produto?: string;
      tempoEstimado?: string;
      neutralizacao?: {
        obrigatoria: boolean;
        produto?: string;
        tempo?: string;
        justificativa: string;
      };
    };
    posQuimica?: string[];
    cronograma4Semanas?: string[];
  };
};

export async function postAestheticDecision(
  payload: AestheticDecisionInputFrontend,
): Promise<AestheticDecisionResponseFrontend> {
  const { data } = await api.post<AestheticDecisionResponseFrontend>(
    "/ai/aesthetic-decision",
    payload,
  );
  return data;
}
