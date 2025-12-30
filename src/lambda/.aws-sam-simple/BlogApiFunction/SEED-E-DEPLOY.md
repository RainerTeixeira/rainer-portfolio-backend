# 🚀 Guia Rápido: Seed e Deploy para Produção

## 📋 Pré-requisitos

- ✅ DynamoDB Local rodando OU AWS configurado
- ✅ Variáveis de ambiente configuradas (.env)
- ✅ Tabelas DynamoDB criadas

## 🌱 Passo 1: Popular DynamoDB com Dados Reais

### Opção A: DynamoDB Local (Desenvolvimento)

```bash
# 1. Subir DynamoDB Local
docker-compose up -d dynamodb-local

# 2. Criar tabelas
npm run dynamodb:create-tables

# 3. Popular com dados reais
npm run dynamodb:seed

# 4. Verificar dados
# Acesse: http://localhost:8001 (DynamoDB Admin)
```

### Opção B: AWS DynamoDB (Produção)

```bash
# 1. Configurar .env para AWS (remover DYNAMODB_ENDPOINT)
# DATABASE_PROVIDER=DYNAMODB
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=sua-chave
# AWS_SECRET_ACCESS_KEY=seu-secret
# DYNAMODB_TABLE_PREFIX=portfolio-backend

# 2. Criar tabelas na AWS
npm run dynamodb:create-tables

# 3. Popular com dados reais
npm run dynamodb:seed

# 4. Verificar no AWS Console
# https://console.aws.amazon.com/dynamodbv2
```

## ✅ Passo 2: Testar Localmente

```bash
# 1. Iniciar servidor
npm run dev

# 2. Testar endpoints
# Swagger: http://localhost:4000/docs
# Health: http://localhost:4000/health

# 3. Testar com dados reais
# GET /posts - Ver posts criados
# GET /categories - Ver categorias
# GET /users/cognito/44085408-7021-7051-e274-ae704499cd72 - Ver usuário Rainer
```

## 📊 Dados Criados

### Usuários (5)
- **Rainer Teixeira** (ADMIN) - cognitoSub real: `44085408-7021-7051-e274-ae704499cd72`
- Maria Silva (EDITOR)
- João Santos (AUTHOR)
- Ana Costa (AUTHOR)
- Carlos Oliveira (SUBSCRIBER)

### Categorias (9)
**Principais:**
- Tecnologia
- Design
- Carreira

**Subcategorias:**
- Frontend (React, Next.js)
- Backend (NestJS, APIs)
- DevOps (AWS, Docker)
- UX/UI Design
- Design Systems
- Produtividade

### Posts (8)
**Publicados (7):**
1. React 19: Revolucionando o Desenvolvimento Frontend (2.8K views, featured)
2. Next.js 15: App Router e Server Actions na Prática (1.9K views, featured)
3. NestJS: Arquitetura Enterprise com DDD (1.4K views)
4. AWS Lambda + DynamoDB: Serverless na Prática (2.1K views, featured)
5. Design Systems: Da Teoria à Implementação (1.7K views, featured)
6. UX Research: Métodos Práticos (1.2K views)
7. Carreira Tech: Do Júnior ao Senior em 3 Anos (3.4K views)

**Rascunho (1):**
8. TypeScript 5.5: Novidades e Melhores Práticas

### Interações
- 5 comentários aprovados
- 14 likes distribuídos
- 5 bookmarks com notas
- 5 notificações (2 não lidas)

## 🔍 Verificar Dados

### Via Swagger (http://localhost:4000/docs)

```bash
# 1. Listar posts
GET /posts?status=PUBLISHED&limit=10

# 2. Buscar post por slug
GET /posts/slug/react-19-revolucionando-desenvolvimento-frontend

# 3. Listar categorias
GET /categories

# 4. Buscar usuário Rainer
GET /users/cognito/44085408-7021-7051-e274-ae704499cd72

# 5. Comentários de um post
GET /comments/post/{postId}
```

### Via DynamoDB Admin (Local)

```bash
# Acesse: http://localhost:8001
# Navegue pelas tabelas:
# - portfolio-backend-users
# - portfolio-backend-posts
# - portfolio-backend-categories
# - portfolio-backend-comments
# - portfolio-backend-likes
# - portfolio-backend-bookmarks
# - portfolio-backend-notifications
```

### Via AWS Console (Produção)

```bash
# Acesse: https://console.aws.amazon.com/dynamodbv2
# Região: us-east-1
# Tabelas: portfolio-backend-*
```

## 📦 Passo 3: Commit para GitHub

