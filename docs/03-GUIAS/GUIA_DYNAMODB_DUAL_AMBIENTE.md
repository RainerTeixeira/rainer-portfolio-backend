# 🔄 DynamoDB: Dual Environment - Local e AWS

**Guia completo** para usar os scripts de DynamoDB tanto em **ambiente local** quanto em **produção AWS**.

---

## 🎯 Visão Geral

Os scripts `dynamodb.tables.ts` e `dynamodb.seed.ts` foram adaptados para funcionar **automaticamente** em dois ambientes:

| Ambiente | Quando Usar | Billing Mode |
|----------|-------------|--------------|
| **🏠 DynamoDB Local** | Desenvolvimento, testes | Provisioned (25 RCU/WCU) |
| **☁️ AWS DynamoDB** | Produção, staging | Provisioned (25 RCU/WCU - FREE TIER) |

### ✨ **Detecção Automática**

Os scripts detectam automaticamente o ambiente baseado na variável `DYNAMODB_ENDPOINT`:

```typescript
const isLocalEnvironment = !!env.DYNAMODB_ENDPOINT;

// Se DYNAMODB_ENDPOINT está definido = Local
// Se DYNAMODB_ENDPOINT não está definido = AWS
```

---

## 🏠 Uso: DynamoDB Local (Desenvolvimento)

### 📋 Pré-requisitos

1. Docker instalado
2. Variável `DYNAMODB_ENDPOINT` definida no `.env`

### ⚙️ Configuração (.env)

```bash
# DynamoDB Local
DYNAMODB_ENDPOINT=http://localhost:8000

# Região (qualquer uma serve para local)
AWS_REGION=us-east-1

# Prefixo das tabelas
DYNAMODB_TABLE_PREFIX=blog
```

### 🚀 Passos

#### 1. Iniciar DynamoDB Local

```bash
docker-compose up -d dynamodb-local
```

Aguarde ~5 segundos para inicialização.

#### 2. Criar Tabelas

```bash
npm run dynamodb:create-tables
```

**Saída esperada:**

```
🗄️  CRIANDO TABELAS NO DYNAMODB LOCAL
═══════════════════════════════════════════════

🌍 Ambiente: DynamoDB Local
🔗 Endpoint: http://localhost:8000
📊 Prefixo das tabelas: blog
🌎 Região: us-east-1
💰 Billing Mode: Provisioned (25 RCU/WCU - FREE TIER)

✅ Conexão estabelecida!

📝 Criando tabela blog-users [Provisioned (5 RCU/WCU)]...
✅ Tabela blog-users criada com sucesso!

... (7 tabelas criadas)
```

#### 3. Popular com Dados

```bash
npm run dynamodb:seed
```

**Saída esperada:**

```
🌱 POPULANDO DYNAMODB LOCAL COM DADOS DE TESTE
═══════════════════════════════════════════════

🌍 Ambiente: DynamoDB Local
🔗 Endpoint: http://localhost:8000

👥 Inserindo usuários...
   ✅ Admin User (ADMIN)
   ... (5 usuários)

✨ DADOS INSERIDOS COM SUCESSO!
```

#### 4. Verificar Tabelas

```bash
npm run dynamodb:list-tables
```

### 🔧 Características - Local

**Billing Mode**: `Provisioned`

- ✅ Throughput fixo (5 RCU / 5 WCU por tabela)
- ✅ Sem custos (100% grátis local)
- ✅ Performance consistente
- ✅ Ideal para desenvolvimento

**Índices GSI**:

- ✅ ProvisionedThroughput configurado (5/5)
- ✅ Todos os índices disponíveis

---

## ☁️ Uso: AWS DynamoDB (Produção)

### 📋 Pré-requisitos

1. Conta AWS ativa
2. AWS CLI configurado (`aws configure`)
3. Permissões IAM adequadas

### ⚙️ Configuração (.env)

```bash
# ❌ NÃO DEFINA DYNAMODB_ENDPOINT!
# (comentar ou remover a linha)

# DYNAMODB_ENDPOINT=  # <- Deixe vazio ou remova!

# Região AWS real
AWS_REGION=us-east-1

# Prefixo das tabelas (prod)
DYNAMODB_TABLE_PREFIX=blogprod

# Credenciais (ou use AWS CLI / IAM Role)
# AWS_ACCESS_KEY_ID=sua-chave
# AWS_SECRET_ACCESS_KEY=sua-secret
```

### 🔐 Autenticação AWS

#### Opção 1: AWS CLI (Recomendado)

```bash
aws configure

# Verificar credenciais
aws sts get-caller-identity
```

#### Opção 2: Variáveis de Ambiente

```bash
export AWS_ACCESS_KEY_ID=sua-chave
export AWS_SECRET_ACCESS_KEY=sua-secret
export AWS_REGION=us-east-1
```

