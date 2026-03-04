
// Motor de Recomendação Inteligente Avançado
// Versão 3.0 - Com Logs Detalhados e Validação Completa

import { appApi } from "@/api/appClient";

/**
 * Calcula compatibilidade entre análise e serviço usando Indicações Inteligentes
 * @param {Object} analise - Dados da análise capilar
 * @param {Object} servico - Serviço a ser avaliado
 * @param {Array} historicoAprendizado - Histórico de análises bem-sucedidas
 * @returns {Object} { score, justificativa, restricoes, detalhes }
 */
export function calcularCompatibilidadeAvancada(analise, servico, historicoAprendizado = []) {

  if (!servico.indicacoes) {
    return { 
      score: 0, 
      justificativa: "Serviço sem indicações configuradas", 
      restricoes: [],
      detalhes: { sem_indicacoes: true }
    };
  }

  let score = 0;
  let maxScore = 0;
  let justificativa = [];
  let restricoes = [];
  let detalhes = {
    servico_nome: servico.nome,
    indicacoes_encontradas: servico.indicacoes,
    analise_input: analise,
    pontuacoes: {}
  };
  
  const indicacoes = servico.indicacoes;
  
  // 1. VERIFICAÇÃO CRÍTICA DE OBSERVAÇÕES (RESTRIÇÕES)
  if (indicacoes.observacoes) {
    const obs = indicacoes.observacoes.toLowerCase();
    const coloracao = (analise.coloracao_cabelo || '').toLowerCase();
    
    // Verificar restrições de coloração
    if (obs.includes('não recomendado para cabelos loiros') && coloracao.includes('loiro')) {
      restricoes.push('❌ Não recomendado para cabelos loiros');
      return { score: 0, justificativa: 'Serviço possui contraindicação para coloração loira', restricoes, detalhes };
    }
    
    if (obs.includes('não recomendado para cabelos grisalhos') && (coloracao.includes('grisalho') || coloracao.includes('branco'))) {
      restricoes.push('❌ Não recomendado para cabelos grisalhos');
      return { score: 0, justificativa: 'Serviço possui contraindicação para cabelos grisalhos', restricoes, detalhes };
    }
    
    if (obs.includes('não recomendado para cabelos descoloridos') && 
        (coloracao.includes('descolorido') || coloracao.includes('platinado'))) {
      restricoes.push('❌ Não recomendado para cabelos descoloridos/platinados');
      return { score: 0, justificativa: 'Serviço possui contraindicação para cabelos descoloridos', restricoes, detalhes };
    }
  }
  
  // 2. TIPO DE CABELO (peso 30)
  if (indicacoes.tipo_cabelo && indicacoes.tipo_cabelo.length > 0) {
    maxScore += 30;
    const tipoFioBasico = (analise.tipo_fio || '').toLowerCase();
    const tipoMatch = indicacoes.tipo_cabelo.some(tipo => 
      tipoFioBasico.includes(tipo.toLowerCase())
    );
    
    if (tipoMatch) {
      score += 30;
      justificativa.push(`✓ Tipo de fio ${analise.tipo_fio} é ideal para este serviço`);
      detalhes.pontuacoes.tipo_cabelo = { pontos: 30, match: true };
    } else {
      justificativa.push(`⚠ Tipo de fio ${analise.tipo_fio} não está nas indicações prioritárias`);
      detalhes.pontuacoes.tipo_cabelo = { pontos: 0, match: false };
    }
  }
  
  // 3. ESTRUTURA (peso 25)
  if (indicacoes.estrutura && indicacoes.estrutura.length > 0) {
    maxScore += 25;
    const estruturaMatch = indicacoes.estrutura.includes(analise.estrutura_fio);
    
    if (estruturaMatch) {
      score += 25;
      justificativa.push(`✓ Estrutura ${analise.estrutura_fio} é ideal`);
      detalhes.pontuacoes.estrutura = { pontos: 25, match: true };
    } else {
      justificativa.push(`⚠ Estrutura ${analise.estrutura_fio} pode precisar de ajustes no tempo/produto`);
      detalhes.pontuacoes.estrutura = { pontos: 0, match: false };
    }
  }
  
  // 4. VOLUME (peso 25)
  if (indicacoes.volume && indicacoes.volume.length > 0) {
    maxScore += 25;
    const volumeMatch = indicacoes.volume.includes(analise.volume_capilar);
    
    if (volumeMatch) {
      score += 25;
      justificativa.push(`✓ Volume ${analise.volume_capilar} é adequado`);
      detalhes.pontuacoes.volume = { pontos: 25, match: true };
    } else {
      justificativa.push(`⚠ Volume ${analise.volume_capilar} pode exigir quantidade maior de produto`);
      detalhes.pontuacoes.volume = { pontos: 0, match: false };
    }
  }
  
  // 5. NÍVEL DE DANO (peso 20)
  if (indicacoes.nivel_dano && indicacoes.nivel_dano.length > 0) {
    maxScore += 20;
    const danoMatch = indicacoes.nivel_dano.includes(analise.nivel_dano);
    
    if (danoMatch) {
      score += 20;
      justificativa.push(`✓ Nível de dano ${analise.nivel_dano} é compatível`);
      detalhes.pontuacoes.nivel_dano = { pontos: 20, match: true };
    } else {
      justificativa.push(`⚠ Nível de dano ${analise.nivel_dano} - considerar tratamento prévio`);
      detalhes.pontuacoes.nivel_dano = { pontos: 0, match: false };
    }
  }
  
  // 6. BONUS DE APRENDIZADO (até +15 pontos)
  const bonusAprendizado = calcularBonusAprendizado(servico, analise, historicoAprendizado);
  score += bonusAprendizado;
  
  if (bonusAprendizado > 0) {
    justificativa.push(`🎯 +${bonusAprendizado} pontos - Histórico de ${Math.floor(bonusAprendizado / 5)} casos similares bem-sucedidos`);
    detalhes.pontuacoes.aprendizado = { pontos: bonusAprendizado, casos_similares: Math.floor(bonusAprendizado / 5) };
  }
  
  // Calcular porcentagem final
  const percentual = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
  
  detalhes.score_final = Math.round(percentual);
  detalhes.score_bruto = score;
  detalhes.score_maximo = maxScore;
  
  return {
    score: Math.round(percentual),
    justificativa: justificativa.join(' • '),
    restricoes,
    detalhes
  };
}

