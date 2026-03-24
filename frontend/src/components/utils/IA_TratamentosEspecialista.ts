// IA_TratamentosEspecialista.ts
// Sistema Inteligente de Aprendizado de Tratamentos Capilares
// SDM Analyzer IA - Especialização em Hidratação, Nutrição e Reconstrução

import api from "@/services/api";

// Tipos para as características do cabelo
interface CaracteristicasCabelo {
  porosidade: string;
  elasticidade: string;
  proteina: string;
  lipidios: string;
  hidratacao: string;
}

// Tipos para sequência de tratamento
interface SequenciaTratamento {
  dia: number;
  tratamento: string;
  intensidade: string;
  duracao: string;
}

// Tipos para cronograma
interface Cronograma {
  tipo: string;
  ciclo: string;
  sequencia: SequenciaTratamento[];
}

// Tipos para produtos recomendados
interface ProdutosRecomendados {
  reconstrucao: string[];
  hidratacao: string[];
  nutricao: string[];
}

// Tipos para perfil de tratamento
interface PerfilTratamento {
  caracteristicas: CaracteristicasCabelo;
  cronograma: Cronograma;
  produtos_recomendados: ProdutosRecomendados;
  alertas: string[];
}

// Tipos para conhecimento de tratamentos
interface ConhecimentoTratamentos {
  loiro_descolorido: PerfilTratamento;
  cachos_crespos: PerfilTratamento;
  liso_danificado: PerfilTratamento;
  quimicamente_tratado: PerfilTratamento;
}

// Tipos para padrões identificados
interface PadraoIdentificado {
  tipo_fio: string;
  nivel_dano: string;
  coloracao: string;
  tratamento_recomendado: string;
  confianca: string;
  casos: number;
}

// Tipos para padrões de aprendizado
interface PadroesAprendizado {
  total_analises: number;
  analises_sucesso: number;
  taxa_sucesso: string;
  padroes_identificados: PadraoIdentificado[];
}

// Tipos para cronograma personalizado
interface CronogramaPersonalizado {
  recomendacao?: string;
  descricao?: string;
  alertas?: string[];
  tipo_cronograma?: string;
  ciclo?: string;
  sequencia?: SequenciaTratamento[];
  produtos?: ProdutosRecomendados;
  caracteristicas_detectadas?: CaracteristicasCabelo;
}

// Tipos para necessidades capilares
interface NecessidadesCapilares {
  hidratacao: number;
  nutricao: number;
  reconstrucao: number;
  prioridade: string | null;
}

// Tipos para cache de aprendizado
interface CacheAprendizado {
  ultimas_analises_sucesso: any[];
  padroes_fortes: PadroesAprendizado | Record<string, never>;
  ultima_atualizacao: string | null;
}

// Tipos para casos similares
interface CasosSimilares {
  encontrado: boolean;
  casos: PadraoIdentificado[];
  recomendacao_baseada_historico: string;
  confianca: string;
}

/**
 * BANCO DE CONHECIMENTO: Tratamentos por Tipo de Cabelo
 * Baseado em estudos tricológicos e feedback profissional
 */
