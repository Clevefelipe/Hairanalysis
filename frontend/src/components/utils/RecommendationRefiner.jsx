// 🎯 RECOMMENDATION REFINER - Sistema de Refinamento Inteligente de Recomendações
// SDM Analyzer IA v1.0 - Aprendizado Baseado em Histórico

import { appApi } from "@/api/appClient";

/**
 * 🎯 SISTEMA DE REFINAMENTO DE RECOMENDAÇÕES
 * 
 * Analisa histórico de análises anteriores para refinar recomendações:
 * - Histórico pessoal do cliente
 * - Histórico de clientes com perfis semelhantes
 * - Taxa de sucesso de cada serviço
 * - Padrões de compatibilidade
 * 
 * Retorna scores de compatibilidade (0-100) para cada recomendação
 */

class RecommendationRefinerEngine {
  constructor() {
    this.version = '1.0.0';
    this.module_name = 'RECOMMENDATION_REFINER';
  }

  /**
   * 🔍 Refinar recomendações baseado em histórico
   */
  async refineRecommendations(currentAnalysis, availableServices, clienteId = null) {

    try {
      // Buscar histórico relevante
      const historicalData = await this._fetchRelevantHistory(currentAnalysis, clienteId);

      // Calcular scores de compatibilidade
      const refinedRecommendations = await this._calculateCompatibilityScores(
        currentAnalysis,
        availableServices,
        historicalData
      );

      return refinedRecommendations;

    } catch (error) {
      // Retornar recomendações sem refino em caso de erro
      return {
        alisamento: null,
        tratamento: null,
        corte: null,
        using_refinement: false
      };
    }
  }

  /**
   * 📊 Buscar histórico relevante
   */
  async _fetchRelevantHistory(currentAnalysis, clienteId) {
    try {
      // Buscar todas as análises
      const allAnalyses = await appApi.entities.Analise.list('-created_date', 200);

      // Filtrar análises com feedback positivo
      const successfulAnalyses = allAnalyses.filter(a => a.feedback_positivo === true);

      // Separar histórico do cliente e de outros clientes
      const clientHistory = clienteId ? 
        successfulAnalyses.filter(a => a.cliente_id === clienteId) : [];

      // Encontrar clientes com perfis similares
      const similarProfiles = this._findSimilarProfiles(currentAnalysis, successfulAnalyses);

      return {
        client_history: clientHistory,
        similar_profiles: similarProfiles,
        total_analyses: successfulAnalyses.length
      };

    } catch (error) {
      return {
        client_history: [],
        similar_profiles: [],
        total_analyses: 0
      };
    }
  }

  /**
   * 🔍 Encontrar perfis similares
   */
  _findSimilarProfiles(currentAnalysis, allAnalyses) {
    const similarProfiles = [];

    for (const analysis of allAnalyses) {
      let similarityScore = 0;

      // Comparar tipo de fio (peso 30%)
      if (analysis.tipo_fio_detalhado === currentAnalysis.tipo_fio_detalhado ||
          analysis.tipo_fio === currentAnalysis.tipo_fio) {
        similarityScore += 30;
      }

      // Comparar nível de dano (peso 25%)
      if (analysis.nivel_dano === currentAnalysis.nivel_dano) {
        similarityScore += 25;
      }

      // Comparar estrutura (peso 15%)
      if (analysis.estrutura_fio === currentAnalysis.estrutura_fio) {
        similarityScore += 15;
      }

      // Comparar volume (peso 15%)
      if (analysis.volume_capilar === currentAnalysis.volume_capilar) {
        similarityScore += 15;
      }

      // Comparar coloração (peso 10%)
      if (analysis.coloracao_cabelo === currentAnalysis.coloracao_cabelo ||
          analysis.cor_cabelo_detectada === currentAnalysis.cor_cabelo_detectada) {
        similarityScore += 10;
      }

      // Comparar nível de descoloração (peso 5%)
      if (analysis.nivel_descoloracao === currentAnalysis.nivel_descoloracao) {
        similarityScore += 5;
      }

      // Considerar perfil similar se score >= 60%
      if (similarityScore >= 60) {
        similarProfiles.push({
          analysis,
          similarity_score: similarityScore
        });
      }
    }

    // Ordenar por similaridade
    similarProfiles.sort((a, b) => b.similarity_score - a.similarity_score);

    return similarProfiles.slice(0, 20); // Top 20 perfis mais similares
  }

