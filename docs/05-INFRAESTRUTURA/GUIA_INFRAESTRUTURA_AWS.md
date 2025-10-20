# 🚀 Guia Completo: Infraestrutura AWS Serverless

**Objetivo:** Deploy completo da aplicação NestJS na AWS usando arquitetura serverless.

**Tempo estimado:** 40 minutos  
**Nível:** Intermediário/Avançado  
**Pré-requisitos:** AWS CLI, AWS SAM CLI, conta AWS

---

## 📚 O Que Você Vai Aprender

- ✅ O que é AWS SAM (Serverless Application Model)
- ✅ Lambda Function URLs (endpoints HTTPS diretos)
- ✅ Deploy passo a passo completo
- ✅ Configuração de DynamoDB e Cognito
- ✅ Monitoramento e logs (CloudWatch)
- ✅ Custos detalhados (Free Tier)
- ✅ Troubleshooting de problemas comuns

---

## 🏗️ Arquitetura Serverless

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │ HTTPS
       ↓
┌──────────────────────────────┐
│  Lambda Function URL         │  ← Endpoint HTTPS direto
│  (Sem API Gateway)           │     Custo: $1/milhão
└──────┬──────────────────┬────┘
       │                  │
       ↓                  ↓
┌─────────────┐    ┌──────────────┐
│   Lambda    │    │   Cognito    │
│  (NestJS)   │←───│  (JWT Auth)  │
└──────┬──────┘    └──────────────┘
       │
       ↓
┌─────────────┐
│  DynamoDB   │  ← Banco NoSQL
│  (7 tabelas)│     25GB Free Tier
└─────────────┘
```

---

## 📦 O Que É AWS SAM?

**AWS SAM (Serverless Application Model)** é a ferramenta oficial da AWS para aplicações serverless.

### Benefícios

✅ **Infraestrutura como código** - Tudo em `template.yaml`  
✅ **Deploy automático** - Um comando cria todos os recursos  
✅ **Teste local** - `sam local` testa antes do deploy  
✅ **Validação** - Detecta erros antes de subir  
✅ **CloudFormation nativo** - 100% compatível  
✅ **Oficial AWS** - Suporte garantido

### Recursos Criados Automaticamente

1. ⚡ **Lambda Function** - Função Node.js 20 com NestJS
2. 🌐 **Lambda Function URL** - Endpoint HTTPS público
3. 🗄️ **7 Tabelas DynamoDB** - Users, Posts, Categories, Comments, Likes, Bookmarks, Notifications
4. 🔐 **Cognito User Pool** - Autenticação (opcional)
5. 🔑 **IAM Roles** - Permissões automáticas
6. 📊 **CloudWatch Logs** - Logs centralizados

---

## 🌐 Lambda Function URLs

### O Que São?

Endpoints HTTPS nativos para Lambda, **sem API Gateway**.

### Vantagens

| Recurso | Function URLs | API Gateway |
|---------|---------------|-------------|
| **Custo** | $1/milhão | $3.50/milhão |
| **Setup** | 2 linhas YAML | Config complexa |
| **HTTPS** | ✅ Automático | ✅ Sim |
| **CORS** | ✅ Simples | ✅ Configurável |
| **Auth JWT** | ✅ Cognito | ✅ Cognito/Custom |
| **Ideal para** | MVP, REST APIs | APIs enterprise |

**💰 Economia:** 71% menos custo que API Gateway

### Configuração

```yaml
FunctionUrlConfig:
  AuthType: NONE  # ou AWS_IAM para autenticação
  Cors:
    AllowOrigins: ["*"]
    AllowMethods: ["*"]
    AllowHeaders: ["*"]
```

---

## ✅ Pré-requisitos

### 1. Conta AWS

- [ ] Conta AWS criada
- [ ] Cartão cadastrado (não será cobrado no Free Tier)

### 2. AWS CLI

```bash
# Verificar
aws --version

