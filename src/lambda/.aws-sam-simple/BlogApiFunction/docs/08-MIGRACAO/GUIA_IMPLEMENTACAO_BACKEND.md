# 🔧 Guia de Implementação Backend

## 🎯 Visão Geral

Guia completo de implementação da arquitetura Cognito + MongoDB no backend.

---

## ✅ Implementações Realizadas

### 1. Schema Prisma

**Arquivo:** `src/prisma/schema.prisma`

```prisma
model User {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  cognitoSub  String   @unique
  username    String   @unique
  fullName        String
  bio         String?
  avatar      String?
  website     String?
  socialLinks Json?
  role        Role     @default(READER)
  isActive    Boolean  @default(true)
  isBanned    Boolean  @default(false)
  postsCount  Int      @default(0)
  commentsCount Int    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // ❌ NÃO TEM campo email
}
```

**Validação:**
```bash
# Verificar que não há campo email
grep -n "email" src/prisma/schema.prisma
# Não deve retornar nada no model User
```

### 2. Seed

**Arquivo:** `src/prisma/mongodb.seed.ts`

```typescript
const users = [
  {
    cognitoSub: `cognito-${nanoid()}`,  // Prefixo cognito-
    username: 'admin',
    fullName: 'Administrador',
    bio: 'Administrador do sistema',
    role: 'ADMIN',
    // ❌ SEM campo email
  },
  // ... outros usuários
];

console.log('✅ Usuários criados (email gerenciado pelo Cognito)');
```

**Executar:**
```bash
npx tsx src/prisma/mongodb.seed.ts
```

**Validar:**
```bash
# Verificar que não há emails no MongoDB
mongosh mongodb://localhost:27017/blog --eval "db.users.find({email: {\$exists: true}}).count()"
# Deve retornar: 0
```

### 3. Repository

**Arquivo:** `src/modules/users/users.repository.ts`

```typescript
export class UsersRepository {
  // ✅ Busca por cognitoSub
  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { cognitoSub }
    });
  }

  // ❌ NÃO TEM findByEmail()
  
  // ✅ Update sem email
  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        username: data.username,
        bio: data.bio,
        avatar: data.avatar,
        website: data.website,
        socialLinks: data.socialLinks,
        // ❌ email não é aceito
      }
    });
  }
}
```

### 4. Controller

**Arquivo:** `src/modules/users/users.controller.ts`

```typescript
@Controller('users')
export class UsersController {
  // ✅ Endpoint para buscar por cognitoSub
  @Get('cognito/:cognitoSub')
  @ApiOperation({ 
    summary: 'Buscar usuário por Cognito Sub',
    description: 'Busca usuário usando o identificador único do Cognito'
  })
  async getUserByCognitoSub(
    @Param('cognitoSub') cognitoSub: string
  ): Promise<User> {
    return this.usersService.getUserByCognitoSub(cognitoSub);
  }

  // ✅ Update sem email
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar perfil do usuário',
    description: 'Atualiza dados complementares. Email deve ser alterado via /auth/change-email'
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }
}
```

**Swagger:**
```typescript
@ApiBody({
  schema: {
    example: {
      fullName: 'João Silva',
      bio: 'Desenvolvedor Full Stack',
      website: 'https://joao.dev'
      // ❌ email não está aqui
    }
  }
})
```

### 5. Service

**Arquivo:** `src/modules/users/users.service.ts`

```typescript
export class UsersService {
  async getUserByCognitoSub(cognitoSub: string): Promise<User> {
    const user = await this.usersRepository.findByCognitoSub(cognitoSub);
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    // Valida que email não está sendo enviado
    if ('email' in data) {
      throw new BadRequestException(
        'Email não pode ser atualizado aqui. Use /auth/change-email'
      );
    }
    
    return this.usersRepository.update(id, data);
  }
}
```

### 6. Auth Service

**Arquivo:** `src/modules/auth/auth.service.ts`

