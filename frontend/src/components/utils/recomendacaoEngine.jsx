
// Motor de RecomendaÃ§Ã£o Inteligente AvanÃ§ado
// VersÃ£o 3.0 - Com Logs Detalhados e ValidaÃ§Ã£o Completa

import { appApi } from "@/api/appClient";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Calcula compatibilidade entre anÃ¡lise e serviÃ§o usando IndicaÃ§Ãµes Inteligentes
 * @param {Object} analise - Dados da anÃ¡lise capilar
 * @param {Object} servico - ServiÃ§o a ser avaliado
 * @param {Array} historicoAprendizado - HistÃ³rico de anÃ¡lises bem-sucedidas
 * @returns {Object} { score, justificativa, restricoes, detalhes }
 */
export function calcularCompatibilidadeAvancada(analise, servico, historicoAprendizado = []) {
  console.log("ðŸ” [RecomendacaoEngine] Analisando compatibilidade:", {
    servico: servico.nome,
    tipo: servico.tipo,
    analise: {
      tipo_fio: analise.tipo_fio,
      estrutura: analise.estrutura_fio,
      volume: analise.volume_capilar,
      nivel_dano: analise.nivel_dano,
      coloracao: analise.coloracao_cabelo
    }
  });

  if (!servico.indicacoes) {
    console.warn("âš ï¸ [RecomendacaoEngine] ServiÃ§o sem indicaÃ§Ãµes:", servico.nome);
    return { 
      score: 0, 
      justificativa: "ServiÃ§o sem indicaÃ§Ãµes configuradas", 
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
  
  console.log("ðŸ“‹ [RecomendacaoEngine] IndicaÃ§Ãµes do serviÃ§o:", indicacoes);
  
  // 1. VERIFICAÃ‡ÃƒO CRÃTICA DE OBSERVAÃ‡Ã•ES (RESTRIÃ‡Ã•ES)
  if (indicacoes.observacoes) {
    const obs = indicacoes.observacoes.toLowerCase();
    const coloracao = (analise.coloracao_cabelo || '').toLowerCase();
    
    console.log("ðŸ” [RecomendacaoEngine] Verificando observaÃ§Ãµes:", {
      observacoes: obs,
      coloracao_cliente: coloracao
    });
    
    // Verificar restriÃ§Ãµes de coloraÃ§Ã£o
    if (obs.includes('nÃ£o recomendado para cabelos loiros') && coloracao.includes('loiro')) {
      restricoes.push('âŒ NÃ£o recomendado para cabelos loiros');
      console.log("âŒ [RecomendacaoEngine] RESTRIÃ‡ÃƒO: Cabelo loiro");
      return { score: 0, justificativa: 'ServiÃ§o possui contraindicaÃ§Ã£o para coloraÃ§Ã£o loira', restricoes, detalhes };
    }
    
    if (obs.includes('nÃ£o recomendado para cabelos grisalhos') && (coloracao.includes('grisalho') || coloracao.includes('branco'))) {
      restricoes.push('âŒ NÃ£o recomendado para cabelos grisalhos');
      console.log("âŒ [RecomendacaoEngine] RESTRIÃ‡ÃƒO: Cabelo grisalho");
      return { score: 0, justificativa: 'ServiÃ§o possui contraindicaÃ§Ã£o para cabelos grisalhos', restricoes, detalhes };
    }
    
    if (obs.includes('nÃ£o recomendado para cabelos descoloridos') && 
        (coloracao.includes('descolorido') || coloracao.includes('platinado'))) {
      restricoes.push('âŒ NÃ£o recomendado para cabelos descoloridos/platinados');
      console.log("âŒ [RecomendacaoEngine] RESTRIÃ‡ÃƒO: Cabelo descolorido");
      return { score: 0, justificativa: 'ServiÃ§o possui contraindicaÃ§Ã£o para cabelos descoloridos', restricoes, detalhes };
    }
  }
  
  // 2. TIPO DE CABELO (peso 30)
  if (indicacoes.tipo_cabelo && indicacoes.tipo_cabelo.length > 0) {
    maxScore += 30;
    const tipoFioBasico = (analise.tipo_fio || '').toLowerCase();
    const tipoMatch = ensureArray(indicacoes.tipo_cabelo).some(tipo => 
      tipoFioBasico.includes(tipo.toLowerCase())
    );
    
    console.log("ðŸŽ¯ [RecomendacaoEngine] Tipo de cabelo:", {
      analise: tipoFioBasico,
      indicacoes: indicacoes.tipo_cabelo,
      match: tipoMatch
    });
    
    if (tipoMatch) {
      score += 30;
      justificativa.push(`âœ“ Tipo de fio ${analise.tipo_fio} Ã© ideal para este serviÃ§o`);
      detalhes.pontuacoes.tipo_cabelo = { pontos: 30, match: true };
    } else {
      justificativa.push(`âš  Tipo de fio ${analise.tipo_fio} nÃ£o estÃ¡ nas indicaÃ§Ãµes prioritÃ¡rias`);
      detalhes.pontuacoes.tipo_cabelo = { pontos: 0, match: false };
    }
  }
  
  // 3. ESTRUTURA (peso 25)
  if (indicacoes.estrutura && indicacoes.estrutura.length > 0) {
    maxScore += 25;
    const estruturaMatch = indicacoes.estrutura.includes(analise.estrutura_fio);
    
    console.log("ðŸŽ¯ [RecomendacaoEngine] Estrutura:", {
      analise: analise.estrutura_fio,
      indicacoes: indicacoes.estrutura,
      match: estruturaMatch
    });
    
    if (estruturaMatch) {
      score += 25;
      justificativa.push(`âœ“ Estrutura ${analise.estrutura_fio} Ã© ideal`);
      detalhes.pontuacoes.estrutura = { pontos: 25, match: true };
    } else {
      justificativa.push(`âš  Estrutura ${analise.estrutura_fio} pode precisar de ajustes no tempo/produto`);
      detalhes.pontuacoes.estrutura = { pontos: 0, match: false };
    }
  }
  
  // 4. VOLUME (peso 25)
  if (indicacoes.volume && indicacoes.volume.length > 0) {
    maxScore += 25;
    const volumeMatch = indicacoes.volume.includes(analise.volume_capilar);
    
    console.log("ðŸŽ¯ [RecomendacaoEngine] Volume:", {
      analise: analise.volume_capilar,
      indicacoes: indicacoes.volume,
      match: volumeMatch
    });
    
    if (volumeMatch) {
      score += 25;
      justificativa.push(`âœ“ Volume ${analise.volume_capilar} Ã© adequado`);
      detalhes.pontuacoes.volume = { pontos: 25, match: true };
    } else {
      justificativa.push(`âš  Volume ${analise.volume_capilar} pode exigir quantidade maior de produto`);
      detalhes.pontuacoes.volume = { pontos: 0, match: false };
    }
  }
  
  // 5. NÃVEL DE DANO (peso 20)
  if (indicacoes.nivel_dano && indicacoes.nivel_dano.length > 0) {
    maxScore += 20;
    const danoMatch = indicacoes.nivel_dano.includes(analise.nivel_dano);
    
    console.log("ðŸŽ¯ [RecomendacaoEngine] NÃ­vel de dano:", {
      analise: analise.nivel_dano,
      indicacoes: indicacoes.nivel_dano,
      match: danoMatch
    });
    
    if (danoMatch) {
      score += 20;
      justificativa.push(`âœ“ NÃ­vel de dano ${analise.nivel_dano} Ã© compatÃ­vel`);
      detalhes.pontuacoes.nivel_dano = { pontos: 20, match: true };
    } else {
      justificativa.push(`âš  NÃ­vel de dano ${analise.nivel_dano} - considerar tratamento prÃ©vio`);
      detalhes.pontuacoes.nivel_dano = { pontos: 0, match: false };
    }
  }
  
  // 6. BONUS DE APRENDIZADO (atÃ© +15 pontos)
  const bonusAprendizado = calcularBonusAprendizado(servico, analise, historicoAprendizado);
  score += bonusAprendizado;
  
  if (bonusAprendizado > 0) {
    justificativa.push(`ðŸŽ¯ +${bonusAprendizado} pontos - HistÃ³rico de ${Math.floor(bonusAprendizado / 5)} casos similares bem-sucedidos`);
    detalhes.pontuacoes.aprendizado = { pontos: bonusAprendizado, casos_similares: Math.floor(bonusAprendizado / 5) };
  }
  
  // Calcular porcentagem final
  const percentual = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
  
  detalhes.score_final = Math.round(percentual);
  detalhes.score_bruto = score;
  detalhes.score_maximo = maxScore;
  
  console.log("âœ… [RecomendacaoEngine] Resultado:", {
    servico: servico.nome,
    score_final: Math.round(percentual),
    score_bruto: score,
    max_score: maxScore,
    justificativa: justificativa.join(' â€¢ ')
  });
  
  return {
    score: Math.round(percentual),
    justificativa: justificativa.join(' â€¢ '),
    restricoes,
    detalhes
  };
}

/**
 * Calcula bonus baseado no histÃ³rico de aprendizado
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
  
  console.log("ðŸ“š [RecomendacaoEngine] Aprendizado:", {
    servico: servico.nome,
    casos_similares: casosSimilares.length,
    bonus: Math.min(casosSimilares.length * 5, 15)
  });
  
  // Cada caso similar adiciona 5 pontos, mÃ¡ximo 15
  return Math.min(casosSimilares.length * 5, 15);
}

/**
 * Recomenda alisamentos com lÃ³gica avanÃ§ada
 * IMPORTANTE: Filtra apenas serviÃ§os ATIVOS
 */
export async function recomendarAlisamentosInteligente(analise, servicos) {
  const servicosSafe = ensureArray(servicos);
  console.log("ðŸš€ [RecomendacaoEngine] Iniciando recomendaÃ§Ã£o de alisamentos");
  console.log("ðŸ“Š [RecomendacaoEngine] Total de serviÃ§os:", servicosSafe.length);
  
  // FILTRAR APENAS SERVIÃ‡OS ATIVOS
  const alisamentos = servicosSafe.filter(s => s.tipo === 'alisamento' && s.ativo !== false);
  console.log("âœ¨ [RecomendacaoEngine] Alisamentos ativos:", alisamentos.length);
  
  if (alisamentos.length === 0) {
    console.warn("âš ï¸ [RecomendacaoEngine] NENHUM ALISAMENTO ATIVO!");
    return { principal: null, alternativo: null, todosScores: [] };
  }
  
  // Buscar histÃ³rico de aprendizado
  let historicoAprendizado = [];
  try {
    const metricas = await appApi.entities.AprendizadoMetrica.list('-created_date', 50);
    historicoAprendizado = ensureArray(metricas).filter(m => m.resultado_satisfatorio === true);
    console.log("ðŸ“š [RecomendacaoEngine] HistÃ³rico carregado:", historicoAprendizado.length, "casos bem-sucedidos");
  } catch (error) {
    console.log('âš ï¸ [RecomendacaoEngine] NÃ£o foi possÃ­vel carregar histÃ³rico de aprendizado');
  }
  
  // Calcular score para cada alisamento
  const scoresAlisamentos = ensureArray(alisamentos).map(servico => {
    console.log("\nðŸ” [RecomendacaoEngine] Analisando:", servico.nome);
    const resultado = calcularCompatibilidadeAvancada(analise, servico, historicoAprendizado);
    return {
      servico,
      score: resultado.score,
      justificativa: resultado.justificativa,
      restricoes: resultado.restricoes,
      detalhes: resultado.detalhes
    };
  });
  
  // Filtrar serviÃ§os com restriÃ§Ãµes (score 0)
  const servicosValidos = scoresAlisamentos.filter(s => s.score > 0);
  console.log("âœ… [RecomendacaoEngine] ServiÃ§os vÃ¡lidos:", servicosValidos.length);
  
  // Ordenar por score
  servicosValidos.sort((a, b) => b.score - a.score);
  
  console.log("ðŸ† [RecomendacaoEngine] Ranking final:");
  servicosValidos.forEach((s, i) => {
    console.log(`${i + 1}. ${s.servico.nome} - ${s.score}% de compatibilidade`);
  });
  
  return {
    principal: servicosValidos[0] || null,
    alternativo: servicosValidos[1] || null,
    todosScores: servicosValidos
  };
}

/**
 * Recomenda tratamento com lÃ³gica avanÃ§ada
 * IMPORTANTE: Filtra apenas serviÃ§os ATIVOS
 */
export async function recomendarTratamentoInteligente(analise, servicos) {
  const servicosSafe = ensureArray(servicos);
  console.log("ðŸš€ [RecomendacaoEngine] Iniciando recomendaÃ§Ã£o de tratamento");
  
  // FILTRAR APENAS SERVIÃ‡OS ATIVOS
  const tratamentos = servicosSafe.filter(s => s.tipo === 'tratamento' && s.ativo !== false);
  console.log("ðŸ’§ [RecomendacaoEngine] Tratamentos ativos:", tratamentos.length);
  
  if (tratamentos.length === 0) {
    console.warn("âš ï¸ [RecomendacaoEngine] NENHUM TRATAMENTO ATIVO!");
    return null;
  }
  
  // Buscar histÃ³rico
  let historicoAprendizado = [];
  try {
    const metricas = await appApi.entities.AprendizadoMetrica.list('-created_date', 50);
    historicoAprendizado = ensureArray(metricas).filter(m => m.resultado_satisfatorio === true);
  } catch (error) {
    console.log('âš ï¸ [RecomendacaoEngine] NÃ£o foi possÃ­vel carregar histÃ³rico de aprendizado');
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
  
  // Filtrar vÃ¡lidos e ordenar
  const servicosValidos = scoresTratamentos.filter(s => s.score > 0);
  servicosValidos.sort((a, b) => b.score - a.score);
  
  console.log("ðŸ† [RecomendacaoEngine] Melhor tratamento:", servicosValidos[0]?.servico.nome, "-", servicosValidos[0]?.score, "%");
  
  return servicosValidos[0] || null;
}

/**
 * Registra feedback e atualiza aprendizado
 */
export async function registrarFeedbackAprendizado(analise, feedbackPositivo, comentario) {
  try {
    // Buscar todos os serviÃ§os para obter os IDs
    const todosServicos = await appApi.entities.Servico.list();
    
    // Registrar mÃ©trica de aprendizado para alisamento
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
    
    // Registrar mÃ©trica para tratamento
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
    
    console.log('âœ… Feedback registrado no sistema de aprendizado');
  } catch (error) {
    console.error('Erro ao registrar feedback:', error);
    // NÃ£o propagar o erro para nÃ£o quebrar a experiÃªncia do usuÃ¡rio
  }
}

export function calcularTempoEstimado(volumeCapilar, tempoBase = 3) {
  const multiplicadores = {
    'baixo': 1.0,
    'mÃ©dio': 1.15,
    'alto': 1.30
  };
  
  const multiplicador = multiplicadores[volumeCapilar] || 1.0;
  const tempoMin = Math.round(tempoBase * multiplicador);
  const tempoMax = tempoMin + 1;
  
  return `${tempoMin}-${tempoMax} horas`;
}

export function calcularAjusteOrcamento(volumeCapilar) {
  const ajustes = {
    'baixo': 'padrÃ£o (0%)',
    'mÃ©dio': '+10% a +15%',
    'alto': '+20% a +30%'
  };
  
  return ajustes[volumeCapilar] || 'padrÃ£o (0%)';
}

export function determinarNivelDano(condicaoCabelo) {
  const condicao = condicaoCabelo?.toLowerCase() || '';
  
  if (condicao.includes('saudÃ¡vel') || condicao.includes('bom estado') || condicao.includes('Ã³timo')) {
    return 'leve';
  }
  
  if (condicao.includes('severamente') || condicao.includes('muito danificado') || condicao.includes('extremamente') || condicao.includes('grave')) {
    return 'severo';
  }
  
  return 'moderado';
}



