# Mapeamento de Regressão (H.A.S.) - 2026-03-04

## Objetivo
Mapear alterações recentes com foco em risco de regressão funcional, jurídica e de persistência.

## Regressões confirmadas

1. Storage de relatórios foi degradado para memória (`memory://`)
- Arquivo: `backend/src/reports/reports.storage.ts`
- Impacto: perda de persistência real de PDF, download inválido fora do processo em memória.
- Severidade: crítica.
- Estado: aberto.

2. Sincronização de schema (`synchronize: true`) gerou incompatibilidades em produção local
- Arquivos impactados: `history.entity.ts`, `salon.entity.ts`, `user.entity.ts`
- Sintoma: falhas de boot do Nest por migração implícita (NOT NULL em tabela com dados / tentativa de alterar PK/FK).
- Severidade: crítica.
- Estado: parcialmente mitigado por defaults/alinhamento de colunas, mas risco estrutural permanece enquanto `synchronize` continuar ativo.

## Riscos altos (potenciais regressões)

1. Serviço de IA com respostas placeholder
- Arquivo: `backend/src/modules/ai/services/ai-analysis.service.ts`
- Risco: comportamento funcional simplificado em endpoints de decisão estética.
- Severidade: alta.
- Estado: aberto (necessário validar comportamento esperado do produto).

2. Busca semântica com assinatura adaptada para compatibilidade
- Arquivo: `backend/src/modules/knowledge/knowledge.service.ts`
- Risco: filtragem por tenant/domínio pode não refletir contrato anterior em todos os fluxos.
- Severidade: alta.
- Estado: aberto.

3. Entidades ajustadas por compatibilidade de compilação
- Arquivos: `user.entity.ts`, `salon.entity.ts`, `straightening.entity.ts`
- Risco: drift entre modelagem atual e banco legado.
- Severidade: alta.
- Estado: aberto.

## Riscos médios

1. Tipagem de payload ampliada para relatório
- Arquivo: `backend/src/reports/report.types.ts`
- Risco: baixo de runtime, médio de inconsistência de contrato entre camadas.
- Estado: monitorar.

2. Providers de métricas adicionados manualmente
- Arquivo: `backend/src/observability/observability.module.ts`
- Risco: duplicidade futura caso outro módulo registre os mesmos métricos.
- Estado: monitorar.

## Alterações de hardening jurídico/técnico aplicadas (não regressivas por si)

- `analysis-engine` com versão de pesos `v1.0.0` e perfil versionado.
- `history.entity.ts` com trilha de auditoria (`modelVersion`, `weightProfileVersion`, etc.).
- middleware de sanitização jurídica com substituições obrigatórias.
- worker adicional de PDF hardened sem substituir o worker atual.

## Bloqueios obrigatórios antes de deploy

1. Restaurar provider real de storage de relatórios (local/s3), removendo fallback em memória como implementação principal.
2. Congelar mudança de schema automática: desativar `synchronize` em ambiente com dados e operar com migration controlada.
3. Validar fluxo de IA real em:
- `POST /ai/aesthetic-decision`
- `POST /ai/sic`
- `POST /vision/process`
4. Executar smoke de multi-tenant:
- isolamento por `salonId` em `history` e `reports`.

## Checklist mínimo de validação de regressão

1. Subir aplicação sem retry infinito de TypeORM.
2. Gerar relatório PDF e baixar URL válida persistida.
3. Processar visão capilar e tricológica com bloqueios corretos de aptidão.
4. Confirmar persistência de auditoria em `analysis_history`.
5. Validar que termos clínicos são sanitizados na resposta.
