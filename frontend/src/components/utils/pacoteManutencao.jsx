// Sistema Inteligente de Pacote de Manutenção - Analyzer SDM IA v16.5
import { appApi } from "@/api/appClient";

/**
 * Gera um pacote de manutenção inteligente baseado na análise capilar
 * @param {Object} analise - Dados da análise realizada
 * @param {Array} servicos - Lista de serviços cadastrados no sistema
 * @returns {Object} Pacote de manutenção estruturado
 */
export function gerarPacoteManutencao(analise, servicos) {

  // Não gerar para modo "Antes x Depois"
  if (analise.modo_analise === "antes_depois") {
    return null;
  }

  const servicosManutencao = [];
  let objetivo = "";
  let prazoRetorno = "30 dias";

  // Filtrar apenas tratamentos ativos
  const tratamentos = servicos.filter(s => 
    s.tipo === 'tratamento' && 
    s.ativo !== false &&
    s.nome !== analise.recomendacao_tratamento // Evitar duplicar o tratamento principal
  );

  // LÓGICA CONTEXTUAL BASEADA NA CONDIÇÃO DO CABELO

  // 1. CABELO DANIFICADO E FINO
  if ((analise.nivel_dano === 'severo' || analise.nivel_dano === 'moderado') && 
      analise.estrutura_fio === 'fina') {
    
    objetivo = "Reconstruir e fortalecer fios finos e danificados, restaurando resistência e elasticidade.";
    prazoRetorno = "21 dias";

    // Reconstrução
    const reconstrucao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('reconstrução') ||
      t.nome.toLowerCase().includes('reconstru') ||
      t.nome.toLowerCase().includes('keratina')
    );
    if (reconstrucao) {
      servicosManutencao.push({
        nome: reconstrucao.nome,
        frequencia: "Semanal (primeiras 3 semanas)",
        justificativa: "Repõe proteínas e fortalece a estrutura capilar danificada"
      });
    }

    // Hidratação
    const hidratacao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('hidrat') ||
      t.nome.toLowerCase().includes('moisture')
    );
    if (hidratacao) {
      servicosManutencao.push({
        nome: hidratacao.nome,
        frequencia: "Semanal (intercalado)",
        justificativa: "Mantém a umidade e previne ressecamento durante a reconstrução"
      });
    }

    // Nutrição
    const nutricao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('nutrição') ||
      t.nome.toLowerCase().includes('nutri')
    );
    if (nutricao) {
      servicosManutencao.push({
        nome: nutricao.nome,
        frequencia: "Quinzenal",
        justificativa: "Repõe lipídios e proporciona brilho e maciez"
      });
    }
  }

  // 2. CABELO SAUDÁVEL PÓS-ALISAMENTO
  else if (analise.nivel_dano === 'saudavel' && 
           (analise.recomendacao_alisamento && analise.recomendacao_alisamento !== 'N/A')) {
    
    objetivo = "Manter os resultados do alisamento, preservando o alinhamento e brilho dos fios.";
    prazoRetorno = "30 dias";

    const hidratacao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('hidrat') ||
      t.nome.toLowerCase().includes('moisture')
    );
    if (hidratacao) {
      servicosManutencao.push({
        nome: hidratacao.nome,
        frequencia: "Quinzenal",
        justificativa: "Mantém a umidade ideal e prolonga o efeito liso"
      });
    }

    const nutricao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('nutrição') ||
      t.nome.toLowerCase().includes('nutri') ||
      t.nome.toLowerCase().includes('selagem')
    );
    if (nutricao) {
      servicosManutencao.push({
        nome: nutricao.nome,
        frequencia: "Mensal",
        justificativa: "Sela a cutícula e preserva o alinhamento conquistado"
      });
    }
  }

  // 3. CABELO DESCOLORIDO/PLATINADO
  else if (analise.coloracao_cabelo === 'Descolorido/Platinado' ||
           analise.nivel_sensibilizacao_quimica === 'severo' ||
           analise.nivel_sensibilizacao_quimica === 'moderado') {
    
    objetivo = "Reparar danos químicos da descoloração e manter o tom, brilho e integridade dos fios.";
    prazoRetorno = "15 dias";

    const nutricao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('nutrição') ||
      t.nome.toLowerCase().includes('nutri')
    );
    if (nutricao) {
      servicosManutencao.push({
        nome: nutricao.nome,
        frequencia: "Semanal",
        justificativa: "Repõe lipídios perdidos na descoloração e devolve maciez"
      });
    }

    const banho = tratamentos.find(t => 
      t.nome.toLowerCase().includes('banho de brilho') ||
      t.nome.toLowerCase().includes('tonalizante') ||
      t.nome.toLowerCase().includes('matiz')
    );
    if (banho) {
      servicosManutencao.push({
        nome: banho.nome,
        frequencia: "Quinzenal",
        justificativa: "Neutraliza tons amarelados e mantém o loiro vibrante"
      });
    }

    const protecao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('proteção') ||
      t.nome.toLowerCase().includes('protect') ||
      t.nome.toLowerCase().includes('térmica')
    );
    if (protecao) {
      servicosManutencao.push({
        nome: protecao.nome,
        frequencia: "A cada lavagem (home care)",
        justificativa: "Protege contra danos térmicos e ambientais"
      });
    }
  }

  // 4. CABELO COM COLORAÇÃO PERMANENTE
  else if (analise.coloracao_cabelo && 
           (analise.coloracao_cabelo.includes('Colorido') || 
            analise.coloracao_cabelo.includes('Loiro') ||
            analise.coloracao_cabelo.includes('Mechas'))) {
    
    objetivo = "Preservar a cor, prevenir desbotamento e manter a saúde dos fios coloridos.";
    prazoRetorno = "30 dias";

    const hidratacao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('hidrat') ||
      t.nome.toLowerCase().includes('color') ||
      t.nome.toLowerCase().includes('cor')
    );
    if (hidratacao) {
      servicosManutencao.push({
        nome: hidratacao.nome,
        frequencia: "Semanal",
        justificativa: "Hidrata sem remover pigmentos, prolongando a durabilidade da cor"
      });
    }

    const neutralizacao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('neutral') ||
      t.nome.toLowerCase().includes('tonalizante') ||
      t.nome.toLowerCase().includes('gloss')
    );
    if (neutralizacao) {
      servicosManutencao.push({
        nome: neutralizacao.nome,
        frequencia: "Quinzenal",
        justificativa: "Revitaliza o tom e adiciona brilho intenso"
      });
    }
  }

  // 5. CABELO COM VOLUME ALTO (CACHEADO/CRESPO)
  else if (analise.volume_capilar === 'alto' && 
           (analise.tipo_fio === 'cacheado' || analise.tipo_fio === 'crespo')) {
    
    objetivo = "Controlar volume, definir cachos e manter hidratação intensa para fios volumosos.";
    prazoRetorno = "21 dias";

    const hidratacao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('hidrat') ||
      t.nome.toLowerCase().includes('cachos') ||
      t.nome.toLowerCase().includes('crespo')
    );
    if (hidratacao) {
      servicosManutencao.push({
        nome: hidratacao.nome,
        frequencia: "Semanal",
        justificativa: "Cachos necessitam hidratação constante para definição e brilho"
      });
    }

    const umectacao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('umectação') ||
      t.nome.toLowerCase().includes('oleos') ||
      t.nome.toLowerCase().includes('óleo')
    );
    if (umectacao) {
      servicosManutencao.push({
        nome: umectacao.nome,
        frequencia: "Quinzenal",
        justificativa: "Óleos vegetais selam a cutícula e reduzem o frizz"
      });
    }
  }

  // 6. CASO PADRÃO - MANUTENÇÃO BÁSICA
  else {
    objetivo = "Manutenção preventiva para preservar a saúde e aparência dos fios.";
    prazoRetorno = "30 dias";

    const hidratacao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('hidrat')
    );
    if (hidratacao) {
      servicosManutencao.push({
        nome: hidratacao.nome,
        frequencia: "Quinzenal",
        justificativa: "Mantém os níveis ideais de umidade capilar"
      });
    }

    const nutricao = tratamentos.find(t => 
      t.nome.toLowerCase().includes('nutrição')
    );
    if (nutricao) {
      servicosManutencao.push({
        nome: nutricao.nome,
        frequencia: "Mensal",
        justificativa: "Repõe nutrientes e proporciona brilho natural"
      });
    }
  }

  // Se não encontrou nenhum serviço, retorna null
  if (servicosManutencao.length === 0) {
    return null;
  }

  const pacote = {
    servicos: servicosManutencao,
    prazo_retorno: prazoRetorno,
    objetivo,
    observacoes: ""
  };

  return pacote;
}

/**
 * Registra aprendizado sobre pacotes de manutenção
 */
export async function registrarAprendizadoPacote(analise, pacoteAceito) {
  try {
    await appApi.entities.LogAuditoria.create({
      tipo_auditoria: 'recomendacao',
      status: 'sucesso',
      descricao: `Pacote de manutenção ${pacoteAceito ? 'aceito' : 'rejeitado'} pelo profissional`,
      metrica_antes: {
        tipo_fio: analise.tipo_fio,
        nivel_dano: analise.nivel_dano,
        coloracao: analise.coloracao_cabelo
      },
      metrica_depois: {
        pacote_aceito: pacoteAceito,
        servicos_pacote: ensureArray(analise.pacote_manutencao?.servicos).map(s => s.nome) || []
      },
      automatica: false
    });
  } catch (error) {
  }
}

