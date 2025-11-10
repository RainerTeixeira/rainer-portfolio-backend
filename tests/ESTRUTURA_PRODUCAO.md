# 📚 Estrutura de Testes - Organização para Produção

**Versão:** 1.0.0  
**Data:** 2025-01-27  
**Status:** ✅ Organizado para Produção

---

## 📁 Estrutura Completa

```
tests/
├── 📄 README.md                    # Documentação principal
├── 📄 ESTRUTURA_PRODUCAO.md        # Este arquivo (guia completo)
├── 📄 ANALISE_ESTRUTURA_TESTES.md  # Análise de cobertura
├── ⚙️ setup.ts                     # Configuração global de testes
│
├── 📁 config/                      # Testes de configuração
│   ├── cognito.config.test.ts
│   ├── database.test.ts
│   ├── dynamo-client.test.ts
│   └── env.*.test.ts (3 arquivos)
│
├── 📁 e2e/                         # Testes end-to-end
│   ├── api.e2e.test.ts
│   ├── cloudinary.spec.ts
│   └── mongodb-backend.e2e.test.ts
│
├── 📁 fixtures/                    # Dados de teste reutilizáveis
│   ├── test-register-adriana.json
│   └── test-register-alan.json
│
├── 📁 helpers/                     # Utilitários e mocks
│   ├── database-test-helper.ts
│   ├── mocks.ts
│   └── test-utils.ts
│
├── 📁 integration/                 # Testes de integração
│   ├── auth.integration.test.ts
│   ├── cognito-real.integration-aws.test.ts
│   ├── mongodb-prisma.integration.test.ts
│   ├── posts-categories.integration.test.ts
│   └── users-posts-comments.integration.test.ts
│
├── 📁 lambda/                      # Testes de Lambda handler
│   └── handler.test.ts
│
├── 📁 modules/                     # Testes por módulo (espelha src/modules/)
│   ├── auth/
│   │   ├── auth.controller.test.ts
│   │   ├── auth.repository.test.ts
│   │   └── auth.service.test.ts
│   ├── bookmarks/
│   │   ├── bookmarks.controller.test.ts
│   │   ├── bookmarks.repository.test.ts
│   │   └── bookmarks.service.test.ts
│   ├── categories/
│   │   ├── categories.controller.test.ts
│   │   ├── categories.repository.test.ts
│   │   └── categories.service.test.ts
│   ├── cloudinary/                 # ✅ Novo
│   │   ├── cloudinary.controller.test.ts
│   │   └── cloudinary.service.test.ts
│   ├── comments/
│   │   ├── comments.controller.test.ts
│   │   ├── comments.repository.test.ts
│   │   └── comments.service.test.ts
│   ├── dashboard/                   # ✅ Novo
│   │   ├── dashboard.controller.test.ts
│   │   └── dashboard.service.test.ts
│   ├── health/
│   │   ├── health.controller.test.ts
│   │   ├── health.repository.test.ts
│   │   └── health.service.test.ts
│   ├── likes/
│   │   ├── likes.controller.test.ts
│   │   ├── likes.edge-cases.test.ts
│   │   ├── likes.repository.test.ts
│   │   └── likes.service.test.ts
│   ├── notifications/
│   │   ├── notifications.controller.test.ts
│   │   ├── notifications.repository.test.ts
│   │   └── notifications.service.test.ts
│   ├── posts/
│   │   ├── post.schema.test.ts
│   │   ├── posts.controller.test.ts
│   │   ├── posts.repository.test.ts
│   │   └── posts.service.test.ts
│   └── users/
│       ├── user.schema.test.ts
│       ├── users.controller.test.ts
│       ├── users.repository.test.ts
│       ├── users.service.test.ts
│       └── interceptors/
│           └── fastify-file.interceptor.test.ts
│
├── 📁 prisma/                      # Testes de Prisma/Database
│   ├── dynamodb.seed.test.ts
│   ├── dynamodb.tables.test.ts
│   ├── mongodb.seed.test.ts
│   ├── prisma.module.test.ts
│   └── prisma.service.test.ts
│
├── 📁 scripts/                     # Scripts de execução e teste manual
│   ├── 📄 README.md                # Documentação dos scripts
│   │
│   ├── 🚀 Execução Automatizada
│   ├── run-tests.ps1               # Script simples (PowerShell)
│   ├── test-all-production.ps1      # Script completo (PowerShell)
│   └── test-all-production.sh       # Script completo (Bash)
│   │
│   └── 🧪 Testes Manuais (para desenvolvimento/debug)
│   ├── test-cloudinary-upload.js   # Teste de upload Cloudinary
│   ├── test-create-post.js         # Teste de criação de post
│   ├── test-login-poboge.js        # Teste de login específico
│   ├── test-register-investigate.ts # Investigação de email
│   ├── test-register-poboge.js     # Teste de registro específico
│   ├── test-register-xiked.js      # Teste de registro específico
│   ├── test-resend-code.js         # Teste de reenvio de código
│   ├── test-reset-password.js      # Teste de reset de senha
│   └── test-verify-email-admin.js  # Teste de verificação admin
│
├── 📁 test-reports/                 # Relatórios de testes
│   ├── 📄 README.md                # Documentação dos relatórios
│   ├── all-tests.json              # Resultado completo (JSON)
│   ├── all-tests.log               # Log de execução
│   ├── security-audit.json         # Auditoria de segurança
│   ├── security-audit.log          # Log de segurança
│   └── test-summary.json           # Resumo dos testes
│
└── 📁 utils/                       # Testes de utilitários
    ├── database-provider/
    │   ├── database-provider-context.service.test.ts
    │   ├── database-provider.decorator.test.ts
    │   ├── database-provider.interceptor.test.ts
    │   └── database-provider.module.test.ts
    ├── date-formatter.test.ts
    ├── error-handler.test.ts
    ├── json-compressor.test.ts
    ├── logger.test.ts
    └── pagination.test.ts
```