const CONHECIMENTO_TRATAMENTOS: ConhecimentoTratamentos = {
  // LOIROS DESCOLORIDOS
  loiro_descolorido: {
    caracteristicas: {
      porosidade: "muito_alta",
      elasticidade: "baixa",
      proteina: "deficiente",
      lipidios: "muito_deficiente",
      hidratacao: "critica"
    },
    cronograma: {
      tipo: "intensivo_reparador",
      ciclo: "14_dias",
      sequencia: [
        { dia: 1, tratamento: "reconstrucao", intensidade: "alta", duracao: "45min" },
        { dia: 4, tratamento: "hidratacao", intensidade: "profunda", duracao: "30min" },
        { dia: 7, tratamento: "nutricao", intensidade: "intensiva", duracao: "40min" },
        { dia: 10, tratamento: "reconstrucao", intensidade: "media", duracao: "30min" },
        { dia: 14, tratamento: "hidratacao", intensidade: "profunda", duracao: "30min" }
      ]
    },
    produtos_recomendados: {
      reconstrucao: ["Máscara com Queratina Hidrolisada", "Ampolas de Colágeno", "Reconstrutor com Aminoácidos"],
      hidratacao: ["Máscara Ultra Hidratante", "Leave-in Hidratante", "Umectação Capilar"],
      nutricao: ["Máscara com Óleo de Argan", "Nutrição com Manteigas Vegetais", "Blend de Óleos"]
    },
    alertas: [
      "⚠️ Evitar excesso de proteína que pode causar rigidez",
      "💧 Priorizar hidratação antes de reconstrução pesada",
      "🌿 Usar apenas óleos leves para não pesar"
    ]
  },

  // CACHOS E CRESPOS
  cachos_crespos: {
    caracteristicas: {
      porosidade: "media_alta",
      elasticidade: "boa",
      proteina: "equilibrada",
      lipidios: "deficiente",
      hidratacao: "necessaria"
    },
    cronograma: {
      tipo: "manutencao_definicao",
      ciclo: "21_dias",
      sequencia: [
        { dia: 1, tratamento: "hidratacao", intensidade: "profunda", duracao: "40min" },
        { dia: 7, tratamento: "nutricao", intensidade: "media", duracao: "30min" },
        { dia: 14, tratamento: "hidratacao", intensidade: "profunda", duracao: "40min" },
        { dia: 21, tratamento: "reconstrucao", intensidade: "leve", duracao: "20min" }
      ]
    },
    produtos_recomendados: {
      hidratacao: ["Máscara para Cachos", "Creme de Pentear Hidratante", "Gelatina Capilar"],
      nutricao: ["Umectação com Óleo de Coco", "Máscara Nutritiva", "Manteiga de Karité"],
      reconstrucao: ["Reconstrutor Leve", "Queratina Líquida", "Proteína da Seda"]
    },
    alertas: [
      "💦 Hidratação é prioridade máxima",
      "🥥 Umectação semanal melhora definição",
      "⚡ Reconstrução apenas quando necessário"
    ]
  },

  // LISOS DANIFICADOS
  liso_danificado: {
    caracteristicas: {
      porosidade: "alta",
      elasticidade: "comprometida",
      proteina: "deficiente",
      lipidios: "deficiente",
      hidratacao: "muito_necessaria"
    },
    cronograma: {
      tipo: "recuperacao_gradual",
      ciclo: "14_dias",
      sequencia: [
        { dia: 1, tratamento: "hidratacao", intensidade: "profunda", duracao: "35min" },
        { dia: 4, tratamento: "reconstrucao", intensidade: "media", duracao: "30min" },
        { dia: 7, tratamento: "nutricao", intensidade: "intensiva", duracao: "40min" },
        { dia: 10, tratamento: "hidratacao", intensidade: "profunda", duracao: "35min" },
        { dia: 14, tratamento: "reconstrucao", intensidade: "leve", duracao: "25min" }
      ]
    },
    produtos_recomendados: {
      hidratacao: ["Máscara Repositora de Massa", "Ampola de Ácido Hialurônico", "Hidratação Intensiva"],
      reconstrucao: ["Reconstrutor com Keratina", "Aminoácidos Essenciais", "Colágeno Vegetal"],
      nutricao: ["Cauterização Capilar", "Blend de Óleos Essenciais", "Nutrição Profunda"]
    },
    alertas: [
      "🔧 Alternar tratamentos para equilíbrio",
      "💎 Usar protetor térmico sempre",
      "✂️ Corte preventivo recomendado"
    ]
  },

  // QUIMICAMENTE TRATADO
  quimicamente_tratado: {
    caracteristicas: {
      porosidade: "muito_alta",
      elasticidade: "muito_baixa",
      proteina: "muito_deficiente",
      lipidios: "deficiente",
      hidratacao: "critica"
    },
    cronograma: {
      tipo: "emergencial_reparador",
      ciclo: "7_dias",
      sequencia: [
        { dia: 1, tratamento: "reconstrucao", intensidade: "emergencial", duracao: "50min" },
        { dia: 3, tratamento: "hidratacao", intensidade: "profunda", duracao: "40min" },
        { dia: 5, tratamento: "nutricao", intensidade: "alta", duracao: "45min" },
        { dia: 7, tratamento: "hidratacao", intensidade: "profunda", duracao: "40min" }
      ]
    },
    produtos_recomendados: {
      reconstrucao: ["Reconstrução Molecular", "Ampola de Resgate", "Queratina Profissional"],
      hidratacao: ["Repositor de Massa Capilar", "Máscara de Emergência", "Ácidos Essenciais"],
      nutricao: ["Banho de Verniz", "Cauterização", "Selagem Térmica"]
    },
    alertas: [
      "🚨 Tratamento profissional essencial",
      "⚠️ Evitar novos processos químicos",
      "💪 Fortalecer antes de qualquer procedimento"
    ]
  }
};

/**
 * SISTEMA DE APRENDIZADO CONTÍNUO
 * Analisa feedbacks e melhora recomendações
 */