  /**
   * 🧮 Calcular scores de compatibilidade
   */
  async _calculateCompatibilityScores(currentAnalysis, availableServices, historicalData) {
    const alisamentos = availableServices.filter(s => s.tipo === 'alisamento');
    const tratamentos = availableServices.filter(s => s.tipo === 'tratamento');

    // Calcular scores para alisamentos
    const alisamentoScores = this._calculateServiceScores(
      alisamentos,
      currentAnalysis,
      historicalData,
      'alisamento'
    );

    // Calcular scores para tratamentos
    const tratamentoScores = this._calculateServiceScores(
      tratamentos,
      currentAnalysis,
      historicalData,
      'tratamento'
    );

    // Selecionar melhores recomendações
    const bestAlisamento = alisamentoScores.length > 0 ? alisamentoScores[0] : null;
    const secondAlisamento = alisamentoScores.length > 1 ? alisamentoScores[1] : null;
    const bestTratamento = tratamentoScores.length > 0 ? tratamentoScores[0] : null;
    const secondTratamento = tratamentoScores.length > 1 ? tratamentoScores[1] : null;

    return {
      alisamento: {
        principal: bestAlisamento,
        alternativo: secondAlisamento
      },
      tratamento: {
        principal: bestTratamento,
        alternativo: secondTratamento
      },
      using_refinement: true,
      confidence: this._calculateConfidence(historicalData.total_analyses)
    };
  }

  /**
   * 📊 Calcular scores para serviços
   */
  _calculateServiceScores(services, currentAnalysis, historicalData, serviceType) {
    const scores = [];

    for (const service of services) {
      let score = 0;
      let details = {
        base_score: 0,
        history_bonus: 0,
        similar_profiles_bonus: 0,
        indication_bonus: 0
      };

      // 1. SCORE BASE - Indicações do serviço (40 pontos)
      const indicationScore = this._calculateIndicationScore(service, currentAnalysis);
      score += indicationScore;
      details.base_score = indicationScore;

      // 2. HISTÓRICO DO CLIENTE - (30 pontos)
      const historyScore = this._calculateHistoryScore(
        service,
        historicalData.client_history,
        serviceType
      );
      score += historyScore;
      details.history_bonus = historyScore;

      // 3. PERFIS SIMILARES - (25 pontos)
      const similarScore = this._calculateSimilarProfilesScore(
        service,
        historicalData.similar_profiles,
        serviceType
      );
      score += similarScore;
      details.similar_profiles_bonus = similarScore;

      // 4. LEARNING SCORE DO SERVIÇO - (5 pontos)
      const learningScore = (service.score_aprendizado || 0) / 20; // Max 5 pontos
      score += learningScore;
      details.learning_bonus = learningScore;

      scores.push({
        service_id: service.id,
        service_name: service.nome,
        compatibility_score: Math.round(score),
        details,
        service
      });
    }

    // Ordenar por score
    scores.sort((a, b) => b.compatibility_score - a.compatibility_score);

    return scores;
  }

