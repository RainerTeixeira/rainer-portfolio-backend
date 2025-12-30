# 🧪 Guia de Testes Avançados

## 📋 Visão Geral

Este guia cobre testes E2E, integração e estratégias para alcançar 100% de coverage após a migração Cognito + MongoDB.

## ✅ Testes Implementados (Básicos)

### Backend

- ✅ `tests/prisma/mongodb.seed.test.ts` - Valida seed sem email
- ✅ `tests/modules/users/users.repository.test.ts` - Valida repository

### Frontend

- ✅ `tests/lib/api/services/user.service.test.ts` - Valida userService
- ✅ `tests/lib/api/services/auth.service.test.ts` - Valida authService

## 🎯 Testes Avançados Pendentes

### 1. Testes E2E (End-to-End)

#### 1.1 Fluxo Completo de Registro

**Arquivo:** `tests/e2e/registration.e2e.test.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Registration E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should register user in Cognito and create profile in MongoDB', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test@123456',
      fullName: 'Test User',
      username: 'testuser',
    };

    // 1. Registrar no Cognito
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(userData.email);
    expect(response.body.data.requiresEmailConfirmation).toBe(true);

    // 2. Verificar que usuário foi criado no MongoDB
    const user = await prisma.user.findFirst({
      where: { username: userData.username },
    });

    expect(user).toBeDefined();
    expect(user?.cognitoSub).toBeDefined();
    expect(user).not.toHaveProperty('email'); // Email NÃO está no MongoDB
    expect(user?.fullName).toBe(userData.fullName);
  });
});
```

#### 1.2 Fluxo Completo de Login

**Arquivo:** `tests/e2e/login.e2e.test.ts`

```typescript

describe('Login E2E', () => {
  it('should login and merge Cognito + MongoDB data', async () => {
    // 1. Login
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test@123456',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.email).toBe('test@example.com'); // Email do Cognito
    expect(response.body.data.fullName).toBeDefined(); // Nome do MongoDB

    // 2. Decodificar token JWT
    const token = response.body.data.accessToken;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    expect(payload.sub).toBeDefined();
    expect(payload.email).toBe('test@example.com');
    expect(payload.email_verified).toBeDefined();
  });
});
```

#### 1.3 Fluxo de Atualização de Perfil

**Arquivo:** `tests/e2e/profile-update.e2e.test.ts`

```typescript
describe('Profile Update E2E', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Test@123456' });

    accessToken = loginResponse.body.data.accessToken;
    userId = loginResponse.body.data.userId;
  });

  it('should update profile without email', async () => {
    const updateData = {
      fullName: 'Updated Name',
      bio: 'New bio',
      website: 'https://example.com',
    };

    const response = await request(app.getHttpServer())
      .put(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.fullName).toBe(updateData.fullName);
    expect(response.body.data.bio).toBe(updateData.bio);
    expect(response.body.data).not.toHaveProperty('email');
  });

  it('should reject email in update request', async () => {
    const response = await request(app.getHttpServer())
      .put(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'newemail@example.com' })
      .expect(400); // Ou 422, dependendo da validação

    expect(response.body.success).toBe(false);
  });
});
```

#### 1.4 Fluxo de Alteração de Email

**Arquivo:** `tests/e2e/email-change.e2e.test.ts`

```typescript
describe('Email Change E2E', () => {
  it('should change email via Cognito only', async () => {
    // 1. Solicitar alteração
    const response = await request(app.getHttpServer())
      .post('/auth/change-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cognitoSub: 'cognito-test-123',
        newEmail: 'newemail@example.com',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('código');

    // 2. Verificar que MongoDB NÃO foi atualizado
    const user = await prisma.user.findFirst({
      where: { cognitoSub: 'cognito-test-123' },
    });

    expect(user).not.toHaveProperty('email');
  });
});
```

### 2. Testes de Integração

#### 2.1 Integração Cognito + MongoDB

**Arquivo:** `tests/integration/cognito-mongodb.integration.test.ts`

```typescript
describe('Cognito + MongoDB Integration', () => {
  it('should sync user from Cognito to MongoDB', async () => {
    const cognitoData = {
      sub: 'cognito-integration-test',
      email: 'integration@example.com',
      email_verified: true,
      fullName: 'Integration Test',
      'cognito:username': 'integrationtest',
    };

    // Simular sincronização
    const user = await usersService.syncUserFromCognito(cognitoData);

    expect(user).toBeDefined();
    expect(user.cognitoSub).toBe(cognitoData.sub);
    expect(user.fullName).toBe(cognitoData.fullName);
    expect(user).not.toHaveProperty('email');
  });

  it('should find user by cognitoSub after sync', async () => {
    const user = await usersRepository.findByCognitoSub('cognito-integration-test');

    expect(user).toBeDefined();
    expect(user?.cognitoSub).toBe('cognito-integration-test');
  });
});
```

