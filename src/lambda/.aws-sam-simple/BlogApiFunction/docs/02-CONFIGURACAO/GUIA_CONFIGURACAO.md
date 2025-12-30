# ⚙️ Guia Completo: Configuração do Ambiente

**Objetivo:** Configurar o ambiente de desenvolvimento do zero ao deploy.

**Tempo estimado:** 15 minutos  
**Nível:** Iniciante/Intermediário  
**Última atualização:** 16/10/2025 (v4.1.1)

---

## 📚 O Que Você Vai Aprender

- ✅ Como configurar o ambiente de desenvolvimento
- ✅ Qual banco de dados escolher (Prisma vs DynamoDB)
- ✅ Como configurar variáveis de ambiente (.env)
- ✅ Setup para cada cenário (dev, test, prod)
- ✅ Comandos úteis para cada provider
- ✅ Troubleshooting de problemas comuns

---

## ⚡ Quick Start (3 Passos)

### Passo 1: Copiar Configuração

```bash
cp env.example .env
```

### Passo 2: Escolher e Configurar Banco

**Desenvolvimento Local (RECOMENDADO):**

```bash
# 1. Subir MongoDB
docker run -d --fullName blogapi-mongodb -p 27017:27017 mongo:7 --replSet rs0
docker exec blogapi-mongodb mongosh --eval "rs.initiate()"

# 2. Configurar .env
# DATABASE_PROVIDER=PRISMA (já está configurado)
```

**Ou use Docker Compose:**

```bash
docker-compose up -d mongodb
```

### Passo 3: Setup Prisma e Rodar

```bash
npm run prisma:generate
npm run prisma:push
npm run dev
```

**✅ Pronto!** Acesse <http://localhost:4000>

---

## 🎯 Escolha Seu Banco de Dados

### 📊 Decisão Rápida

```
┌─────────────────────────────────────────────┐
│   Qual é o meu caso de uso?                 │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌─────────────┐         ┌─────────────┐
│ DESENVOLVIMENTO │     │  PRODUÇÃO   │
│  ou TESTES      │     │             │
└────────┬────────┘     └──────┬──────┘
         │                     │
         ▼                     ▼
   ┌─────────┐           ┌─────────┐
   │ PRISMA  │           │ Servidor│
   │ MongoDB │           │ ou      │
   └─────────┘           │ Lambda? │
                         └────┬────┘
                              │
                   ┌──────────┴──────────┐
                   │                     │
                   ▼                     ▼
              ┌─────────┐          ┌─────────┐
              │ AWS     │          │ Servidor│
              │ Lambda  │          │ Normal  │
              └────┬────┘          └────┬────┘
                   │                    │
                   ▼                    ▼
              ┌─────────┐          ┌─────────┐
              │DYNAMODB │          │ PRISMA  │
              │ AWS     │          │ Atlas   │
              └─────────┘          └─────────┘
```

### ✅ Use PRISMA (MongoDB)

**Quando:**

- ✅ Desenvolvimento local
- ✅ Testes unitários/integração
- ✅ Staging/Homologação
- ✅ Produção em servidor tradicional
- ✅ Quer Prisma Studio (GUI)

**Vantagens:**

- Desenvolvimento rápido e produtivo
- Type-safe queries (autocomplete)
- Prisma Studio para visualizar dados
- Migrations automáticas
- Fácil de debugar

### ✅ Use DYNAMODB

**Quando:**

- ✅ Produção AWS Lambda
- ✅ Arquitetura 100% serverless
- ✅ Alta escalabilidade necessária
- ✅ Pay-per-request preferível
- ✅ Teste de pré-deploy (DynamoDB Local)

**Vantagens:**

- Serverless (zero gerenciamento)
- Escalabilidade automática
- Alta disponibilidade (99.99% SLA)
- Integração nativa com Lambda
- Custo otimizado (pay-per-use)

---

## 🔧 Configuração Detalhada

### Cenário 1: Desenvolvimento (MongoDB) - RECOMENDADO

#### Passo 1: Subir MongoDB

