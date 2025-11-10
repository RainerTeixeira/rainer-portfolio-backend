# Estrutura de Testes

Este diretório contém todos os testes do projeto backend.

## Organização

```
tests/
├── config/              # Testes de configuração
│   ├── cognito.config.test.ts
│   ├── database.test.ts
│   ├── dynamo-client.test.ts
│   └── env.*.test.ts
├── e2e/                 # Testes end-to-end
│   ├── api.e2e.test.ts
│   ├── cloudinary.spec.ts
│   └── mongodb-backend.e2e.test.ts
├── fixtures/            # Dados de teste (JSON, etc)
│   ├── test-register-adriana.json
│   └── test-register-alan.json
├── helpers/             # Utilitários e mocks reutilizáveis
│   ├── mocks.ts
│   └── test-utils.ts
├── integration/         # Testes de integração
│   ├── auth.integration.test.ts
│   ├── cognito-real.integration-aws.test.ts
│   ├── mongodb-prisma.integration.test.ts
│   ├── posts-categories.integration.test.ts
│   └── users-posts-comments.integration.test.ts
├── lambda/              # Testes de Lambda handler
│   └── handler.test.ts
├── modules/             # Testes por módulo
│   ├── auth/
│   ├── bookmarks/
│   ├── categories/
│   ├── cloudinary/      # ✅ Novo
│   ├── comments/
│   ├── dashboard/       # ✅ Novo
│   ├── health/
│   ├── likes/
│   ├── notifications/
│   ├── posts/
│   └── users/
├── prisma/              # Testes de Prisma/Database
│   ├── dynamodb.seed.test.ts
│   ├── dynamodb.tables.test.ts
│   ├── mongodb.seed.test.ts
│   ├── prisma.module.test.ts
│   └── prisma.service.test.ts
├── scripts/             # Scripts de teste e execução
│   ├── run-tests.ps1              # Script PowerShell para executar testes
│   ├── test-all-production.ps1    # Script completo de testes (PowerShell)
│   ├── test-all-production.sh     # Script completo de testes (Bash)
│   ├── test-cloudinary-upload.js   # Scripts de teste manuais
│   ├── test-create-post.js
│   ├── test-login-poboge.js
│   ├── test-register-poboge.js
│   ├── test-register-xiked.js
│   ├── test-resend-code.js
│   ├── test-reset-password.js
│   └── test-verify-email-admin.js
├── utils/               # Testes de utilitários
│   ├── database-provider/
│   ├── date-formatter.test.ts
│   ├── error-handler.test.ts
│   ├── logger.test.ts
│   └── pagination.test.ts
└── setup.ts             # Configuração global de testes
```

## Tipos de Testes

### Testes Unitários
Localizados em `modules/`, `config/`, `utils/` - Testam componentes individuais isoladamente.

### Testes de Integração
Localizados em `integration/` - Testam a interação entre múltiplos componentes.

### Testes E2E
Localizados em `e2e/` - Testam fluxos completos do sistema.

### Scripts de Teste
Localizados em `scripts/` - Scripts para execução de testes e testes manuais:
- **Scripts de Execução**: `run-tests.ps1`, `test-all-production.ps1`, `test-all-production.sh`
- **Scripts de Teste Manual**: Scripts Node.js (`.js`) para testes específicos

### Fixtures
Localizados em `fixtures/` - Dados de teste reutilizáveis (JSON, etc).

## Executando Testes

### Via NPM Scripts

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Com cobertura
npm run test:coverage
```

### Via Scripts de Execução

```powershell
# PowerShell - Executar testes com cobertura
.\tests\scripts\run-tests.ps1

# PowerShell - Executar todos os testes (produção simulado)
.\tests\scripts\test-all-production.ps1

# Bash - Executar todos os testes (produção simulado)
bash tests/scripts/test-all-production.sh
```

## Convenções

- Arquivos de teste terminam com `.test.ts` ou `.spec.ts`
- Scripts de teste terminam com `.js`
- Fixtures são arquivos `.json` ou outros formatos de dados
- Helpers e mocks ficam em `helpers/`