# Instalar (se necessário)
# Windows: https://awscli.amazonaws.com/AWSCLIV2.msi
# macOS: brew install awscli
# Linux: pip install awscli
```

### 3. AWS SAM CLI

```bash
# Verificar
sam --version

# Instalar (se necessário)
# Windows: choco install aws-sam-cli
# macOS: brew install aws-sam-cli
# pip install aws-sam-cli
```

### 4. Configurar Credenciais

```bash
aws configure

# Preencher:
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region: us-east-1
# Output format: json
```

---

## 🚀 Deploy Passo a Passo

### Passo 1: Criar template.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Blog API - NestJS Serverless

Globals:
  Function:
    Timeout: 30
    MemorySize: 512
    Runtime: nodejs20.x
    Environment:
      Variables:
        NODE_ENV: production
        DATABASE_PROVIDER: DYNAMODB

Resources:
  # Lambda Function
  BlogApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ./
      Handler: dist/lambda/handler.handler
      FunctionUrlConfig:
        AuthType: NONE
        Cors:
          AllowOrigins: ["*"]
          AllowMethods: ["*"]
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTable
        - DynamoDBCrudPolicy:
            TableName: !Ref PostsTable
      Environment:
        Variables:
          DYNAMODB_TABLE_PREFIX: blog-prod

  # Tabela DynamoDB Users
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: blog-prod-users
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

  # Tabela DynamoDB Posts
  PostsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: blog-prod-posts
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

Outputs:
  ApiUrl:
    Description: URL da API
    Value: !GetAtt BlogApiFunctionUrl.FunctionUrl
```

**📁 Localização:** `src/lambda/template.yaml`

---

### Passo 2: Build

```bash
npm run build  # Build do NestJS
```

### Passo 3: Validar Template

```bash
cd src/lambda
sam validate
```

**✅ Deve retornar:** "template.yaml is a valid SAM Template"

### Passo 4: Build SAM

```bash
sam build
```

Cria pasta `.aws-sam/` com artefatos.

### Passo 5: Deploy (Primeira vez)

```bash
sam deploy --guided
```

**Perguntas interativas:**

```
Stack Name: blog-backend-api
AWS Region: us-east-1
Confirm changes: Y
Allow SAM CLI IAM role creation: Y
BlogApiFunction has no authentication: Y (confirmar)
Save arguments to configuration: Y
```

### Passo 6: Deploy (Subsequentes)

```bash
sam deploy  # Usa samconfig.toml salvo
```

---

## 🎯 Múltiplos Ambientes

### Criar samconfig.toml

```toml
version = 0.1

[default.deploy.parameters]
stack_name = "blog-backend-dev"
region = "us-east-1"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"

[staging.deploy.parameters]
stack_name = "blog-backend-staging"
region = "us-east-1"

[production.deploy.parameters]
stack_name = "blog-backend-prod"
region = "us-east-1"
parameter_overrides = "Environment=production"
```

### Deploy por Ambiente

```bash
# Dev
sam deploy --config-env default

# Staging
sam deploy --config-env staging

# Produção
sam deploy --config-env production
```

---

## 🗄️ DynamoDB: 7 Tabelas Necessárias

Crie uma tabela para cada model:

```yaml
# 1. Users
UsersTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: !Sub ${TablePrefix}-users
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: id
        AttributeType: S
      - AttributeName: cognitoSub
        AttributeType: S
    KeySchema:
      - AttributeName: id
        KeyType: HASH
    GlobalSecondaryIndexes:
      - IndexName: cognitoSub-index
        KeySchema:
          - AttributeName: cognitoSub
            KeyType: HASH

# 2-7. Posts, Categories, Comments, Likes, Bookmarks, Notifications
# (Seguir o mesmo padrão)
```

**💡 Dica:** Ver `src/lambda/template.yaml` para template completo com todas as 7 tabelas.

---

## 🔐 Adicionar Cognito

