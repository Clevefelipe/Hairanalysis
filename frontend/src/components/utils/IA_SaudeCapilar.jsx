// 🔬 IA SAÚDE CAPILAR - Módulo de Tricologia Avançada
// SDM Analyzer IA v3.0 - Análise Microscópica de Couro Cabeludo
// Função: Diagnóstico tricológico profissional e científico

import { appApi } from "@/api/appClient";

/**
 * 🔬 IA SAÚDE CAPILAR - Controladora de Análise Tricológica
 */
class IASaudeCapilar {
  constructor() {
    this.nome = "IA_SAUDE_CAPILAR";
    this.versao = "3.0";
    this.ultimaAnalise = null;
    this.metricas = {
      totalAnalisesTricolicas: 0,
      precisaoMedia: 0,
      totalDiagnosticos: 0
    };
  }

  /**
   * 🔄 Comparar Análises (Antes x Depois)
   */
  async compararAnalises(analiseAnterior, analiseAtual) {
    console.log(`🔄 [${this.nome}] Comparando análises tricológicas...`);
    
    try {
      const comparacao = {
        timestamp: new Date().toISOString(),
        periodo: this.calcularPeriodo(analiseAnterior.created_date, analiseAtual.created_date),
        
        evolucao_oleosidade: {
          anterior: analiseAnterior.oleosidade_sebo?.percentual_oleosidade || 0,
          atual: analiseAtual.oleosidade_sebo?.percentual_oleosidade || 0,
          variacao: (analiseAtual.oleosidade_sebo?.percentual_oleosidade || 0) - 
                   (analiseAnterior.oleosidade_sebo?.percentual_oleosidade || 0),
          status: this.calcularStatus(
            analiseAnterior.oleosidade_sebo?.percentual_oleosidade,
            analiseAtual.oleosidade_sebo?.percentual_oleosidade,
            'oleosidade'
          )
        },
        
        evolucao_descamacao: {
          anterior: analiseAnterior.descamacao_caspa?.percentual_descamacao || 0,
          atual: analiseAtual.descamacao_caspa?.percentual_descamacao || 0,
          variacao: (analiseAtual.descamacao_caspa?.percentual_descamacao || 0) - 
                   (analiseAnterior.descamacao_caspa?.percentual_descamacao || 0),
          status: this.calcularStatus(
            analiseAnterior.descamacao_caspa?.percentual_descamacao,
            analiseAtual.descamacao_caspa?.percentual_descamacao,
            'descamacao'
          )
        },
        
        evolucao_saude_geral: {
          anterior: analiseAnterior.metricas_quantitativas?.indice_saude_geral || 0,
          atual: analiseAtual.metricas_quantitativas?.indice_saude_geral || 0,
          variacao: (analiseAtual.metricas_quantitativas?.indice_saude_geral || 0) - 
                   (analiseAnterior.metricas_quantitativas?.indice_saude_geral || 0),
          status: this.calcularStatus(
            analiseAnterior.metricas_quantitativas?.indice_saude_geral,
            analiseAtual.metricas_quantitativas?.indice_saude_geral,
            'saude'
          )
        },
        
        evolucao_densidade: {
          anterior: analiseAnterior.densidade_folicular?.foliculos_por_cm2 || 0,
          atual: analiseAtual.densidade_folicular?.foliculos_por_cm2 || 0,
          variacao: (analiseAtual.densidade_folicular?.foliculos_por_cm2 || 0) - 
                   (analiseAnterior.densidade_folicular?.foliculos_por_cm2 || 0),
          status: this.calcularStatus(
            analiseAnterior.densidade_folicular?.foliculos_por_cm2,
            analiseAtual.densidade_folicular?.foliculos_por_cm2,
            'densidade'
          )
        },
        
        resumo_evolucao: '',
        recomendacoes_ajustadas: []
      };

      // Gerar resumo
      comparacao.resumo_evolucao = this.gerarResumoEvolucao(comparacao);

      console.log('✅ [IA_SAUDE_CAPILAR] Comparação concluída');
      return comparacao;

    } catch (error) {
      console.error(`❌ [${this.nome}] Erro na comparação:`, error);
      throw error;
    }
  }

  /**
   * 📊 Calcular Status de Evolução
   */
  calcularStatus(valorAnterior, valorAtual, tipo) {
    if (!valorAnterior || !valorAtual) return 'sem_dados';
    
    const variacao = valorAtual - valorAnterior;
    
    // Para oleosidade e descamação, diminuir é melhor
    if (tipo === 'oleosidade' || tipo === 'descamacao') {
      if (variacao <= -10) return 'melhora_significativa';
      if (variacao < 0) return 'melhora';
      if (variacao === 0) return 'estavel';
      if (variacao < 10) return 'piora_leve';
      return 'piora_significativa';
    }
    
    // Para saúde e densidade, aumentar é melhor
    if (tipo === 'saude' || tipo === 'densidade') {
      if (variacao >= 10) return 'melhora_significativa';
      if (variacao > 0) return 'melhora';
      if (variacao === 0) return 'estavel';
      if (variacao > -10) return 'piora_leve';
      return 'piora_significativa';
    }
    
    return 'estavel';
  }

