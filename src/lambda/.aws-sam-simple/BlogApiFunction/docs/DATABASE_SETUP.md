# Configuração de Banco de Dados

## Visão Geral

O backend suporta dois provedores de banco de dados através da variável de ambiente `DATABASE_PROVIDER`:
- **PRISMA**: MongoDB via Prisma ORM (ideal para desenvolvimento e staging)
- **DYNAMODB**: AWS DynamoDB (ideal para produção serverless)

## Configuração MongoDB (PRISMA)

### Pré-requisitos
- MongoDB instalado localmente ou acesso a um cluster MongoDB Atlas
- Node.js 18+

### Passos

1. **Configure as variáveis de ambiente**:
```env
DATABASE_PROVIDER=PRISMA
DATABASE_URL="mongodb://localhost:27017/portfolio?replicaSet=rs0&directConnection=true"
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Execute as migrações do Prisma**:
```bash
npx prisma migrate dev
```

4. **Inicie o servidor**:
```bash
npm run start:dev
```

### Replica Set Local

Para desenvolvimento local, o MongoDB requer um replica set. Use Docker:

```bash
docker-compose up -d mongodb
```

## Configuração DynamoDB

### Pré-requisitos
- AWS CLI configurada
- Docker (para DynamoDB Local)

### Ambiente Local

1. **Inicie o DynamoDB Local**:
```bash
docker-compose up -d dynamodb-local
```

2. **Configure as variáveis de ambiente**:
```env
DATABASE_PROVIDER=DYNAMODB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAFAKEACCESSKEY12345
AWS_SECRET_ACCESS_KEY=fakeSecretKeyExample1234567890abcdefghijklmnopqrstu
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_PREFIX=blog
```

3. **Execute o script de criação de tabelas**:
```bash
npm run db:create-tables
```

### Ambiente Produção AWS

1. **Configure as credenciais AWS**:
```bash
aws configure
```

2. **Configure as variáveis de ambiente**:
```env
DATABASE_PROVIDER=DYNAMODB
AWS_REGION=us-east-1
# Não configure DYNAMODB_ENDPOINT em produção
DYNAMODB_TABLE_PREFIX=blog-prod
```

3. **Crie as tabelas via AWS CLI**:
```bash
aws dynamodb create-table \
  --table-name blog-prod-users \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Troca entre Bancos

Para alternar entre MongoDB e DynamoDB, basta alterar a variável `DATABASE_PROVIDER`:

```bash
# Para MongoDB
export DATABASE_PROVIDER=PRISMA

# Para DynamoDB
export DATABASE_PROVIDER=DYNAMODB
```

## Verificação

Para verificar qual banco está ativo:

```bash
curl http://localhost:4000/health
```

A resposta incluirá o provedor de banco de dados em uso.

## Considerações

### MongoDB
- ✅ Fácil para desenvolvimento local
- ✅ Queries complexas suportadas
- ✅ Migrations automáticas com Prisma
- ❌ Requer gerenciamento de servidor

### DynamoDB
- ✅ Serverless, sem servidor para gerenciar
- ✅ Performance escalável
- ✅ Integração nativa com AWS Lambda
- ❌ Queries limitadas
- ❌ Custo por operação

## Recuperação de Dados

### MongoDB Backup
```bash
mongodump --uri="mongodb://localhost:27017/portfolio" --out=./backup
```

### DynamoDB Backup
```bash
aws dynamodb create-backup \
  --table-name blog-prod-posts \
  --backup-name backup-posts-$(date +%Y%m%d)
```

## Monitoramento

### MongoDB
- Use MongoDB Compass para visualização
- Logs disponíveis em `logs/mongodb.log`

### DynamoDB
- Monitor via AWS CloudWatch
- Métricas no console AWS DynamoDB
