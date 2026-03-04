# 🚀 Hair Analysis System - Guia de Produção

## 📋 Pré-requisitos

- Docker & Docker Compose
- Node.js 18+ (para desenvolvimento local)
- PostgreSQL 15+ (se não usar Docker)
- Redis 7+ (opcional, para cache)

## 🐳 Deploy com Docker

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar variáveis importantes:
# - JWT_SECRET (gerar um token seguro)
# - OPENAI_API_KEY
# - DATABASE_PASSWORD
# - FRONTEND_API_URL
```

### 2. Iniciar Serviços

#### Desenvolvimento:
```bash
docker-compose up -d
```

#### Produção:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Configurar Banco de Dados

```bash
# Rodar migrations
docker-compose exec backend npm run migration:run

# Inserir dados iniciais
docker-compose exec backend npm run seed
```

## 🔧 Configuração Manual

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar migrations
npm run migration:run

# Inserir dados iniciais
npm run seed

# Iniciar servidor
npm run start:prod
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Build para produção
npm run build

# Iniciar servidor
npm run preview
```

## 📊 Monitoramento e Saúde

### Health Checks

- **Backend**: `GET /health`
- **Frontend**: `GET /health`
- **Database**: Verificado via backend health check

### Logs

```bash
# Ver logs do backend
docker-compose logs -f backend

# Ver logs do frontend
docker-compose logs -f frontend

# Ver logs do banco
docker-compose logs -f postgres
```

## 🔐 Segurança

### Configurações de Produção

1. **JWT Secret**: Use uma string longa e aleatória
2. **Database Password**: Senha forte para PostgreSQL
3. **CORS**: Configure apenas domínios permitidos
4. **Rate Limiting**: Limite de requisições por IP
5. **HTTPS**: Configure certificados SSL em produção

### Headers de Segurança

O sistema inclui headers de segurança via Helmet.js:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## 📚 Documentação da API

Acesse a documentação Swagger em:
`http://localhost:3000/api/docs`

## 🔄 Backup e Restore

### Backup do Banco

```bash
# Criar backup
docker-compose exec postgres pg_dump -U postgres hair_analysis > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres hair_analysis < backup.sql
```

### Backup de Uploads

```bash
# Backup dos arquivos de upload
docker run --rm -v hair-analysis_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Migration Error**: Verifique se o banco está acessível
2. **JWT Invalid**: Verifique JWT_SECRET no .env
3. **CORS Error**: Verifique FRONTEND_URL configurado
4. **Upload Failed**: Verifique permissões do diretório uploads

### Comandos Úteis

```bash
# Reiniciar serviços
docker-compose restart

# Limpar volumes (cuidado!)
docker-compose down -v

# Ver status dos containers
docker-compose ps

# Acessar terminal do container
docker-compose exec backend sh
```

## 📈 Performance

### Otimizações Implementadas

- **Rate Limiting**: 100 requisições/minuto por IP
- **Gzip Compression**: Ativado no nginx
- **Static Caching**: 1 ano para assets estáticos
- **Database Indexes**: Índices otimizados
- **Redis Cache**: Para dados frequentemente acessados

### Monitoramento

- Health checks automáticos
- Logs estruturados
- Métricas de performance via Docker stats

## 🔄 CI/CD

### GitHub Actions (Opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          docker-compose -f docker-compose.prod.yml up -d --build
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs
2. Teste os health checks
3. Consulte a documentação da API
4. Verifique as variáveis de ambiente

---

**Importante**: Mantenha suas senhas e chaves de API seguras. Nunca commit arquivos .env no repositório!