```bash
# Via Docker (recomendado)
docker run -d --fullName blogapi-mongodb -p 27017:27017 mongo:7 --replSet rs0
docker exec blogapi-mongodb mongosh --eval "rs.initiate()"

# Ou via Docker Compose
docker-compose up -d mongodb
```

#### Passo 2: Configurar .env

```env
NODE_ENV=development
PORT=4000
DATABASE_PROVIDER=PRISMA
DATABASE_URL="mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true"

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
```

#### Passo 3: Setup Prisma

```bash
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:push      # Criar collections no MongoDB
npm run seed             # (Opcional) Popular com dados
```

#### Passo 4: Rodar

```bash
npm run dev
```

**URLs:**

- API: <http://localhost:4000>
- Swagger: <http://localhost:4000/docs>
- Prisma Studio: <http://localhost:5555> (após `npm run prisma:studio`)

---

### Cenário 2: Testes Pré-Deploy (DynamoDB Local)

#### Passo 1: Subir DynamoDB Local

```bash
npm run docker:dynamodb

# Ou via Docker Compose
docker-compose up -d dynamodb
```

#### Passo 2: Configurar .env

```env
NODE_ENV=development
DATABASE_PROVIDER=DYNAMODB
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000  # Local
DYNAMODB_TABLE_PREFIX=blog-dev
```

#### Passo 3: Criar Tabelas

```bash
npm run dynamodb:create-tables
npm run dynamodb:list-tables  # Verificar
```

#### Passo 4: Popular e Rodar

```bash
npm run dynamodb:seed  # (Opcional) Popular
npm run dev
```

---

### Cenário 3: Produção AWS (DynamoDB)

#### Passo 1: Configurar .env (produção)

```env
NODE_ENV=production
DATABASE_PROVIDER=DYNAMODB
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=blog-prod
# Sem DYNAMODB_ENDPOINT (usa DynamoDB AWS)

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
```

#### Passo 2: Deploy via SAM

```bash
npm run build
npm run sam:deploy:prod
```

**Tabelas criadas automaticamente** pelo AWS SAM.

---

## 📋 Variáveis de Ambiente

### Essenciais (Sempre Necessárias)

```env
NODE_ENV=development              # development | production | test
PORT=4000                         # Porta do servidor
HOST=0.0.0.0                      # Host (0.0.0.0 para Docker)
LOG_LEVEL=info                    # debug | info | warn | error
DATABASE_PROVIDER=PRISMA          # PRISMA | DYNAMODB
```

### Se DATABASE_PROVIDER=PRISMA

```env
DATABASE_URL="mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true"

# Produção (MongoDB Atlas):
# DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/blog"
```

**⚠️ Importante:** Prisma 6+ requer MongoDB em **Replica Set**!

### Se DATABASE_PROVIDER=DYNAMODB

```env
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=blog-dev

# Apenas para DynamoDB Local (desenvolvimento):
DYNAMODB_ENDPOINT=http://localhost:8000

# Apenas para DynamoDB AWS (produção):
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### Cognito (Autenticação)

```env
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
```

### Opcionais

```env
CORS_ORIGIN=*                     # Produção: https://seudominio.com
JWT_SECRET=your-secret-key-256bits
```

---

## 📊 Comparação: PRISMA vs DYNAMODB

| Aspecto | PRISMA (MongoDB) | DYNAMODB |
|---------|------------------|----------|
| **Setup** | Docker local | DynamoDB Local ou AWS |
| **Desenvolvimento** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐ Bom |
| **Produtividade** | ⭐⭐⭐⭐⭐ Muito Alta | ⭐⭐⭐ Média |
| **Type Safety** | ⭐⭐⭐⭐⭐ Total | ⭐⭐⭐⭐ Boa |
| **Escalabilidade** | ⭐⭐⭐⭐ Muito Boa | ⭐⭐⭐⭐⭐ Excelente |
| **Serverless** | ⭐⭐⭐ Atlas | ⭐⭐⭐⭐⭐ Nativo |
| **Custo (Dev)** | R$ 0 (Docker) | R$ 0 (Docker) |
| **Custo (Prod)** | R$ 0 (Atlas M0) | R$ 0 (Free tier) |
| **GUI Visual** | ⭐⭐⭐⭐⭐ Prisma Studio | ⭐⭐⭐ AWS Console |
| **Queries** | ⭐⭐⭐⭐⭐ Intuitivas | ⭐⭐⭐ Query/Scan |
| **Manutenção** | ⭐⭐⭐⭐ Baixa | ⭐⭐⭐⭐⭐ Zero |

---

## 🛠️ Comandos por Provider

### Prisma (MongoDB)

```bash
# Setup inicial
npm run prisma:generate     # Gerar Prisma Client
npm run prisma:push          # Criar collections
npm run seed                 # Popular banco