#### Opção 3: IAM Role (Lambda)

Se rodando dentro de Lambda, usa automaticamente a role da função.

### 🚀 Passos

#### 1. Verificar Credenciais

```bash
aws sts get-caller-identity
```

**Saída esperada:**

```json
{
    "UserId": "...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/seu-usuario"
}
```

#### 2. Criar Tabelas na AWS

```bash
npm run dynamodb:create-tables
```

**Saída esperada:**

```
🗄️  CRIANDO TABELAS NO AWS DYNAMODB
═══════════════════════════════════════════════

🌍 Ambiente: AWS DynamoDB
🔗 Endpoint: AWS Cloud (padrão)
📊 Prefixo das tabelas: blogprod
🌎 Região: us-east-1
💰 Billing Mode: On-Demand (PAY_PER_REQUEST)

✅ Conexão estabelecida!

📝 Criando tabela blogprod-users [On-Demand (PAY_PER_REQUEST)]...
✅ Tabela blogprod-users criada com sucesso!

... (7 tabelas criadas)

💰 Informações de Custos AWS:
   • Billing Mode: On-Demand (PAY_PER_REQUEST)
   • Você paga apenas pelas requests que usar
   • Free Tier: 25 GB de armazenamento
   • Free Tier: 25 WCU e 25 RCU (primeiro ano)
   • Recomendado para produção serverless!
```

#### 3. Popular com Dados (Opcional)

```bash
npm run dynamodb:seed
```

⚠️ **Atenção**: Só popule com dados de teste em ambientes não-produção!

#### 4. Verificar no AWS Console

Acesse: <https://console.aws.amazon.com/dynamodb/>

Ou via CLI:

```bash
aws dynamodb list-tables --region us-east-1
```

### 🔧 Características - AWS

**Billing Mode**: `PAY_PER_REQUEST` (On-Demand)

- ✅ **Serverless**: Sem gerenciamento de capacidade
- ✅ **Auto-scaling**: Escala automaticamente
- ✅ **Pay-per-use**: Paga apenas pelo que usar
- ✅ **Sem throughput**: Não precisa definir RCU/WCU
- ✅ **Ideal para Lambda**: Tráfego imprevisível

**Índices GSI**:

- ✅ Sem ProvisionedThroughput (On-Demand)
- ✅ Escalam automaticamente
- ✅ Mesmos custos da tabela principal

**Custos Estimados** (valores aproximados):

- Write: $1.25 por milhão de requests
- Read: $0.25 por milhão de requests
- Armazenamento: $0.25 por GB/mês

**Free Tier** (primeiro ano):

- 25 GB de armazenamento
- 200 milhões de requests por mês

---

## 🔍 Comparação: Local vs AWS

| Aspecto | DynamoDB Local | AWS DynamoDB |
|---------|----------------|--------------|
| **Detecção** | `DYNAMODB_ENDPOINT` definido | `DYNAMODB_ENDPOINT` não definido |
| **Billing Mode** | Provisioned (5/5) | On-Demand |
| **Credenciais** | Fake (hardcoded) | AWS CLI / IAM Role |
| **Endpoint** | `http://localhost:8000` | AWS padrão da região |
| **Custos** | R$ 0,00 (grátis) | Pay-per-use |
| **Performance** | Limitada (local) | Alta (AWS Cloud) |
| **Escalabilidade** | Fixa | Infinita |
| **Uso Recomendado** | Desenvolvimento | Produção |

---

## 📝 Código de Adaptação

### Como Funciona Internamente

#### **Detecção de Ambiente**

```typescript
// Detecta automaticamente baseado na variável de ambiente
const isLocalEnvironment = !!env.DYNAMODB_ENDPOINT;
const environment = isLocalEnvironment ? 'DynamoDB Local' : 'AWS DynamoDB';
```

#### **Configuração do Cliente**

```typescript
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  
  // Se Local: usa endpoint local
  // Se AWS: usa endpoint padrão da região (undefined)
  endpoint: env.DYNAMODB_ENDPOINT || undefined,
  
  // Se Local: usa credenciais fake
  // Se AWS: usa credenciais do ambiente (IAM, AWS CLI)
  credentials: isLocalEnvironment ? {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  } : undefined,
});
```

#### **Adaptação de Definições de Tabela**