```bash
# 1. Verificar status
git status

# 2. Adicionar arquivos
git add .

# 3. Commit com mensagem descritiva
git commit -m "feat: adicionar seed DynamoDB com dados reais para produção

- Criar script dynamodb.seed.ts com dados profissionais
- 5 usuários (admin Rainer + 4 colaboradores)
- 9 categorias hierárquicas (3 principais + 6 subcategorias)
- 8 posts com conteúdo real (7 publicados + 1 rascunho)
- Interações realistas (comentários, likes, bookmarks, notificações)
- Views realistas (1K-3K por post)
- Dados prontos para produção"

# 4. Push para GitHub
git push origin main
```

## ☁️ Passo 4: Deploy AWS (Opcional)

### Via AWS SAM

```bash
# 1. Build
npm run sam:build

# 2. Deploy para produção
npm run sam:deploy:prod

# 3. Aguardar deploy (5-10 minutos)
# CloudFormation criará:
# - Lambda Function
# - API Gateway (Function URLs)
# - DynamoDB Tables (automático)
# - Cognito User Pool
# - IAM Roles

# 4. Anotar URL da API
# Exemplo: https://abc123.lambda-url.us-east-1.on.aws/

# 5. Testar em produção
curl https://sua-url.lambda-url.us-east-1.on.aws/health
```

### Popular DynamoDB AWS

```bash
# 1. Configurar .env para AWS (sem DYNAMODB_ENDPOINT)
DATABASE_PROVIDER=DYNAMODB
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=portfolio-backend

# 2. Popular dados
npm run dynamodb:seed

# 3. Verificar no AWS Console
# https://console.aws.amazon.com/dynamodbv2
```

## 🎯 Checklist Final

### Antes do Commit
- [ ] Seed executado com sucesso
- [ ] Dados verificados no DynamoDB
- [ ] Servidor local testado (npm run dev)
- [ ] Endpoints testados no Swagger
- [ ] Posts visíveis e com conteúdo
- [ ] Categorias hierárquicas funcionando
- [ ] Usuário admin (Rainer) criado

### Antes do Deploy AWS
- [ ] AWS CLI configurado (aws configure)
- [ ] Credenciais AWS válidas
- [ ] SAM CLI instalado
- [ ] .env configurado para AWS
- [ ] Build local funcionando (npm run build)
- [ ] Testes passando (npm test)

### Após Deploy AWS
- [ ] Lambda Function criada
- [ ] DynamoDB Tables criadas
- [ ] Cognito User Pool criado
- [ ] Function URL acessível
- [ ] Health check respondendo
- [ ] Dados populados no DynamoDB AWS
- [ ] Logs no CloudWatch funcionando

## 🐛 Troubleshooting

### Erro: "Table does not exist"
```bash
# Criar tabelas primeiro
npm run dynamodb:create-tables
```

### Erro: "Unable to connect to DynamoDB"
```bash
# Verificar se DynamoDB Local está rodando
docker ps | grep dynamodb

# Ou verificar credenciais AWS
aws sts get-caller-identity
```

### Erro: "Validation error"
```bash
# Verificar .env
cat .env | grep DYNAMODB

# Verificar variáveis obrigatórias
DATABASE_PROVIDER=DYNAMODB
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=portfolio-backend
```

### Seed muito lento
```bash
# Normal! DynamoDB tem rate limits
# Aguarde 2-5 minutos para seed completo
# Progresso é exibido no console
```

## 📚 Documentação Adicional

- [Guia DynamoDB Local](docs/03-GUIAS/GUIA_DYNAMODB_LOCAL.md)
- [Guia de Seed](docs/03-GUIAS/GUIA_SEED_BANCO_DADOS.md)
- [Deploy AWS](docs/05-INFRAESTRUTURA/GUIA_INFRAESTRUTURA_AWS.md)
- [Configuração](docs/02-CONFIGURACAO/GUIA_CONFIGURACAO.md)

## 💡 Dicas

1. **Desenvolvimento**: Use DynamoDB Local para testes rápidos
2. **Staging**: Use AWS DynamoDB com prefixo `portfolio-backend-staging`
3. **Produção**: Use AWS DynamoDB com prefixo `portfolio-backend-prod`
4. **Backup**: DynamoDB AWS tem backup automático (Point-in-Time Recovery)
5. **Custos**: Free Tier permanente (25 RCU/WCU) - R$ 0,00 para sempre!

## 🎉 Pronto!

Seu banco de dados está populado com dados reais e profissionais, pronto para:
- ✅ Desenvolvimento local
- ✅ Testes de integração
- ✅ Deploy em staging
- ✅ Deploy em produção
- ✅ Demonstrações para clientes

**Próximo passo**: Testar no frontend e fazer deploy completo!
