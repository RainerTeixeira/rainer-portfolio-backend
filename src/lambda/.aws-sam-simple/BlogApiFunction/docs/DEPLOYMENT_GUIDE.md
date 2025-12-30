# 📚 Guia Completo de Deploy - Backend Serverless

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Ambiente Local](#ambiente-local)
3. [Testes com SAM Local](#testes-com-sam-local)
4. [Deploy em Produção](#deploy-em-produção)
5. [Monitoramento e Logs](#monitoramento-e-logs)
6. [Troubleshooting](#troubleshooting)
7. [Custos Estimados](#custos-estimados)

## 🚀 Pré-requisitos

### Ferramentas Necessárias
```bash
# Node.js 20+
node --version

# AWS CLI v2+
aws --version

# SAM CLI v1.100+
sam --version

# Docker (para DynamoDB Local)
docker --version

# PowerShell (Windows) ou Bash (Linux/Mac)
```

### Configurar AWS CLI
```bash
# Configurar credenciais
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

## 🏠 Ambiente Local

### 1. Setup Inicial
```bash
# Clonar repositório
git clone <repository-url>
cd rainer-portfolio-backend

# Executar script de setup
chmod +x scripts/setup-local.sh  # Linux/Mac
./scripts/setup-local.sh

# Windows (PowerShell)
.\scripts\setup-local.ps1
```

### 2. Variáveis de Ambiente
Crie `.env.local`:
```env
NODE_ENV=development
DATABASE_PROVIDER=DYNAMODB
DYNAMODB_LOCAL_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=dev-portfolio-backend-table
COGNITO_USER_POOL_ID=local-user-pool
COGNITO_CLIENT_ID=local-client-id
AWS_REGION=us-east-1
JWT_SECRET=local-jwt-secret-key
```

### 3. Executar Localmente
```bash
# Opção 1: Servidor NestJS direto
npm run start:dev

# Opção 2: Com SAM (simula Lambda)
sam local start-api --port 3000

# Opção 3: Com Docker
docker-compose up -d
```

### 4. DynamoDB Local UI
Acesse: http://localhost:8001/shell

## 🧪 Testes com SAM Local

### 1. Build do Projeto
```bash
sam build
```

### 2. Executar API Local
```bash
# Iniciar API
sam local start-api --port 3000

# Com arquivo de eventos
sam local start-api --port 3000 -l sam.log
```

### 3. Testar Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Criar usuário
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "cognitoSub": "12345"}'
```

### 4. Invocar Funções Diretamente
```bash
# Invocar handler
sam local invoke ApiFunction -e events/event.json

# Com debug
sam local invoke ApiFunction -d 5858 --debug-port 5858
```

## 🚀 Deploy em Produção

### 1. Preparar Deploy
```bash
# Instalar dependências de produção
npm ci --only=production

# Build do projeto
npm run build

# Empacutar dependências para Lambda Layer
cd node_modules
zip -r ../layers/njs.zip . -x "*.test.*" "*/test/*"
cd ..
```

### 2. Deploy com SAM
```bash
# Deploy para staging
./scripts/deploy.sh staging us-east-1

# Deploy para produção
./scripts/deploy.sh production us-east-1

# Deploy manual
sam deploy \
  --stack-name production-portfolio-backend \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides ParameterKey=Environment,ParameterValue=production
```

### 3. Configurar Cognito
1. Acesse AWS Console > Cognito
2. Configure User Pool criado
3. Adicione OAuth providers (Google, GitHub)
4. Configure callback URLs
5. Gere Client Secret se necessário

### 4. Atualizar Frontend
Configure o frontend para usar a Function URL:
```typescript
// .env.production
NEXT_PUBLIC_API_URL=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=seu-client-id
NEXT_PUBLIC_COGNITO_USER_POOL_ID=seu-user-pool-id
```

## 📊 Monitoramento e Logs

### 1. CloudWatch Logs
```bash
# Verificar logs da Lambda
sam logs -n production-portfolio-backend -t --stack-name production-portfolio-backend

# Logs em tempo real
sam logs -n production-portfolio-backend -t --stack-name production-portfolio-backend --tail

# Filtrar por tempo
sam logs -n production-portfolio-backend -t --stack-name production-portfolio-backend --start-time '2024-01-01T00:00:00'
```

### 2. CloudWatch Metrics
- **Lambda Invocations**: Número de execuções
- **Lambda Duration**: Tempo de execução
- **Lambda Errors**: Taxa de erros
- **DynamoDB Read/Write**: Operações no banco

### 3. X-Ray Tracing
Ativado por default no template SAM:
```bash
# Verificar traces no console
aws xray get-trace-summaries --time-range-type TimeRangeByStartTime
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Cold Start Alto
```yaml
# template.yaml - Aumentar memória
MemorySize: 1024  # Aumenta CPU também

# Ou usar Provisioned Concurrency
AutoPublishAlias: live
ProvisionedConcurrentExecutions: 5
```

#### 2. Timeout da Lambda
```yaml
# template.yaml - Aumentar timeout
Timeout: 60  # segundos
```

#### 3. Erro de Permissão
```bash
# Verificar IAM Role
aws iam get-role-policy --role-name production-portfolio-api-role --policy-name DynamoDBAccess

# Atualizar políticas se necessário
sam deploy --stack-name production-portfolio-backend --parameter-overrides ParameterKey=Environment,ParameterValue=production
```

#### 4. Problemas com CORS
```typescript
// lambda.handler.ts - Adicionar headers CORS
result.headers['Access-Control-Allow-Origin'] = '*';
result.headers['Access-Control-Allow-Credentials'] = 'true';
```

### Debug Local
```bash
# Com VS Code
sam local invoke ApiFunction -d 5858 --debug-port 5858

# Com Chrome DevTools
node --inspect dist/bootstrap/lambda.handler.js
```

## 💰 Custos Estimados (Free Tier)

### Lambda
- **Invocações**: 1M gratuito/mês
- **Compute**: 400.000 GB-segundos gratuito/mês
- **Estimativa**: $0-20/mês dependendo do tráfego

### DynamoDB
- **Storage**: 25GB gratuito
- **Read/Write**: 25 unidades WCU + 25 RCU gratuito
- **PAY_PER_REQUEST**: $1.25 por milhão de requests
- **Estimativa**: $0-10/mês

### Cognito
- **MAU**: 50.000 gratuito/mês
- **Estimativa**: $0-5/mês

### Total Estimado
- **Desenvolvimento**: $0/mês (dentro do Free Tier)
- **Produção leve**: $10-30/mês
- **Produção média**: $30-100/mês

## 🔄 CI/CD com GitHub Actions

### .github/workflows/deploy.yml
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and deploy
        run: |
          npm run build
          sam build
          sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
```

## 📝 Comandos Úteis

```bash
# Listar stacks
aws cloudformation list-stacks

# Descrever stack
aws cloudformation describe-stacks --stack-name production-portfolio-backend

# Deletar stack
aws cloudformation delete-stack --stack-name production-portfolio-backend

# Limpar recursos não utilizados
aws lambda list-functions
aws dynamodb list-tables
aws cognito-idp list-user-pools --max-results 60
```

## 🎯 Boas Práticas

1. **Sempre teste em staging antes de produção**
2. **Monitore custos regularmente no AWS Cost Explorer**
3. **Use alerts do CloudWatch para métricas críticas**
4. **Mantenha o template SAM versionado**
5. **Documente alterações na infraestrutura**
6. **Use variáveis de ambiente para configurações sensíveis**
7. **Implemente retry e backoff nas chamadas AWS**
8. **Configure health checks para monitoramento**