```typescript
function adaptTableDefinition(definition: any) {
  if (isLocalEnvironment) {
    // Local: mantém ProvisionedThroughput
    return definition;
  } else {
    // AWS: usa On-Demand
    const awsDefinition = { ...definition };
    
    // Remove ProvisionedThroughput
    delete awsDefinition.ProvisionedThroughput;
    
    // Remove ProvisionedThroughput dos GSI
    if (awsDefinition.GlobalSecondaryIndexes) {
      awsDefinition.GlobalSecondaryIndexes = 
        awsDefinition.GlobalSecondaryIndexes.map(gsi => {
          const adaptedGsi = { ...gsi };
          delete adaptedGsi.ProvisionedThroughput;
          return adaptedGsi;
        });
    }
    
    // Define On-Demand
    awsDefinition.BillingMode = 'PAY_PER_REQUEST';
    
    return awsDefinition;
  }
}
```

---

## 🎯 Fluxos de Trabalho

### 🏠 Workflow: Desenvolvimento Local

```bash
# 1. Configurar .env para local
echo "DYNAMODB_ENDPOINT=http://localhost:8000" >> .env

# 2. Iniciar container
docker-compose up -d dynamodb-local

# 3. Criar tabelas (Provisioned)
npm run dynamodb:create-tables

# 4. Popular dados
npm run dynamodb:seed

# 5. Desenvolver
npm run dev

# 6. Testar
curl http://localhost:4000/health \
  -H "X-Database-Provider: DYNAMODB"
```

### ☁️ Workflow: Produção AWS

```bash
# 1. Configurar .env para AWS
# Remover ou comentar DYNAMODB_ENDPOINT
# DYNAMODB_ENDPOINT=

# 2. Configurar AWS CLI
aws configure

# 3. Verificar credenciais
aws sts get-caller-identity

# 4. Criar tabelas na AWS (On-Demand)
npm run dynamodb:create-tables

# 5. Popular dados (CUIDADO EM PROD!)
# npm run dynamodb:seed  # Só em staging/dev!

# 6. Deploy da aplicação
npm run sam:deploy

# 7. Testar
curl https://sua-url-lambda.execute-api.us-east-1.amazonaws.com/health \
  -H "X-Database-Provider: DYNAMODB"
```

---

## 💰 Custos AWS - Estimativa

### Calculadora de Custos

Para uma aplicação de **blog pequeno-médio**:

| Métrica | Volume Mensal | Custo |
|---------|---------------|-------|
| Armazenamento | 1 GB | $0.25 |
| Writes | 100.000 | $0.13 |
| Reads | 1.000.000 | $0.25 |
| **Total** | - | **~$0.63/mês** |

### Free Tier (Primeiro Ano)

- ✅ **25 GB** de armazenamento
- ✅ **200 milhões** de requests/mês
- ✅ **25 WCU e 25 RCU** provisionados

**Conclusão**: Para blogs pequenos/médios, **fica dentro do Free Tier**! 🎉

---

## 🔧 Troubleshooting

### Problema: "Access Denied" na AWS

**Causa**: Credenciais incorretas ou sem permissões.

**Solução**:

```bash
# Verificar credenciais
aws sts get-caller-identity

# Configurar novamente
aws configure

# Verificar permissões IAM
# Precisa de: dynamodb:CreateTable, dynamodb:DescribeTable, etc
```

### Problema: Tabelas com Billing Mode errado

**Causa**: Script não detectou o ambiente corretamente.

**Solução**:

```bash
# Para Local: DEVE ter DYNAMODB_ENDPOINT
echo "DYNAMODB_ENDPOINT=http://localhost:8000" >> .env

# Para AWS: NÃO deve ter DYNAMODB_ENDPOINT
# Comentar ou remover a linha do .env
```

### Problema: "Cannot connect to Local"

**Causa**: Container não está rodando.

**Solução**:

```bash
# Verificar containers
docker ps | grep dynamodb

# Iniciar se não estiver rodando
docker-compose up -d dynamodb-local

# Ver logs
docker logs blogapi-dynamodb
```

---

## 📊 Comparação de Definições

### Local (Provisioned)

```typescript
{
  TableName: 'blog-users',
  KeySchema: [...],
  
  // ✅ Throughput fixo (obrigatório no Local)
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  },
  
  GlobalSecondaryIndexes: [{
    IndexName: 'EmailIndex',
    KeySchema: [...],
    
    // ✅ Throughput do índice (obrigatório no Local)
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }]
}
```

### AWS (On-Demand)

```typescript
{
  TableName: 'blog-users',
  KeySchema: [...],
  
  // ✅ On-Demand (serverless, auto-scaling)
  BillingMode: 'PAY_PER_REQUEST',
  
  // ❌ SEM ProvisionedThroughput!
  
  GlobalSecondaryIndexes: [{
    IndexName: 'EmailIndex',
    KeySchema: [...],
    
    // ❌ SEM ProvisionedThroughput no GSI!
  }]
}
```

---

## 🎯 Melhores Práticas

### ✅ Desenvolvimento Local

