# 🧠 Hair Analysis System (H.A.S.)

**Hair Analysis System (H.A.S.)** é um sistema **SaaS profissional** para salões de beleza e clínicas estéticas capilares, focado em **análise capilar e tricológica estética assistida por Inteligência Artificial**.

O sistema foi projetado para apoiar **decisões técnicas seguras**, gerar **relatórios premium**, acompanhar a **evolução capilar ao longo do tempo** e elevar o padrão profissional dos salões.

---

## 🎯 Propósito do Sistema

O Hair Analysis System existe para:

- Elevar o nível técnico da análise capilar em salão  
- Apoiar decisões sobre **tratamentos, alisamentos e protocolos**  
- Priorizar **segurança da fibra e do couro cabeludo**  
- Criar histórico técnico confiável do cliente  
- Gerar **relatórios profissionais em PDF**  
- Integrar **IA estética**, sem caráter médico  

> O sistema **não substitui** avaliação profissional presencial ou médica.

---

## 🧩 Principais Funcionalidades

### 🔍 Análise Capilar Estética
- Avaliação da **haste capilar** (porosidade, elasticidade, resistência, integridade)
- Interpretação técnica do impacto estético (frizz, volume, alinhamento, quebra)
- Tradução técnica para linguagem acessível ao cliente
- Identificação de tipo de fio e curvatura
- Identificação de coloração/descoloração
- Identificação de fios brancos
- Calcular tempo estimado da última química
- Tipo de Danos (térmico, químico, mecânico)

---

### 🧬 Análise Tricológica Estética
- Avaliação do **couro cabeludo e folículo piloso**
- Identificação de sinais estéticos relevantes:
  - Oleosidade excessiva
  - Descamação
  - Sensibilidade
  - Afinamento aparente
  - Queda acima do padrão estético esperado
- Apoio à prevenção de desequilíbrios tricológicos

⚠️ O sistema **não realiza diagnóstico médico** nem prescreve medicamentos.

---

### 📸 Análise por Imagem e Vídeo
- Captura e análise de imagens e vídeos do couro cabeludo e fios
- Integração com **microscopia digital**
- Visualização em tempo real durante a análise
- Detecção automática de achados visuais relevantes

Quando um sinal relevante é identificado, o sistema:
- Pausa a captura automaticamente
- Registra o achado
- Exibe alerta em tela
- Inclui o achado no relatório técnico em PDF

---

### 🧠 Inteligência Artificial Estética (IA)

A IA do Hair Analysis System atua como **especialista em tricologia estética e engenharia cosmética**, sendo responsável por:

- Interpretar dados disponíveis (sem inferir dados ausentes)
- Avaliar riscos estéticos
- Determinar aptidão para procedimentos químicos
- Sugerir protocolos personalizados
- Criar cronogramas capilares
- Definir períodos de retorno
- Gerar relatórios técnicos profissionais

Todas as recomendações **devem ser validadas pelo profissional responsável**.

---

### 🧪 Aptidão para Alisamentos (Exclusivo H.A.S.)

O sistema classifica a aptidão para alisamento em:

- ✅ **Apto**
- ⚠️ **Apto com Restrições**
- ❌ **Não Apto**

A decisão é:
- Justificada tecnicamente
- Baseada apenas nos dados disponíveis
- Sempre priorizando a **segurança da fibra capilar**

⚠️ O sistema **nunca recomenda serviços não cadastrados no salão**.

---

### 💇 Protocolos Personalizados
- Seleção exclusiva entre **serviços cadastrados no salão**
- Avaliação de compatibilidade por serviço
- Indicação de cuidados técnicos pré e pós-química
- Sugestão de combos (alisamento + tratamento)
- Definição de intervalos seguros entre químicas
- Montagem de cronograma capilar com intervalos seguros e retorno programado
---

### 🧴 Home Care Personalizado
- Cronograma capilar de 4 semanas:
  - Hidratação
  - Nutrição
  - Reconstrução (com cautela)