```typescript
export class AuthService {
  async register(data: RegisterDto): Promise<RegisterResponse> {
    // 1. Criar usuário no Cognito
    const cognitoUser = await this.cognito.signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName
    });
    
    // 2. Criar perfil no MongoDB (SEM email)
    const user = await this.usersService.create({
      cognitoSub: cognitoUser.sub,
      username: data.username,
      fullName: data.fullName,
      // ❌ email não é salvo
    });
    
    return {
      userId: user.id,
      email: data.email,  // ← do Cognito
      requiresEmailConfirmation: true
    };
  }

  async login(data: LoginDto): Promise<LoginResponse> {
    // 1. Autenticar no Cognito
    const tokens = await this.cognito.initiateAuth({
      email: data.email,
      password: data.password
    });
    
    // 2. Buscar perfil no MongoDB
    const decoded = jwt.decode(tokens.idToken);
    const user = await this.usersService.getUserByCognitoSub(decoded.sub);
    
    return {
      tokens,
      user: {
        ...user,
        email: decoded.email,  // ← do token Cognito
        emailVerified: decoded.email_verified
      }
    };
  }

  async changeEmail(cognitoSub: string, newEmail: string): Promise<void> {
    // Atualiza APENAS no Cognito
    await this.cognito.adminUpdateUserAttributes(cognitoSub, {
      email: newEmail,
      email_verified: 'false'
    });
    
    // MongoDB NÃO é atualizado
  }
}
```

---

## 🧪 Testes

### 1. Teste do Seed

**Arquivo:** `tests/prisma/mongodb.seed.test.ts`

```typescript
describe('MongoDB Seed', () => {
  it('should not have email field in User model', () => {
    const userFields = Object.keys(prisma.user.fields);
    expect(userFields).not.toContain('email');
  });

  it('should have cognitoSub field', () => {
    const userFields = Object.keys(prisma.user.fields);
    expect(userFields).toContain('cognitoSub');
  });

  it('should create user without email', async () => {
    const user = await prisma.user.create({
      data: {
        cognitoSub: 'cognito-test-123',
        username: 'testuser',
        fullName: 'Test User'
      }
    });
    
    expect(user).not.toHaveProperty('email');
    expect(user.cognitoSub).toBe('cognito-test-123');
  });
});
```

### 2. Teste do Repository

**Arquivo:** `tests/modules/users/users.repository.test.ts`

```typescript
describe('UsersRepository', () => {
  it('should not have findByEmail method', () => {
    const repository = new UsersRepository(prisma);
    expect(repository.findByEmail).toBeUndefined();
  });

  it('should have findByCognitoSub method', () => {
    const repository = new UsersRepository(prisma);
    expect(repository.findByCognitoSub).toBeDefined();
  });

  it('should find user by cognitoSub', async () => {
    const user = await repository.findByCognitoSub('cognito-abc123');
    expect(user).toBeDefined();
    expect(user.cognitoSub).toBe('cognito-abc123');
  });
});
```

**Executar:**
```bash
npm run test
```

---

## 📋 Checklist de Validação

### Schema
- [x] Model User não tem campo email
- [x] Model User tem campo cognitoSub @unique
- [x] Prisma Client gerado sem erros

### Seed
- [x] Não insere campo email
- [x] Gera cognitoSub com prefixo cognito-
- [x] Executa sem erros

### Repository
- [x] Não tem método findByEmail()
- [x] Tem método findByCognitoSub()
- [x] Update não aceita email

### Controller
- [x] Endpoint GET /users/cognito/:cognitoSub existe
- [x] Endpoint PATCH /users/:id não aceita email
- [x] Swagger documentado

### Service
- [x] getUserByCognitoSub() implementado
- [x] update() rejeita email
- [x] Email vem do Cognito

### Testes
- [x] Testes do seed passam
- [x] Testes do repository passam
- [x] 0 erros

---

## 🚀 Comandos Úteis

### Desenvolvimento
```bash
# Gerar Prisma Client
npx prisma generate

# Executar seed
npx tsx src/prisma/mongodb.seed.ts

# Iniciar servidor
npm run start:dev

# Executar testes
npm run test
```

### Validação
```bash
# Verificar MongoDB (não deve ter emails)
mongosh mongodb://localhost:27017/blog --eval "db.users.find({email: {\$exists: true}}).count()"

# Verificar cognitoSub (todos devem ter)
mongosh mongodb://localhost:27017/blog --eval "db.users.find({cognitoSub: {\$exists: false}}).count()"

# Listar usuários
mongosh mongodb://localhost:27017/blog --eval "db.users.find({}, {username: 1, cognitoSub: 1}).pretty()"
```

---

## 🔗 Links Relacionados

- [ARQUITETURA_COGNITO_MONGODB.md](ARQUITETURA_COGNITO_MONGODB.md) - Arquitetura completa
- [GUIA_PRODUCAO.md](GUIA_PRODUCAO.md) - Deploy em produção
- [03-GUIAS/GUIA_INTEGRACAO_AUTH.md](../03-GUIAS/GUIA_INTEGRACAO_AUTH.md) - Integração Cognito

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Implementado
