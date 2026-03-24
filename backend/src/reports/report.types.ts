export interface ReportPayload {
  salao?: {
    nome?: string;
    logoUrl?: string;
  };
  analysisId?: string;
  content?: any;
  cliente?: {
    nome?: string;
    telefone?: string;
    contato?: string;
  };
  profissional?: string;
  dataAnalise?: string | Date;
  aptidao?: {
    status?: string;
    justificativa?: string;
  };
  sumario?: string;
  protocolos?: {
    alisamentos?: Array<{ nome?: string; aptidao?: string; justificativa?: string }>;
    tratamentosSalao?: Array<any>;
    homeCare?: Array<any>;
    couroCabeludo?: string[];
    manutencao?: { tratamentosDias?: number; alisamentoDias?: number; acompanhamentoDias?: number };
    neutralizacao?: { obrigatoria?: boolean; produto?: string; tempo?: string; justificativa?: string };
    cronograma?: Array<{ semana?: number; foco?: string; observacoes?: string }>;
  };
  cuidadosPrePos?: string[];
  alertas?: string[];
  [key: string]: any;
}
