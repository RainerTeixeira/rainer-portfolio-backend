# Autenticação Passwordless - Implementação

## 📋 Resumo

Implementação de autenticação passwordless (sem senha) usando código de verificação de 6 dígitos enviado por email. Esta é uma das três formas de autenticação disponíveis no sistema:

1. **Passwordless com código por email** ✅ (Implementado)
2. **OAuth Google** ✅ (Já existente)
3. **OAuth GitHub** ✅ (Já existente)

## 🏗️ Arquitetura

### Backend (NestJS + AWS Cognito)

A implementação foi feita em três camadas:

#### 1. **AuthRepository** (`src/modules/auth/auth.repository.ts`)
- Método `userExistsByEmail()`: Verifica se um usuário existe no Cognito
- Interação direta com AWS Cognito SDK

#### 2. **AuthService** (`src/modules/auth/auth.service.ts`)
- Método `initiatePasswordlessLogin()`: Gera e armazena código de 6 dígitos
- Método `verifyPasswordlessCode()`: Valida código e autentica usuário
- Cache em memória para códigos (TTL: 10 minutos)
- Limite de 3 tentativas por código
- Sincronização automática com MongoDB

#### 3. **AuthController** (`src/modules/auth/auth.controller.ts`)
- Endpoint `POST /auth/passwordless/init`: Inicia fluxo passwordless
- Endpoint `POST /auth/passwordless/verify`: Verifica código e autentica
- Documentação Swagger completa

## 🔐 Fluxo de Autenticação Passwordless

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Cliente │                │ Backend │                │ Cognito │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ POST /passwordless/init  │                          │
     │ { email }                │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ Verificar se usuário     │
     │                          │ existe                   │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ Gerar código 6 dígitos   │
     │                          │ Armazenar em cache       │
     │                          │ (TTL: 10 min)            │
     │                          │                          │
     │                          │ TODO: Enviar email       │
     │                          │ (por enquanto, log)      │
     │                          │                          │
     │ { success, message }     │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ POST /passwordless/verify│                          │
     │ { email, code }          │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ Validar código           │
     │                          │ - Expiração (10 min)     │
     │                          │ - Tentativas (máx 3)     │
     │                          │ - Código correto         │
     │                          │                          │
     │                          │ Buscar usuário           │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ Sincronizar MongoDB      │
     │                          │                          │
     │ { tokens, user }         │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
```

## 📝 Modelos de Dados

### PasswordlessLoginInitData
```typescript
{
  email: string;
}
```

### PasswordlessLoginInitResponse
```typescript
{
  success: boolean;
  message: string;
  session?: string; // Reservado para uso futuro
}
```

### PasswordlessLoginVerifyData
```typescript
{
  email: string;
  code: string; // 6 dígitos
  session?: string; // Reservado para uso futuro
}
```

### PasswordlessLoginVerifyResponse
```typescript
{
  tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    tokenType: string; // "Bearer"
    expiresIn: number; // 3600 (1 hora)
  };
  user: {
    id: string;
    cognitoSub: string;
    fullName: string;
    email: string;
    avatar?: string;
    bio?: string;
    website?: string;
    socialLinks?: object;
    role: string; // "subscriber", "author", "admin"
    isActive: boolean;
    isBanned: boolean;
    postsCount: number;
    commentsCount: number;
  };
}
```

## 🔒 Segurança

### Proteções Implementadas

1. **Rate Limiting por Tentativas**
   - Máximo de 3 tentativas por código
   - Código invalidado após 3 tentativas incorretas

2. **Expiração de Código**
   - TTL de 10 minutos
   - Limpeza automática de códigos expirados

3. **Não Revelação de Usuários**
   - Retorna sucesso mesmo se email não existir
   - Previne enumeração de usuários

4. **Validação de Entrada**
   - Email deve ser válido
   - Código deve ter exatamente 6 dígitos numéricos

5. **Cache em Memória**
   - Códigos armazenados apenas em memória (não persistidos)
   - Limpeza automática a cada 60 segundos

## ⚠️ Limitações Atuais

### 1. Envio de Email
**Status**: Não implementado (apenas log)

**Solução Temporária**: O código é logado no console do backend
```
⚠️  DESENVOLVIMENTO: Código passwordless para usuario@exemplo.com é 123456
```

**Próximos Passos**:
- Integrar com AWS SES (Simple Email Service)
- Criar template de email profissional
- Configurar domínio verificado no SES

### 2. Tokens JWT
**Status**: Tokens simplificados (Base64)

**Solução Atual**: Tokens são criados como Base64 do payload
```typescript
const accessToken = Buffer.from(JSON.stringify(payload)).toString('base64');
```

**Próximos Passos**:
- Usar `AdminInitiateAuth` do Cognito para obter tokens reais
- Implementar assinatura JWT com chave privada
- Adicionar validação de tokens no middleware

### 3. Escalabilidade
**Status**: Cache em memória (não distribuído)

**Limitação**: Em ambiente com múltiplas instâncias, códigos não são compartilhados

**Próximos Passos**:
- Migrar para Redis ou DynamoDB
- Implementar cache distribuído
- Adicionar suporte para clusters

## 🧪 Como Testar

### 1. Iniciar Login Passwordless

**Request**:
```bash
curl -X POST http://localhost:4000/auth/passwordless/init \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com"}'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Código de verificação enviado para seu email."
  }
}
```

**Console do Backend**:
```
⚠️  DESENVOLVIMENTO: Código passwordless para usuario@exemplo.com é 123456
```

### 2. Verificar Código

**Request**:
```bash
curl -X POST http://localhost:4000/auth/passwordless/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "code": "123456"
  }'
```

**Response (Sucesso)**:
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      "refreshToken": "eyJzdWIiOiIxMjM0NTY3ODkwIiwidGltZXN0YW1wIjoxNzM2NjI4MDAwfQ",
      "idToken": "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      "tokenType": "Bearer",
      "expiresIn": 3600
    },
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "cognitoSub": "abc-123-xyz",
      "fullName": "João Silva",
      "email": "usuario@exemplo.com",
      "role": "subscriber",
      "isActive": true,
      "isBanned": false,
      "postsCount": 0,
      "commentsCount": 0
    }
  }
}
```

**Response (Código Incorreto)**:
```json
{
  "statusCode": 400,
  "message": "Código incorreto. Tentativas restantes: 2",
  "error": "Bad Request"
}
```

**Response (Código Expirado)**:
```json
{
  "statusCode": 400,
  "message": "Código expirado. Solicite um novo código.",
  "error": "Bad Request"
}
```

## 📚 Documentação Swagger

Acesse: `http://localhost:4000/api-docs`

Endpoints disponíveis:
- `POST /auth/passwordless/init` - 🔑 Iniciar Autenticação Passwordless
- `POST /auth/passwordless/verify` - ✅ Verificar Código Passwordless

## 🔄 Próximas Etapas

- [ ] Implementar envio de email com AWS SES
- [ ] Criar template de email profissional
- [ ] Migrar cache para Redis/DynamoDB
- [ ] Implementar tokens JWT reais do Cognito
- [ ] Adicionar rate limiting por IP
- [ ] Implementar frontend para passwordless
- [ ] Adicionar testes unitários e de integração
- [ ] Configurar monitoramento e alertas

## 📖 Referências

- [AWS Cognito Custom Auth Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html#amazon-cognito-user-pools-custom-authentication-flow)
- [AWS SES - Simple Email Service](https://docs.aws.amazon.com/ses/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)