#### 2.2 Integração de Endpoints

**Arquivo:** `tests/integration/users-endpoints.integration.test.ts`

```typescript
describe('Users Endpoints Integration', () => {
  it('GET /users/cognito/:cognitoSub should return user', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/cognito/cognito-test-123')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.cognitoSub).toBe('cognito-test-123');
    expect(response.body.data).not.toHaveProperty('email');
  });

  it('PATCH /users/:id should not accept email', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/user-id')
      .send({ email: 'test@example.com', fullName: 'Test' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
```

### 3. Testes de Coverage 100%

#### 3.1 Configuração do Jest

**Arquivo:** `jest.config.ts`

```typescript
export default {
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
  ],
};
```

#### 3.2 Áreas Críticas para Coverage

**UsersService:**

```typescript
describe('UsersService - Full Coverage', () => {
  it('should handle createUser with all fields', async () => {
    // Testar com todos os campos opcionais
  });

  it('should handle createUser with minimal fields', async () => {
    // Testar com campos mínimos
  });

  it('should throw ConflictException on duplicate username', async () => {
    // Testar erro de duplicação
  });

  it('should throw NotFoundException when user not found', async () => {
    // Testar usuário não encontrado
  });

  it('should update Cognito attributes when fullName changes', async () => {
    // Testar sincronização com Cognito
  });

  it('should handle Cognito update failure', async () => {
    // Testar falha na atualização do Cognito
  });
});
```

**UsersRepository:**

```typescript
describe('UsersRepository - Full Coverage', () => {
  it('should create user with all optional fields', async () => {
    // Testar criação completa
  });

  it('should find user by cognitoSub', async () => {
    // Testar busca por cognitoSub
  });

  it('should return null when user not found', async () => {
    // Testar retorno null
  });

  it('should update user with partial data', async () => {
    // Testar atualização parcial
  });

  it('should increment/decrement counters', async () => {
    // Testar contadores
  });
});
```

#### 3.3 Comandos para Coverage

```bash
# Executar testes com coverage
npm run test:cov

# Gerar relatório HTML
npm run test:cov -- --coverageReporters=html

# Ver relatório
open coverage/index.html
```

## 📊 Estratégia de Testes

### Pirâmide de Testes

```
        /\
       /  \      E2E (10%)
      /____\     - Fluxos completos
     /      \    - Integração real
    /________\   
   /          \  Integração (30%)
  /____________\ - Módulos integrados
 /              \
/________________\ Unitários (60%)
                   - Funções isoladas
                   - Mocks completos
```

### Prioridades

1. **Alta Prioridade:**
   - ✅ Seed sem email
   - ✅ Repository findByCognitoSub
   - ✅ Service não atualiza email
   - ⏳ E2E registro + login

2. **Média Prioridade:**
   - ⏳ Integração Cognito + MongoDB
   - ⏳ Endpoints completos
   - ⏳ Fluxo de alteração de email

3. **Baixa Prioridade:**
   - ⏳ Coverage 100%
   - ⏳ Testes de performance
   - ⏳ Testes de carga

## 🚀 Executando Testes

### Comandos Básicos

```bash
# Todos os testes
npm run test

# Apenas unitários
npm run test:unit

# Apenas integração
npm run test:integration

# Apenas E2E
npm run test:e2e

# Com coverage
npm run test:cov

# Watch mode
npm run test:watch

# Específico
npm run test -- users.repository.test.ts
```

### CI/CD Pipeline

```yaml
# .github/workflows/tests.yml
fullName: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - fullName: Install dependencies
        run: npm ci
      
      - fullName: Run unit tests
        run: npm run test:unit
      
      - fullName: Run integration tests
        run: npm run test:integration
      
      - fullName: Run E2E tests
        run: npm run test:e2e
      
      - fullName: Generate coverage
        run: npm run test:cov
      
      - fullName: Upload coverage
        uses: codecov/codecov-action@v3
```

## ✅ Checklist de Testes

### Unitários

- [x] Seed não insere email
- [x] Repository não tem findByEmail
- [x] Repository tem findByCognitoSub
- [ ] Service cria usuário sem email
- [ ] Service atualiza sem email
- [ ] Service sincroniza com Cognito

### Integração

- [ ] Cognito + MongoDB sync
- [ ] Endpoints retornam dados corretos
- [ ] Validações funcionam
- [ ] Erros são tratados

### E2E

- [ ] Registro completo
- [ ] Login completo
- [ ] Atualização de perfil
- [ ] Alteração de email
- [ ] Fluxo de erro

### Coverage

- [ ] UsersService 100%
- [ ] UsersRepository 100%
- [ ] AuthService 100%
- [ ] Controllers 100%

## 📞 Suporte

Para dúvidas sobre testes:

1. Consulte exemplos neste guia
2. Execute testes existentes
3. Verifique coverage atual

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Status:** Em Progresso
