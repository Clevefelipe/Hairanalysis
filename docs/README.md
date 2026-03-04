# 🧠 Hair Analysis System (H.A.S.)

**Hair Analysis System (H.A.S.)** é uma **Plataforma Inteligente de Decisão Estética Capilar (SaaS)** para salões de beleza e clínicas estéticas capilares.

O sistema combina:

- Análise capilar estética
- Análise tricológica estética
- Motor de decisão técnica
- Inteligência Artificial contextual
- Sistema de risco e integridade
- Relatórios premium automatizados

Tudo orientado à segurança da fibra, padronização técnica e elevação do nível profissional do salão.

---

## 🎯 Propósito da Plataforma

O H.A.S. foi criado para:

- Elevar o padrão técnico da análise estética em salão
- Reduzir risco químico
- Apoiar decisões seguras de alisamentos e protocolos
- Criar histórico técnico confiável
- Gerar relatórios profissionais automatizados
- Padronizar condutas técnicas
- Transformar percepção subjetiva em decisão estruturada

> O sistema não substitui avaliação profissional presencial ou médica.

---

## 🧠 Motor de Inteligência Técnica

O H.A.S. não é apenas um gerador de relatórios.  
Ele funciona como um Motor de Decisão Estética Estruturado.

Baseado em:

- Dados manuais
- Análise por imagem
- Histórico químico
- Sinais tricológicos
- Catálogo interno do salão

A IA interpreta apenas os dados disponíveis e aplica regras técnicas predefinidas.

---

## 🔢 Score Técnico de Integridade da Fibra (Novo)

Cada análise gera um:

🔢 **Score de Integridade da Fibra (0–100)**

| Faixa  | Interpretação |
| ------ | ------------- |
| 85–100 | Fibra saudável |
| 70–84  | Leve comprometimento |
| 50–69  | Comprometimento moderado |
| 30–49  | Alto risco |
| 0–29   | Risco crítico |

O score considera:

- Porosidade
- Elasticidade
- Resistência
- Histórico químico
- Dano térmico
- Dano mecânico
- Estabilidade pós-química

Este score permite:

- Evolução gráfica
- Comparação entre análises
- Alertas automáticos
- Base matemática para aptidão

---

## ⚠️ Índices de Risco Segmentados (Novo)

Além da classificação de aptidão, o sistema calcula:

- 🔥 Risco Térmico
- 🧪 Risco Químico
- 💥 Risco de Quebra
- 🧬 Risco de Elasticidade
- 🧴 Risco de Sensibilidade de Couro

Cada risco possui intensidade graduada:

- Baixo
- Moderado
- Elevado
- Crítico

Isso torna a decisão mais precisa e justificável.

---

## 🎯 Classificação de Aptidão para Alisamento

Baseada em:

- Score técnico
- Índices de risco
- Histórico químico
- Integridade estrutural

Classificação:

- ✅ Apto
- ⚠️ Apto com Restrições
- ❌ Não Apto

Sempre:

- Justificada tecnicamente
- Limitada aos serviços cadastrados no salão
- Priorizando segurança

---

## 📈 Indicador de Confiabilidade da Análise (Novo)

Como o sistema pode trabalhar com dados parciais, cada relatório apresenta:

🔍 **Confiança da Análise (%)**

Baseado em:

- Quantidade de dados preenchidos
- Qualidade da imagem enviada
- Histórico disponível

Exemplo:

**Confiança da análise: 82% (dados completos + imagem válida)**

Isso aumenta transparência e credibilidade.

---

## 🔮 Camada Preditiva Estética (Novo)

A IA pode estimar:

- Tendência de desgaste da fibra
- Risco acumulado em caso de nova química
- Intervalo mínimo seguro estimado
- Previsão de retorno da curvatura
- Tendência de afinamento estético

Modelo baseado em:

- Histórico evolutivo
- Score atual
- Frequência de procedimentos

⚠️ Sempre dentro do escopo estético, sem caráter médico.

---

## 🔬 Análise Capilar Estética

Avaliação da haste capilar:

- Porosidade
- Elasticidade
- Resistência
- Integridade
- Tipo e curvatura
- Presença de fios brancos
- Identificação de químicas
- Tempo estimado da última química
- Tipo de dano (térmico, químico, mecânico)

Tradução técnica para linguagem acessível ao cliente.

---

## 🧬 Análise Tricológica Estética

Avaliação do couro cabeludo:

- Oleosidade
- Descamação
- Sensibilidade
- Afinamento aparente
- Queda acima do padrão estético
- Build-up de produto

⚠️ Não realiza diagnóstico médico.

Quando necessário, orienta encaminhamento dermatológico.

---

## 🧠 IA e Protocolos Estruturados

A IA:

- Não cria serviços fora do catálogo
- Não prescreve medicamentos
- Não realiza diagnóstico clínico

Regras estruturadas:

Neutralização obrigatória se:

- pH alcalino
- Cutícula aberta
- Elasticidade alterada
- Instabilidade pós-química

