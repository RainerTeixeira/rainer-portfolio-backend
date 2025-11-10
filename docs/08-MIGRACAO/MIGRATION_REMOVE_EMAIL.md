# 🔄 Migração: Cognito como Fonte Única de Email

## 📋 Objetivo

Adaptar o sistema para que o **Amazon Cognito** seja a **única fonte de verdade** para:
- ✅ `email` (verificado)
- ✅ `sub` (identificador único)

O **MongoDB** armazenará apenas:
- ✅ `cognitoSub` (chave de ligação)
- ✅ Dados complementares (bio, avatar, website, etc.)

## 🎯 Mudanças Necessárias

### 1. Backend (NestJS + Prisma + MongoDB)

#### 1.1 Schema Prisma ✅ (JÁ ESTÁ CORRETO)
O schema atual **já está otimizado**:
- ✅ Não possui campo `email` no model User
- ✅ Usa `cognitoSub` como identificador único
- ✅ Todos os dados complementares estão no MongoDB

**Nenhuma alteração necessária no schema.prisma**

#### 1.2 Seed (mongodb.seed.ts)
**Mudanças:**
- ❌ Remover qualquer referência a `email` ao criar usuários
- ✅ Usar apenas `cognitoSub` + dados complementares
- ✅ Gerar `cognitoSub` fake com `nanoid()` para testes

**Arquivo:** `src/prisma/mongodb.seed.ts`

#### 1.3 Repositories
**Mudanças:**
- ❌ Remover método `findByEmail()` (se existir)
- ✅ Manter apenas `findByCognitoSub()`
- ✅ Garantir que queries não filtrem por email

**Arquivos:**
- `src/modules/users/users.repository.ts`

#### 1.4 Services
**Mudanças:**
- ❌ Remover lógica de atualização de email no MongoDB
- ✅ Email só pode ser alterado via Cognito (AWS SDK)
- ✅ Sincronização automática ao fazer login

**Arquivos:**
- `src/modules/users/users.service.ts`
- `src/modules/auth/auth.service.ts`

#### 1.5 DTOs e Validações
**Mudanças:**
- ❌ Remover `email` de `UpdateUserData`
- ✅ Manter `email` apenas em `RegisterData` (vai para Cognito)
- ✅ Validações devem aceitar apenas campos do MongoDB

**Arquivos:**
- `src/modules/users/user.model.ts`
- `src/modules/users/dto/*.dto.ts`

#### 1.6 Controllers
**Mudanças:**
- ❌ Endpoint de atualização de perfil não aceita `email`
- ✅ Criar endpoint separado `/auth/change-email` (Cognito only)
- ✅ Documentação Swagger atualizada

**Arquivos:**
- `src/modules/users/users.controller.ts`
- `src/modules/auth/auth.controller.ts`

### 2. Frontend (Next.js + React)

#### 2.1 Types e Interfaces
**Mudanças:**
- ❌ Remover `email` de interfaces de atualização de perfil
- ✅ `email` vem apenas do token Cognito (JWT)
- ✅ Criar type `CognitoUser` separado de `MongoUser`

**Arquivos:**
- `lib/api/types/auth.ts`
- `lib/api/types/user.ts`

#### 2.2 Services
**Mudanças:**
- ❌ `updateProfile()` não envia `email`
- ✅ `changeEmail()` chama endpoint específico do Cognito
- ✅ `getUserProfile()` mescla dados: Cognito (email) + MongoDB (perfil)

**Arquivos:**
- `lib/api/services/auth.service.ts`
- `lib/api/services/user.service.ts`

#### 2.3 Hooks
**Mudanças:**
- ✅ `useAuth()` busca email do token JWT
- ✅ `useProfile()` mescla dados Cognito + MongoDB
- ❌ Nunca tentar salvar email no MongoDB

**Arquivos:**
- `hooks/useAuth.ts`
- `components/dashboard/hooks/use-profile.ts` (se existir)

#### 2.4 Componentes
**Mudanças:**
- ✅ Formulário de perfil: campo email **readonly** (vem do Cognito)
- ✅ Botão "Alterar Email" abre dialog separado
- ✅ Dialog chama `/auth/change-email` (Cognito)

**Arquivos:**
- `components/dashboard/profile-form.tsx`
- `components/dashboard/change-email-dialog.tsx` ✅ (já existe)

#### 2.5 Context
**Mudanças:**
- ✅ `AuthContext` mescla dados: `email` do token + perfil do MongoDB
- ✅ `updateProfile()` não aceita `email`

**Arquivos:**
- `contexts/AuthContext.tsx`

### 3. Testes

#### 3.1 Backend Tests
**Mudanças:**
- ✅ Mockar `cognitoSub` em todos os testes
- ✅ Email vem apenas de mocks do Cognito
- ❌ Remover testes que tentam atualizar email no MongoDB

**Arquivos:**
- `tests/modules/users/*.test.ts`
- `tests/modules/auth/*.test.ts`
- `tests/integration/*.test.ts`

#### 3.2 Frontend Tests
**Mudanças:**
- ✅ Mockar token JWT com `email` e `sub`
- ✅ Testar que `updateProfile()` não envia `email`
- ✅ Testar fluxo de alteração de email via Cognito

**Arquivos:**
- `tests/lib/api/services/*.test.ts`
- `tests/components/dashboard/*.test.tsx`

### 4. Documentação

#### 4.1 README
**Mudanças:**
- ✅ Seção explicando arquitetura Cognito + MongoDB
- ✅ Diagrama de fluxo de dados
- ✅ Exemplos de uso

**Arquivos:**
- `README.md` (backend)
- `README.md` (frontend)