- Frequência semanal
- Alertas sobre excesso proteico
- Cuidados domiciliares alinhados ao diagnóstico estético

---

### 📊 Histórico e Acompanhamento Evolutivo
- Histórico comparativo entre visitas
- Gráficos de evolução capilar
- Registro técnico contínuo
- Datas sugeridas para reavaliação
- Alertas preventivos
- Acesso do cliente via **link ou QR Code**

---

## 🤖 Governança da IA e Motor Determinístico

- **Modo Capilar/Tricológico/Geral**: a IA opera em escopo estético; modo tricológico bloqueia recomendações de alisamento e evita termos clínicos. 
- **Prompt mestre seguro**: regras jurídicas obrigatórias (sem diagnósticos, sem promessas absolutas, uso de vocabulário estético, orientação a avaliação médica apenas quando necessário) e uso exclusivo de serviços cadastrados no catálogo para alisamentos.
- **Camada IA (leitura)**: classifica atributos (elasticidade, porosidade, resistência, histórico químico, integridade cuticular, confidence) mas **não calcula score final**.
- **Camada Determinística (analysis-engine)**: calcula Score de Integridade e aptidão com pesos versionados (`weightProfileVersion`), faixas 0–39/40–59/60–79/80–100 e bloqueio por baixa confiabilidade (`confidenceScore < 60`).
- **Sanitização jurídica**: middleware troca termos clínicos por equivalentes estéticos (ex.: “diagnóstico” → “avaliação estética”).
- **Auditabilidade**: cada análise registra `modelVersion`, `weightProfileVersion`, `promptVersion`, `temperature`, `rawIAOutput`, `scoreCalculado`, `confidenceScore`, `previousAnalysisId`.
- **Compatibilidade/neutralização**: recomendações de neutralização de pH e combos inteligentes seguem apenas serviços do catálogo; nenhum alisamento é sugerido em modo tricológico.

### Versionamento rápido

| Artefato              | Versão          | Observação                                         |
| --------------------- | --------------- | -------------------------------------------------- |
| promptVersion         | has-prompt-legal-1.2.0 | Governança jurídica/estética, catálogo fechado de alisamentos, neutralização obrigatória em pH alcalino/instabilidade. |
| weightProfileVersion  | v1.2.0          | Pesos determinísticos fixos (analysis-engine).     |

---

## 📤 Relatórios Profissionais
- Geração automática de **PDFs premium**
- Linguagem técnica e profissional
- Conteúdo claro e responsável
- Integração com histórico do cliente
- Ideal para apresentação e fidelização

---

## 🗣️ Tom de Voz do Sistema
- Profissional
- Técnico e claro
- Seguro e não alarmista
- Acolhedor
- Orientado à decisão do profissional

---

## ⚠️ Aviso Legal

> O Hair Analysis System é um sistema **estético** assistido por Inteligência Artificial.  
> Não é um sistema médico ou clínico.  
> Não realiza diagnósticos médicos e não substitui avaliação dermatológica.  

Sempre que os sinais ultrapassarem o escopo estético, o sistema **orienta o profissional a recomendar avaliação médica especializada**.

---

## 🚀 Arquitetura e Evolução

O Hair Analysis System foi projetado para:
- Escalabilidade
- Modularidade
- Uso com dados parciais
- Integração com IA multimodal
- Expansão global

Ele serve como base para:
- Ranking inteligente de serviços
- Relatórios avançados
- IA contextual por salão
- Evolução contínua do histórico capilar

---

## 🩺 Observabilidade e Monitoramento

