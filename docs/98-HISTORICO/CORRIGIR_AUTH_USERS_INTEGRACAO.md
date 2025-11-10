# 🔧 Correção: Integração Auth ↔ Users

## 🎯 Objetivo

Integrar o módulo `auth` com o módulo `users` para que:

1. Registro no Cognito **crie perfil no MongoDB**
2. Login sincronize usuário entre Cognito ↔ MongoDB
3. IDs sejam consistentes em todo o sistema

---

## 📝 Mudanças Necessárias

### 1. Adicionar campos em Auth Model

**Arquivo:** `src/modules/auth/auth.model.ts`

```typescript
export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  username: string;        // ← TORNAR OBRIGATÓRIO
  phoneNumber?: string;
  avatar?: string;          // ← ADICIONAR (opcional)
}
```

### 2. Importar UsersModule em AuthModule

**Arquivo:** `src/modules/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';  // ← ADICIONAR
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';

@Module({
  imports: [UsersModule],  // ← ADICIONAR
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
```

### 3. Injetar UsersService em AuthService

**Arquivo:** `src/modules/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import { UsersService } from '../users/users.service.js';  // ← ADICIONAR
import type {
  LoginData,
  RegisterData,
  //...
} from './auth.model.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersService: UsersService,  // ← ADICIONAR
  ) {}

  // Métodos...
}
```

### 4. Modificar método register() para criar no MongoDB

**Arquivo:** `src/modules/auth/auth.service.ts`

```typescript
async register(data: RegisterData): Promise<RegisterResponse> {
  try {
    // 1. Registra no Cognito
    const cognitoResponse = await this.authRepository.register(data);
    const cognitoSub = cognitoResponse.UserSub!;

    // 2. Cria perfil no MongoDB
    try {
      await this.usersService.createUser({
        cognitoSub: cognitoSub,
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        avatar: data.avatar,
        role: 'AUTHOR',  // Padrão para novos usuários
      });
    } catch (mongoError: any) {
      // Se falhar ao criar no MongoDB, idealmente deveria deletar do Cognito
      // Mas por simplicidade, apenas loga o erro
      console.error('Erro ao criar usuário no MongoDB:', mongoError);
      
      // Verifica se é erro de duplicação
      if (mongoError.code === 'P2002') {
        throw new ConflictException('Email ou username já cadastrado no sistema');
      }
      
      throw new InternalServerErrorException('Erro ao criar perfil do usuário');
    }

    return {
      userId: cognitoSub,
      email: data.email,
      fullName: data.fullName,
      emailVerificationRequired: !cognitoResponse.UserConfirmed,
      message: cognitoResponse.UserConfirmed
        ? 'Usuário criado com sucesso!'
        : 'Usuário criado com sucesso. Verifique seu email para confirmar o cadastro.',
    };
  } catch (error: any) {
    // Tratamento de erros existente...
    if (error.fullName === 'UsernameExistsException') {
      throw new BadRequestException('Email já cadastrado no Cognito');
    }
    if (error.fullName === 'InvalidPasswordException') {
      throw new BadRequestException('Senha não atende aos requisitos de segurança');
    }
    if (error.fullName === 'InvalidParameterException') {
      throw new BadRequestException('Parâmetros inválidos: ' + error.message);
    }
    if (error instanceof BadRequestException || error instanceof ConflictException) {
      throw error;
    }
    throw new InternalServerErrorException('Erro ao registrar usuário');
  }
}
```

### 5. Modificar método login() para sincronizar

**Arquivo:** `src/modules/auth/auth.service.ts`