```yaml
# User Pool
CognitoUserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: !Sub ${AWS::StackName}-users
    UsernameAttributes:
      - email
    AutoVerifiedAttributes:
      - email
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: true

# App Client
CognitoUserPoolClient:
  Type: AWS::Cognito::UserPoolClient
  Properties:
    ClientName: !Sub ${AWS::StackName}-client
    UserPoolId: !Ref CognitoUserPool
    GenerateSecret: false
    ExplicitAuthFlows:
      - ALLOW_USER_PASSWORD_AUTH
      - ALLOW_REFRESH_TOKEN_AUTH

Outputs:
  UserPoolId:
    Value: !Ref CognitoUserPool
  ClientId:
    Value: !Ref CognitoUserPoolClient
```

---

## 📊 Monitoramento

### Ver Logs

```bash
# Logs em tempo real
sam logs -n BlogApiFunction --stack-name blog-backend-api --tail

# Últimas 10 linhas
sam logs -n BlogApiFunction --stack-name blog-backend-api --tail --filter ERROR
```

### CloudWatch Console

1. Acesse: AWS Console → CloudWatch
2. Logs → Log groups
3. Procure: `/aws/lambda/blog-backend-api-BlogApiFunction-*`

### Métricas

```bash
# Ver métricas da função
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=blog-backend-api-BlogApiFunction \
  --start-time 2025-10-16T00:00:00Z \
  --end-time 2025-10-17T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## 💰 Custos Detalhados

### Free Tier (12 meses)

| Serviço | Free Tier Mensal | Custo |
|---------|------------------|-------|
| **Lambda** | 1M requisições + 400k GB-s | R$ 0,00 |
| **DynamoDB** | 25 GB + 25 RCU/WCU | R$ 0,00 |
| **Cognito** | 50k MAUs | R$ 0,00 |
| **CloudWatch** | 5 GB logs | R$ 0,00 |
| **Function URLs** | Incluído no Lambda | R$ 0,00 |
| **Data Transfer** | 1 GB out | R$ 0,00 |
| **TOTAL** | - | **R$ 0,00/mês** 🎉 |

### Após Free Tier

| Serviço | Custo | Exemplo |
|---------|-------|---------|
| Lambda | $0.20 por 1M req | 10M req = $2.00 |
| DynamoDB | $1.25 por milhão writes | 1M writes = $1.25 |
| Function URLs | $1.00 por 1M req | 5M req = $5.00 |
| CloudWatch | $0.50 por GB | 10 GB = $5.00 |

**Estimativa para 1M usuários/mês:** ~$50-100/mês

---

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Validar template
sam validate

# Build local
sam build

# Testar localmente
sam local start-api  # Inicia API na porta 4000

# Invocar função diretamente
sam local invoke BlogApiFunction --event events/test-event.json
```

### Deploy

```bash
# Deploy primeira vez (interativo)
sam deploy --guided

# Deploy subsequentes
sam deploy

# Deploy por ambiente
sam deploy --config-env production
```

### Monitoramento

```bash
# Ver logs em tempo real
sam logs -n BlogApiFunction --tail

# Ver apenas erros
sam logs -n BlogApiFunction --tail --filter ERROR

# Listar stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE
```

### Limpeza

```bash
# Deletar stack (remove TODOS os recursos)
sam delete

# Ou via CloudFormation
aws cloudformation delete-stack --stack-name blog-backend-api
```

---

## 🧪 Testar API Deployada

### Obter URL da Função

```bash
# Após deploy, procure no output:
Outputs:
  ApiUrl: https://abc123xyz.lambda-url.us-east-1.on.aws/
```

### Testar Endpoints

```bash
# Health check
curl https://abc123xyz.lambda-url.us-east-1.on.aws/health

# Listar posts
curl https://abc123xyz.lambda-url.us-east-1.on.aws/posts

# Criar post (com autenticação)
curl -X POST https://abc123xyz.lambda-url.us-east-1.on.aws/posts \
  -H "Authorization: Bearer <token-cognito>" \
  -H "Content-Type: application/json" \
  -d '{"title": "...", "content": {...}}'
```

---

## 🔒 Autenticação em Produção