| Endpoint | Origem | Descrição |
| -------- | ------ | --------- |
| `GET /api/health` | Backend (Nest) | JSON compatível com Terminus contendo checks de banco, memória RSS/Heap, storage e metadados (`uptime_seconds`, `timestamp`, `env`, `version`). |
| `GET /healthz` | Frontend/Proxy | Rota leve que apenas **proxy** o `/api/health`. Útil para load balancers que precisam checar o host servido pelo frontend (Vite/dev ou CDN). |
| `GET /api/metrics` | Backend (PrometheusModule) | Exposição texto (Prometheus 0.0.4) com métricas de requests HTTP, duração, geração de relatórios e métricas padrão do Node.js. |

## Backend

- NestJS + TypeORM
- Banco Postgres (usa variáveis do `.env`)

### Como usar em desenvolvimento

- **/api/health**: `curl http://localhost:3000/api/health`
- **/healthz** (frontend passando pelo proxy do Vite): `curl http://localhost:5173/healthz`
- **/api/metrics**: `curl http://localhost:3001/api/metrics` (caso rode backend em porta 3001 via Docker) ou `http://localhost:3000/api/metrics` no modo `npm run start:dev`.

### Banco de dados (Postgres)

1. Configure o `.env` do backend com as credenciais do Postgres (veja `.env.example`).
2. Rode as migrations:
   ```bash
   npm run migration:run
   ```
3. (Opcional) Para aplicar migrations futuras: `npm run migration:generate -- <NomeMigration>` e depois `npm run migration:run`.

> Os três endpoints são expostos automaticamente ao iniciar o backend. Em produção, restrinja `/api/metrics` e `/api/health` via firewall, autenticação reversa ou service mesh. A rota `/healthz` pode permanecer pública para balanceadores, desde que esteja atrás do CDN/frontend.

---

## 💎 Hair Analysis System
**Tecnologia, segurança e inteligência aplicadas à estética capilar profissional.**

---

## 🧱 Tokens de Layout e Guidelines

Para manter o ritmo premium e denso do produto, utilizamos um conjunto de util classes em `src/index.css`:

| Token            | Uso recomendado |
| ---------------- | ---------------- |
| `.layout-shell`  | Padding horizontal/vertical do conteúdo principal. Aplica-se ao `<main>` e garante respiro uniforme em todas as páginas. |
| `.section-stack` | Agrupador vertical entre seções — substitui `space-y-*`, reduzindo gaps e mantendo ritmo consistente. |
| `.panel-tight`   | Contêiner padrão de cards/painéis. Inclui borda suave, raio 3xl e padding compacto. |
| `.grid-dense`    | Grid responsivo com `gap-4/5`, usado para cards executivos, métricas e listas compactas. |
| `.toolbar`       | Barras de ação (filtros + botões) com `flex-wrap` e `gap-2`, ideal para páginas Clientes e Histórico. |

---

## 🗂️ Configuração de armazenamento local de relatórios

Para evitar regressões e garantir que os arquivos PDF de relatório sejam persistidos em local previsível durante desenvolvimento local, a configuração do provider de relatórios foi ajustada para:

- `REPORTS_LOCAL_DIR` (opcional): caminho absoluto específico, se definido.
- `~/Desktop/HairAnalysisReports` (padrão): diretório no Desktop do usuário, quando não há `REPORTS_LOCAL_DIR`.

### Exemplo (Windows)

 no `.env` do backend:

```env
REPORTS_LOCAL_DIR=C:\Users\SeuUsuario\Documents\HairAnalysisReports
```

### Exemplo (Linux / macOS)

```env
REPORTS_LOCAL_DIR=/home/seuusuario/HairAnalysisReports
```

### Uso esperado

- Ao gerar relatório (`POST /reports`), o sistema salva em local físico de arquivo.
- O caminho de retorno (URL assinada) é gerado pelo `PUBLIC_REPORT_BASE_URL`.

### Por que isso evita regressão

- Sempre há um fallback documentado (Desktop) para ambiente local.
- Evita que a aplicação esteja dependente apenas de storage em memória ou S3 durante desenvolvimento.
- Permite inspeção manual dos PDFs gerados em um fastpath previsível.

