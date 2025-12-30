# 🚀 SAM Local - Guia Rápido

## 📋 Pré-requisitos

- Docker Desktop rodando
- AWS SAM CLI instalado
- DynamoDB Local (via docker-compose)

## ⚡ Início Rápido

### 1. Iniciar DynamoDB Local

```powershell
docker-compose up -d dynamodb
```

### 2. Build e Executar SAM Local

```powershell
.\scripts\sam-local.ps1
```

Este script irá:
- ✅ Verificar se DynamoDB está rodando
- ✅ Validar template SAM
- ✅ Fazer build com container
- ✅ Iniciar API local na porta 4000

### 3. Testar Endpoints

```powershell
.\scripts\test-sam-local.ps1
```

Ou manualmente:

```powershell
# Health check
curl http://localhost:4000/health

# API v1 health
curl http://localhost:4000/api/v1/health

# Listar posts
curl http://localhost:4000/api/v1/posts
```

## 🔧 Comandos Individuais

### Validar Template

```bash
sam validate --template-file src/lambda/template.yaml
```

### Build com Container

```bash
sam build \
  --template-file src/lambda/template.yaml \
  --build-dir src/lambda/.aws-sam \
  --no-cached \
  --use-container \
  --parameter-overrides Environment=dev
```

### Iniciar API Local

```bash
sam local start-api \
  --template-file src/lambda/template.yaml \
  --port 4000 \
  --parameter-overrides Environment=dev \
  --skip-pull-image \
  --env-vars src/lambda/env.json
```

## 📝 Variáveis de Ambiente

Configuradas em `src/lambda/env.json`:

```json
{
  "BlogApiFunction": {
    "DATABASE_PROVIDER": "DYNAMODB",
    "DYNAMODB_ENDPOINT": "http://host.docker.internal:8000",
    "DYNAMODB_TABLE_PREFIX": "blog-dev",
    "AWS_REGION": "us-east-1",
    "CORS_ORIGIN": "http://localhost:3000"
  }
}
```

## 🐛 Troubleshooting

### DynamoDB não conecta

Certifique-se que o container está rodando:

```powershell
docker ps | findstr dynamodb
```

Se não estiver, inicie:

```powershell
docker-compose up -d dynamodb
```

### Build falha

Limpe o cache e tente novamente:

```powershell
Remove-Item -Recurse -Force src/lambda/.aws-sam
.\scripts\sam-local.ps1
```

### Porta 4000 em uso

Pare processos na porta 4000:

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

## 📚 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check básico |
| `/api/v1/health` | GET | Health check detalhado |
| `/api/v1/posts` | GET | Listar posts |
| `/api/v1/posts/:id` | GET | Buscar post por ID |
| `/api/v1/users` | GET | Listar usuários |
| `/api/v1/categories` | GET | Listar categorias |

## 🔗 Links Úteis

- **API Local**: http://localhost:4000
- **DynamoDB Admin**: http://localhost:8001
- **Swagger Docs**: http://localhost:4000/docs (quando disponível)
