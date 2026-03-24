---
description: Passo a passo rápido para rodar o Hair Analysis System
---

# Getting Started (Dev)

## Pré-requisitos

- Windows 10/11 com virtualização ativada
- WSL2 instalado
- Docker Desktop instalado e em execução
- Node.js 18+ e npm (para rodar sem Docker, opcional)

## Instalar WSL2 (se ainda não tiver)

1. Abra PowerShell como administrador e execute:

   ```powershell
   wsl --install
   ```

2. Reinicie se solicitado e defina WSL2 como padrão:

   ```powershell
   wsl --set-default-version 2
   ```

## Instalar Docker Desktop

1. Baixe em [docker.com](https://www.docker.com/products/docker-desktop/)
2. Na instalação, marque “Use WSL2 instead of Hyper-V”.
3. Após instalar, abra Docker Desktop e aguarde o status “Running”.
4. Valide no terminal:

   ```bash
   docker --version
   docker compose version
   ```

## Rodar com Docker (recomendado)

1. Na raiz do projeto, suba o ambiente dev:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Endpoints principais:

   - API: [http://localhost:3000/api](http://localhost:3000/api)
   - Metrics: [http://localhost:3000/metrics](http://localhost:3000/metrics)
   - Health: [http://localhost:3000/health](http://localhost:3000/health)
   - Frontend: [http://localhost:5173](http://localhost:5173)

3. Para parar:

   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

## Rodar sem Docker (alternativa)

1. Backend:

   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

   Configure .env com DB local (Postgres) e JWT_SECRET.

2. Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Use `VITE_API_BASE_URL=[http://localhost:3000/api](http://localhost:3000/api)`

## Variáveis importantes (backend)

- JWT_SECRET, JWT_REFRESH_SECRET
- JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
- DATABASE_HOST/PORT/USERNAME/PASSWORD/DATABASE_NAME
- FRONTEND_URL
- UPLOADS_DIR, UPLOADS_TTL_HOURS, UPLOADS_CLEAN_INTERVAL_MIN

## Dicas rápidas

- Se porta 5432 estiver em uso, ajuste o mapeamento em `docker-compose.dev.yml`.
- UPLOADS_DIR em Docker já monta volume `backend_uploads`.
- Sem Docker, instale Postgres local e crie o DB `hair_analysis`.

## IA e RAG (contexto de conhecimento)

- Os prompts de análise (capilar, premium e visão) usam apenas alisamentos cadastrados e com critérios completos (hairTypes, structures, volume, damageLevel, tolerâncias). Itens incompletos são tratados como indisponíveis e ficam em `restrictedProcedures`.
- O RAG é montado por análise usando sinais estruturais para buscar conhecimento específico na base:
  - Capilar: `hairType`, `density`, `porosity_level`, `elasticity` (quando informados).
  - Premium: `hairType`, `structure/hairStructure`, `volume`, `porosity`, `elasticity` vindos do `visionResult`.
  - Visão (imagem): `uvMode/uvFlags/microscopyAlerts` + `imageSignals` (quando presentes) com `hairType/tipo_fio`, `curvature/curvatura`, `volume`, `porosity/porosidade`, `elasticity/elasticidade`.
- A IA é instruída a usar somente o nome exato do catálogo de alisamentos; nomes genéricos (ex.: “alisamento progressivo”, selagem, semi definitiva) são bloqueados.