export async function analisarPadroesAprendizado(): Promise<PadroesAprendizado | null> {
  try {
    // Buscar análises com feedback positivo
    const { data } = await api.get('/analises', {
      params: { limit: 100, sort: '-created_date' },
    });
    const analises = Array.isArray(data) ? data : [];
    const analisesComSucesso = analises.filter((a: any) => a.feedback_positivo === true);

    const padroes: PadroesAprendizado = {
      total_analises: analises.length,
      analises_sucesso: analisesComSucesso.length,
      taxa_sucesso: (analisesComSucesso.length / analises.length * 100).toFixed(1),
      padroes_identificados: []
    };

    // Agrupar por tipo de fio e tratamento
    const agrupamentos: Record<string, any> = {};

    analisesComSucesso.forEach((analise: any) => {
      const chave = `${analise.tipo_fio_detalhado}_${analise.nivel_dano}_${analise.coloracao_cabelo}`;

      if (!agrupamentos[chave]) {
        agrupamentos[chave] = {
          tipo_fio: analise.tipo_fio_detalhado,
          nivel_dano: analise.nivel_dano,
          coloracao: analise.coloracao_cabelo,
          tratamentos_sucesso: [],
          count: 0
        };
      }

      agrupamentos[chave].count++;
      if (analise.recomendacao_tratamento && analise.recomendacao_tratamento !== 'N/A') {
        agrupamentos[chave].tratamentos_sucesso.push(analise.recomendacao_tratamento);
      }
    });

    // Identificar padrões fortes (> 3 casos similares)
    Object.entries(agrupamentos).forEach(([chave, dados]) => {
      if (dados.count >= 3) {
        const tratamentoMaisComum = dados.tratamentos_sucesso
          .reduce((acc: Record<string, number>, t: string) => {
            acc[t] = (acc[t] || 0) + 1;
            return acc;
          }, {});

        const melhorTratamento = (Object.entries(tratamentoMaisComum) as Array<[string, number]>)
          .sort(([,a], [,b]) => b - a)[0];

        if (melhorTratamento) {
          padroes.padroes_identificados.push({
            tipo_fio: dados.tipo_fio,
            nivel_dano: dados.nivel_dano,
            coloracao: dados.coloracao,
            tratamento_recomendado: melhorTratamento[0],
            confianca: (melhorTratamento[1] / dados.count * 100).toFixed(0) + '%',
            casos: dados.count
          });
        }
      }
    });

    return padroes;

  } catch (error) {
    return null;
  }
}

/**
 * RECOMENDAÇÃO INTELIGENTE DE CRONOGRAMA
 * Baseado em tipo de cabelo e histórico
 */
export function gerarCronogramaPersonalizado(analise: any): CronogramaPersonalizado {
  // Identificar perfil do cabelo
  let perfil: PerfilTratamento | null = null;

  if (analise.coloracao_cabelo && (analise.coloracao_cabelo.includes('Descolorido') || analise.coloracao_cabelo.includes('Loiro'))) {
    perfil = CONHECIMENTO_TRATAMENTOS.loiro_descolorido;
  } else if (analise.tipo_fio_detalhado && ['3A', '3B', '3C', '4A', '4B', '4C'].includes(analise.tipo_fio_detalhado)) {
    perfil = CONHECIMENTO_TRATAMENTOS.cachos_crespos;
  } else if (analise.nivel_dano === 'severo' || analise.nivel_sensibilizacao_quimica === 'severo') {
    perfil = CONHECIMENTO_TRATAMENTOS.quimicamente_tratado;
  } else if (analise.nivel_dano && analise.nivel_dano !== 'saudavel') {
    perfil = CONHECIMENTO_TRATAMENTOS.liso_danificado;
  }

  if (!perfil) {
    return {
      recomendacao: "Cronograma Capilar Básico",
      descricao: "Hidratação semanal + Nutrição quinzenal + Reconstrução mensal",
      alertas: ["Observe as necessidades específicas do seu cabelo e ajuste conforme necessário"]
    };
  }

  return {
    tipo_cronograma: perfil.cronograma.tipo,
    ciclo: perfil.cronograma.ciclo,
    sequencia: perfil.cronograma.sequencia,
    produtos: perfil.produtos_recomendados,
    alertas: perfil.alertas,
    caracteristicas_detectadas: perfil.caracteristicas
  };
}

/**
 * ANÁLISE PROFUNDA DE NECESSIDADES
 * Identifica exatamente o que o cabelo precisa
 */
