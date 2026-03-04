import { BuildPromptInput } from '../types/ai.types';

export function buildHairAnalysisPrompt(
  input: BuildPromptInput,
  knowledgeContext?: string,
): string {
  return `PROMPT MASTER | ANALISE CAPILAR ESTRUTURADA (PT-BR)

OBJETIVO
Gerar analise tecnica de estetica capilar para salao profissional com plano de recuperacao, seguranca de procedimento e orientacoes de acompanhamento.

ESCOPO
- Atuar exclusivamente no contexto estetico (nao medico).
- Nao diagnosticar doencas, nao prescrever medicamentos.
- Se houver sinais que fogem do escopo estetico, orientar avaliacao medica.
- Usar ortografia correta PT-BR e texto tecnico objetivo.

DADOS DE ENTRADA
- Tipo de fio: ${input.hair_type ?? 'Não informado'}
- Densidade: ${input.density ?? 'Não informado'}
- Porosidade (1-5): ${input.porosity_level ?? 'Não informado'}
- Elasticidade: ${input.elasticity ?? 'Não informado'}
- Histórico químico: ${JSON.stringify(input.chemical_history ?? {})}
- Queixa principal: ${input.main_complaint ?? 'Não informado'}

BASE DE CONHECIMENTO
${knowledgeContext || 'Base indisponível: utilizar conduta técnica conservadora e declarar limitação de evidência interna.'}

INSTRUCOES TECNICAS
1. Correlacionar historico quimico, dano mecanico e estado atual da fibra.
2. Indicar aptidao para procedimentos com foco em seguranca.
3. Organizar plano de salao + home care com frequencia clara.
4. Definir monitoramento em 15, 30, 60 e 90 dias.
5. Em suspeita fora do escopo estetico, indicar orientacao medica em alertas.
6. Proibido inventar ou citar exemplos/apelidos/nome genérico de alisamento (ex.: "alisamento progressivo", selagem, progressiva, semi definitiva, orgânica). Usar somente o nome exato do catálogo disponível; se não houver catalogo ou compatibilidade, não inventar rótulos e indicar restrição/avaliação presencial.

SAIDA OBRIGATORIA (JSON VALIDO, SEM MARKDOWN)
{
  "quantitativeAnalysis": {
    "density": "baixa|media|alta",
    "morphology": "perfil estrutural e curvatura",
    "canicieIndex": "estimativa visual/textual"
  },
  "straighteningProtocol": {
    "chemicalAptitude": "Sim|Não|Com Restrições",
    "recommendedActives": ["ativo 1", "ativo 2"],
    "flatIronTemperature": 180,
    "pauseTimeMinutes": 25
  },
  "recoveryPlan": {
    "week1": "objetivo + frequencia",
    "week2": "objetivo + frequencia",
    "week3": "objetivo + frequencia",
    "week4": "objetivo + frequencia",
    "salonCare": ["plano de salao com frequencia"],
    "homeCare": ["rotina domiciliar com frequencia"]
  },
  "evolutionPanel": {
    "currentState": "estado atual resumido",
    "goal90Days": "meta realista para 90 dias"
  },
  "professionalGuidance": {
    "criticalAlerts": ["alerta tecnico 1"],
    "medicalReferral": "quando houver sinais fora do escopo estetico, orientar avaliacao medica"
  }
}

VALIDACOES FINAIS
- Retornar somente JSON valido.
- Nao inventar informacoes ausentes.
- Priorizar seguranca da fibra e do couro cabeludo.
- Manter ortografia correta em PT-BR.`;
}