  /**
   * 📋 Calcular score baseado em indicações
   */
  _calculateIndicationScore(service, currentAnalysis) {
    const indicacoes = service.indicacoes;
    if (!indicacoes) return 20; // Score neutro

    let score = 0;
    let matchCount = 0;
    let totalChecks = 0;

    // Verificar tipo de cabelo
    if (indicacoes.tipo_cabelo && indicacoes.tipo_cabelo.length > 0) {
      totalChecks++;
      const tipoBase = this._getTipoBasico(currentAnalysis.tipo_fio_detalhado || currentAnalysis.tipo_fio);
      if (indicacoes.tipo_cabelo.includes(tipoBase)) {
        matchCount++;
      }
    }

    // Verificar estrutura
    if (indicacoes.estrutura && indicacoes.estrutura.length > 0) {
      totalChecks++;
      if (indicacoes.estrutura.includes(currentAnalysis.estrutura_fio)) {
        matchCount++;
      }
    }

    // Verificar volume
    if (indicacoes.volume && indicacoes.volume.length > 0) {
      totalChecks++;
      if (indicacoes.volume.includes(currentAnalysis.volume_capilar)) {
        matchCount++;
      }
    }

    // Verificar nível de dano
    if (indicacoes.nivel_dano && indicacoes.nivel_dano.length > 0) {
      totalChecks++;
      if (indicacoes.nivel_dano.includes(currentAnalysis.nivel_dano)) {
        matchCount++;
      }
    }

    // Calcular score (máximo 40 pontos)
    if (totalChecks > 0) {
      score = (matchCount / totalChecks) * 40;
    } else {
      score = 20; // Score neutro se não houver indicações
    }

    return score;
  }

  /**
   * 📚 Calcular score baseado em histórico do cliente
   */
  _calculateHistoryScore(service, clientHistory, serviceType) {
    if (clientHistory.length === 0) return 0;

    const field = serviceType === 'alisamento' ? 'recomendacao_alisamento' : 'recomendacao_tratamento';
    
    // Contar quantas vezes este serviço foi usado com sucesso
    const successCount = clientHistory.filter(a => a[field] === service.nome).length;

    if (successCount === 0) return 0;

    // Score baseado em frequência de sucesso (máximo 30 pontos)
    const score = Math.min((successCount / clientHistory.length) * 30, 30);

    return score;
  }

  /**
   * 👥 Calcular score baseado em perfis similares
   */
  _calculateSimilarProfilesScore(service, similarProfiles, serviceType) {
    if (similarProfiles.length === 0) return 0;

    const field = serviceType === 'alisamento' ? 'recomendacao_alisamento' : 'recomendacao_tratamento';
    
    let totalScore = 0;
    let count = 0;

    for (const profile of similarProfiles) {
      if (profile.analysis[field] === service.nome) {
        // Ponderar pelo score de similaridade
        totalScore += profile.similarity_score / 100;
        count++;
      }
    }

    if (count === 0) return 0;

    // Score baseado em sucesso em perfis similares (máximo 25 pontos)
    const score = Math.min((count / similarProfiles.length) * 25, 25);

    return score;
  }

  /**
   * 🔤 Obter tipo básico de fio
   */
  _getTipoBasico(tipoDetalhado) {
    if (!tipoDetalhado) return '';
    
    const tipo = tipoDetalhado.charAt(0);
    
    switch (tipo) {
      case '1': return 'liso';
      case '2': return 'ondulado';
      case '3': return 'cacheado';
      case '4': return 'crespo';
      default: return '';
    }
  }

  /**
   * 📊 Calcular confiança geral
   */
  _calculateConfidence(totalAnalyses) {
    if (totalAnalyses < 5) return 60;
    if (totalAnalyses < 20) return 75;
    if (totalAnalyses < 50) return 85;
    return 95;
  }

  /**
   * 📈 Obter estatísticas
   */
  getStats() {
    return {
      module_name: this.module_name,
      version: this.version,
      status: 'active'
    };
  }
}

// Singleton
const recommendationRefiner = new RecommendationRefinerEngine();

/**
 * 🎯 Função pública para refinar recomendações
 */
export async function refineRecommendations(currentAnalysis, availableServices, clienteId = null) {
  return await recommendationRefiner.refineRecommendations(currentAnalysis, availableServices, clienteId);
}

/**
 * 📊 Obter estatísticas
 */
export function getRefinerStats() {
  return recommendationRefiner.getStats();
}

export default recommendationRefiner;