  /**
   * 📅 Calcular Período entre Análises
   */
  calcularPeriodo(dataAnterior, dataAtual) {
    const diff = new Date(dataAtual) - new Date(dataAnterior);
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias < 7) return `${dias} dia(s)`;
    if (dias < 30) return `${Math.floor(dias / 7)} semana(s)`;
    if (dias < 365) return `${Math.floor(dias / 30)} mês(es)`;
    return `${Math.floor(dias / 365)} ano(s)`;
  }

  /**
   * 📝 Gerar Resumo de Evolução
   */
  gerarResumoEvolucao(comparacao) {
    const melhorias = [];
    const pioras = [];
    const estaveis = [];
    
    if (comparacao.evolucao_oleosidade.status.includes('melhora')) {
      melhorias.push('redução na oleosidade');
    } else if (comparacao.evolucao_oleosidade.status.includes('piora')) {
      pioras.push('aumento na oleosidade');
    } else {
      estaveis.push('oleosidade estável');
    }
    
    if (comparacao.evolucao_descamacao.status.includes('melhora')) {
      melhorias.push('redução na descamação');
    } else if (comparacao.evolucao_descamacao.status.includes('piora')) {
      pioras.push('aumento na descamação');
    } else {
      estaveis.push('descamação estável');
    }
    
    if (comparacao.evolucao_saude_geral.status.includes('melhora')) {
      melhorias.push('melhora na saúde geral');
    } else if (comparacao.evolucao_saude_geral.status.includes('piora')) {
      pioras.push('piora na saúde geral');
    } else {
      estaveis.push('saúde geral estável');
    }
    
    let resumo = `Período de acompanhamento: ${comparacao.periodo}.\n\n`;
    
    if (melhorias.length > 0) {
      resumo += `✅ Melhorias observadas: ${melhorias.join(', ')}.\n`;
    }
    if (pioras.length > 0) {
      resumo += `⚠️ Pontos de atenção: ${pioras.join(', ')}.\n`;
    }
    if (estaveis.length > 0) {
      resumo += `➡️ Condições estáveis: ${estaveis.join(', ')}.\n`;
    }
    
    return resumo;
  }

  /**
   * 📊 Obter Métricas
   */
  obterMetricas() {
    return {
      modulo: this.nome,
      versao: this.versao,
      metricas: this.metricas,
      ultima_analise: this.ultimaAnalise,
      status: 'ativo'
    };
  }
}

// Singleton global
const iaSaudeCapilar = new IASaudeCapilar();