| `.chip-group`    | Coleções de filtros rápidos (chips). Mantém espaçamento de 2 para desktops e mobile. |

### Boas práticas
1. **Aplicar tokens no nível de seção** antes de estilizar elementos internos (ex.: `<section className="panel-tight">`).
2. **Usar `grid-dense` + `panel-tight`** para qualquer conjunto de cards executivos, evitando classes ad-hoc.
3. **Barras com filtros/ações** devem usar `SectionToolbar` ou a util `.toolbar` para garantir quebras suaves em telas menores.
4. **Metrics**: preferir o componente `MetricCard` (em `src/components/ui/MetricCard.tsx`) para manter iconografia e tipografia consistentes.

---

## ✅ Checklist de Readiness

- [x] Header com busca global, IA e ações rápidas disponível em todas as rotas privadas.
- [x] Dashboard executivo com hero verde (monitoramento IA), KPIs e alertas técnicos.
- [x] Clientes › Visão Geral com filtros densos, banner de foco e ações em lote.
- [x] Históricos (análises, público, admin, técnico) migrados para `panel-tight`.
- [x] Componentes utilitários (`MetricCard`, `SectionToolbar`) criados.
- [ ] Aplicar `MetricCard` e `SectionToolbar` em todas as seções repetidas (em andamento).
- [ ] Validar breakpoints 1280/1024/768 após integrações.
- [ ] Mapear endpoints que alimentarão `heroHighlights`, KPIs e filtros — alinhar com backend.

## Decisao Deterministica (Hardening v1.2.0)

- A IA ficou restrita a extracao/classificacao de sinais visuais (elasticidade, porosidade, resistencia, historico quimico, integridade cuticular e qualidade da imagem).
- O score final e a aptidao sao calculados apenas no backend pelo `AnalysisEngineService` (TypeScript), sem ajuste dinamico por IA.
- Versao de pesos persistida: `weightProfileVersion: "v1.2.0"`.

### Perfis tecnicos fixos

- `VIRGIN` (Perfil 1 - Cabelo Virgem): Elasticidade 30%, Resistencia 30%, Porosidade invertida 25%, Dano termico/mecanico 15%.
- `CHEMICALLY_TREATED` (Perfil 2 - Quimicamente Tratado): Elasticidade 40%, Resistencia 30%, Historico quimico invertido 20%, Porosidade invertida 10%.
- `HIGH_STRUCTURAL_SENSITIVITY` (Perfil 3 - Alta Sensibilidade): Elasticidade 45%, Resistencia 35%, Historico quimico invertido 20%.

### Faixas de aptidao estetica para alisamento

- `0-39`: Nao apto.
- `40-59`: Aptidao condicionada.
- `60-79`: Apto com cautela.
- `80-100`: Apto estetico.

Mensagem padrao do sistema:

`Apresenta aptidao estetica para procedimentos de alisamento, conforme parametros tecnicos do sistema.`

### Governanca de modos

- Modo capilar (haste): permite aptidao estetica para alisamento apenas com itens do catalogo interno.
- Modo tricologico (couro): bloqueia recomendacao de alisamento e mantem foco em cuidado estetico/manutencao.
- Se `confidenceScore < 60%`: bloqueio automatico com retorno "Analise com baixa confiabilidade tecnica. Recomenda-se nova captura de imagem.".

### Rastreabilidade juridica por analise (caixa-preta)

Cada analise salva:

- `modelVersion`
- `weightProfileVersion`
- `promptVersion`
- `temperature`
- `rawIAOutput`
- `scoreCalculado`
- `confidenceScore`
- `salonId`
- `professionalId`
- `previousAnalysisId`
- `timestamp`

### Politica de responsabilidade profissional

- O H.A.S. nao realiza diagnostico clinico.
- O H.A.S. nao prescreve tratamento medico.
- O H.A.S. nao determina procedimento obrigatorio.
- A validacao humana do profissional responsavel e obrigatoria em toda decisao final.