```typescript
async login(data: LoginData): Promise<LoginResponse> {
  try {
    // 1. Autentica no Cognito
    const response = await this.authRepository.login(data);

    if (!response.AuthenticationResult) {
      throw new UnauthorizedException('Falha na autenticação');
    }

    const { AccessToken, RefreshToken, ExpiresIn, IdToken } = response.AuthenticationResult;
    const payload = this.decodeToken(IdToken!);

    // 2. Busca ou cria usuário no MongoDB
    let user = await this.usersService.getUserByCognitoSub(payload.sub);
    
    if (!user) {
      // Primeira vez que o usuário faz login - cria perfil
      // Isso pode acontecer se o usuário foi criado no Cognito antes da integração
      const username = payload['cognito:username'] || payload.email.split('@')[0];
      
      user = await this.usersService.createUser({
        cognitoSub: payload.sub,
        email: payload.email,
        username: username,
        fullName: payload.fullName || 'Usuário',
      });
    }

    return {
      accessToken: AccessToken!,
      refreshToken: RefreshToken!,
      tokenType: 'Bearer',
      expiresIn: ExpiresIn!,
      userId: user.id,  // ← ID do MongoDB (não do Cognito!)
      email: user.email,
      fullName: user.fullName,
    };
  } catch (error: any) {
    if (error.fullName === 'NotAuthorizedException') {
      throw new UnauthorizedException('Email ou senha incorretos');
    }
    if (error.fullName === 'UserNotConfirmedException') {
      throw new UnauthorizedException('Email não confirmado. Verifique seu email.');
    }
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new InternalServerErrorException('Erro ao realizar login');
  }
}
```

### 6. Adicionar método getUserByCognitoSub em UsersService

**Arquivo:** `src/modules/users/users.service.ts`

```typescript
// Adicionar método
async getUserByCognitoSub(cognitoSub: string) {
  try {
    return await this.usersRepository.findByCognitoSub(cognitoSub);
  } catch (error) {
    return null;  // Retorna null se não encontrar
  }
}
```

### 7. Adicionar método findByCognitoSub em UsersRepository

**Arquivo:** `src/modules/users/users.repository.ts`

```typescript
// Adicionar método
async findByCognitoSub(cognitoSub: string) {
  return await this.prisma.user.findUnique({
    where: { cognitoSub },
  });
}
```

### 8. Exportar UsersService em UsersModule

**Arquivo:** `src/modules/users/users.module.ts`

Verificar se está exportando:

```typescript
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],  // ← Deve ter UsersService
})
export class UsersModule {}
```

---

## 🎯 Resultado Esperado

Após as correções:

### Fluxo de Registro

```
1. POST /auth/register
   ↓
2. Cria usuário no Cognito
   ↓
3. Cria perfil no MongoDB com cognitoSub
   ↓
4. Retorna sucesso
```

### Fluxo de Login

```
1. POST /auth/login
   ↓
2. Autentica no Cognito
   ↓
3. Busca usuário no MongoDB pelo cognitoSub
   ↓
4. Se não existe, cria (migração automática)
   ↓
5. Retorna tokens + dados do MongoDB
```

### Dados Sincronizados

| Cognito | MongoDB |
|---------|---------|
| `sub` (UUID) | `cognitoSub` |
| `email` | `email` |
| `fullName` | `fullName` |
| `cognito:username` | `username` |

---

## ✅ Validação

Após aplicar as correções, testar:

```bash
# 1. Registrar novo usuário
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "SenhaSegura123!",
    "fullName": "Usuário Teste",
    "username": "usuarioteste"
  }'

# 2. Verificar se foi criado no MongoDB
curl -X GET http://localhost:4000/users/username/usuarioteste

# 3. Fazer login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "SenhaSegura123!"
  }'

# 4. Verificar se userId retornado é do MongoDB (ObjectId format)
```

---

## 📊 Impacto das Mudanças

### Arquivos Modificados

- `src/modules/auth/auth.model.ts` - Username obrigatório, avatar opcional
- `src/modules/auth/auth.module.ts` - Import UsersModule
- `src/modules/auth/auth.service.ts` - Inject UsersService + sincronização
- `src/modules/users/users.service.ts` - Método getUserByCognitoSub
- `src/modules/users/users.repository.ts` - Método findByCognitoSub

### Arquivos NÃO Modificados

- Controllers (nenhuma mudança na API)
- Schemas Zod
- Repositories (exceto adicionar método)
- Outros módulos

---

## 🎉 Benefícios

1. ✅ **Consistência de Dados** - Usuários sempre têm perfil completo
2. ✅ **IDs Corretos** - authorId, userId sempre são do MongoDB
3. ✅ **Sincronização Automática** - Login cria perfil se não existir
4. ✅ **Segurança** - Cognito gerencia senha, MongoDB gerencia dados
5. ✅ **Escalabilidade** - Preparado para Lambda Post-Confirmation Trigger

---

**Status:** ⚠️ Aguardando implementação  
**Prioridade:** 🚨 CRÍTICA  
**Tempo Estimado:** 30 minutos