# Desenvolvimento
npm run prisma:studio        # Abrir GUI (localhost:5555)
npm run dev                  # Rodar aplicação

# Manutenção
npm run prisma:format        # Formatar schema.prisma
```

### DynamoDB

```bash
# Setup inicial (Local)
npm run docker:dynamodb           # Subir container
npm run dynamodb:create-tables    # Criar tabelas
npm run dynamodb:seed             # Popular banco

# Desenvolvimento
npm run dynamodb:list-tables      # Listar tabelas
npm run dynamodb:admin            # GUI web (localhost:8001)
npm run dev                       # Rodar aplicação

# Produção (AWS)
npm run sam:deploy:prod           # Deploy (cria tabelas automaticamente)
```

---

## 🗄️ Modelos de Dados (7 Collections/Tables)

Independente do provider, o projeto mantém **7 modelos**:

1. **Users** - Usuários, autores, perfis (cognitoSub, email, username, role)
2. **Posts** - Artigos do blog (title, slug, content, subcategoryId, authorId)
3. **Categories** - Categorias hierárquicas (fullName, slug, parentId)
4. **Comments** - Comentários com threads (content, postId, parentId)
5. **Likes** - Curtidas (userId, postId)
6. **Bookmarks** - Posts salvos (userId, postId, collection, notes)
7. **Notifications** - Notificações (type, userId, isRead)

---

## ✅ Checklist de Configuração

### Básico (Todos os cenários)

- [ ] `.env` criado (`cp env.example .env`)
- [ ] `DATABASE_PROVIDER` definido
- [ ] `NODE_ENV` configurado
- [ ] `PORT` definida (padrão: 4000)
- [ ] Dependências instaladas (`npm install`)

### Se DATABASE_PROVIDER=PRISMA

- [ ] MongoDB rodando (Docker ou Atlas)
- [ ] MongoDB configurado como Replica Set
- [ ] `DATABASE_URL` configurada
- [ ] Prisma Client gerado (`npm run prisma:generate`)
- [ ] Schema sincronizado (`npm run prisma:push`)

### Se DATABASE_PROVIDER=DYNAMODB

- [ ] DynamoDB Local rodando (dev) ou AWS configurado (prod)
- [ ] `AWS_REGION` configurada
- [ ] `DYNAMODB_TABLE_PREFIX` definido
- [ ] Tabelas criadas (`npm run dynamodb:create-tables`)

### Cognito (Ambos)

- [ ] `COGNITO_USER_POOL_ID` configurado
- [ ] `COGNITO_CLIENT_ID` configurado
- [ ] `COGNITO_REGION` configurado

---

## 🚀 Recomendações por Caso de Uso

### Desenvolvimento Local

```bash
✅ RECOMENDADO: DATABASE_PROVIDER=PRISMA
```

**Por quê?**

- Mais rápido para desenvolver
- Prisma Studio (visualizar dados)
- Type-safe (autocomplete completo)
- Fácil de debugar
- Free tier (Docker local)

### Testes Pré-Deploy

```bash
✅ RECOMENDADO: DATABASE_PROVIDER=DYNAMODB (Local)
```

**Por quê?**

- Testar com DynamoDB antes do deploy
- Validar queries e estrutura
- Identificar problemas cedo
- Ambiente similar à produção

### Produção

**AWS Lambda:**

```bash
✅ DATABASE_PROVIDER=DYNAMODB
```

**Servidor Tradicional:**

```bash
✅ DATABASE_PROVIDER=PRISMA (MongoDB Atlas)
```

---

## 🐛 Troubleshooting

### MongoDB não conecta

**Erro:** `MongoServerError: connection refused`

**Solução:**

```bash
# Verificar se está rodando
docker ps | grep blogapi-mongodb