```bash
# Use sempre DynamoDB Local para dev
DYNAMODB_ENDPOINT=http://localhost:8000

# Vantagens:
✅ Grátis
✅ Offline
✅ Reset rápido (docker restart)
✅ Sem impacto em produção
```

### ✅ Staging/QA na AWS

```bash
# Use prefixo diferente
DYNAMODB_TABLE_PREFIX=blogstaging

# Região separada (opcional)
AWS_REGION=us-east-2

# Crie tabelas de staging
npm run dynamodb:create-tables
```

### ✅ Produção AWS

```bash
# Prefixo de produção
DYNAMODB_TABLE_PREFIX=blogprod

# Região de produção
AWS_REGION=us-east-1

# ⚠️ NÃO execute seed em produção!
# npm run dynamodb:seed  # ❌ SÓ EM DEV/STAGING!

# Deploy via SAM
npm run sam:deploy:prod
```

---

## 🔄 Migração Local → AWS

### Passo a Passo

#### 1. Desenvolvimento (Local)

```bash
# .env
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_PREFIX=blog
```

```bash
docker-compose up -d dynamodb-local
npm run dynamodb:create-tables
npm run dynamodb:seed
npm run dev
```

#### 2. Preparar para AWS

```bash
# .env
# DYNAMODB_ENDPOINT=  # <- Comentar/remover
DYNAMODB_TABLE_PREFIX=blogprod
AWS_REGION=us-east-1
```

#### 3. Deploy para AWS

```bash
# Criar tabelas na AWS
npm run dynamodb:create-tables

# Verificar
aws dynamodb list-tables

# Deploy da aplicação
npm run sam:deploy
```

#### 4. Testar na AWS

```bash
# Obter URL da Lambda
aws cloudformation describe-stacks \
  --stack-name blog-backend-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text

# Testar
curl https://sua-url/health \
  -H "X-Database-Provider: DYNAMODB"
```

---

## 📋 Checklist de Deploy

### Antes de Criar Tabelas na AWS

- [ ] AWS CLI configurado (`aws configure`)
- [ ] Credenciais verificadas (`aws sts get-caller-identity`)
- [ ] Região correta no `.env`
- [ ] Prefixo de tabelas apropriado (prod/staging)
- [ ] `DYNAMODB_ENDPOINT` comentado/removido
- [ ] Permissões IAM adequadas

### Após Criar Tabelas

- [ ] Tabelas criadas (`aws dynamodb list-tables`)
- [ ] Billing Mode = PAY_PER_REQUEST
- [ ] Índices GSI criados corretamente
- [ ] Backup habilitado (opcional, recomendado)
- [ ] Point-in-time recovery (opcional)

---

## 🎓 Conceitos Importantes

### Billing Mode

| Mode | Quando Usar | Vantagens | Desvantagens |
|------|-------------|-----------|--------------|
| **Provisioned** | Tráfego previsível | Mais barato em alto volume | Precisa gerenciar capacidade |
| **On-Demand** | Tráfego variável | Auto-scaling, sem gerenciamento | Mais caro em alto volume |

Para **aplicações serverless** (Lambda), **On-Demand é sempre recomendado**! ✅

### Global Secondary Index (GSI)

**GSI permite queries adicionais** além da chave primária:

```typescript
// Sem GSI: só busca por ID
await dynamodb.get({ Key: { id: '123' } });

// Com GSI EmailIndex: busca por email
await dynamodb.query({
  IndexName: 'EmailIndex',
  KeyConditionExpression: 'email = :email',
  ExpressionAttributeValues: { ':email': 'user@email.com' }
});
```

---

## 📚 Recursos Adicionais

### Documentação AWS

- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [On-Demand vs Provisioned](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadWriteCapacityMode.html)
- [Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

### Scripts do Projeto

- `src/prisma/dynamodb.tables.ts` - Criação de tabelas
- `src/prisma/dynamodb.seed.ts` - Seed de dados
- `package.json` - Scripts NPM

### Outros Guias

- `docs/03-GUIAS/GUIA_DYNAMODB_LOCAL.md` - Guia completo do Local
- `docs/05-INFRAESTRUTURA/GUIA_INFRAESTRUTURA_AWS.md` - Infraestrutura AWS
- `src/prisma/README.md` - Estrutura da pasta Prisma

---

## ✅ Resumo

| Ambiente | .env | Comando | Billing |
|----------|------|---------|---------|
| **Local** | `DYNAMODB_ENDPOINT=http://localhost:8000` | `npm run dynamodb:create-tables` | Provisioned |
| **AWS** | `# DYNAMODB_ENDPOINT=` (comentar) | `npm run dynamodb:create-tables` | On-Demand |

**Adaptação é 100% automática!** 🎉

---

**Criado em**: 17/10/2025  
**Versão**: 1.0 - Dual Environment Support  
**Status**: ✅ Produção-ready