---

## 🎯 Princípios de Organização

### 1. Espelhamento de Estrutura
- ✅ `tests/modules/` **espelha exatamente** `src/modules/`
- ✅ `tests/config/` **espelha** `src/config/`
- ✅ `tests/prisma/` **espelha** `src/prisma/`
- ✅ `tests/utils/` **espelha** `src/utils/`

### 2. Convenções de Nomenclatura
- **Testes Unitários:** `*.test.ts`
- **Testes E2E:** `*.e2e.test.ts` ou `*.spec.ts`
- **Testes de Integração:** `*.integration.test.ts`
- **Scripts de Teste Manual:** `test-*.js` ou `test-*.ts`

### 3. Cobertura de Testes
- ✅ **100% dos módulos** têm testes
- ✅ **Controllers:** Todos testados
- ✅ **Services:** Todos testados
- ✅ **Repositories:** Todos testados
- ✅ **Schemas:** Alguns testados (opcional)

---

## 🚀 Executando Testes

### Comandos NPM (Recomendado)

```bash
# Todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Testes específicos
npm run test:cognito    # Testes de integração Cognito
npm run test:mongodb    # Testes de integração MongoDB

# Limpar cache
npm run test:clear-cache
```

### Scripts de Execução (Produção)

#### PowerShell (Windows)

```powershell
# Script simples (apenas testes)
.\tests\scripts\run-tests.ps1

# Script completo (com Docker, segurança, etc)
.\tests\scripts\test-all-production.ps1

# Com opções
.\tests\scripts\test-all-production.ps1 -SkipDocker
.\tests\scripts\test-all-production.ps1 -SkipSecurity -SkipPerformance
```

#### Bash (Linux/Mac)

```bash
# Script completo
bash tests/scripts/test-all-production.sh

# Com opções
bash tests/scripts/test-all-production.sh --skip-docker
bash tests/scripts/test-all-production.sh --skip-security --skip-performance
```

---

## 📊 Status dos Testes

### Módulos com Testes Completos ✅

| Módulo | Controller | Service | Repository | Schema | Status |
|--------|-----------|---------|------------|--------|--------|
| Auth | ✅ | ✅ | ✅ | - | ✅ Completo |
| Bookmarks | ✅ | ✅ | ✅ | - | ✅ Completo |
| Categories | ✅ | ✅ | ✅ | - | ✅ Completo |
| **Cloudinary** | ✅ | ✅ | - | - | ✅ Completo |
| Comments | ✅ | ✅ | ✅ | - | ✅ Completo |
| **Dashboard** | ✅ | ✅ | - | - | ✅ Completo |
| Health | ✅ | ✅ | ✅ | - | ✅ Completo |
| Likes | ✅ | ✅ | ✅ | - | ✅ Completo (+ edge cases) |
| Notifications | ✅ | ✅ | ✅ | - | ✅ Completo |
| Posts | ✅ | ✅ | ✅ | ✅ | ✅ Completo (+ schema) |
| Users | ✅ | ✅ | ✅ | ✅ | ✅ Completo (+ schema + interceptor) |