export async function realizarAnaliseTricologica(imagemUrl, clienteInfo, analiseCapilarId = null) {
  console.log('🔬 [IA_SAUDE_CAPILAR] Iniciando análise tricológica avançada...');

  try {
    const prompt = `Você é uma IA especializada em TRICOLOGIA e SAÚDE CAPILAR do SDM Analyzer IA.

═══════════════════════════════════════════════════════════
🔬 ANÁLISE TRICOLÓGICA AVANÇADA — Diagnóstico Completo
═══════════════════════════════════════════════════════════

EXAMINE a imagem microscópica do couro cabeludo com MÁXIMA PRECISÃO TÉCNICA.

📋 PROTOCOLO DE ANÁLISE DETALHADA:

1️⃣ **DENSIDADE FOLICULAR**
   - Conte os folículos visíveis por cm² (estimativa técnica)
   - Classifique: baixa (<120), média (120-150), alta (150-180), muito_alta (>180)
   - Detecte rarefação e áreas afetadas

2️⃣ **DETECÇÃO DE ALOPECIA** (CRÍTICO)
   - Identifique TIPO:
     • androgenética (miniaturização progressiva)
     • areata (placas circulares)
     • difusa (perda generalizada)
     • tração (dano mecânico)
     • cicatricial (fibrose permanente)
   - Avalie GRAU (0-5): 0=nenhum, 1=mínimo, 2=leve, 3=moderado, 4=severo, 5=crítico
   - Identifique ÁREA: frontal, parietal, temporal, occipital ou difusa
   - Detecte sinais de MINIATURIZAÇÃO (fios afinando progressivamente)
   - **Se detectar alopecia severa (grau >= 3), OBRIGATORIAMENTE recomendar avaliação dermatológica**

3️⃣ **OLEOSIDADE E SEBO** ⭐ NOVA ANÁLISE
   - Identifique brilho excessivo no couro cabeludo
   - Detecte acúmulo de sebo (manchas mais escuras/brilhosas)
   - Classifique: baixo, médio, alto, excessivo
   - Avalie obstrução folicular (0-100%)
   - **Recomendações automáticas**:
     • Oleosidade alta: shampoos equilibrantes, uso de tônicos, espaçamento de lavagens
     • Oleosidade excessiva: avaliação dermatológica, tratamento com ácido salicílico

4️⃣ **DESCAMAÇÃO E CASPA** ⭐ NOVA ANÁLISE
   - Identifique flocos, placas ou irritação visível
   - Classifique tipo: seca, oleosa, mista
   - Avalie severidade: leve, moderada, severa
   - Detecte distribuição: localizada ou difusa
   - Identifique sinais de irritação (vermelhidão)
   - **Recomendações automáticas**:
     • Descamação leve: shampoos calmantes, esfoliação suave
     • Descamação severa: avaliação dermatológica, possível dermatite seborreica

5️⃣ **POROSIDADE DOS FIOS** ⭐ NOVA ANÁLISE
   - Analise textura visual dos fios (ásperos, ressecados, quebradiços)
   - Detecte cutículas abertas (fios opacos, sem brilho)
   - Classifique: baixa, média, alta, muito_alta
   - Score de porosidade (0-100)
   - **Recomendações automáticas**:
     • Porosidade alta: tratamentos de selagem, hidratação profunda, controle de pH
     • Porosidade muito_alta: reconstrução capilar, proteínas, cronograma capilar

6️⃣ **QUEBRA E FRAGILIDADE** ⭐ NOVA ANÁLISE
   - Analise uniformidade dos fios (comprimentos diferentes = quebra)
   - Detecte pontas duplas visíveis
   - Identifique fragmentação de fios
   - Avalie elasticidade (fios elásticos resistem melhor)
   - Score de resistência (0-100)
   - **Recomendações automáticas**:
     • Quebra moderada: reconstruções com queratina, cronograma de força
     • Quebra severa: corte de pontas obrigatório, nutrição intensiva

7️⃣ **CONDIÇÕES INFLAMATÓRIAS**
   - Detecte sinais de inflamação (vermelhidão, irritação)
   - Identifique: dermatite seborreica, foliculite, psoríase
   - Classifique severidade

8️⃣ **SAÚDE DO COURO CABELUDO**
   - Coloração: normal, avermelhado, pálido, irregular
   - Textura: lisa, irregular, escamosa, mista
   - Elasticidade: boa, regular, baixa
   - Hidratação: adequada, seca, muito_seca
   - Microcirculação: boa, regular, comprometida

9️⃣ **ESTADO DOS FOLÍCULOS**
   - Percentual de folículos saudáveis (0-100%)
   - Detecte obstrução folicular
   - Identifique miniaturização
   - Sinais de queda excessiva

🔟 **MÉTRICAS QUANTITATIVAS**
   - Índice de Saúde Geral (0-100)
   - Espessura média dos fios (micrometros)
   - Scores individuais

1️⃣1️⃣ **ROTINA PERSONALIZADA DE CUIDADOS** ⭐ OBRIGATÓRIO
   Gere uma ROTINA SEMANAL DETALHADA baseada no diagnóstico:
   
   **Rotina Semanal**: Array com dias da semana e cuidados específicos
   Exemplo:
   [
     {
       "dia": "Segunda-feira",
       "cuidados": ["Shampoo equilibrante para oleosidade", "Máscara hidratante leve (5min)", "Finalização com leave-in anti-frizz"]
     },
     {
       "dia": "Quinta-feira",
       "cuidados": ["Nutrição profunda com óleos vegetais", "Cronograma: dia da nutrição", "Finalização natural sem calor"]
     }
   ]
   
   **Tratamentos Profissionais**: Recomende tratamentos no salão
   Exemplo:
   [
     {
       "nome": "Hidratação Profunda",
       "frequencia": "Quinzenal",
       "objetivo": "Repor umidade e selar cutícula"
     },
     {
       "nome": "Cauterização Capilar",
       "frequencia": "Mensal",
       "objetivo": "Reconstruir fibra capilar e reduzir quebra"
     }
   ]
   
   **Home Care**: Produtos para uso domiciliar
   Exemplo:
   [
     {
       "produto": "Tônico Antiqueda com Minoxidil",
       "uso": "Aplicar no couro cabeludo 2x ao dia",
       "objetivo": "Estimular crescimento e fortalecer raiz"
     },
     {
       "produto": "Sérum Reparador de Pontas",
       "uso": "Aplicar nas pontas após lavar",
       "objetivo": "Selar pontas e prevenir quebra"
     }
   ]
   
   **Manutenção no Salão**:
   {
     "frequencia": "Mensal",
     "recomendacao": "Avaliação tricológica de acompanhamento e ajuste de tratamentos conforme evolução"
   }

═══════════════════════════════════════════════════════════
⚠️ ALERTA AUTOMÁTICO OBRIGATÓRIO:
═══════════════════════════════════════════════════════════

- Se ALOPECIA detectada (grau >= 3): "⚠ ALERTA: Sinais de alopecia detectados. Recomenda-se avaliação dermatológica urgente."
- Se DESCAMAÇÃO severa: "⚠ ALERTA: Descamação severa detectada. Possível dermatite seborreica. Avaliação médica recomendada."
- Se QUEBRA severa: "⚠ ALERTA: Quebra severa detectada. Corte de pontas obrigatório e reconstrução intensiva necessária."
- Se INFLAMAÇÃO presente: "⚠ ALERTA: Sinais inflamatórios detectados. Avaliação dermatológica recomendada."

═══════════════════════════════════════════════════════════
📊 LINGUAGEM TÉCNICA PROFISSIONAL:
═══════════════════════════════════════════════════════════

Use terminologia tricológica precisa:
- "Miniaturização folicular progressiva"
- "Hiperqueratose folicular"
- "Dermatite seborreica leve com descamação oleosa"
- "Porosidade elevada com cutícula aberta e perda de proteínas"
- "Fragilidade capilar com elasticidade comprometida"

═══════════════════════════════════════════════════════════

Analise a imagem com RIGOR TÉCNICO e forneça diagnóstico COMPLETO e PROFISSIONAL.`;

    const analiseSchema = {
      type: "object",
      properties: {
        densidade_folicular: {
          type: "object",
          properties: {
            foliculos_por_cm2: { type: "number" },
            classificacao: { type: "string", enum: ["baixa", "média", "alta", "muito_alta"] },
            rarefacao_detectada: { type: "boolean" },
            areas_afetadas: { type: "string" }
          },
          required: ["foliculos_por_cm2", "classificacao", "rarefacao_detectada"]
        },
        deteccao_alopecia: {
          type: "object",
          properties: {
            alopecia_detectada: { type: "boolean" },
            tipo_alopecia: { 
              type: "string", 
              enum: ["nenhuma", "androgenética", "areata", "difusa", "tracao", "cicatricial", "indeterminada"] 
            },
            grau_rarefacao: { 
              type: "number", 
              minimum: 0, 
              maximum: 5
            },
            area_predominante: { 
              type: "string", 
              enum: ["nenhuma", "frontal", "parietal", "temporal", "occipital", "difusa"] 
            },
            padrao_perda: { type: "string", enum: ["nenhum", "focal", "difuso", "marginal"] },
            progressao_ativa: { type: "boolean" },
            sinais_miniaturizacao: { type: "boolean" },
            requer_encaminhamento_medico: { type: "boolean" },
            recomendacao_alopecia: { type: "string" }
          },
          required: ["alopecia_detectada", "tipo_alopecia", "grau_rarefacao", "requer_encaminhamento_medico"]
        },
        oleosidade_sebo: {
          type: "object",
          properties: {
            nivel_oleosidade: { type: "string", enum: ["baixo", "médio", "alto", "excessivo"] },
            percentual_oleosidade: { type: "number", minimum: 0, maximum: 100 },
            obstrucao_folicular: { type: "number", minimum: 0, maximum: 100 },
            sebo_acumulado: { type: "boolean" },
            brilho_excessivo_detectado: { type: "boolean" },
            recomendacao_oleosidade: { type: "string" }
          },
          required: ["nivel_oleosidade", "sebo_acumulado", "recomendacao_oleosidade"]
        },
        descamacao_caspa: {
          type: "object",
          properties: {
            presente: { type: "boolean" },
            tipo: { type: "string", enum: ["seca", "oleosa", "mista", "nenhuma"] },
            severidade: { type: "string", enum: ["leve", "moderada", "severa", "nenhuma"] },
            percentual_descamacao: { type: "number", minimum: 0, maximum: 100 },
            distribuicao: { type: "string", enum: ["localizada", "difusa", "nenhuma"] },
            irritacao_visivel: { type: "boolean" },
            recomendacao_descamacao: { type: "string" }
          },
          required: ["presente", "tipo", "severidade", "recomendacao_descamacao"]
        },
        porosidade_fios: {
          type: "object",
          properties: {
            nivel_porosidade: { type: "string", enum: ["baixa", "média", "alta", "muito_alta"] },
            cuticula_aberta: { type: "boolean" },
            textura_aspera: { type: "boolean" },
            fios_ressecados: { type: "boolean" },
            perda_brilho: { type: "boolean" },
            score_porosidade: { type: "number", minimum: 0, maximum: 100 },
            recomendacao_porosidade: { type: "string" }
          },
          required: ["nivel_porosidade", "score_porosidade", "recomendacao_porosidade"]
        },
        quebra_fios: {
          type: "object",
          properties: {
            quebra_detectada: { type: "boolean" },
            nivel_quebra: { type: "string", enum: ["mínima", "leve", "moderada", "severa"] },
            pontas_duplas: { type: "boolean" },
            fragmentacao_fios: { type: "boolean" },
            uniformidade_baixa: { type: "boolean" },
            fios_elasticos: { type: "boolean" },
            score_resistencia: { type: "number", minimum: 0, maximum: 100 },
            recomendacao_quebra: { type: "string" }
          },
          required: ["quebra_detectada", "nivel_quebra", "score_resistencia", "recomendacao_quebra"]
        },
        condicoes_inflamatorias: {
          type: "object",
          properties: {
            inflamacao_presente: { type: "boolean" },
            dermatite_seborreica: { type: "boolean" },
            foliculite: { type: "boolean" },
            psoriase: { type: "boolean" },
            outras_condicoes: { type: "string" },
            severidade: { type: "string", enum: ["leve", "moderada", "severa", "nenhuma"] }
          },
          required: ["inflamacao_presente", "severidade"]
        },
        saude_couro_cabeludo: {
          type: "object",
          properties: {
            coloracao: { type: "string", enum: ["normal", "avermelhado", "pálido", "irregular"] },
            textura: { type: "string", enum: ["lisa", "irregular", "escamosa", "mista"] },
            elasticidade: { type: "string", enum: ["boa", "regular", "baixa"] },
            hidratacao: { type: "string", enum: ["adequada", "seca", "muito_seca"] },
            microcirculacao: { type: "string", enum: ["boa", "regular", "comprometida"] }
          },
          required: ["coloracao", "textura", "elasticidade", "hidratacao", "microcirculacao"]
        },
        estado_foliculos: {
          type: "object",
          properties: {
            foliculos_saudaveis_percentual: { type: "number", minimum: 0, maximum: 100 },
            obstrucao_folicular: { type: "boolean" },
            miniatuzacao_detectada: { type: "boolean" },
            sinais_queda_excessiva: { type: "boolean" },
            foliculos_comprometidos: { type: "string" }
          },
          required: ["foliculos_saudaveis_percentual", "obstrucao_folicular"]
        },
        metricas_quantitativas: {
          type: "object",
          properties: {
            indice_saude_geral: { type: "number", minimum: 0, maximum: 100 },
            espessura_media_fio_micrometros: { type: "number" },
            score_oleosidade: { type: "number", minimum: 0, maximum: 100 },
            score_descamacao: { type: "number", minimum: 0, maximum: 100 },
            score_inflamacao: { type: "number", minimum: 0, maximum: 100 }
          },
          required: ["indice_saude_geral"]
        },
        rotina_cuidados: {
          type: "object",
          properties: {
            rotina_semanal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dia: { type: "string" },
                  cuidados: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["dia", "cuidados"]
              }
            },
            tratamentos_profissionais: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  frequencia: { type: "string" },
                  objetivo: { type: "string" }
                },
                required: ["nome", "frequencia", "objetivo"]
              }
            },
            home_care: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  produto: { type: "string" },
                  uso: { type: "string" },
                  objetivo: { type: "string" }
                },
                required: ["produto", "uso", "objetivo"]
              }
            },
            manutencao_salao: {
              type: "object",
              properties: {
                frequencia: { type: "string" },
                recomendacao: { type: "string" }
              },
              required: ["frequencia", "recomendacao"]
            }
          },
          required: ["rotina_semanal", "tratamentos_profissionais", "home_care", "manutencao_salao"]
        },
        diagnostico_tecnico: { type: "string" },
        condicoes_identificadas: {
          type: "array",
          items: { type: "string" }
        },
        tratamentos_recomendados: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              tipo: { type: "string", enum: ["profissional", "homecare", "medicamentoso"] },
              objetivo: { type: "string" },
              frequencia: { type: "string" }
            },
            required: ["nome", "tipo", "objetivo"]
          }
        },
        recomendacoes_profissionais: { type: "string" },
        observacoes_adicionais: { type: "string" }
      },
      required: [
        "densidade_folicular",
        "deteccao_alopecia",
        "oleosidade_sebo",
        "descamacao_caspa",
        "porosidade_fios",
        "quebra_fios",
        "condicoes_inflamatorias",
        "saude_couro_cabeludo",
        "estado_foliculos",
        "metricas_quantitativas",
        "rotina_cuidados",
        "diagnostico_tecnico",
        "condicoes_identificadas",
        "recomendacoes_profissionais"
      ]
    };

    console.log('🧠 [IA_SAUDE_CAPILAR] Enviando imagem para backend (tricologia)...');

    // Chama o endpoint do backend que usa runAnalysisPipeline para análises tricológicas
    const payload = {
      media: [imagemUrl],
      metadata: { tipoAnalise: 'tricologia' },
      contexto: {}
    };

    const start = Date.now();
    try {
      console.log(`[IA_SAUDE_CAPILAR] POST /api/analysis/tricologia payload summary: media=${payload.media.length}`);
      const resp = await appApi.analysis.tricologia(payload);
      const duration = Date.now() - start;
      console.log(`[IA_SAUDE_CAPILAR] resposta backend recebida em ${duration}ms`, resp && typeof resp === 'object' ? { keys: Object.keys(resp) } : resp);
      const response = resp?.analysis || resp;

      iaSaudeCapilar.metricas.totalAnalisesTricolicas++;
      iaSaudeCapilar.ultimaAnalise = new Date().toISOString();

      console.log('✅ [IA_SAUDE_CAPILAR] Análise concluída com sucesso');

      // Montar resultado final
      const analiseCompleta = {
        cliente_id: clienteInfo?.id || null,
        cliente_nome: clienteInfo?.nome || "Sem cadastro",
        analise_capilar_id: analiseCapilarId,
        imagem_url: imagemUrl,
        metodo_analise: "ia_tricolica_microscopica_avancada",
        ...response,
        created_date: new Date().toISOString()
      };

      return analiseCompleta;
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`[IA_SAUDE_CAPILAR] Erro ao chamar backend após ${duration}ms:`, err);
      throw err;
    }

  } catch (error) {
    console.error('❌ [IA_SAUDE_CAPILAR] Erro na análise:', error);
    throw error;
  }
}

