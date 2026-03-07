export interface ReportPayload {
  salao?: {
    nome?: string;
    logoUrl?: string;
  };
  cliente?: {
    nome?: string;
    contato?: string;
  };
  profissional?: string;
  dataAnalise?: string;
  sumario?: string;
  aptidao?: {
    status?: 'Apto' | 'AptoComRestricoes' | 'NaoApto';
    justificativa?: string;
  };
  perfil?: {
    tipo?: string;
    volume?: string;
    estrutura?: string;
    danos?: {
      termico?: boolean;
      mecanico?: boolean;
      quimico?: boolean;
      observacoes?: string[];
    };
  };
  chemicalProfile?: any;
  protocolos?: {
    alisamentos?: Array<{
      serviceId: string;
      nome: string;
      aptidao: 'Apto' | 'NaoApto';
      justificativa?: string;
    }>;
    tratamentosSalao?: Array<{
      tipo: string;
      descricao?: string;
      prioridade?: 'Alta' | 'Media' | 'Baixa';
    }>;
    homeCare?: Array<{
      tipo: string;
      descricao?: string;
      intervaloDias?: number;
      modoUso?: string;
    }>;
    couroCabeludo?: string[];
    neutralizacao?: {
      obrigatoria: boolean;
      produto?: string;
      tempo?: string;
      justificativa?: string;
    };
    cronograma?: Array<{
      semana: number;
      foco: string;
      observacoes?: string;
    }>;
    manutencao?: {
      tratamentosDias?: number;
      alisamentoDias?: number;
      acompanhamentoDias?: number;
    };
  };
  alertas?: string[];
  cuidadosPrePos?: string[];
  analysisId?: string;
  content?: any;
}