**Total:** 11/11 módulos (100%) ✅

### Estruturas de Suporte

| Categoria | Arquivos | Status |
|-----------|----------|--------|
| Config | 6 | ✅ Completo |
| Prisma | 5 | ✅ Completo |
| Utils | 9 | ✅ Completo |
| Lambda | 1 | ✅ Completo |
| Integration | 5 | ✅ Completo |
| E2E | 3 | ✅ Completo |

---

## 🧪 Tipos de Testes

### 1. Testes Unitários (`*.test.ts`)
**Localização:** `tests/modules/`, `tests/config/`, `tests/utils/`

**Características:**
- Testam componentes isoladamente
- Usam mocks para dependências
- Execução rápida
- Cobertura: 100% dos módulos

**Exemplo:**
```typescript
// tests/modules/auth/auth.service.test.ts
describe('AuthService', () => {
  it('deve fazer login com sucesso', async () => {
    // Teste isolado com mocks
  });
});
```

### 2. Testes de Integração (`*.integration.test.ts`)
**Localização:** `tests/integration/`

**Características:**
- Testam interação entre múltiplos componentes
- Podem usar banco de dados real
- Execução mais lenta
- Testam fluxos completos

**Exemplo:**
```typescript
// tests/integration/auth.integration.test.ts
describe('Auth Integration', () => {
  it('deve registrar usuário e criar perfil', async () => {
    // Teste com banco real
  });
});
```

### 3. Testes E2E (`*.e2e.test.ts` ou `*.spec.ts`)
**Localização:** `tests/e2e/`

**Características:**
- Testam fluxos completos do sistema
- Requerem servidor em execução
- Testam endpoints HTTP completos
- Execução mais lenta

**Exemplo:**
```typescript
// tests/e2e/api.e2e.test.ts
describe('API E2E', () => {
  it('deve criar post via API', async () => {
    // Teste completo via HTTP
  });
});
```

---

## 📝 Scripts de Teste Manual

### Localização
`tests/scripts/test-*.js` ou `tests/scripts/test-*.ts`

### Propósito
Scripts Node.js para testes manuais ou debug durante desenvolvimento.

### Scripts Disponíveis

| Script | Propósito | Quando Usar |
|--------|-----------|-------------|
| `test-cloudinary-upload.js` | Testa upload de imagens | Durante desenvolvimento de upload |
| `test-create-post.js` | Testa criação de posts | Durante desenvolvimento de posts |
| `test-login-poboge.js` | Testa login específico | Debug de autenticação |
| `test-register-*.js` | Testa registro específico | Debug de registro |
| `test-resend-code.js` | Testa reenvio de código | Debug de confirmação |
| `test-reset-password.js` | Testa reset de senha | Debug de recuperação |
| `test-verify-email-admin.js` | Testa verificação admin | Debug de verificação |
| `test-register-investigate.ts` | Investiga problemas de email | Debug de email |

### Uso

```bash
# Executar script manual
node tests/scripts/test-cloudinary-upload.js

# Com argumentos
node tests/scripts/test-create-post.js email@example.com senha123
```

### ⚠️ Nota sobre Redundâncias

Alguns scripts são específicos para debug de problemas específicos:
- `test-login-poboge.js` - Usuário específico
- `test-register-poboge.js` - Usuário específico
- `test-register-xiked.js` - Usuário específico

**Recomendação:** Manter para histórico, mas considerar consolidar em script genérico no futuro.

---

## 🔧 Configuração de Testes

### Jest Configuration (`jest.config.ts`)

```typescript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
}
```

### Setup Global (`tests/setup.ts`)

- Configura variáveis de ambiente
- Mock de console global
- Timezone UTC
- Configurações de teste

### Variáveis de Ambiente

Os scripts configuram automaticamente:
```bash
NODE_ENV=test
DATABASE_URL=mongodb://localhost:27017/blog-test
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...
DATABASE_PROVIDER=PRISMA
```

---

## 📊 Cobertura de Código

### Métricas Atuais

| Métrica | Cobertura | Meta | Status |
|---------|-----------|------|--------|
| **Lines** | 99.57% | 90% | ✅ Excelente |
| **Statements** | 98.86% | 90% | ✅ Excelente |
| **Functions** | 100% | 90% | ✅ Perfeito |
| **Branches** | 90.54% | 90% | ✅ Bom |

### Relatórios

- **HTML:** `tests/coverage/index.html`
- **JSON:** `tests/coverage/coverage-summary.json`
- **LCOV:** `tests/coverage/lcov.info`

