---
description: Visão arquitetural do Hair Analysis System monorepo
---

# Hair Analysis System — Blueprint Arquitetural (atualizado)

## 1. Visão geral
- **Objetivo**: prover plataforma SaaS para análise capilar com módulos de IA, histórico, visão computacional e gestão de clientes/salões.
- **Stack**:
  - Backend: NestJS 11 + TypeORM (PostgreSQL) + JWT (access) + módulos segmentados; validação de env com Zod.
  - Frontend: Vite + React + TypeScript; design tokens globais (CSS) e Tailwind como utilitário complementar.
  - Infra: execução local via npm, dockerfiles por pacote e docker-compose para dev/prod.
- **Padrões transversais**: ESLint/Prettier por pacote; documentação em `/docs`.

## 2. Estrutura do monorepo (simplificada)
```
hair-analysis-system/
├── backend/
│   ├── Dockerfile
│   ├── prisma/                 # schema legado e dev.db
│   ├── scripts/                # seed/SQL utilitários
│   ├── src/
│   │   ├── config/             # env + helpers
│   │   ├── common/, logger/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── ai/             # assistente/chat OpenAI
│   │   │   ├── analysis-engine/ # motores de risco/fibra/confiança
│   │   │   ├── history/
│   │   │   ├── knowledge/
│   │   │   ├── salon/
│   │   │   ├── straightening/
│   │   │   └── vision/
│   │   ├── clientes/           # módulo legado de clientes
│   │   ├── observability/      # Prometheus + health
│   │   ├── reports/            # geração/download de relatórios
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── test/ (unit + e2e)
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── adapters, api, ai, components, pages, styles (design tokens)
│   │   └── tests/
│   └── vite.config.ts
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md (root) / docs/
└── docs/ARCHITECTURE.md (este arquivo)
```

## 3. Backend NestJS (estado atual)
### 3.1 Módulos principais (TypeORM)
| Módulo | Responsabilidade |
|--------|------------------|
| `auth` | Login e JWT access; criação de profissionais; guards de throttle global |
| `clientes` (legado) | CRUD de clientes via TypeORM |
| `salon` | Dados de salões/franquias |
| `history` | Histórico de análises/laudos |
| `vision` | Upload e análise de imagem (diskStorage, validação de tipo/tamanho) |
| `knowledge` | Base de conhecimento e documentos |
| `straightening` | Protocolos de alisamento/recomendações |
| `audit` | Logs de auditoria |
| `analysis-engine` | Agrega motores numéricos (risco, fibra, confiança, aptidão) consumidos por history/vision |
| `observability` | Exporta métricas Prometheus, health e tracing IDs |
| `reports` | Geração/download de relatórios (storage local/S3) + métricas |
| `ai` | Assistente/chat (OpenAI) exposto via `/assistant/chat` |

### 3.2 Camadas
- **Controller**: rotas REST com DTOs (class-validator/class-transformer) e guards.
- **Service**: regras de negócio + integrações externas.
- **Repository (TypeORM)**: repositórios via entidades carregadas no `TypeOrmModule`. Prisma permanece apenas como legado (schema/migrations) e não é utilizado no runtime atual.
- **DTOs & Entities**: DTOs para transporte; entities para persistência.

### 3.3 Infra backend
- **Configuração**: `ConfigModule` + validação com Zod (`env.config.ts`). Suporte a `DATABASE_URL` e variáveis legadas `DATABASE_*`/`DB_*`.
- **Autenticação**: JWT access; throttling global via `ThrottlerModule` e `APP_GUARD`. Os módulos protegidos por `JwtAuthGuard` também validam `salonId` e ownership de análises/relatórios para evitar vazamento entre franquias.
- **Logger**: `AppLogger` custom.
- **Observabilidade**: Prometheus (`/metrics`) com interceptador HTTP; healthcheck em `/health`.
- **Pipelines IA/Visão**: síncrono em serviço Nest; uploads locais; limpeza/regra de TTL configurável. O `AnalysisEngineModule` fornece cálculos determinísticos para risco/fibra/confiança e aplica as governanças por modo de análise (capilar x tricológica, bloqueando recomendações clínicas e alisamentos quando o modo não permite).

### 3.4 Testes e seeds
- Jest configurado (unit, e2e via `test/jest-e2e.json`).
- Scripts de seed disponíveis em `backend/scripts/seed.js` e SQLs auxiliares.

## 4. Frontend Vite + React
### 4.1 Estrutura (atual)
- Páginas React (Vite) com design tokens globais em CSS; Tailwind disponível como utilitário.
- Estado/autenticação via contexts/hooks; rotas protegidas.
- Serviços HTTP via axios (base `/api`).
- Integração direta com o assistente (`TopBar` → `askAiAssistant` → `/assistant/chat`).
- Testes com Vitest + Testing Library (specs em `src/pages` e outros).

## 5. Infraestrutura & DevEx
- **Dockerfiles**:
  - Backend: multi-stage (builder + runtime). Expõe `3000`, usa envs JWT/DB.
  - Frontend: build estático.
- **docker-compose**: arquivos `docker-compose.dev.yml` e `docker-compose.prod.yml` presentes.
- **Scripts npm**: backend com lint/test/build/migrations/seed; frontend com dev/build/test/typecheck.
- **CI/CD**: backlog.

## 6. Observabilidade & Qualidade
- **ESLint/Prettier**: configs próprias por pacote.
- **Logs**: `AppLogger` com traceId e auditoria específica em `AuditModule`.
- **Métricas**: Prometheus ativo no backend (`/metrics`, contadores/histogramas HTTP, vision, reports, fila de geração de relatórios). Dashboards e alertas versionados em `docs/observability/`.
- **Healthcheck**: `/health` (backend) e `/healthz` (frontend simples).
- **QA Checklists**: cenários em `docs/QA_CHECKLIST.md`.