/**
 * 🔄 Comparar Análises Tricológicas
 */
export async function compararAnalisesTricologicas(analiseAnterior, analiseAtual) {
  return await iaSaudeCapilar.compararAnalises(analiseAnterior, analiseAtual);
}

/**
 * 📊 Obter Métricas do Módulo
 */
export function obterMetricasTricolicas() {
  return iaSaudeCapilar.obterMetricas();
}

/**
 * 🎥 ANÁLISE TRICOLÓGICA POR VÍDEO MICROSCÓPICO
 * Análise avançada usando múltiplos frames de vídeo para diagnóstico completo
 */
export async function realizarAnaliseTricologicaVideo(fileUrls, clienteInfo, analiseCapilarId = null) {
  console.log(`🎥 [IA_SAUDE_CAPILAR] Iniciando análise tricológica por vídeo (${fileUrls.length} frames)...`);

  try {
    const prompt = `Você é uma IA especialista em TRICOLOGIA e SAÚDE CAPILAR do SDM Analyzer IA.

═══════════════════════════════════════════════════════════
🎥 ANÁLISE TRICOLÓGICA POR VÍDEO MICROSCÓPICO — Diagnóstico Avançado
═══════════════════════════════════════════════════════════

Você receberá ${fileUrls.length} FRAMES SEQUENCIAIS de um vídeo microscópico percorrendo o couro cabeludo.

🎯 VANTAGENS DA ANÁLISE POR VÍDEO:
- MÚLTIPLAS ÁREAS do couro cabeludo visíveis
- DIFERENTES ÂNGULOS dos folículos
- PADRÕES DE DISTRIBUIÇÃO mais evidentes (oleosidade, descamação, rarefação)
- VARIAÇÃO de densidade folicular entre regiões
- IDENTIFICAÇÃO mais precisa de áreas afetadas

📋 PROTOCOLO DE ANÁLISE MULTIFOCAL:

1️⃣ **DENSIDADE FOLICULAR VARIÁVEL**
   - Analise TODAS as regiões mostradas no vídeo
   - Conte folículos em diferentes áreas
   - Identifique variações de densidade entre regiões
   - Média de folículos/cm² considerando todas as áreas
   - Detecte rarefação localizada ou difusa

2️⃣ **DETECÇÃO DE ALOPECIA PRECISA** (CRÍTICO)
   - Com múltiplos frames, identifique padrão de perda:
     • androgenética: miniaturização progressiva em região específica
     • areata: placas circulares com perda total
     • difusa: rarefação generalizada
     • tração: perda marginal (frontal/temporal)
   - Grau de rarefação baseado em MÚLTIPLAS observações
   - Área predominante identificada com precisão
   - **Se grau >= 3, OBRIGATÓRIO recomendar dermatologista**

3️⃣ **OLEOSIDADE E SEBO DISTRIBUÍDO**
   - Observe brilho excessivo em diferentes regiões
   - Identifique se oleosidade é:
     • Uniforme (todo couro cabeludo)
     • Localizada (região específica)
     • Irregular (áreas mais oleosas que outras)
   - Detecte acúmulo de sebo (manchas escuras/brilhosas)
   - Percentual médio de oleosidade considerando todas as áreas

4️⃣ **DESCAMAÇÃO E CASPA DISTRIBUÍDA**
   - Identifique flocos/placas em múltiplas regiões
   - Tipo: seca (flocos brancos soltos) ou oleosa (placas amareladas aderidas)
   - Distribuição: localizada (região específica) ou difusa (todo couro)
   - Percentual de área afetada
   - Irritação visível (vermelhidão)

5️⃣ **POROSIDADE E TEXTURA DOS FIOS**
   - Analise textura em diferentes regiões
   - Cutículas abertas = fios opacos, sem brilho
   - Fios ressecados = textura áspera
   - Score médio de porosidade

6️⃣ **QUEBRA E FRAGILIDADE**
   - Observe uniformidade dos comprimentos (quebra = fios irregulares)
   - Pontas duplas visíveis
   - Fragmentação
   - Score de resistência

7️⃣ **CONDIÇÕES INFLAMATÓRIAS**
   - Vermelhidão visível
   - Dermatite seborreica, foliculite, psoríase
   - Severidade

8️⃣ **ÍNDICE DE SAÚDE GERAL (0-100)**
   Calcule baseado em TODOS os frames:
   - Densidade folicular: 30 pontos
   - Ausência de alopecia: 20 pontos
   - Controle de oleosidade: 15 pontos
   - Ausência de descamação: 15 pontos
   - Baixa porosidade: 10 pontos
   - Baixa quebra: 10 pontos

9️⃣ **ROTINA PERSONALIZADA COMPLETA** ⭐ OBRIGATÓRIO
   Baseada no diagnóstico MULTIFOCAL, crie:
   
   - **Rotina Semanal** (array com dias específicos e cuidados)
   - **Tratamentos Profissionais** (recomendações de salão)
   - **Home Care** (produtos para uso diário)
   - **Manutenção** (frequência de retorno)

═══════════════════════════════════════════════════════════
⚠️ ALERTAS AUTOMÁTICOS OBRIGATÓRIOS:
═══════════════════════════════════════════════════════════

- Alopecia grau >= 3: AVALIAÇÃO DERMATOLÓGICA URGENTE
- Descamação severa: Possível dermatite seborreica
- Quebra severa: Corte e reconstrução obrigatórios
- Inflamação detectada: Avaliação médica recomendada

═══════════════════════════════════════════════════════════

Use terminologia técnica profissional e forneça diagnóstico COMPLETO baseado em TODAS as áreas observadas no vídeo.`;

    const analiseSchema = {
      type: "object",
      properties: {
        densidade_folicular: {
          type: "object",
          properties: {
            foliculos_por_cm2: { type: "number" },
            classificacao: { type: "string", enum: ["baixa", "média", "alta", "muito_alta"] },
            rarefacao_detectada: { type: "boolean" },
            areas_afetadas: { type: "string" },
            variacao_entre_regioes: { type: "string" }
          },
          required: ["foliculos_por_cm2", "classificacao", "rarefacao_detectada"]
        },
        deteccao_alopecia: {
          type: "object",
          properties: {
            alopecia_detectada: { type: "boolean" },
            tipo_alopecia: { 
              type: "string", 
              enum: ["nenhuma", "androgenética", "areata", "difusa", "tracao", "cicatricial", "indeterminada"] 
            },
            grau_rarefacao: { type: "number", minimum: 0, maximum: 5 },
            area_predominante: { 
              type: "string", 
              enum: ["nenhuma", "frontal", "parietal", "temporal", "occipital", "difusa"] 
            },
            padrao_perda: { type: "string", enum: ["nenhum", "focal", "difuso", "marginal"] },
            progressao_ativa: { type: "boolean" },
            sinais_miniaturizacao: { type: "boolean" },
            requer_encaminhamento_medico: { type: "boolean" },
            recomendacao_alopecia: { type: "string" }
          },
          required: ["alopecia_detectada", "tipo_alopecia", "grau_rarefacao", "requer_encaminhamento_medico"]
        },
        oleosidade_sebo: {
          type: "object",
          properties: {
            nivel_oleosidade: { type: "string", enum: ["baixo", "médio", "alto", "excessivo"] },
            percentual_oleosidade: { type: "number", minimum: 0, maximum: 100 },
            distribuicao_oleosidade: { type: "string", enum: ["uniforme", "localizada", "irregular"] },
            obstrucao_folicular: { type: "number", minimum: 0, maximum: 100 },
            sebo_acumulado: { type: "boolean" },
            brilho_excessivo_detectado: { type: "boolean" },
            recomendacao_oleosidade: { type: "string" }
          },
          required: ["nivel_oleosidade", "sebo_acumulado", "recomendacao_oleosidade"]
        },
        descamacao_caspa: {
          type: "object",
          properties: {
            presente: { type: "boolean" },
            tipo: { type: "string", enum: ["seca", "oleosa", "mista", "nenhuma"] },
            severidade: { type: "string", enum: ["leve", "moderada", "severa", "nenhuma"] },
            percentual_descamacao: { type: "number", minimum: 0, maximum: 100 },
            distribuicao: { type: "string", enum: ["localizada", "difusa", "nenhuma"] },
            areas_afetadas: { type: "string" },
            irritacao_visivel: { type: "boolean" },
            recomendacao_descamacao: { type: "string" }
          },
          required: ["presente", "tipo", "severidade", "recomendacao_descamacao"]
        },
        porosidade_fios: {
          type: "object",
          properties: {
            nivel_porosidade: { type: "string", enum: ["baixa", "média", "alta", "muito_alta"] },
            cuticula_aberta: { type: "boolean" },
            textura_aspera: { type: "boolean" },
            fios_ressecados: { type: "boolean" },
            perda_brilho: { type: "boolean" },
            score_porosidade: { type: "number", minimum: 0, maximum: 100 },
            recomendacao_porosidade: { type: "string" }
          },
          required: ["nivel_porosidade", "score_porosidade", "recomendacao_porosidade"]
        },
        quebra_fios: {
          type: "object",
          properties: {
            quebra_detectada: { type: "boolean" },
            nivel_quebra: { type: "string", enum: ["mínima", "leve", "moderada", "severa"] },
            pontas_duplas: { type: "boolean" },
            fragmentacao_fios: { type: "boolean" },
            uniformidade_baixa: { type: "boolean" },
            fios_elasticos: { type: "boolean" },
            score_resistencia: { type: "number", minimum: 0, maximum: 100 },
            recomendacao_quebra: { type: "string" }
          },
          required: ["quebra_detectada", "nivel_quebra", "score_resistencia", "recomendacao_quebra"]
        },
        condicoes_inflamatorias: {
          type: "object",
          properties: {
            inflamacao_presente: { type: "boolean" },
            dermatite_seborreica: { type: "boolean" },
            foliculite: { type: "boolean" },
            psoriase: { type: "boolean" },
            outras_condicoes: { type: "string" },
            severidade: { type: "string", enum: ["leve", "moderada", "severa", "nenhuma"] }
          },
          required: ["inflamacao_presente", "severidade"]
        },
        saude_couro_cabeludo: {
          type: "object",
          properties: {
            coloracao: { type: "string", enum: ["normal", "avermelhado", "pálido", "irregular"] },
            textura: { type: "string", enum: ["lisa", "irregular", "escamosa", "mista"] },
            elasticidade: { type: "string", enum: ["boa", "regular", "baixa"] },
            hidratacao: { type: "string", enum: ["adequada", "seca", "muito_seca"] },
            microcirculacao: { type: "string", enum: ["boa", "regular", "comprometida"] }
          },
          required: ["coloracao", "textura", "elasticidade", "hidratacao", "microcirculacao"]
        },
        estado_foliculos: {
          type: "object",
          properties: {
            foliculos_saudaveis_percentual: { type: "number", minimum: 0, maximum: 100 },
            obstrucao_folicular: { type: "boolean" },
            miniatuzacao_detectada: { type: "boolean" },
            sinais_queda_excessiva: { type: "boolean" },
            foliculos_comprometidos: { type: "string" }
          },
          required: ["foliculos_saudaveis_percentual", "obstrucao_folicular"]
        },
        metricas_quantitativas: {
          type: "object",
          properties: {
            indice_saude_geral: { type: "number", minimum: 0, maximum: 100 },
            espessura_media_fio_micrometros: { type: "number" },
            score_oleosidade: { type: "number", minimum: 0, maximum: 100 },
            score_descamacao: { type: "number", minimum: 0, maximum: 100 },
            score_inflamacao: { type: "number", minimum: 0, maximum: 100 }
          },
          required: ["indice_saude_geral"]
        },
        rotina_cuidados: {
          type: "object",
          properties: {
            rotina_semanal: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dia: { type: "string" },
                  cuidados: { type: "array", items: { type: "string" } }
                },
                required: ["dia", "cuidados"]
              }
            },
            tratamentos_profissionais: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  frequencia: { type: "string" },
                  objetivo: { type: "string" }
                },
                required: ["nome", "frequencia", "objetivo"]
              }
            },
            home_care: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  produto: { type: "string" },
                  uso: { type: "string" },
                  objetivo: { type: "string" }
                },
                required: ["produto", "uso", "objetivo"]
              }
            },
            manutencao_salao: {
              type: "object",
              properties: {
                frequencia: { type: "string" },
                recomendacao: { type: "string" }
              },
              required: ["frequencia", "recomendacao"]
            }
          },
          required: ["rotina_semanal", "tratamentos_profissionais", "home_care", "manutencao_salao"]
        },
        diagnostico_tecnico: { type: "string" },
        condicoes_identificadas: { type: "array", items: { type: "string" } },
        tratamentos_recomendados: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              tipo: { type: "string", enum: ["profissional", "homecare", "medicamentoso"] },
              objetivo: { type: "string" },
              frequencia: { type: "string" }
            },
            required: ["nome", "tipo", "objetivo"]
          }
        },
        recomendacoes_profissionais: { type: "string" },
        observacoes_adicionais: { type: "string" },
        analise_por_video: {
          type: "object",
          properties: {
            total_frames_analisados: { type: "number" },
            areas_cobertas: { type: "array", items: { type: "string" } },
            qualidade_video: { type: "string", enum: ["excelente", "boa", "regular", "baixa"] },
            insights_adicionais: { type: "string" }
          }
        }
      },
      required: [
        "densidade_folicular",
        "deteccao_alopecia",
        "oleosidade_sebo",
        "descamacao_caspa",
        "porosidade_fios",
        "quebra_fios",
        "condicoes_inflamatorias",
        "saude_couro_cabeludo",
        "estado_foliculos",
        "metricas_quantitativas",
        "rotina_cuidados",
        "diagnostico_tecnico",
        "condicoes_identificadas",
        "recomendacoes_profissionais",
        "analise_por_video"
      ]
    };

    console.log('🧠 [IA_SAUDE_CAPILAR] Enviando frames para backend (tricologia por vídeo)...');

    const payload = {
      media: fileUrls,
      metadata: { tipoAnalise: 'tricologia' },
      contexto: {}
    };

    const resp = await appApi.analysisTricologia(payload);
    const response = resp?.analysis || resp;

    iaSaudeCapilar.metricas.totalAnalisesTricolicas++;
    iaSaudeCapilar.ultimaAnalise = new Date().toISOString();

    console.log('✅ [IA_SAUDE_CAPILAR] Análise por vídeo concluída');

    const analiseCompleta = {
      cliente_id: clienteInfo?.id || null,
      cliente_nome: clienteInfo?.nome || "Sem cadastro",
      analise_capilar_id: analiseCapilarId,
      imagem_url: fileUrls[0],
      metodo_analise: "ia_tricolica_video_microscopico",
      ...response,
      created_date: new Date().toISOString()
    };

    return analiseCompleta;

  } catch (error) {
    console.error('❌ [IA_SAUDE_CAPILAR] Erro na análise por vídeo:', error);
    throw error;
  }
}

export default iaSaudeCapilar;

