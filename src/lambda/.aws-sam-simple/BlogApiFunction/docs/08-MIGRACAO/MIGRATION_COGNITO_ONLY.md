# 🔄 Migração: Cognito-Only Authentication

## 📋 Resumo da Migração

Esta migração adapta o sistema para usar **Amazon Cognito** como única fonte de verdade para `email` e `username`, mantendo apenas dados complementares no MongoDB.

## 🎯 Objetivo

- **Cognito**: Gerencia `email`, `username`, `password`, verificação, MFA
- **MongoDB**: Armazena apenas `cognitoSub` + dados complementares (nome, bio, avatar, etc.)
- **Chave de ligação**: `cognitoSub` (UUID único do Cognito)

## 📝 Mudanças Implementadas

### 1. Schema Prisma (`schema.prisma`)
- ❌ **Removido**: `username String @unique`
- ✅ **Mantido**: `cognitoSub String @unique` (chave de ligação)
- ✅ **Mantido**: Todos os outros campos complementares

### 2. Modelos TypeScript (`user.model.ts`)
- ❌ **Removido**: `username: string` da interface `User`
- ❌ **Removido**: `username` de `CreateUserData` e `UpdateUserData`
- ✅ **Mantido**: `cognitoSub` como identificador único

### 3. Schemas de Validação (`user.schema.ts`)
- ❌ **Removido**: Validações de `email` e `username`
- ❌ **Removido**: Validações de `password`
- ✅ **Adicionado**: `getUserByCognitoSubSchema`
- ✅ **Mantido**: Validações de dados complementares

### 4. Repository (`users.repository.ts`)
- ❌ **Removido**: `findByUsername()`
- ❌ **Removido**: Referências a `username` em logs e queries
- ✅ **Mantido**: `findByCognitoSub()` como método principal de busca
- ✅ **Atualizado**: `findOrCreateFromCognito()` sem `username`

### 5. Service (`users.service.ts`)
- ❌ **Removido**: `getUserByUsername()`
- ❌ **Removido**: Validações de `username` duplicado
- ✅ **Atualizado**: `syncUserFromCognito()` sem `username`
- ✅ **Mantido**: Todas as outras funcionalidades

### 6. Controller (`users.controller.ts`)
- ❌ **Removido**: Rota `GET /users/username/:username`
- ✅ **Mantido**: Rota `GET /users/cognito/:cognitoSub`
- ✅ **Atualizado**: Documentação Swagger sem `username`

### 7. Seed (`mongodb.seed.ts`)
- ❌ **Removido**: `username` dos dados de usuários
- ✅ **Mantido**: `cognitoSub` gerado com `nanoid()`
- ✅ **Mantido**: Todos os outros dados complementares

## 🔧 Como Aplicar a Migração

### 1. Atualizar Schema do Banco

```bash
# Gerar novo Prisma Client
npm run prisma:generate

# Aplicar mudanças no banco (remove coluna username)
npm run prisma:push
```

### 2. Popular com Novos Dados

```bash
# Limpar e popular banco com nova estrutura
npm run seed
```

### 3. Testar Aplicação

```bash
# Rodar testes
npm test

# Iniciar aplicação
npm run dev
```

## 📊 Fluxo de Autenticação Atualizado

### Registro
1. **Frontend** → Cognito: Registra com `email`, `username`, `password`
2. **Cognito** → Lambda: Post-Confirmation Trigger
3. **Lambda** → Backend: `POST /users` com `cognitoSub` + `fullName`
4. **Backend** → MongoDB: Salva perfil complementar

### Login
1. **Frontend** → Cognito: Login com `email` + `password`
2. **Cognito** → Frontend: Retorna JWT com `sub`, `email`, `username`
3. **Frontend** → Backend: Requisições com JWT no header
4. **Backend**: Extrai `cognitoSub` do JWT e busca no MongoDB

### Atualização de Perfil
- **Email/Username**: Atualizado apenas no Cognito
- **Dados complementares**: Atualizados no MongoDB via `cognitoSub`

## 🔍 Endpoints Atualizados

### ✅ Mantidos
- `POST /users` - Criar usuário (sem `username`)
- `GET /users` - Listar usuários
- `GET /users/:id` - Buscar por ID
- `GET /users/cognito/:cognitoSub` - Buscar por Cognito Sub
- `PUT /users/:id` - Atualizar (sem `username`)
- `DELETE /users/:id` - Deletar

### ❌ Removidos
- `GET /users/username/:username` - Buscar por username

## 🧪 Testes Atualizados

Todos os testes foram atualizados para:
- Usar `cognitoSub` como chave de usuário
- Mockar `email` e `username` apenas via Cognito
- Testar apenas dados complementares no MongoDB

## 📚 Documentação Atualizada

- **README.md**: Arquitetura híbrida Cognito + MongoDB
- **Swagger**: Schemas sem `email` e `username`
- **JSDoc**: Comentários atualizados em todos os arquivos

## ⚠️ Pontos de Atenção

1. **Frontend**: Deve usar `cognitoSub` em todas as chamadas ao backend
2. **Cognito**: `email` e `username` vêm sempre do JWT token
3. **MongoDB**: Nunca armazenar `email` ou `username`
4. **Busca**: Usar `cognitoSub` em vez de `username` para identificar usuários
5. **Perfil**: Exibir `email`/`username` do Cognito + dados do MongoDB

## 🎉 Benefícios

- ✅ **Single Source of Truth**: Cognito gerencia credenciais
- ✅ **Segurança**: Senhas e verificações no Cognito
- ✅ **Escalabilidade**: MongoDB apenas para dados complementares
- ✅ **Simplicidade**: Menos duplicação de dados
- ✅ **Conformidade**: Padrões AWS de autenticação

## 🚀 Próximos Passos

1. Atualizar frontend para usar `cognitoSub`
2. Configurar Lambda Post-Confirmation Trigger
3. Implementar sincronização Cognito ↔ MongoDB
4. Testar fluxo completo de registro/login
5. Deploy em produção com DynamoDB