### Fluxo JWT com Cognito

```
1. Frontend faz login via Cognito
   POST https://cognito-idp.us-east-1.amazonaws.com/
   ↓
2. Cognito retorna JWT token
   { "AccessToken": "eyJhbGci..." }
   ↓
3. Frontend envia token para Lambda
   Authorization: Bearer eyJhbGci...
   ↓
4. Lambda valida JWT antes de processar
   (Implementado no NestJS)
```

### Configurar Validação JWT

```typescript
// src/main.ts
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  // Validar token (já implementado no AuthService)
  next();
});
```

---

## 🐛 Troubleshooting

### Erro: "No credentials found"

```bash
# Configurar credenciais AWS
aws configure

# Ou definir variáveis de ambiente
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
```

### Erro: "Stack already exists"

```bash
# Atualizar stack existente
sam deploy

# Ou deletar e recriar
sam delete
sam deploy --guided
```

### Erro: "Rate exceeded"

Lambda está recebendo muitas requisições (cold start).

**Solução:**

```yaml
# Provisioned concurrency (evita cold starts)
Properties:
  ProvisionedConcurrencyConfig:
    ProvisionedConcurrentExecutions: 1
```

### Erro: "Timeout"

Função demorou mais de 30s.

**Solução:**

```yaml
Globals:
  Function:
    Timeout: 60  # Aumentar para 60 segundos
```

### Logs não aparecem

```bash
# Verificar se CloudWatch está habilitado
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/blog

# Forçar nova função
sam deploy --force-upload
```

---

## 📊 Template.yaml Essencial

### Estrutura Mínima

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    MemorySize: 512
    Runtime: nodejs20.x

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, production]

Resources:
  # Lambda
  BlogApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ../../
      Handler: dist/lambda/handler.handler
      FunctionUrlConfig:
        AuthType: NONE
        Cors:
          AllowOrigins: ["*"]
      Environment:
        Variables:
          NODE_ENV: !Ref Environment
          DATABASE_PROVIDER: DYNAMODB
          DYNAMODB_TABLE_PREFIX: !Sub blog-${Environment}
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTable

  # DynamoDB Users
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub blog-${Environment}-users
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

Outputs:
  ApiUrl:
    Value: !GetAtt BlogApiFunctionUrl.FunctionUrl
  FunctionArn:
    Value: !GetAtt BlogApiFunction.Arn
```

**📁 Template completo:** Ver `src/lambda/template.yaml` com todas as 7 tabelas.

---

## 📈 Monitoramento e Logs

### CloudWatch Logs

```bash
# Tempo real
sam logs --tail

# Filtrar erros
sam logs --filter "ERROR"

# Últimos 5 minutos
sam logs --start-time '5min ago'
```

### Métricas Importantes

| Métrica | Descrição | Alerta |
|---------|-----------|--------|
| **Invocations** | Número de chamadas | > 100k/dia |
| **Duration** | Tempo de execução | > 4000ms |
| **Errors** | Erros na função | > 1% |
| **Throttles** | Requisições limitadas | > 0 |

### Alarmes (Opcional)

```yaml
# Alarme de erros
ErrorAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmDescription: Erros na função Lambda
    MetricName: Errors
    Namespace: AWS/Lambda
    Statistic: Sum
    Period: 60
    EvaluationPeriods: 1
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
```

---

## 💡 Boas Práticas

### 1. Use Variáveis de Ambiente

```yaml
Environment:
  Variables:
    NODE_ENV: production
    DATABASE_PROVIDER: DYNAMODB
    LOG_LEVEL: warn
```

### 2. Configure Timeouts Adequados

```yaml
Timeout: 30  # 30s é bom para APIs REST
```

### 3. Use DynamoDB On-Demand

```yaml
BillingMode: PAY_PER_REQUEST  # Pague apenas pelo que usar
```

### 4. Habilite X-Ray (Opcional)

```yaml
Tracing: Active  # Debugging e performance
```

### 5. Configure Retenção de Logs

```yaml
# CloudWatch log group
LogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub /aws/lambda/${BlogApiFunction}
    RetentionInDays: 7  # Dev: 7 dias, Prod: 30 dias
