# 🔄 Guia de Sincronização Cognito ⇄ MongoDB

## 📋 Visão Geral

Este documento descreve a estratégia recomendada de sincronização de `createdAt` e `updatedAt` entre Amazon Cognito e MongoDB, seguindo as melhores práticas da documentação oficial do Cognito.

## ✅ Estratégia Implementada (Boa Prática Recomendada)

### 🔹 createdAt
- **Sincronizado com Cognito na primeira criação**
- Quando um usuário é criado via Cognito, buscamos `UserCreateDate` do Cognito via `AdminGetUserCommand`
- O `createdAt` do MongoDB é populado com o valor do Cognito
- Isso garante consistência entre os dois sistemas
- Se não for possível buscar do Cognito, usa `now()` como fallback

### 🔹 updatedAt
- **Mantido como `null` até primeira atualização real**
- Não é criado automaticamente no Prisma (`@updatedAt` foi removido)
- É definido manualmente apenas quando há uma mudança real no aplicativo
- Isso economiza espaço no banco para registros nunca atualizados

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Amazon Cognito │
│  - UserCreateDate│
│  - Email, Senha  │
└────────┬────────┘
         │
         │ Sync createdAt
         │
┌────────▼────────┐
│     MongoDB     │
│  - createdAt    │ ← Sincronizado do Cognito
│  - updatedAt    │ ← null até primeira atualização
│  - Perfil       │
└─────────────────┘
```

## 📝 Implementação

### 1. Schema Prisma

```prisma
model User {
  cognitoSub String @id @map("_id")
  fullName   String @unique
  createdAt  DateTime @default(now())  // Pode ser sobrescrito pelo Cognito
  updatedAt  DateTime?                  // null até primeira atualização
  // ... outros campos
}
```

### 2. Repository - Criação com Sincronização

```typescript
async create(data: CreateUserData, cognitoCreatedAt?: Date): Promise<User> {
  const userData: Prisma.UserCreateInput = {
    cognitoSub: data.cognitoSub,
    fullName: data.fullName,
    // Sincroniza createdAt com Cognito se disponível (boa prática recomendada)
    ...(cognitoCreatedAt && { createdAt: cognitoCreatedAt }),
    // updatedAt não é definido na criação (será null até primeira atualização)
  };
  
  return await this.prisma.user.create({ data: userData });
}
```

### 3. Repository - Busca Data do Cognito

```typescript
private async getCognitoUserCreatedAt(cognitoSub: string): Promise<Date | null> {
  try {
    const client = new CognitoIdentityProviderClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    
    const command = new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: cognitoSub,
    });
    
    const response = await client.send(command);
    
    // Cognito retorna UserCreateDate em formato Date
    if (response.UserCreateDate) {
      return response.UserCreateDate;
    }
    
    return null;
  } catch (error) {
    this.logger.warn(`Não foi possível obter data de criação do Cognito`);
    return null;
  }
}
```

### 4. Repository - Atualização com updatedAt Manual

```typescript
async update(cognitoSub: string, data: UpdateUserData): Promise<User> {
  const updateData: Prisma.UserUpdateInput = {
    // ... campos atualizados
    // Atualiza updatedAt apenas quando há uma atualização real
    updatedAt: new Date(),
  };

  return await this.prisma.user.update({
    where: { cognitoSub },
    data: updateData,
  });
}
```

## 🔄 Fluxos de Sincronização

### Fluxo de Registro

1. Usuário se registra no Cognito
2. Cognito retorna `UserSub` e `UserCreateDate`
3. Aplicação busca dados completos do Cognito (se necessário)
4. Cria usuário no MongoDB com `createdAt` sincronizado
5. `updatedAt` fica `null` (não foi atualizado ainda)

```typescript
// auth.service.ts - register()
const cognitoResponse = await this.authRepository.register(data);
const cognitoSub = cognitoResponse.UserSub!;

// Buscar data de criação do Cognito
const cognitoUser = await cognitoClient.send(new AdminGetUserCommand({
  UserPoolId: process.env.COGNITO_USER_POOL_ID!,
  Username: cognitoSub,
}));

// Criar no MongoDB com createdAt sincronizado
await this.usersService.createUser({
  cognitoSub: cognitoSub,
  fullName: data.fullName,
}, cognitoUser.UserCreateDate);
```

### Fluxo de Login

1. Usuário faz login no Cognito
2. Cognito retorna JWT token
3. Se usuário não existe no MongoDB:
   - Busca `UserCreateDate` do Cognito
   - Cria usuário com `createdAt` sincronizado
4. `updatedAt` permanece `null` até primeira atualização

### Fluxo de Atualização

1. Usuário atualiza perfil (ex: muda bio)
2. Repository atualiza dados no MongoDB
3. **Apenas agora** `updatedAt` é definido com `new Date()`
4. Registros nunca atualizados continuam com `updatedAt = null`

## 💾 Economia de Espaço

### Antes (updatedAt sempre presente)
```
User 1: createdAt: 2024-01-01, updatedAt: 2024-01-01  (8 bytes desnecessários)
User 2: createdAt: 2024-01-02, updatedAt: 2024-01-02  (8 bytes desnecessários)
User 3: createdAt: 2024-01-03, updatedAt: 2024-01-03  (8 bytes desnecessários)
```

### Depois (updatedAt apenas quando necessário)
```
User 1: createdAt: 2024-01-01, updatedAt: null        (economia: 8 bytes)
User 2: createdAt: 2024-01-02, updatedAt: null        (economia: 8 bytes)
User 3: createdAt: 2024-01-03, updatedAt: 2024-01-10  (atualizado realmente)
```

## 📊 Exemplos Práticos

### Exemplo 1: Usuário nunca atualizado

```javascript
// Criado em 01/01/2024
{
  cognitoSub: "abc123",
  fullName: "João Silva",
  createdAt: "2024-01-01T10:00:00Z",  // Do Cognito
  updatedAt: null                      // Nunca foi atualizado
}
```

### Exemplo 2: Usuário atualizado

```javascript
// Criado em 01/01/2024, atualizado em 15/01/2024
{
  cognitoSub: "abc123",
  fullName: "João Silva Santos",  // Nome atualizado
  createdAt: "2024-01-01T10:00:00Z",  // Do Cognito
  updatedAt: "2024-01-15T14:30:00Z"   // Data da atualização real
}
```

## 🎯 Benefícios

1. ✅ **Consistência com Cognito**: `createdAt` sempre igual ao Cognito
2. ✅ **Economia de espaço**: `updatedAt` só existe quando necessário
3. ✅ **Rastreabilidade**: Sabemos exatamente quando algo mudou
4. ✅ **Boas práticas**: Segue recomendações da documentação oficial

## 🔍 Verificação

Para verificar se está funcionando:

```typescript
// Usuário recém-criado
const newUser = await prisma.user.findUnique({
  where: { cognitoSub: "abc123" }
});
console.log(newUser.createdAt); // Data do Cognito
console.log(newUser.updatedAt); // null

// Após atualização
await usersRepository.update("abc123", { bio: "Nova bio" });
const updatedUser = await prisma.user.findUnique({
  where: { cognitoSub: "abc123" }
});
console.log(updatedUser.updatedAt); // Data da atualização
```

## 📚 Referências

- [AWS Cognito - AdminGetUser API](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminGetUser.html)
- [Prisma - Optional Fields](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#optional)
- [MongoDB - Storage Optimization](https://www.mongodb.com/docs/manual/core/data-modeling-operations/)

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Status:** ✅ Implementado