## 7. Roadmap (curto prazo)
1. Consolidar ORM (TypeORM vs Prisma) e migrações únicas.
2. Ampliar cobertura de testes (auth, vision, history, reports) e seeds consistentes (rodar no CI e validar fixtures IA).
3. Storage externo (S3/Blob) para uploads com URLs assinadas.
4. Fluxos assíncronos (fila) para visão/IA e geração de relatórios + métricas de job.
5. Refinar frontend com tokens em todas as páginas, novos specs (History, ValidateReport) e telemetria básica no browser.

## 8. Variáveis de ambiente (principais)
Backend
```
NODE_ENV=development|production|test
PORT=3000
DATABASE_URL=postgres://user:pass@host:5432/dbname
# ou fallbacks:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=hair_analysis

JWT_SECRET=<32+ chars>
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# IA / OpenAI
OPENAI_API_KEY=

# Storage de relatórios
REPORTS_STORAGE_PROVIDER=local|s3
REPORTS_S3_BUCKET=
REPORTS_S3_REGION=
REPORTS_S3_ACCESS_KEY_ID=
REPORTS_S3_SECRET_ACCESS_KEY=

# URLs públicas
FRONTEND_URL=http://localhost:5173
PUBLIC_APP_URL=
PUBLIC_REPORT_BASE_URL=

# Observabilidade
PROMETHEUS_PORT=9090
```
Frontend
```
VITE_API_BASE_URL=/api
VITE_APP_NAME=Hair Analysis System
```

## 9. Guia de documentação
- `README.md` na raiz: visão geral + links.
- `docs/GETTING_STARTED.md`: setup passo a passo (comandos npm, docker, scripts IA).
- `docs/QA_CHECKLIST.md`: cenários funcionais.
- `docs/DEPLOY.md`: estratégias local/staging/produção (docker-compose, Kubernetes futuro).

Este blueprint serve como contrato para a refatoração completa mantendo requisitos funcionais e adicionando boas práticas de arquitetura limpa, testes e observabilidade.

## 10. Arquitetura em 3 camadas (decisao segura)

1. Camada A - Extracao IA + input manual
- IA apenas classifica sinais e qualidade de imagem.
- IA nao calcula score final.

2. Camada B - Motor matematico deterministico (backend)
- `backend/src/modules/analysis-engine/*`
- Perfis de pesos fixos/versionados (`weightProfileVersion: v1.0.0`).
- Repetibilidade obrigatoria (mesmo input => mesmo score).

3. Camada C - Governanca juridica e entrega
- Bloqueios por modo (`capilar` x `tricologica`).
- Bloqueio por baixa confiabilidade (`confidenceScore < 60`).
- Sanitizacao de linguagem clinica antes da resposta ao frontend.

### Fluxo de auditoria juridica

- Entrada -> IA (extracao) -> motor deterministico -> governanca de modo -> persistencia historica.
- Payload juridico salvo por analise: `modelVersion`, `weightProfileVersion`, `promptVersion`, `temperature`, `rawIAOutput`, `scoreCalculado`, `confidenceScore`, `salonId`, `professionalId`, `previousAnalysisId`, `timestamp`.

### Worker PDF (hardening)

- Geracao em worker dedicado (`ReportsWorker`) acionado por `ReportsService`.
- Timeout de render configuravel (`REPORTS_RENDER_TIMEOUT_MS`, padrao 30000ms).
- Retry controlado (`REPORTS_RENDER_RETRIES`, padrao 2).
- Chave versionada de artefato (timestamp por versao) para storage local/S3.
- Limite de memoria recomendado no container (`mem_limit` + `mem_reservation` no compose).

### Politica multi-tenant

- `salonId` obrigatorio em todas as operacoes autenticadas.
- Cross-salon bloqueado via guards e validacao de ownership em history/reports.
- Persistencia de analise sempre vinculada a `salonId` e `professionalId`.

## 11. Hardening juridico e tecnico (incremental)

### 11.1 Camada de pesos versionados
- Arquivo isolado: `backend/src/modules/analysis-engine/weight-profiles.constants.ts`.
- Versao fixa: `v1.0.0`.
- Perfis tecnicos fixos: `VIRGEM`, `QUIMICAMENTE_TRATADO`, `ALTA_SENSIBILIDADE`.

### 11.2 Auditoria expandida em analise
- Entidade `HistoryEntity` (tabela `analysis_history`) recebe campos opcionais de auditoria:
  `modelVersion`, `weightProfileVersion`, `promptVersion`, `temperature`, `rawIAOutput`,
  `scoreCalculado`, `confidenceScore`, `previousAnalysisId`.
- Integracao em `VisionService.process`: dados de `legalAudit` sao persistidos sem alterar contratos anteriores.

### 11.3 Sanitizacao juridica de saida
- Middleware: `backend/src/common/middleware/legal-terms-sanitizer.middleware.ts`.
- Substituicoes obrigatorias:
  - `cura` -> `cuidado estético`
  - `diagnóstico` -> `avaliação estética`
  - `alopecia` -> `queda acentuada percebida`
  - `dermatite` -> `sensibilidade aparente`

### 11.4 PDF hardening isolado
- Worker adicional: `backend/src/reports/reports.hardening.worker.ts`.
- Worker atual permanece ativo e inalterado.
- Opcional: aplicar `backend/docker-compose.reports-worker.override.yml` para limitar memoria via `NODE_OPTIONS` e `mem_limit`.