export function analisarNecessidadesCapilares(analise: any): NecessidadesCapilares {
  const necessidades: NecessidadesCapilares = {
    hidratacao: 0,
    nutricao: 0,
    reconstrucao: 0,
    prioridade: null
  };

  // Análise de porosidade
  if (analise.porosidade_fios) {
    if (analise.porosidade_fios.nivel_porosidade === 'muito_alta' || analise.porosidade_fios.nivel_porosidade === 'alta') {
      necessidades.hidratacao += 40;
      necessidades.reconstrucao += 30;
    }
  }

  // Análise de quebra
  if (analise.quebra_fios) {
    if (analise.quebra_fios.quebra_detectada) {
      necessidades.reconstrucao += 50;
    }
  }

  // Análise de dano
  if (analise.nivel_dano === 'severo') {
    necessidades.reconstrucao += 40;
    necessidades.hidratacao += 30;
  } else if (analise.nivel_dano === 'moderado') {
    necessidades.hidratacao += 30;
    necessidades.nutricao += 20;
  }

  // Análise de coloração
  if (analise.coloracao_cabelo && analise.coloracao_cabelo !== 'Natural') {
    necessidades.hidratacao += 25;
    necessidades.nutricao += 20;
  }

  // Determinar prioridade
  const max = Math.max(necessidades.hidratacao, necessidades.nutricao, necessidades.reconstrucao);
  if (max === necessidades.hidratacao) necessidades.prioridade = 'hidratacao';
  else if (max === necessidades.nutricao) necessidades.prioridade = 'nutricao';
  else necessidades.prioridade = 'reconstrucao';

  return necessidades;
}

/**
 * SISTEMA DE CACHE DE APRENDIZADO
 * Guarda padrões bem-sucedidos para rápida recuperação
 */
const CACHE_APRENDIZADO: CacheAprendizado = {
  ultimas_analises_sucesso: [],
  padroes_fortes: {},
  ultima_atualizacao: null
};

export async function atualizarCacheAprendizado(): Promise<CacheAprendizado> {
  const padroes = await analisarPadroesAprendizado();
  if (padroes) {
    CACHE_APRENDIZADO.padroes_fortes = padroes;
    CACHE_APRENDIZADO.ultima_atualizacao = new Date().toISOString();
  }

  return CACHE_APRENDIZADO;
}

/**
 * BUSCAR RECOMENDAÇÃO SIMILAR HISTÓRICA
 * Encontra casos similares bem-sucedidos
 */
export function buscarCasosSimilares(analise: any, padroesAprendizado: PadroesAprendizado | null): CasosSimilares | null {
  if (!padroesAprendizado || !padroesAprendizado.padroes_identificados) {
    return null;
  }

  const casosSimilares = padroesAprendizado.padroes_identificados.filter(padrao => {
    return padrao.tipo_fio === analise.tipo_fio_detalhado &&
           padrao.nivel_dano === analise.nivel_dano;
  });

  if (casosSimilares.length > 0) {
    return {
      encontrado: true,
      casos: casosSimilares,
      recomendacao_baseada_historico: casosSimilares[0].tratamento_recomendado,
      confianca: casosSimilares[0].confianca
    };
  }

  return null;
}

/**
 * GERAR RELATÓRIO DE APRENDIZADO
 * Para visualização pelo profissional
 */
export function gerarRelatorioAprendizado(padroes: PadroesAprendizado | null): string {
  if (!padroes || !padroes.padroes_identificados) {
    return "Nenhum padrão identificado ainda. Continue usando o sistema!";
  }

  let relatorio = `📊 RELATÓRIO DE APRENDIZADO IA\n\n`;
  relatorio += `Total de Análises: ${padroes.total_analises}\n`;
  relatorio += `Análises com Sucesso: ${padroes.analises_sucesso}\n`;
  relatorio += `Taxa de Sucesso: ${padroes.taxa_sucesso}%\n\n`;
  relatorio += `🎯 PADRÕES IDENTIFICADOS:\n\n`;

  padroes.padroes_identificados.forEach((padrao, idx) => {
    relatorio += `${idx + 1}. ${padrao.tipo_fio} - ${padrao.nivel_dano}\n`;
    relatorio += `   Tratamento: ${padrao.tratamento_recomendado}\n`;
    relatorio += `   Confiança: ${padrao.confianca} (${padrao.casos} casos)\n\n`;
  });

  return relatorio;
}

export default {
  analisarPadroesAprendizado,
  gerarCronogramaPersonalizado,
  analisarNecessidadesCapilares,
  atualizarCacheAprendizado,
  buscarCasosSimilares,
  gerarRelatorioAprendizado
};