/**
 * Calcula bonus baseado no histórico de aprendizado
 */
function calcularBonusAprendizado(servico, analise, historicoAprendizado) {
  if (!historicoAprendizado || historicoAprendizado.length === 0) return 0;
  
  // Filtrar casos similares bem-sucedidos - matching exato
  const casosSimilares = historicoAprendizado.filter(h => 
    h.servico_nome === servico.nome &&
    h.tipo_fio === analise.tipo_fio &&
    h.estrutura_fio === analise.estrutura_fio &&
    h.volume_capilar === analise.volume_capilar &&
    h.resultado_satisfatorio === true
  );
  
  // Cada caso similar adiciona 5 pontos, máximo 15
  return Math.min(casosSimilares.length * 5, 15);
}

/**
 * Recomenda alisamentos com lógica avançada
 * IMPORTANTE: Filtra apenas serviços ATIVOS
 */
export async function recomendarAlisamentosInteligente(analise, servicos) {
  const alisamentos = servicos.filter(s => s.tipo === 'alisamento' && s.ativo !== false);
  
  if (alisamentos.length === 0) {
    return { principal: null, alternativo: null, todosScores: [] };
  }
  
  // Buscar histórico de aprendizado
  let historicoAprendizado = [];
  try {
    const metricas = await appApi.entities.AprendizadoMetrica.list('-created_date', 50);
    historicoAprendizado = metricas.filter(m => m.resultado_satisfatorio === true);
  } catch (error) {
    // Não foi possível carregar histórico de aprendizado
  }
  
  // Calcular score para cada alisamento
  const scoresAlisamentos = ensureArray(alisamentos).map(servico => {
    const resultado = calcularCompatibilidadeAvancada(analise, servico, historicoAprendizado);
    return {
      servico,
      score: resultado.score,
      justificativa: resultado.justificativa,
      restricoes: resultado.restricoes,
      detalhes: resultado.detalhes
    };
  });
  
  // Filtrar serviços com restrições (score 0)
  const servicosValidos = scoresAlisamentos.filter(s => s.score > 0);
  
  // Ordenar por score
  servicosValidos.sort((a, b) => b.score - a.score);
  
  servicosValidos.forEach((s, i) => {
    // Ranking logic removed
  });
  
  return {
    principal: servicosValidos[0] || null,
    alternativo: servicosValidos[1] || null,
    todosScores: servicosValidos
  };
}

/**
 * Recomenda tratamento com lógica avançada
 * IMPORTANTE: Filtra apenas serviços ATIVOS
 */
