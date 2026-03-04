# Changelog Técnico — Hair Analysis System (H.A.S.)

## Período
Ciclo de melhorias recentes (auditoria + estabilização funcional + refinamento de UX).

---

## 1) Governança de modos de análise

### Entregas
- Suporte consistente ao modo **geral** (`geral`) em backend e frontend.
- Normalização de exibição para evitar fallback incorreto para `capilar`.
- Regras de governança mantidas: bloqueios/ajustes por escopo de análise.

### Impacto
- Histórico e relatórios refletem corretamente sessões integradas.
- Redução de inconsistências entre persistência, API e UI.

---

## 2) PDF de histórico

### Entregas
- Ajuste de layout para evitar quebra entre título de seção e gráfico de evolução.
- Reserva de espaço antes da renderização do bloco gráfico.

### Impacto
- Relatórios mais estáveis visualmente e sem cortes indevidos em paginação.

---

## 3) IA premium e critérios de alisamento

### Entregas
- Enriquecimento do prompt premium com critérios técnicos completos:
  - tipos de fio
  - estrutura
  - volume
  - nível de dano
  - tolerância máxima de dano
  - suporte de porosidade
  - suporte de elasticidade
  - observações técnicas
- Teste unitário de regressão para validar presença desses campos no prompt.

### Impacto
- Maior precisão e rastreabilidade técnica das recomendações.

---

## 4) Base de conhecimento (RAG) e embeddings

### Entregas
- Correção do pipeline para gerar embeddings usando texto real (ingestão, reload e busca).
- Embedding local determinístico para fallback funcional sem dependência externa.
- Testes de regressão para `KnowledgeService` cobrindo:
  - ordenação por similaridade
  - escopo por salão/domínio
  - validação de query inválida

### Impacto
- Busca semântica funcional e menos suscetível a falsos empates por vetor nulo.

---

## 5) Higiene de repositório

### Entregas
- Expansão de `.gitignore` para logs, dist, coverage e backups temporários.
- Remoção de arquivos legados locais de backup/log.

### Impacto
- Menos ruído em versionamento e revisão de mudanças.

---

## 6) UX/UI (Onda 1 + Onda 2)

### Entregas
- Padronização progressiva com tokens compartilhados:
  - `layout-shell`
  - `section-stack`
  - `panel-tight`
  - `toolbar`
- Ajustes de estados `loading/empty/error` em páginas de histórico.
- Refino de `AuditLogs` com:
  - layout consistente
  - paginação responsiva
  - botão de atualização funcional
  - estados disabled/contextuais em ações
  - empty-state orientativo

### Impacto
- Fluxo administrativo mais previsível e consistente em desktop/mobile.

---

## 7) Build e validação

### Status
- Build frontend validado após as mudanças.
- `npm run lint` (backend): sem erros e sem warnings após limpeza de tipagens em `src/**` e `test/**`.
- `npm run test` (backend): 5 suítes e 8 testes passando.
- `npm run test:e2e -- history-reports.e2e-spec.ts`: 13 testes passando, cobrindo sucesso, falha e autorização (`401/403`).

---

## Próximos passos sugeridos
1. Medir bundle real do frontend pós code-splitting e avaliar split adicional de gráficos (`recharts`) apenas se houver ganho mensurável.
2. Consolidar métricas de performance de geração de PDF e busca semântica para baseline de produção.
3. Publicar tag/release interna com referência ao fechamento desta onda de auditoria.