```

---

## 🎯 Checklist de Deploy

### Antes do Deploy

- [ ] Código buildado (`npm run build`)
- [ ] Testes passando (`npm test`)
- [ ] Template validado (`sam validate`)
- [ ] Credenciais AWS configuradas
- [ ] DynamoDB tables planejadas (7 tabelas)

### Durante o Deploy

- [ ] `sam build` executado
- [ ] `sam deploy --guided` executado
- [ ] Stack criada com sucesso
- [ ] Outputs visíveis (ApiUrl)

### Após o Deploy

- [ ] Function URL testada
- [ ] Endpoints funcionando
- [ ] Logs aparecendo no CloudWatch
- [ ] DynamoDB tables criadas
- [ ] Cognito configurado (se aplicável)
- [ ] Custos monitorados

---

## 🆚 SAM vs Serverless Framework

| Aspecto | AWS SAM | Serverless Framework |
|---------|---------|---------------------|
| **Oficial** | ✅ AWS | ❌ Third-party |
| **CloudFormation** | ✅ Nativo | ⚠️ Traduz |
| **Teste local** | ✅ `sam local` | ✅ `sls invoke` |
| **Multi-cloud** | ❌ Só AWS | ✅ AWS, Azure, GCP |
| **Plugins** | ⚠️ Poucos | ✅ Muitos |
| **Comunidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Recomendado para** | AWS puro | Multi-cloud |

**Nossa escolha:** AWS SAM (projeto 100% AWS)

---

## 📚 Scripts NPM Disponíveis

```bash
# Validação
npm run sam:validate

# Build
npm run sam:build

# Deploy
npm run sam:deploy:dev
npm run sam:deploy:staging
npm run sam:deploy:prod
npm run sam:deploy:guided  # Primeira vez

# Teste local
npm run sam:local

# Logs
npm run sam:logs

# Limpeza
npm run sam:delete
```

---

## 🎯 Próximos Passos

### Após Deploy Bem-Sucedido

1. ✅ **Testar API:**

   ```bash
   curl https://sua-url.lambda-url.us-east-1.on.aws/health
   ```

2. ✅ **Configurar Frontend:**

   ```javascript
   const API_URL = 'https://sua-url.lambda-url.us-east-1.on.aws';
   ```

3. ✅ **Monitorar:**
   - CloudWatch Logs
   - Métricas de invocação
   - Custos (AWS Cost Explorer)

4. ✅ **Configurar Domínio Customizado** (Opcional):
   - Route 53 + CloudFront
   - Certificado SSL (ACM)

---

## 📖 Documentação Adicional

### Interna

- **`src/lambda/README.md`** - Documentação completa do handler Lambda
- **`src/lambda/template.yaml`** - Template completo com 7 tabelas
- **`src/lambda/quick-start.sh`** - Script automático (Linux/Mac)
- **`src/lambda/quick-start.ps1`** - Script automático (Windows)

### Externa

- [AWS SAM Docs](https://docs.aws.amazon.com/serverless-application-model/)
- [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)
- [Cognito Docs](https://docs.aws.amazon.com/cognito/)

---

## 🎉 Resultado Final

### ✅ Infraestrutura Deployada

Após seguir este guia, você terá na AWS:

✅ **Lambda Function** - API NestJS rodando serverless  
✅ **Function URL** - Endpoint HTTPS público  
✅ **7 Tabelas DynamoDB** - Banco de dados completo  
✅ **Cognito User Pool** - Autenticação (opcional)  
✅ **CloudWatch Logs** - Monitoramento automático  
✅ **IAM Roles** - Permissões configuradas  
✅ **Custo:** R$ 0,00/mês (Free Tier)

---

**Criado em:** 16/10/2025  
**Tipo:** Guia Completo de Infraestrutura  
**Status:** ✅ Consolidado (v4.1.1)