Dispensável se já neutralizado ou acidificado.

Sempre exibindo:

- Produto
- Tempo
- Justificativa técnica

---

## 💇 Protocolos Personalizados

- Seleção apenas entre serviços cadastrados
- Avaliação de compatibilidade
- Combos inteligentes
- Intervalos seguros
- Cronograma adaptativo (4 semanas)
- Retorno programado

---

## 🧴 Home Care Personalizado

- Cronograma estruturado
- Intervalos seguros
- Ajustado pelo score técnico
- Alertas de risco domiciliar

---

## 📊 Histórico e Evolução

O sistema armazena:

- Score técnico por análise
- Índices de risco
- Classificação de aptidão
- Protocolos aplicados

Permite:

- Gráfico evolutivo
- Comparação antes/depois
- Alertas automáticos

---

## 📄 Relatórios Premium Automatizados

Worker assíncrono com:

- Fila
- Geração PDF (pdfkit)
- Storage local ou S3
- URLs assinadas
- Status tracking

Seções do relatório:

- Score técnico
- Índices de risco
- Aptidão
- Perfil do fio
- Tratamentos salão
- Home care
- Couro cabeludo
- Neutralização
- Cronograma
- Alertas
- Confiança da análise

---

## 🤖 Assistente IA (Chat Interno Autenticado)

O sistema possui um endpoint autenticado para assistente interno:

- `POST /assistant/chat`
- Protegido por autenticação JWT
- Integrado no frontend pela TopBar para consultas rápidas em contexto

Objetivo:

- Acelerar tomada de decisão durante atendimento
- Apoiar equipe técnica com respostas dentro do escopo estético

---

## 🛡️ Governança de Modos (Capilar/Tricológico/Geral)

Regras recentes reforçadas no backend e nos prompts:

- Separação explícita por `analysisType`
- Sanitização de termos clínicos em saídas textuais
- Bloqueio de recomendações de alisamento no modo tricológico
- Contexto técnico/prompt ajustado de acordo com o modo da análise

Resultado:

- Maior consistência entre histórico, relatório e recomendações
- Redução de risco de extrapolação fora do escopo estético

---

## 🔐 Segurança e Isolamento de Dados em Relatórios

Fortalecimentos aplicados em relatórios/histórico:

- Endpoints de relatório protegidos com `JwtAuthGuard`
- Validação de pertencimento (`analysis/history` ↔ `salonId`) em create/status/download
- Endurecimento de autorização para evitar acesso cross-salon

Cobertura validada com testes e2e incluindo cenários:

- `401` sem token
- `401` token malformado
- `403` sem contexto de salão
- `403` tentativa de acesso entre salões

---

## ✅ Checagem Técnica (rodada atual)

Validação executada nesta auditoria:

- Backend
  - `npm run lint` ✅
  - `npm run test` ✅ (7 suítes / 16 testes)
  - `npm run test:e2e` ✅ (2 suítes / 14 testes)
- Frontend
  - `npm run test` ✅ (5 suítes / 14 testes)
  - `npm run typecheck` ✅
  - `npm run build` ✅

Status geral: base funcional, estável para continuidade de evolução.

---

## ✅ Etapa Concluída — Regressão Frontend (Módulos Críticos)

Escopo validado nesta etapa:

- Fluxos de entrada e recomendação em `AnalisesHub`
- Regras de flow e inicialização automática em `AnaliseTricologica`
- Histórico com fallback de sessão/cliente em `HistoryPage`
- Ações críticas de detalhe (download/share/navegação) em `HistoryDetailPage`

Arquivos de teste adicionados/expandidos:

- `frontend/src/pages/AnalisesHub.spec.tsx`
- `frontend/src/pages/AnaliseTricologica.spec.tsx`
- `frontend/src/pages/HistoryPage.spec.tsx`
- `frontend/src/pages/HistoryDetailPage.spec.tsx`

Resultado consolidado da etapa:

- Frontend: `5 suítes / 14 testes` ✅
- Backend (sanity integrado): unit + e2e ✅
- Build/typecheck/lint: ✅

Pronto para merge interno com risco reduzido de regressão nos fluxos cobertos.

---

## 🏗 Arquitetura

Projetado para:

- Escalabilidade
- Modularidade
- Integração multimodal
- IA contextual por salão
- Uso com dados parciais
- Expansão internacional

---

## ⚖️ Aviso Legal

Sistema estético assistido por IA.

Não substitui avaliação médica.

Encaminha para dermatologista quando necessário.

---

## 🚀 Posicionamento Estratégico

O H.A.S. não é apenas um software de análise.

É uma:

**Plataforma de Inteligência Técnica para Decisão Estética Capilar.**

Transforma percepção subjetiva em:

- Score
- Índice de risco
- Justificativa técnica
- Histórico estruturado
- Decisão segura

---

## 💎 Hair Analysis System

Tecnologia.  
Segurança.  
Inteligência aplicada à estética capilar profissional.

