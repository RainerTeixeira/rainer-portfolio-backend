# 🏗️ Arquitetura: Cognito + MongoDB

## 🎯 Visão Geral

Sistema de autenticação híbrido usando **Amazon Cognito** como fonte única de dados de autenticação e **MongoDB** para dados complementares de perfil.

---

## 📊 Separação de Responsabilidades

### Amazon Cognito (Autenticação)
**Responsabilidade:** Gerenciar identidade e autenticação

```typescript
{
  sub: "cognito-a1b2c3d4e5f6",           // ID único do usuário
  email: "usuario@example.com",          // Email verificado
  email_verified: true,                  // Status de verificação
  fullName: "João Silva",                    // Nome do usuário
  "cognito:username": "joaosilva"        // Username Cognito
}
```

**Funcionalidades:**
- ✅ Registro de usuários
- ✅ Login/Logout
- ✅ Verificação de email
- ✅ Recuperação de senha
- ✅ Alteração de email
- ✅ MFA (Multi-Factor Authentication)
- ✅ Tokens JWT

### MongoDB (Perfil)
**Responsabilidade:** Armazenar dados complementares

```typescript
{
  id: "mongo_object_id",
  cognitoSub: "cognito-a1b2c3d4e5f6",   // Chave de ligação
  username: "joaosilva",                 // Username único
  fullName: "João Silva",
  bio: "Desenvolvedor Full Stack",
  avatar: "https://cdn.com/avatar.jpg",
  website: "https://joaosilva.dev",
  socialLinks: {
    github: "https://github.com/joaosilva",
    linkedin: "https://linkedin.com/in/joaosilva"
  },
  role: "AUTHOR",
  isActive: true,
  postsCount: 10,
  commentsCount: 25,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:30:00Z"
}
```

**Funcionalidades:**
- ✅ Perfil do usuário
- ✅ Posts e comentários
- ✅ Estatísticas
- ✅ Relacionamentos
- ✅ Permissões (roles)

---

## 🔄 Fluxos de Autenticação

### 1. Registro de Novo Usuário

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /auth/register
       │ { email, password, fullName, username }
       ↓
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 1. Cognito.signUp()
       ↓
┌─────────────┐
│   Cognito   │ → Cria usuário, gera sub
└──────┬──────┘
       │ sub: "cognito-abc123"
       ↓
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 2. MongoDB.create()
       ↓
┌─────────────┐
│   MongoDB   │ → Salva { cognitoSub, fullName, username }
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Frontend   │ → Redireciona para verificação de email
└─────────────┘
```

### 2. Login

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /auth/login
       │ { email, password }
       ↓
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 1. Cognito.initiateAuth()
       ↓
┌─────────────┐
│   Cognito   │ → Valida credenciais, retorna JWT
└──────┬──────┘
       │ JWT { sub, email, email_verified }
       ↓
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 2. MongoDB.findByCognitoSub(sub)
       ↓
┌─────────────┐
│   MongoDB   │ → Retorna perfil complementar
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Frontend   │ → Armazena token, mescla dados
└─────────────┘
```

### 3. Atualização de Perfil

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ PATCH /users/:id
       │ { fullName, bio, avatar }
       │ (SEM email)
       ↓
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ MongoDB.update()
       ↓
┌─────────────┐
│   MongoDB   │ → Atualiza apenas campos locais
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Frontend   │ → Mescla com email do JWT
└─────────────┘
```

### 4. Alteração de Email

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /auth/change-email
       │ { cognitoSub, newEmail }
       ↓
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ Cognito.adminUpdateUserAttributes()
       ↓
┌─────────────┐
│   Cognito   │ → Atualiza email, envia código
└──────┬──────┘
       │ Código de verificação
       ↓
┌─────────────┐
│  Frontend   │ → Usuário digita código
└──────┬──────┘
       │ POST /auth/verify-email-change
       │ { cognitoSub, code }
       ↓
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ Cognito.verifyUserAttribute()
       ↓
┌─────────────┐
│   Cognito   │ → Confirma novo email
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Frontend   │ → Logout, redireciona para login
└─────────────┘
```

---

## 🔐 Segurança

### Princípios Implementados

1. **Single Source of Truth**
   - Email existe APENAS no Cognito
   - Sem duplicação de dados sensíveis
   - Consistência garantida

2. **Verificação de Email**
   - Cognito gerencia verificação
   - Código de 6 dígitos
   - Expira em 24 horas

3. **Tokens JWT**
   - Assinados pelo Cognito
   - Contém email verificado
   - Validados no backend

4. **Separação de Dados**
   - Dados sensíveis: Cognito
   - Dados de domínio: MongoDB
   - Menor superfície de ataque

---

## 📈 Benefícios da Arquitetura

### Segurança
- ✅ Email gerenciado por serviço AWS certificado
- ✅ Sem duplicação de dados sensíveis
- ✅ Verificação de email via Cognito
- ✅ MFA nativo do Cognito

### Consistência
- ✅ Fonte única de verdade para email
- ✅ Sem sincronização manual
- ✅ Dados sempre atualizados

### Manutenibilidade
- ✅ Menos lógica de sincronização
- ✅ Código mais limpo
- ✅ Menos bugs potenciais

### Performance
- ✅ Menos queries no MongoDB
- ✅ Cache eficiente de JWT
- ✅ Escalabilidade do Cognito

### Compliance
- ✅ GDPR compliant
- ✅ Dados sensíveis em serviço certificado
- ✅ Auditoria via CloudWatch

---

## 🎯 Casos de Uso

### Usuário Atualiza Nome
```
Frontend → MongoDB (fullName)
Email permanece no Cognito (inalterado)
```

### Usuário Altera Email
```
Frontend → Cognito (email)
MongoDB não é atualizado (email não existe lá)
```

### Usuário Faz Login
```
Cognito valida credenciais
Backend busca perfil no MongoDB
Frontend mescla: email (Cognito) + perfil (MongoDB)
```

---

## ⚠️ Pontos de Atenção

### Email no MongoDB
- ❌ NUNCA armazenar email no MongoDB
- ❌ NUNCA sincronizar email
- ✅ Email vem SEMPRE do token JWT

### CognitoSub
- ✅ Único identificador entre sistemas
- ✅ Imutável (não muda)
- ✅ Indexado no MongoDB

### Alteração de Email
- ✅ Apenas via Cognito
- ✅ Requer verificação
- ✅ Usuário deve fazer logout após alteração

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Implementado