# Verificar replica set
docker exec blogapi-mongodb mongosh --eval "rs.status()"

# Reiniciar
docker restart blogapi-mongodb
```

### Prisma Client not generated

**Erro:** `Cannot find module '@prisma/client'`

**Solução:**

```bash
npm run prisma:generate
rm -rf node_modules/.prisma
npm install
```

### DynamoDB não conecta

**Erro:** `ResourceNotFoundException: Cannot do operations on a non-existent table`

**Solução:**

```bash
# Verificar container
docker ps | grep blogapi-dynamodb

# Criar tabelas
npm run dynamodb:create-tables

# Listar tabelas
npm run dynamodb:list-tables
```

### Variáveis de ambiente inválidas

**Erro:** `ZodError: Validation failed`

**Solução:**

```bash
# Verificar .env
cat .env

# Comparar com env.example
diff .env env.example

# Corrigir variáveis faltantes/inválidas
```

---

## 📚 Documentação Relacionada

### Guias Essenciais

- **[GUIA_DECISAO_DATABASE.md](GUIA_DECISAO_DATABASE.md)** - Árvore de decisão completa ⭐
- **[REFERENCIA_RAPIDA_ENV.md](REFERENCIA_RAPIDA_ENV.md)** - Referência rápida
- **[ARQUIVOS_CONFIGURACAO.md](ARQUIVOS_CONFIGURACAO.md)** - Doc técnica dos arquivos

### Outros Recursos

- **[../README.md](../../README.md)** - Documentação principal
- **[../03-GUIAS/COMECE_AQUI_NESTJS.md](../03-GUIAS/COMECE_AQUI_NESTJS.md)** - Guia NestJS
- **[../03-GUIAS/GUIA_DYNAMODB_LOCAL.md](../03-GUIAS/GUIA_DYNAMODB_LOCAL.md)** - Setup DynamoDB completo

### Documentação Externa

- [Prisma Docs](https://www.prisma.io/docs)
- [MongoDB Docs](https://www.mongodb.com/docs/)
- [DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)
- [AWS Cognito Docs](https://docs.aws.amazon.com/cognito/)

---

## 💡 Dicas Pro

### 1. Use PRISMA para Desenvolvimento

**Por quê?**

- Prisma Studio mostra todos os dados visualmente
- Type-safe queries evitam erros
- Migrations são automáticas
- Debug é muito mais fácil

### 2. Teste com DynamoDB Local Antes do Deploy

```bash
# Alternar para DynamoDB Local
DATABASE_PROVIDER=DYNAMODB
DYNAMODB_ENDPOINT=http://localhost:8000

# Rodar aplicação
npm run dev

# Testar endpoints no Swagger
```

### 3. Use Docker Compose para Tudo

```bash
docker-compose up -d  # Sobe MongoDB + DynamoDB + GUIs
```

Você terá disponível:

- MongoDB (porta 27017)
- DynamoDB (porta 8000)
- Prisma Studio (porta 5555)
- DynamoDB Admin (porta 8001)

---

## 🎯 Resultado Final

### ✅ Ambiente Configurado

Após seguir este guia, você terá:

✅ **Banco de dados** rodando (MongoDB ou DynamoDB)  
✅ **Variáveis de ambiente** configuradas  
✅ **Prisma Client** gerado (se usar Prisma)  
✅ **Tabelas/Collections** criadas  
✅ **Aplicação** rodando e funcional  
✅ **Pronto para desenvolver** 🚀

---

**Criado em:** 16/10/2025  
**Tipo:** Guia Completo de Configuração  
**Status:** ✅ Consolidado (v4.1.1)