---

## 🎓 Guia para Novos Desenvolvedores

### Primeiro Passo: Entender a Estrutura

1. **Leia este arquivo** (`ESTRUTURA_PRODUCAO.md`)
2. **Leia o README principal** (`tests/README.md`)
3. **Explore um módulo de teste** como exemplo:
   - `tests/modules/posts/` é um bom exemplo completo

### Como Adicionar Novos Testes

#### 1. Criar novo módulo com testes

```bash
# Estrutura deve espelhar src/modules/
src/modules/novo-modulo/
  ├── novo-modulo.controller.ts
  ├── novo-modulo.service.ts
  └── novo-modulo.repository.ts

# Criar testes correspondentes
tests/modules/novo-modulo/
  ├── novo-modulo.controller.test.ts
  ├── novo-modulo.service.test.ts
  └── novo-modulo.repository.test.ts
```

#### 2. Seguir padrão existente

Consulte `tests/modules/posts/` como referência:
- Estrutura similar
- Mocks consistentes
- Cobertura completa

#### 3. Executar testes

```bash
# Testar apenas o novo módulo
npm test -- tests/modules/novo-modulo

# Com cobertura
npm test -- tests/modules/novo-modulo --coverage
```

### Checklist para Novos Testes

- [ ] Controller testado (todos os endpoints)
- [ ] Service testado (toda a lógica de negócio)
- [ ] Repository testado (todas as operações de banco)
- [ ] Mocks configurados corretamente
- [ ] Testes de erro incluídos
- [ ] Testes de edge cases incluídos
- [ ] Cobertura acima de 80%

---

## 🔍 Verificando Redundâncias

### Scripts de Execução

| Script | Propósito | Quando Usar | Redundância |
|--------|-----------|-------------|-------------|
| `run-tests.ps1` | Script simples | Testes rápidos | ⚠️ Redundante com `npm test` |
| `test-all-production.ps1` | Script completo | Testes completos | ✅ Útil (Docker, segurança) |
| `test-all-production.sh` | Versão Bash | Mesmo que acima | ✅ Útil (cross-platform) |

**Recomendação:**
- ✅ Manter `test-all-production.*` (úteis para CI/CD)
- ⚠️ `run-tests.ps1` pode ser removido (redundante com `npm test`)

### Scripts de Teste Manual

Todos os scripts `test-*.js` são úteis para desenvolvimento/debug, mas alguns são muito específicos:

**Manter:**
- ✅ `test-cloudinary-upload.js` - Genérico
- ✅ `test-create-post.js` - Genérico
- ✅ `test-register-investigate.ts` - Útil para debug

**Considerar consolidação:**
- ⚠️ `test-login-poboge.js` - Muito específico
- ⚠️ `test-register-poboge.js` - Muito específico
- ⚠️ `test-register-xiked.js` - Muito específico

---

## ✅ Checklist de Produção

### Antes de Deploy

- [ ] Todos os testes passando (`npm test`)
- [ ] Cobertura acima de 90%
- [ ] Testes E2E executados com sucesso
- [ ] Testes de integração executados com sucesso
- [ ] Auditoria de segurança executada (`npm audit`)
- [ ] Documentação atualizada
- [ ] Scripts de teste funcionando

### Verificação Rápida

```bash
# 1. Executar todos os testes
npm test

# 2. Verificar cobertura
npm run test:coverage

# 3. Verificar segurança
npm audit

# 4. Verificar tipos
npm run typecheck

# 5. Verificar lint
npm run lint
```

---

## 📞 Suporte

### Documentação Adicional

- **README Principal:** `tests/README.md`
- **Scripts:** `tests/scripts/README.md`
- **Relatórios:** `tests/test-reports/README.md`
- **Análise:** `tests/ANALISE_ESTRUTURA_TESTES.md`

### Problemas Comuns

1. **Testes falhando:** Verificar mocks e variáveis de ambiente
2. **Cobertura baixa:** Executar `npm run test:coverage` e verificar relatório HTML
3. **Scripts não funcionando:** Verificar se Docker está rodando (para testes de integração)

---

## 🎉 Status Final

**✅ Estrutura 100% Organizada para Produção**

- ✅ Todos os módulos têm testes
- ✅ Estrutura espelha código fonte
- ✅ Documentação completa
- ✅ Scripts funcionais
- ✅ Cobertura excelente (99.57%)

**Pronto para novos desenvolvedores!** 🚀

