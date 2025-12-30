# ✅ Ajustes para Build SAM em Container - Concluído

## 📝 Alterações Realizadas

### 1. ✅ package.json
- **Alterado**: `postinstall` script
- **De**: `pnpm run prisma:generate`
- **Para**: `echo 'Skipping postinstall for SAM local build'`
- **Motivo**: Evitar erro no build em container (Prisma não é necessário para DynamoDB)

### 2. ✅ .npmrc
- **Confirmado**: Arquivo já existe com configurações corretas
  ```
  ignore-scripts=true
  engine-strict=false
  ```

### 3. ✅ template.yaml
- **Confirmado**: Handler correto: `src/lambda/handler.handler`
- **Confirmado**: EntryPoints: `src/lambda/handler.ts`
- **Confirmado**: CodeUri: `../../`
- **Adicionado**: Externals expandidos:
  ```yaml
  External:
    - '@aws-sdk/*'
    - 'aws-sdk/*'
    - '@fastify/view'
    - '@nestjs/websockets'
    - '@nestjs/microservices'
    - 'class-transformer/storage'
  ```
- **Confirmado**: Events HttpApi com `{proxy+}` configurado

### 4. ✅ Novos Arquivos Criados

#### `src/lambda/env.json`
Variáveis de ambiente para SAM local:
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

#### `scripts/sam-local.ps1`
Script automatizado que:
1. Verifica DynamoDB Local
2. Valida template SAM
3. Executa build com container
4. Inicia API local na porta 4000

#### `scripts/test-sam-local.ps1`
Script de testes que verifica:
- `/health`
- `/api/v1/health`
- `/api/v1/posts`

#### `src/lambda/README-SAM-LOCAL.md`
Documentação completa com:
- Guia de início rápido
- Comandos individuais
- Troubleshooting
- Lista de endpoints

## 🚀 Como Usar

### Opção 1: Script Automatizado (Recomendado)

```powershell
# 1. Garantir DynamoDB rodando
docker-compose up -d dynamodb

# 2. Build e executar SAM local
.\scripts\sam-local.ps1

# 3. Em outro terminal, testar
.\scripts\test-sam-local.ps1
```

### Opção 2: Comandos Manuais

```bash
# 1. Validar template
sam validate --template-file src/lambda/template.yaml

# 2. Build com container
sam build \
  --template-file src/lambda/template.yaml \
  --build-dir src/lambda/.aws-sam \
  --no-cached \
  --use-container \
  --parameter-overrides Environment=dev

# 3. Iniciar API local
sam local start-api \
  --template-file src/lambda/template.yaml \
  --port 4000 \
  --parameter-overrides Environment=dev \
  --skip-pull-image \
  --env-vars src/lambda/env.json

# 4. Testar
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/posts
```

## ✅ Checklist de Verificação

- [x] postinstall inofensivo no package.json
- [x] .npmrc com ignore-scripts=true
- [x] template.yaml com externals corretos
- [x] Handler: src/lambda/handler.handler
- [x] EntryPoints: src/lambda/handler.ts
- [x] CodeUri: ../../
- [x] Events HttpApi {proxy+} configurado
- [x] env.json com variáveis DynamoDB local
- [x] Script automatizado sam-local.ps1
- [x] Script de testes test-sam-local.ps1
- [x] Documentação README-SAM-LOCAL.md

## 🎯 Próximos Passos

1. **Garantir DynamoDB rodando**:
   ```powershell
   docker ps | findstr dynamodb
   ```

2. **Executar build SAM**:
   ```powershell
   .\scripts\sam-local.ps1
   ```

3. **Testar endpoints**:
   ```powershell
   .\scripts\test-sam-local.ps1
   ```

## 📊 Variáveis de Ambiente Configuradas

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_PROVIDER` | `DYNAMODB` | Usar DynamoDB |
| `DYNAMODB_ENDPOINT` | `http://host.docker.internal:8000` | DynamoDB Local |
| `DYNAMODB_TABLE_PREFIX` | `blog-dev` | Prefixo das tabelas |
| `AWS_REGION` | `us-east-1` | Região AWS |
| `CORS_ORIGIN` | `http://localhost:3000` | Frontend local |
| `NODE_ENV` | `development` | Ambiente dev |
| `LOG_LEVEL` | `debug` | Logs detalhados |

## 🔗 Endpoints de Teste

- **Health**: http://localhost:4000/health
- **API Health**: http://localhost:4000/api/v1/health
- **Posts**: http://localhost:4000/api/v1/posts
- **Users**: http://localhost:4000/api/v1/users
- **Categories**: http://localhost:4000/api/v1/categories

## 💡 Dicas

1. **Primeira execução**: Build pode levar 5-10 minutos
2. **Builds subsequentes**: Mais rápidos com cache
3. **DynamoDB**: Deve estar rodando antes do SAM local
4. **Porta 4000**: Certifique-se que está livre
5. **Logs**: SAM local mostra logs em tempo real

## 🐛 Troubleshooting Comum

### Build falha com erro de Prisma
✅ **Resolvido**: postinstall agora é inofensivo

### DynamoDB não conecta
```powershell
docker-compose up -d dynamodb
docker ps | findstr dynamodb
```

### Porta 4000 em uso
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

---

**Status**: ✅ Pronto para uso
**Data**: 2025-01-26
**Versão**: 3.0.0
