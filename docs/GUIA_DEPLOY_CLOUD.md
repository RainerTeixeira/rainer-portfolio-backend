# ☁️ Guia de Deploy para Cloud (AWS)

Este guia mostra como fazer deploy da aplicação do ambiente local para a AWS Cloud.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Checklist Local](#checklist-local)
3. [Configuração AWS](#configuração-aws)
4. [Deploy com SAM](#deploy-com-sam)
5. [Deploy com Serverless Framework](#deploy-com-serverless-framework)
6. [Configuração DynamoDB Produção](#configuração-dynamodb-produção)
7. [Configuração Cognito](#configuração-cognito)
8. [Monitoramento](#monitoramento)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### ✅ Ambiente Local Funcionando

Antes de fazer deploy, certifique-se que o ambiente local está 100% funcional:

```powershell
# Executar script de finalização
.\scripts\finalizar-ambiente-local.ps1

# Verificar se tudo passou
# - AWS CLI instalado
# - Tabelas DynamoDB criadas
# - MongoDB populado
# - API funcionando
```

### ✅ Ferramentas Necessárias

- [x] **AWS CLI** instalado e configurado
- [x] **SAM CLI** (para deploy Lambda)
- [x] **Credenciais AWS** com permissões adequadas
- [x] **Node.js** 18+
- [x] **Git** (para versionamento)

---

## ✅ Checklist Local

Antes do deploy, verifique:

```powershell
# 1. Build da aplicação
npm run build

# 2. Testes passando
npm test

# 3. Linter sem erros
npm run lint

# 4. Cobertura de testes adequada
npm run test:coverage
```

**Checklist:**

- [ ] Build sem erros
- [ ] Testes passando (> 80% cobertura)
- [ ] Sem erros de lint
- [ ] .env configurado corretamente
- [ ] Documentação atualizada

---

## 🔐 Configuração AWS

### 1. Configurar Credenciais AWS

```powershell
# Configurar AWS CLI
aws configure

# Será perguntado:
# AWS Access Key ID: <sua_key>
# AWS Secret Access Key: <seu_secret>
# Default region: us-east-1
# Default output format: json
```

### 2. Criar Credenciais IAM

No AWS Console:

1. Vá em **IAM** → **Users** → **Seu usuário**
2. **Security credentials** → **Create access key**
3. Escolha: **Command Line Interface (CLI)**
4. Copie e guarde:
   - Access Key ID
   - Secret Access Key

### 3. Políticas Necessárias

Seu usuário IAM precisa das seguintes permissões:

- **AWSLambdaFullAccess** (Lambda)
- **AmazonDynamoDBFullAccess** (DynamoDB)
- **AmazonCognitoPowerUser** (Cognito)
- **CloudFormationFullAccess** (CloudFormation/SAM)
- **IAMFullAccess** (Criar roles)
- **AmazonS3FullAccess** (S3 para deploy)
- **CloudWatchLogsFullAccess** (Logs)

---

## 🚀 Deploy com SAM

### 1. Instalar SAM CLI

```powershell
# Windows (via MSI)
# Baixe: https://github.com/aws/aws-sam-cli/releases/latest
# Instale o arquivo .msi

# Verificar instalação
sam --version
```

### 2. Validar Template

```powershell
cd src/lambda
sam validate
```

### 3. Build

```powershell
# Na raiz do projeto
npm run sam:build

# Ou manualmente
cd src/lambda
sam build
```

### 4. Deploy Guided (Primeira Vez)

```powershell
npm run sam:deploy:guided

# Ou manualmente
cd src/lambda
sam deploy --guided
```

**Perguntas do guided:**

```
Stack Name [blog-backend-api]: blog-backend-prod
AWS Region [us-east-1]: us-east-1
Parameter Environment [development]: production
Confirm changes before deploy [Y/n]: Y
Allow SAM CLI IAM role creation [Y/n]: Y
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: samconfig.toml
SAM configuration environment [default]: prod
```

### 5. Deploy Subsequentes

```powershell
# Desenvolvimento
npm run sam:deploy:dev

# Staging
npm run sam:deploy:staging

# Produção
npm run sam:deploy:prod
```

---

## 📦 Deploy com Serverless Framework

### 1. Instalar Serverless

```powershell
npm install -g serverless
```

### 2. Deploy

```powershell
# Deploy para staging
npm run deploy

# Deploy para produção
serverless deploy --stage prod
```

---

## 🗄️ Configuração DynamoDB Produção

### 1. Criar Tabelas na AWS

```powershell
# Atualizar .env para produção
# Remover DYNAMODB_ENDPOINT (usa AWS real)

# Criar tabelas
npm run dynamodb:create-tables
```

### 2. Configurar Auto Scaling

No AWS Console:

1. **DynamoDB** → **Tables** → Selecione tabela
2. **Additional settings** → **Auto scaling**
3. Configure:
   - **Minimum capacity units**: 1
   - **Maximum capacity units**: 10
   - **Target utilization**: 70%

### 3. Backup Automático

```powershell
# Habilitar Point-in-Time Recovery
aws dynamodb update-continuous-backups \
  --table-fullName blog-users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## 🔐 Configuração Cognito

### 1. User Pool Já Criado

Você já tem o User Pool configurado:

```
User Pool ID: us-east-1_wryiyhbWC
Client ID: 3ueos5ofu499je6ebc5u98n35h
Region: us-east-1
```

### 2. Configurar Domínio (Opcional)

1. **Cognito** → **RainerSoftCognito** → **Domain**
2. Adicionar domínio customizado ou usar Amazon Cognito domain

### 3. Configurar Callbacks

1. **App integration** → **App client settings**
2. **Callback URL(s)**: `https://seu-dominio.com/callback`
3. **Sign out URL(s)**: `https://seu-dominio.com/logout`

---

## 📊 Monitoramento

### 1. CloudWatch Logs

```powershell
# Ver logs da função Lambda
npm run sam:logs

# Ou manualmente
sam logs -n BlogApiFunction --stack-fullName blog-backend-api --tail
```

### 2. CloudWatch Dashboards

Crie dashboard para monitorar:

- **Lambda**: Invocações, erros, duração
- **DynamoDB**: Leitura/escrita, throttling
- **Cognito**: Logins, registros

### 3. Alarmes

Configure alarmes para:

- **Lambda Errors** > 10
- **DynamoDB Throttled Requests** > 5
- **API Gateway 5xx** > 20

---

## 🔧 Configurações de Produção

### 1. Variáveis de Ambiente

No `template.yaml` ou `serverless.yml`:

```yaml
Environment:
  Variables:
    NODE_ENV: production
    DATABASE_PROVIDER: DYNAMODB
    AWS_REGION: us-east-1
    COGNITO_USER_POOL_ID: us-east-1_wryiyhbWC
    COGNITO_CLIENT_ID: 3ueos5ofu499je6ebc5u98n35h
    COGNITO_REGION: us-east-1
    COGNITO_ISSUER: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_wryiyhbWC
    # JWT_SECRET: (usar AWS Secrets Manager)
```

### 2. Secrets Manager

Armazenar secrets de forma segura:

```powershell
# Criar secret
aws secretsmanager create-secret \
  --fullName blog-backend/jwt-secret \
  --secret-string "seu-jwt-secret-aqui"

# Recuperar no código
# const secret = await secretsManager.getSecretValue({SecretId: 'blog-backend/jwt-secret'})
```

---

## 🌐 Domínio Customizado

### 1. Obter Certificado SSL

```powershell
# AWS Certificate Manager (ACM)
# Region: us-east-1 (para API Gateway)

# Via Console:
# ACM → Request certificate → Domain: api.seu-dominio.com
```

### 2. Configurar API Gateway

1. **API Gateway** → **Custom domain names**
2. **Create** → Adicionar domínio
3. Configurar mapeamento para sua API

### 3. Atualizar DNS

No seu provedor de DNS, adicione:

```
Type: CNAME
Name: api.seu-dominio.com
Value: d-xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

---

## 🧪 Testes em Produção

### 1. Smoke Tests

```powershell
# Testar health check
curl https://api.seu-dominio.com/health

# Testar autenticação
curl -X POST https://api.seu-dominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'
```

### 2. Load Testing

Use ferramentas como:

- **Apache Bench (ab)**
- **Artillery**
- **k6**

```powershell
# Exemplo com ab
ab -n 1000 -c 10 https://api.seu-dominio.com/health
```

---

## 🐛 Troubleshooting

### Lambda Timeout

```yaml
# Aumentar timeout no template.yaml
Timeout: 30  # 30 segundos
```

### DynamoDB Throttling

- Aumentar capacidade provisionada
- Ou usar modo On-Demand

### Cold Start

- Usar Provisioned Concurrency
- Otimizar bundle size
- Lazy loading de dependências

### Logs não aparecem

```powershell
# Verificar permissões IAM
# Lambda precisa de CloudWatchLogsFullAccess
```

---

## 📚 Recursos Adicionais

### Documentação AWS

- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway Security](https://docs.aws.amazon.com/apigateway/latest/developerguide/security.html)

### Custos Estimados

Para ~1000 requests/dia:

- **Lambda**: ~$0.20/mês (free tier)
- **DynamoDB**: ~$1.25/mês (On-Demand)
- **API Gateway**: ~$3.50/mês
- **Cognito**: Grátis (até 50k MAU)

**Total estimado**: ~$5/mês

---

## ✅ Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] Testes passando (> 80% cobertura)
- [ ] Build sem erros
- [ ] Sem erros de lint
- [ ] .env configurado para produção
- [ ] Secrets no AWS Secrets Manager
- [ ] IAM roles configuradas
- [ ] DynamoDB tables criadas
- [ ] Cognito User Pool configurado
- [ ] Domínio customizado (opcional)
- [ ] CloudWatch alarmes configurados
- [ ] Backup automático habilitado
- [ ] Documentação atualizada

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. ✅ Configurar CI/CD (GitHub Actions / GitLab CI)
2. ✅ Implementar monitoramento avançado
3. ✅ Configurar WAF para segurança
4. ✅ Implementar rate limiting
5. ✅ Adicionar caching (CloudFront)

---

**Criado em:** 16/10/2025  
**Atualizado em:** 16/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Deploy
