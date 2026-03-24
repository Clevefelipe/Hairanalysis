# LEGAL - Hair Analysis System (H.A.S.)

## Declaracao de nao diagnostico clinico

- O Hair Analysis System e uma plataforma de inteligencia tecnica para decisao estetica capilar.
- O sistema **não realiza diagnóstico médico**.
- O sistema **não prescreve medicamentos**.
- O sistema **não determina procedimento obrigatório**.

## Governança da IA e Motor Determinístico (Resumo)

- **Escopo estético**: modos Capilar/Tricológico/Geral operam apenas em finalidade estética; modo tricológico bloqueia recomendações de alisamento e evita termos clínicos.
- **Camada IA (leitura)**: extrai sinais (elasticidade, porosidade, resistência, histórico químico, integridade cuticular, confiança) e não calcula score final.
- **Camada determinística (analysis-engine)**: calcula Score de Integridade, risco e aptidão com pesos versionados (`weightProfileVersion`), faixas 0–39/40–59/60–79/80–100; bloqueia aptidão se `confidenceScore < 60`.
- **Catálogo fechado**: alisamentos só podem ser recomendados se existirem no catálogo do salão; modo tricológico nunca recomenda alisamento.
- **Sanitização jurídica**: middleware converte termos clínicos para linguagem estética (ex.: “diagnóstico” → “avaliação estética”).
- **Auditabilidade**: registros incluem `modelVersion`, `weightProfileVersion`, `promptVersion`, `temperature`, `rawIAOutput`, `scoreCalculado`, `confidenceScore`, `previousAnalysisId`.

## Versionamento de Prompt

- Prompt mestre atual: **has-prompt-legal-1.2.0** (governança jurídica/estética, catálogo controlado, neutralização de pH obrigatória em processos alcalinos/instabilidade, bloqueio de alisamento em modo tricológico).
- Pesos determinísticos: **weightProfileVersion: v1.2.0**.
- Ao atualizar texto de prompt, registrar nova tag aqui e ajustar `promptVersion` na integração, sem alterar o motor determinístico.

## Termo de uso profissional

- O uso e destinado a profissionais habilitados no contexto estetico.
- A interpretacao das analises deve considerar avaliacao presencial do cliente.
- A escolha final de procedimento e de responsabilidade do profissional.

## Limitacao de responsabilidade

- O H.A.S. nao promete ausencia de risco.
- O H.A.S. nao determina procedimento obrigatorio.
- As saidas devem ser tratadas como apoio tecnico e nao como ordem de execucao.

## Obrigatoriedade de validacao humana

- Toda decisao final sobre alisamento, protocolo e cronograma deve ser validada por profissional responsavel.
- Em modo tricológico, recomendacoes de alisamento sao bloqueadas por governanca.
- Em baixa confiabilidade tecnica (`confidenceScore < 60`), a aptidao automatica e bloqueada e nova captura deve ser realizada.