export async function recomendarTratamentoInteligente(analise, servicos) {
  // FILTRAR APENAS SERVIÇOS ATIVOS
  const tratamentos = servicos.filter(s => s.tipo === 'tratamento' && s.ativo !== false);
  
  if (tratamentos.length === 0) {
    return null;
  }
  
  // Buscar histórico
  let historicoAprendizado = [];
  try {
    const metricas = await appApi.entities.AprendizadoMetrica.list('-created_date', 50);
    historicoAprendizado = metricas.filter(m => m.resultado_satisfatorio === true);
  } catch (error) {
    // Não foi possível carregar histórico de aprendizado
  }
  
  // Calcular score para cada tratamento
  const scoresTratamentos = ensureArray(tratamentos).map(servico => {
    const resultado = calcularCompatibilidadeAvancada(analise, servico, historicoAprendizado);
    return {
      servico,
      score: resultado.score,
      justificativa: resultado.justificativa,
      restricoes: resultado.restricoes,
      detalhes: resultado.detalhes
    };
  });
  
  // Filtrar válidos e ordenar
  const servicosValidos = scoresTratamentos.filter(s => s.score > 0);
  servicosValidos.sort((a, b) => b.score - a.score);
  
  return servicosValidos[0] || null;
}

/**
 * Registra feedback e atualiza aprendizado
 */
export async function registrarFeedbackAprendizado(analise, feedbackPositivo, comentario) {
  try {
    // Buscar todos os serviços para obter os IDs
    const todosServicos = await appApi.entities.Servico.list();
    
    // Registrar métrica de aprendizado para alisamento
    if (analise.recomendacao_alisamento && analise.recomendacao_alisamento !== 'N/A') {
      const servicoNome = analise.alisamento_escolhido || analise.recomendacao_alisamento;
      const servico = todosServicos.find(s => s.nome === servicoNome);
      
      if (servico) {
        await appApi.entities.AprendizadoMetrica.create({
          servico_id: servico.id,
          servico_nome: servicoNome,
          tipo_fio: analise.tipo_fio,
          volume_capilar: analise.volume_capilar,
          estrutura_fio: analise.estrutura_fio,
          nivel_dano: analise.nivel_dano,
          foi_recomendado: true,
          foi_escolhido: true,
          resultado_satisfatorio: feedbackPositivo,
          score_compatibilidade: analise.score_compatibilidade_alisamento || 0,
          analise_id: analise.id
        });
      }
    }
    
    // Registrar métrica para tratamento
    if (analise.recomendacao_tratamento && analise.recomendacao_tratamento !== 'N/A') {
      const servicoNome = analise.tratamento_escolhido || analise.recomendacao_tratamento;
      const servico = todosServicos.find(s => s.nome === servicoNome);
      
      if (servico) {
        await appApi.entities.AprendizadoMetrica.create({
          servico_id: servico.id,
          servico_nome: servicoNome,
          tipo_fio: analise.tipo_fio,
          volume_capilar: analise.volume_capilar,
          estrutura_fio: analise.estrutura_fio,
          nivel_dano: analise.nivel_dano,
          foi_recomendado: true,
          foi_escolhido: true,
          resultado_satisfatorio: feedbackPositivo,
          analise_id: analise.id
        });
      }
    }
    
  } catch (error) {
    // Não propagar o erro para não quebrar a experiência do usuário
  }
}

export function calcularTempoEstimado(volumeCapilar, tempoBase = 3) {
  const multiplicadores = {
    'baixo': 1.0,
    'médio': 1.15,
    'alto': 1.30
  };
  
  const multiplicador = multiplicadores[volumeCapilar] || 1.0;
  const tempoMin = Math.round(tempoBase * multiplicador);
  const tempoMax = tempoMin + 1;
  
  return `${tempoMin}-${tempoMax} horas`;
}

export function calcularAjusteOrcamento(volumeCapilar) {
  const ajustes = {
    'baixo': 'padrão (0%)',
    'médio': '+10% a +15%',
    'alto': '+20% a +30%'
  };
  
  return ajustes[volumeCapilar] || 'padrão (0%)';
}

export function determinarNivelDano(condicaoCabelo) {
  const condicao = condicaoCabelo?.toLowerCase() || '';
  
  if (condicao.includes('saudável') || condicao.includes('bom estado') || condicao.includes('ótimo')) {
    return 'leve';
  }
  
  if (condicao.includes('severamente') || condicao.includes('muito danificado') || condicao.includes('extremamente') || condicao.includes('grave')) {
    return 'severo';
  }
  
  return 'moderado';
}


