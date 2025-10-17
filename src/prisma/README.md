# 📂 Prisma - Estrutura de Banco de Dados

Estrutura profissional e organizada para gerenciamento de dados com **MongoDB** (Prisma ORM) e **DynamoDB** (AWS).

---

## 📋 Arquivos Principais

### 🗄️ Schema & Configuração

#### `schema.prisma`

**Schema do Prisma para MongoDB**

- 7 Models principais: User, Post, Category, Comment, Like, Bookmark, Notification
- 3 Enums: UserRole, PostStatus, NotificationType
- Hierarquia de 2 níveis para categorias
- Integração com AWS Cognito para autenticação

### 🌱 Seeds de Banco de Dados

#### `mongodb.seed.ts`

**Seed profissional para MongoDB/Prisma**

- População completa do banco com dados de exemplo
- 5 usuários (Admin, Editor, 2 Autores, 1 Assinante)
- 9 categorias hierárquicas (3 principais + 6 subcategorias)
- 8 posts (7 publicados + 1 rascunho)
- Comentários, likes, bookmarks e notificações
- **Idempotente**: pode executar múltiplas vezes
- Usa `upsert()` para evitar conflitos

**Como usar:**

```bash
npm run seed
# ou
npm run mongodb:seed
```

#### `dynamodb.seed.ts`

**Seed profissional para DynamoDB**

- Mesma estrutura de dados do MongoDB
- Adaptado para o modelo de dados do DynamoDB
- Suporta DynamoDB Local e AWS
- Cria dados em todas as tabelas

**Como usar:**

```bash
npm run dynamodb:seed
```

### 🔧 Utilitários DynamoDB

#### `dynamodb.tables.ts`

**Script de criação de tabelas DynamoDB**

- Cria 7 tabelas com índices otimizados
- GSI (Global Secondary Indexes) configurados
- Suporta DynamoDB Local (desenvolvimento) e AWS (produção)
- Detecta automaticamente o ambiente

**Como usar:**

```bash
npm run dynamodb:create-tables
```

### 🛠️ Serviços NestJS

#### `prisma.service.ts`

Service do Prisma para injeção de dependência no NestJS

#### `prisma.module.ts`

Módulo NestJS que exporta o PrismaService

---

## 🚀 Scripts Disponíveis

### MongoDB (Prisma)

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Generate** | `npm run prisma:generate` | Gera Prisma Client |
| **Push** | `npm run prisma:push` | Sincroniza schema com MongoDB |
| **Studio** | `npm run prisma:studio` | Interface visual do Prisma |
| **Seed** | `npm run mongodb:seed` | Popula MongoDB com dados |
| **Format** | `npm run prisma:format` | Formata arquivo schema.prisma |

### DynamoDB (AWS)

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Create Tables** | `npm run dynamodb:create-tables` | Cria todas as tabelas |
| **Seed** | `npm run dynamodb:seed` | Popula DynamoDB com dados |
| **List Tables** | `npm run dynamodb:list-tables` | Lista tabelas existentes |

---

## 📊 Estrutura de Dados

### Models (7)

1. **User** - Usuários do sistema
   - Integração com AWS Cognito
   - Perfis: Admin, Editor, Author, Subscriber
   - Estatísticas: posts count, comments count

2. **Post** - Artigos do blog
   - Pertence a uma subcategoria
   - Status: Draft, Published, Archived, Scheduled, Trash
   - Contadores: views, likes, comments, bookmarks

3. **Category** - Categorias hierárquicas
   - 2 níveis: Principal → Subcategorias
   - Posts sempre pertencem a subcategorias
   - Ordenação e ativação/desativação

4. **Comment** - Comentários em posts
   - Suporta threads (comentários aninhados)
   - Sistema de moderação
   - Aprovação por Editor/Admin

5. **Like** - Curtidas em posts
   - Relação N:N entre User e Post
   - Um usuário curte um post apenas uma vez

6. **Bookmark** - Posts salvos
   - Coleções personalizadas
   - Notas privadas do usuário

7. **Notification** - Notificações do sistema
   - Tipos: Comment, Like, Follower, Published, Mention, System
   - Status de leitura

---

## 🗂️ Arquivos Antigos (Backups)

Os arquivos abaixo são backups da estrutura anterior:

- `OLD_seed.ts` - Seed MongoDB antigo
- `OLD_seed-dynamodb.ts` - Seed DynamoDB antigo
- `OLD_create-dynamodb-tables.ts` - Criação de tabelas antigo

**⚠️ Estes arquivos podem ser deletados após validação da nova estrutura.**

---

## 🔄 Migração de Nomenclatura

A estrutura foi reorganizada para seguir padrões profissionais:

| Antigo | Novo | Razão |
|--------|------|-------|
| `seed.ts` | `mongodb.seed.ts` | Identificação clara do banco |
| `seed-dynamodb.ts` | `dynamodb.seed.ts` | Nomenclatura consistente |
| `create-dynamodb-tables.ts` | `dynamodb.tables.ts` | Nome mais conciso |

---

## 📝 Boas Práticas

### Seeds Idempotentes

✅ **Sempre use `upsert()`** ao invés de `create()`

- Permite executar o seed múltiplas vezes
- Evita erros de constraint única
- Facilita desenvolvimento e testes

### Logs Detalhados

✅ **Sempre registre cada etapa**

- Facilita debug de problemas
- Mostra progresso durante execução
- Identifica falhas rapidamente

### Try-Catch

✅ **Sempre use try-catch em operações de banco**

- Tratamento adequado de erros
- Mensagens informativas
- Rollback quando necessário

---

## 🎯 Fluxo de Trabalho Recomendado

### 1. Desenvolvimento Local (MongoDB)

```bash
# Iniciar MongoDB
docker-compose up -d mongodb

# Gerar Prisma Client
npm run prisma:generate

# Sincronizar schema
npm run prisma:push

# Popular banco
npm run seed

# Verificar dados
npm run prisma:studio
```

### 2. Teste com DynamoDB Local

```bash
# Iniciar DynamoDB Local
docker-compose up -d dynamodb-local

# Criar tabelas
npm run dynamodb:create-tables

# Popular banco
npm run dynamodb:seed

# Listar tabelas
npm run dynamodb:list-tables
```

### 3. Deploy para AWS

```bash
# Criar tabelas no AWS DynamoDB
DATABASE_PROVIDER=DYNAMODB npm run dynamodb:create-tables

# Popular com dados iniciais (opcional)
DATABASE_PROVIDER=DYNAMODB npm run dynamodb:seed
```

---

## 🔍 Verificação da Estrutura

Execute para verificar se tudo está correto:

```bash
# MongoDB
npm run seed && npm run prisma:studio

# DynamoDB Local
npm run dynamodb:create-tables && npm run dynamodb:seed
```

---

## 📚 Referências

- **Schema Prisma**: [schema.prisma](./schema.prisma)
- **Seed MongoDB**: [mongodb.seed.ts](./mongodb.seed.ts)
- **Seed DynamoDB**: [dynamodb.seed.ts](./dynamodb.seed.ts)
- **Tabelas DynamoDB**: [dynamodb.tables.ts](./dynamodb.tables.ts)
- **Documentação**: `/docs/03-GUIAS/GUIA_SEED_BANCO_DADOS.md`

---

**Última atualização**: 17/10/2025  
**Versão**: 2.0 - Estrutura Profissional Reorganizada
