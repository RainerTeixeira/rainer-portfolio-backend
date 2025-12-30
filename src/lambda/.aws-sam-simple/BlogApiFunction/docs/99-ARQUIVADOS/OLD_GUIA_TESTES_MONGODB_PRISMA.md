# 🧪 Guia de Testes - MongoDB + Prisma

## 📋 **Visão Geral**

Este guia explica como executar os testes para validar o funcionamento do backend com MongoDB e Prisma.

---

## 🎯 **Tipos de Testes**

### **1. Testes de Integração MongoDB/Prisma**

**Arquivo**: `tests/integration/mongodb-prisma.integration.test.ts`

**O que testa**:

- ✅ Conexão com MongoDB
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Relacionamentos entre entidades
- ✅ Unique constraints
- ✅ Índices e performance
- ✅ Hierarquia de categorias

**Suites de teste**:

1. Conexão MongoDB (ping, serverStatus)
2. CRUD Users (criar, buscar, atualizar, deletar)
3. CRUD Categories (hierarquia pai/filho)
4. CRUD Posts (com autor e categoria)
5. CRUD Comments (incluindo replies aninhados)
6. CRUD Likes (com constraint de duplicação)
7. Performance e Índices
8. Relacionamentos Complexos

### **2. Testes End-to-End (E2E)**

**Arquivo**: `tests/e2e/mongodb-backend.e2e.test.ts`

**O que testa**:

- ✅ Servidor NestJS completo
- ✅ Rotas HTTP (GET, POST, PUT, DELETE)
- ✅ Health check endpoint
- ✅ Swagger documentation
- ✅ Fluxo completo do usuário
- ✅ Integração entre módulos

**Suites de teste**:

1. Health Check (`/health`)
2. Swagger (`/api`, `/api-json`)
3. Users API (`/users`)
4. Categories API (`/categories`)
5. Posts API (`/posts`)
6. Comments API (`/comments`)
7. Likes API (`/likes`)
8. Fluxo Completo (User → Post → Comment → Like)

---

## 🚀 **Pré-requisitos**

### **1. MongoDB Rodando**

```bash
# Docker Compose (recomendado)
docker-compose up -d mongodb

# OU MongoDB local
# Porta: 27017
```

### **2. Prisma Client Gerado**

```bash
npm run prisma:generate
```

### **3. Variáveis de Ambiente**

```bash
# .env.test ou .env
DATABASE_URL="mongodb://localhost:27017/blog-test"
NODE_ENV="test"
```

---

## ⚡ **Execução Rápida**

### **Todos os Testes**

```bash
npm test
```

### **Apenas Testes de Integração MongoDB**

```bash
npm test -- mongodb-prisma.integration
```

### **Apenas Testes E2E**

```bash
npm test -- mongodb-backend.e2e
```

### **Com Cobertura**

```bash
npm run test:coverage
```

### **Watch Mode (desenvolvimento)**

```bash
npm run test:watch
```

---

## 📊 **Execução Detalhada**

### **1. Setup Inicial**

```bash
# 1. Subir MongoDB
docker-compose up -d mongodb

# 2. Verificar se MongoDB está rodando
docker ps | grep mongodb

# 3. Gerar Prisma Client
npm run prisma:generate

# 4. (Opcional) Criar banco de dados de teste
npm run prisma:push

# 5. (Opcional) Seed de dados de teste
npm run mongodb:seed
```

### **2. Executar Testes de Integração**

```bash
# Executar apenas testes de integração MongoDB/Prisma
npx jest tests/integration/mongodb-prisma.integration.test.ts

# Com verbose (detalhado)
npx jest tests/integration/mongodb-prisma.integration.test.ts --verbose

# Com cobertura
npx jest tests/integration/mongodb-prisma.integration.test.ts --coverage
```

**Saída esperada**:

```
PASS  tests/integration/mongodb-prisma.integration.test.ts
  MongoDB/Prisma Integration
    ✅ Conexão MongoDB
      ✓ deve conectar ao MongoDB via Prisma
      ✓ deve retornar informações do banco de dados
    🔧 CRUD - Users
      ✓ deve criar um usuário
      ✓ deve buscar um usuário por email
      ✓ deve atualizar um usuário
      ✓ deve deletar um usuário
    🔧 CRUD - Categories
      ✓ deve criar uma categoria principal
      ✓ deve criar uma subcategoria
      ✓ deve listar subcategorias de uma categoria
    ... (mais testes)

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Time:        5.234s
```

### **3. Executar Testes E2E**

```bash
# Executar testes E2E
npx jest tests/e2e/mongodb-backend.e2e.test.ts

# Com verbose
npx jest tests/e2e/mongodb-backend.e2e.test.ts --verbose
```

**Saída esperada**:

```
PASS  tests/e2e/mongodb-backend.e2e.test.ts
  Backend E2E - MongoDB/Prisma
    🏥 Health Check
      ✓ GET /health - deve retornar status OK
      ✓ GET /health - deve confirmar conexão MongoDB
    📚 Swagger Documentation
      ✓ GET /api - deve retornar página Swagger
      ✓ GET /api-json - deve retornar OpenAPI JSON
    👥 Users CRUD
      ✓ POST /users - deve criar um usuário
      ✓ GET /users - deve listar usuários
      ✓ GET /users/:id - deve buscar usuário específico
    ... (mais testes)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Time:        8.123s
```

