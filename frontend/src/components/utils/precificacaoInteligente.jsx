// Sistema de Precificação Inteligente - Analyzer SDM IA v14.5
import { appApi } from "@/api/appClient";

export function calcularPrecificacaoInteligente(analise, servico) {
  if (!servico || !servico.valor) {
    return { precoFinal: 0, detalhamento: [] };
  }

  const precoBase = parseFloat(servico.valor);
  let multiplicador = 1.0;
  const detalhamento = [];

  // 1. AJUSTE POR VOLUME CAPILAR
  if (analise.volume_capilar) {
    if (analise.volume_capilar === 'alto') {
      multiplicador += 0.15; // +15%
      detalhamento.push({ 
        item: 'Volume Alto', 
        percentual: 15, 
        valor: precoBase * 0.15,
        justificativa: 'Cabelo volumoso requer mais produto e tempo'
      });
    } else if (analise.volume_capilar === 'médio') {
      multiplicador += 0.08; // +8%
      detalhamento.push({ 
        item: 'Volume Médio', 
        percentual: 8, 
        valor: precoBase * 0.08,
        justificativa: 'Volume padrão com ajuste moderado'
      });
    }
  }

  // 2. AJUSTE POR ESTRUTURA DO FIO
  if (analise.estrutura_fio === 'grossa') {
    multiplicador += 0.10; // +10%
    detalhamento.push({ 
      item: 'Fio Grosso', 
      percentual: 10, 
      valor: precoBase * 0.10,
      justificativa: 'Fios grossos demandam mais produto e técnica específica'
    });
  }

  // 3. AJUSTE POR NÍVEL DE DANO
  if (analise.nivel_dano) {
    if (analise.nivel_dano === 'severo') {
      multiplicador += 0.20; // +20%
      detalhamento.push({ 
        item: 'Dano Severo', 
        percentual: 20, 
        valor: precoBase * 0.20,
        justificativa: 'Requer tratamento intensivo e cuidados extras'
      });
    } else if (analise.nivel_dano === 'moderado') {
      multiplicador += 0.12; // +12%
      detalhamento.push({ 
        item: 'Dano Moderado', 
        percentual: 12, 
        valor: precoBase * 0.12,
        justificativa: 'Necessita preparo capilar adicional'
      });
    } else if (analise.nivel_dano === 'leve') {
      multiplicador += 0.05; // +5%
      detalhamento.push({ 
        item: 'Dano Leve', 
        percentual: 5, 
        valor: precoBase * 0.05,
        justificativa: 'Preparo básico necessário'
      });
    }
  }

  // 4. AJUSTE POR COMPRIMENTO (baseado na classificação do tipo de fio)
  if (analise.tipo_fio_detalhado) {
    const tiposLongos = ['3A', '3B', '3C', '4A', '4B', '4C'];
    if (tiposLongos.includes(analise.tipo_fio_detalhado)) {
      multiplicador += 0.08; // +8%
      detalhamento.push({ 
        item: 'Textura Complexa', 
        percentual: 8, 
        valor: precoBase * 0.08,
        justificativa: 'Cabelos cacheados/crespos demandam técnica especializada'
      });
    }
  }

  // 5. AJUSTE POR COLORAÇÃO
  if (analise.coloracao_cabelo) {
    if (['Descolorido/Platinado', 'Grisalho/Branco'].includes(analise.coloracao_cabelo)) {
      multiplicador += 0.10; // +10%
      detalhamento.push({ 
        item: 'Cabelo Sensibilizado', 
        percentual: 10, 
        valor: precoBase * 0.10,
        justificativa: 'Cabelo químico requer produto e técnica específicos'
      });
    }
  }

  const precoFinal = Math.round(precoBase * multiplicador);
  const totalAjuste = precoFinal - precoBase;
  const percentualTotal = Math.round(((multiplicador - 1) * 100));

  return {
    precoBase,
    precoFinal,
    totalAjuste,
    percentualTotal,
    detalhamento,
    formula: `R$ ${precoBase.toFixed(2)} × ${multiplicador.toFixed(2)} = R$ ${precoFinal.toFixed(2)}`
  };
}

export function gerarRecomendacaoHomecare(analise) {
  const recomendacoes = [];

  // Cronograma baseado no nível de dano
  if (analise.nivel_dano === 'severo') {
    recomendacoes.push({
      tipo: 'Cronograma Capilar',
      frequencia: 'Semanal',
      detalhes: 'Hidratação + Nutrição + Reconstrução (rotação)'
    });
  } else if (analise.nivel_dano === 'moderado') {
    recomendacoes.push({
      tipo: 'Cronograma Capilar',
      frequencia: 'Quinzenal',
      detalhes: 'Hidratação + Nutrição alternadas'
    });
  } else {
    recomendacoes.push({
      tipo: 'Manutenção',
      frequencia: 'Mensal',
      detalhes: 'Hidratação preventiva'
    });
  }

  // Produtos baseados na estrutura
  if (analise.estrutura_fio === 'fina') {
    recomendacoes.push({
      tipo: 'Produtos',
      detalhes: 'Shampoo e condicionador leves, sem silicones pesados'
    });
  } else if (analise.estrutura_fio === 'grossa') {
    recomendacoes.push({
      tipo: 'Produtos',
      detalhes: 'Cremes densos, máscaras intensivas, óleos vegetais'
    });
  }

  // Proteção térmica
  if (analise.coloracao_cabelo && analise.coloracao_cabelo !== 'Natural') {
    recomendacoes.push({
      tipo: 'Proteção',
      detalhes: 'Protetor térmico e protetor solar capilar obrigatórios'
    });
  }

  return recomendacoes;
}

export function gerarOrientacoesCorte(analise) {
  if (!analise.necessidade_corte || analise.necessidade_corte === 'não necessário') {
    return {
      necessario: false,
      tipo: 'Não necessário',
      extensao: 'N/A',
      motivo: 'Pontas preservadas e saudáveis'
    };
  }

  let extensao = '';
  let tecnica = '';
  let motivo = analise.justificativa_corte || '';

  if (analise.necessidade_corte === 'obrigatório') {
    extensao = '3-5 cm';
    tecnica = 'Corte reto para remoção total de pontas duplas';
  } else if (analise.necessidade_corte === 'moderado') {
    extensao = '2-3 cm';
    tecnica = 'Corte em camadas para renovação';
  } else if (analise.necessidade_corte === 'preventivo') {
    extensao = '1-2 cm';
    tecnica = 'Acabamento nas pontas';
  }

  return {
    necessario: true,
    nivel: analise.necessidade_corte,
    extensao,
    tecnica,
    motivo: motivo || 'Recomendado para otimizar resultado do procedimento'
  };
}

export async function registrarDecisaoProfissional(analiseId, decisao) {
  try {
    await appApi.entities.LogAuditoria.create({
      tipo_auditoria: 'ia',
      status: 'sucesso',
      descricao: 'Decisão profissional registrada para aprendizado',
      metrica_depois: {
        analise_id: analiseId,
        decisao_ia: decisao.recomendacao_ia,
        decisao_profissional: decisao.escolha_profissional,
        ajuste_preco: decisao.ajuste_preco || 0,
        timestamp: new Date().toISOString()
      },
      automatica: false
    });

  } catch (error) {
  }
}