#### 4.2 Swagger/OpenAPI
**Mudanças:**
- ✅ Documentar que `email` não é aceito em PATCH /users/:id
- ✅ Documentar endpoint POST /auth/change-email
- ✅ Exemplos de request/response

**Arquivos:**
- `src/modules/users/users.controller.ts` (decorators)
- `src/modules/auth/auth.controller.ts` (decorators)

#### 4.3 Docs Internas
**Mudanças:**
- ✅ Guia de autenticação atualizado
- ✅ Guia de integração Cognito + MongoDB
- ✅ FAQ sobre alteração de email

**Arquivos:**
- `docs/03-GUIAS/GUIA_INTEGRACAO_AUTH.md`
- `docs/03-GUIAS/GUIA_COGNITO_MONGODB.md` (novo)

## 🔄 Fluxo Completo

### Registro
```
1. Frontend → POST /auth/register { email, password, fullName, username }
2. Backend → Cognito.signUp() → gera `sub` e armazena `email`
3. Backend → MongoDB.create({ cognitoSub: sub, fullName, username })
4. Retorno → { userId: sub, email, requiresEmailConfirmation: true }
```

### Login
```
1. Frontend → POST /auth/login { email, password }
2. Backend → Cognito.initiateAuth() → valida credenciais
3. Backend → JWT contém { sub, email, email_verified, fullName }
4. Backend → MongoDB.findByCognitoSub(sub) → busca perfil complementar
5. Retorno → { tokens, user: { ...cognito, ...mongo } }
```

### Atualização de Perfil
```
1. Frontend → PATCH /users/:id { fullName, bio, avatar, website }
2. Backend → MongoDB.update(id, data) → atualiza apenas campos locais
3. ❌ Email NÃO é aceito neste endpoint
4. Retorno → { user: { ...updatedProfile } }
```

### Alteração de Email
```
1. Frontend → POST /auth/change-email { cognitoSub, newEmail }
2. Backend → Cognito.adminUpdateUserAttributes() → atualiza email
3. Backend → Cognito envia código de verificação
4. Frontend → POST /auth/verify-email-change { cognitoSub, code }
5. Backend → Cognito.verifyUserAttribute() → confirma novo email
6. ❌ MongoDB NÃO é atualizado (email vem sempre do Cognito)
```

## 📝 Checklist de Implementação

### Backend
- [ ] 1. Atualizar `mongodb.seed.ts` (remover email)
- [ ] 2. Revisar `users.repository.ts` (remover findByEmail)
- [ ] 3. Atualizar `users.service.ts` (remover lógica de email)
- [ ] 4. Atualizar `user.model.ts` (remover email de DTOs)
- [ ] 5. Atualizar `users.controller.ts` (documentação Swagger)
- [ ] 6. Garantir que `auth.service.ts` use apenas Cognito para email
- [ ] 7. Atualizar testes unitários
- [ ] 8. Atualizar testes de integração
- [ ] 9. Atualizar testes E2E
- [ ] 10. Atualizar documentação

### Frontend
- [ ] 1. Atualizar types (`auth.ts`, `user.ts`)
- [ ] 2. Atualizar `auth.service.ts` (getUserProfile mescla dados)
- [ ] 3. Atualizar `useAuth.ts` (email do token)
- [ ] 4. Atualizar `AuthContext.tsx` (mesclar dados)
- [ ] 5. Atualizar formulário de perfil (email readonly)
- [ ] 6. Garantir que `change-email-dialog.tsx` funciona
- [ ] 7. Atualizar testes de services
- [ ] 8. Atualizar testes de componentes
- [ ] 9. Atualizar documentação

### Testes Completos
- [ ] 1. Registro → Cognito gera sub + email
- [ ] 2. Login → dados mesclados (Cognito + MongoDB)
- [ ] 3. Atualização de perfil → sem email
- [ ] 4. Alteração de email → via Cognito
- [ ] 5. Seed → usuários sem email no MongoDB

## 🚀 Ordem de Execução

1. **Backend primeiro** (para não quebrar contratos de API)
2. **Frontend depois** (adapta-se às novas APIs)
3. **Testes por último** (validam tudo)

## ⚠️ Pontos de Atenção

1. **Migração de dados existentes**: Se já existem usuários no MongoDB com `email`, criar script de migração para removê-lo
2. **Cache**: Limpar cache de sessões após deploy
3. **Tokens antigos**: Usuários logados precisarão fazer login novamente
4. **Documentação**: Atualizar ANTES do deploy para evitar confusão

## 📊 Impacto

- ✅ **Segurança**: Email gerenciado apenas pelo Cognito (fonte única)
- ✅ **Consistência**: Sem duplicação de dados
- ✅ **Manutenibilidade**: Menos lógica de sincronização
- ✅ **Performance**: Menos queries no MongoDB
- ⚠️ **Breaking Change**: APIs de atualização de perfil mudam

## 🎉 Resultado Final

```typescript
// MongoDB User (apenas dados complementares)
{
  id: "mongo_object_id",
  cognitoSub: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  username: "joaodev",
  fullName: "João Desenvolvedor",
  bio: "Full Stack Developer",
  avatar: "https://cdn.com/avatar.jpg",
  website: "https://joaodev.com",
  role: "AUTHOR",
  isActive: true,
  postsCount: 5,
  commentsCount: 12
}

// Cognito User (autenticação)
{
  sub: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  email: "joao@example.com",
  email_verified: true,
  fullName: "João Desenvolvedor"
}

// Frontend (dados mesclados)
{
  id: "mongo_object_id",
  cognitoSub: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  email: "joao@example.com", // ← do Cognito
  username: "joaodev",
  fullName: "João Desenvolvedor",
  bio: "Full Stack Developer",
  avatar: "https://cdn.com/avatar.jpg",
  // ... resto do MongoDB
}
```