---

## 🔍 **Validação Manual**

### **1. Conectar ao MongoDB**

```bash
# Via Docker
docker exec -it rainer-portfolio-backend-mongodb-1 mongosh

# Comandos MongoDB
use blog-test
db.users.find()
db.posts.find()
db.categories.find()
```

### **2. Health Check**

```bash
# Com servidor rodando (npm run dev)
curl http://localhost:4000/health

# Resposta esperada:
{
  "status": "ok",
  "database": {
    "prisma": {
      "status": "connected"
    }
  }
}
```

### **3. Swagger**

```bash
# Acessar no navegador
http://localhost:4000/api

# Testar rotas diretamente no Swagger UI
```

---

## 📈 **Cobertura de Testes**

### **Ver Cobertura**

```bash
npm run test:coverage
```

### **Ver Relatório HTML**

```bash
npm run test:coverage
start coverage/index.html  # Windows
open coverage/index.html   # Mac/Linux
```

### **Metas de Cobertura**

```javascript
// jest.config.ts
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

---

## 🐛 **Troubleshooting**

### **Erro: MongoDB não está rodando**

```bash
# Erro:
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017

# Solução:
docker-compose up -d mongodb
docker ps  # Verificar se está rodando
```

### **Erro: Prisma Client não gerado**

```bash
# Erro:
Cannot find module '@prisma/client'

# Solução:
npm run prisma:generate
```

### **Erro: Database em uso**

```bash
# Erro:
Database is locked / in use

# Solução 1: Parar testes rodando
pkill -f jest

# Solução 2: Limpar banco de teste
docker-compose down mongodb
docker-compose up -d mongodb
npm run prisma:push
```

### **Erro: Timeout nos testes**

```bash
# Erro:
Timeout - Async callback was not invoked within the 5000 ms timeout

# Solução: Aumentar timeout no Jest
// jest.config.ts
testTimeout: 10000,  // 10 segundos
```

### **Erro: Unique constraint failed**

```bash
# Erro:
Unique constraint failed on the fields: (`email`)

# Causa: Dados de teste anterior não foram limpos

# Solução: Garantir beforeEach limpa o banco
beforeEach(async () => {
  await prisma.user.deleteMany({});
  // ... limpar outras tabelas
});
```

---

## 📊 **Estrutura dos Testes**

```
tests/
├── integration/
│   ├── mongodb-prisma.integration.test.ts  ← Testes de integração Prisma
│   ├── auth.integration.test.ts
│   ├── posts-categories.integration.test.ts
│   └── users-posts-comments.integration.test.ts
├── e2e/
│   ├── mongodb-backend.e2e.test.ts  ← Testes E2E completos
│   └── api.e2e.test.ts
├── modules/
│   ├── users/
│   ├── posts/
│   └── ... (testes unitários)
├── setup.ts  ← Setup global
└── helpers/
    ├── mocks.ts
    └── test-utils.ts
```

---

## ✅ **Checklist de Validação**

Após executar os testes, verifique:

- [ ] ✅ MongoDB está rodando (`docker ps`)
- [ ] ✅ Prisma Client está gerado (`node_modules/@prisma/client`)
- [ ] ✅ Testes de integração passam (25 testes)
- [ ] ✅ Testes E2E passam (18 testes)
- [ ] ✅ Cobertura > 80%
- [ ] ✅ Health check funciona (`/health`)
- [ ] ✅ Swagger funciona (`/api`)
- [ ] ✅ CRUD operations funcionam
- [ ] ✅ Relacionamentos funcionam
- [ ] ✅ Constraints são respeitados

---

## 🎯 **Comandos Úteis**

```bash
# Executar testes específicos
npm test -- --testNamePattern="deve criar um usuário"

# Executar apenas um arquivo
npm test -- tests/integration/mongodb-prisma.integration.test.ts

# Modo watch (re-executa ao salvar)
npm run test:watch

# Debug de testes
node --inspect-brk node_modules/.bin/jest --runInBand

# Limpar cache do Jest
npm test -- --clearCache

# Ver todos os testes sem executar
npm test -- --listTests

# Executar testes em paralelo
npm test -- --maxWorkers=4

# Executar apenas testes que falharam
npm test -- --onlyFailures
```

---

## 📚 **Documentação Relacionada**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest API](https://github.com/visionmedia/supertest)

---

## 🎉 **Próximos Passos**

Após validar que todos os testes passam:

1. ✅ **CI/CD**: Integrar testes no pipeline
2. ✅ **Monitoramento**: Adicionar métricas de teste
3. ✅ **Testes de Performance**: Adicionar load testing
4. ✅ **Testes de Segurança**: Validar autenticação/autorização

---

**Status**: ✅ **TESTES PRONTOS PARA EXECUÇÃO!**

Execute: `npm test` para validar tudo! 🚀
