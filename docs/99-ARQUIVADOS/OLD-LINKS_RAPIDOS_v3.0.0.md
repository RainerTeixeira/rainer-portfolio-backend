# 🔗 Links Rápidos - v3.0.0

**Versão:** 3.0.0  
**Data:** 16/10/2025  
**Feature:** 🗄️ Seleção Dinâmica de Banco de Dados

---

## 📚 Documentação Principal

### README e Guias

- 📖 **[README.md](README.md)** - Documentação principal completa
- 🔥 **[GUIA_SELECAO_BANCO_SWAGGER.md](docs/03-GUIAS/GUIA_SELECAO_BANCO_SWAGGER.md)** - Como usar no Swagger
- 🔥 **[GUIA_DECISAO_DATABASE.md](docs/02-CONFIGURACAO/GUIA_DECISAO_DATABASE.md)** - Qual banco usar?
- 📘 **[GUIA_DYNAMODB_LOCAL.md](docs/03-GUIAS/GUIA_DYNAMODB_LOCAL.md)** - Setup DynamoDB Local

### Atualização v3.0.0

- 📄 **[ATUALIZACAO_v3.0.0.md](docs/ATUALIZACAO_v3.0.0.md)** - Documentação técnica completa
- 📋 **[RESUMO_ATUALIZACAO_v3.0.0.md](docs/RESUMO_ATUALIZACAO_v3.0.0.md)** - Resumo executivo
- ✅ **[RESULTADO_ATUALIZACAO_v3.0.0.md](RESULTADO_ATUALIZACAO_v3.0.0.md)** - Resultado final

---

## 🚀 Quick Start

### Testar no Swagger (2 minutos)

```bash
npm run dev
```

Abra: <http://localhost:4000/docs>

### Cenário 1: MongoDB Local

```bash
iniciar-ambiente-local.bat     # Windows
# ou
docker run -d --name mongodb -p 27017:27017 mongo:7 --replSet rs0
npm run prisma:generate
npm run dev
```

### Cenário 2: DynamoDB Local

```bash
iniciar-ambiente-dynamodb.bat  # Windows
# ou
npm run docker:dynamodb
npm run dynamodb:create-tables
npm run dev
```

### Cenário 3: DynamoDB AWS

```bash
npm run sam:deploy:prod
```

---

## 🔧 Código da Feature

### Arquivos

- `src/utils/database-provider/database-provider-context.service.ts`
- `src/utils/database-provider/database-provider.decorator.ts`
- `src/utils/database-provider/database-provider.interceptor.ts`
- `src/utils/database-provider/database-provider.module.ts`
- `src/utils/database-provider/index.ts`

### Exemplo de Uso

```typescript
// Controller
@DatabaseProviderHeader()
@Get()
async findAll() { ... }

// Service
if (this.databaseContext.isPrisma()) {
  return this.prisma.user.findMany();
} else {
  return this.dynamodb.scan({ TableName: 'users' });
}
```

---

## 📡 URLs da Aplicação

- **API:** <http://localhost:4000>
- **Swagger:** <http://localhost:4000/docs>
- **Health:** <http://localhost:4000/health>
- **Prisma Studio:** <http://localhost:5555> (após `npm run prisma:studio`)

---

## 🗂️ Estrutura de Documentação

```
docs/
├── 00-LEIA_PRIMEIRO.md
├── INDEX.md
├── README.md
│
├── 01-NAVEGACAO/
│   └── _LEIA_ISTO.md
│
├── 02-CONFIGURACAO/
│   ├── COMECE_AQUI.md
│   ├── GUIA_DECISAO_DATABASE.md 🔥
│   └── REFERENCIA_RAPIDA_ENV.md
│
├── 03-GUIAS/
│   ├── GUIA_SELECAO_BANCO_SWAGGER.md 🔥
│   ├── GUIA_DYNAMODB_LOCAL.md
│   └── COMECE_AQUI_NESTJS.md
│
├── 05-INFRAESTRUTURA/
│   └── GUIA_DEPLOY_AWS.md 🔥
│
└── 99-ARQUIVADOS/
    └── OLD-*.md
```

---

## 💻 Scripts NPM Principais

### Desenvolvimento

```bash
npm run dev                    # Servidor com hot reload
npm run prisma:studio          # GUI do Prisma
```

### Database (MongoDB)

```bash
npm run prisma:generate        # Gerar Prisma Client
npm run prisma:push            # Sync schema
npm run seed                   # Popular banco
```

### Database (DynamoDB)

```bash
npm run docker:dynamodb        # Subir DynamoDB Local
npm run dynamodb:create-tables # Criar tabelas
npm run dynamodb:seed          # Popular dados
npm run dynamodb:list-tables   # Listar tabelas
```

### AWS SAM (Deploy)

```bash
npm run sam:validate           # Validar template
npm run sam:build              # Build
npm run sam:local              # Testar local
npm run sam:deploy:dev         # Deploy dev
npm run sam:deploy:prod        # Deploy produção
```

### Testes

```bash
npm test                       # Rodar testes
npm run test:coverage          # Cobertura
```

---

## 📊 Cenários Suportados

| Cenário | Banco | .env | Quando Usar |
|---------|-------|------|-------------|
| **PRISMA** | MongoDB + Prisma | `DATABASE_PROVIDER=PRISMA` | Desenvolvimento rápido |
| **DYNAMODB_LOCAL** | DynamoDB Local | `DATABASE_PROVIDER=DYNAMODB`<br>`DYNAMODB_ENDPOINT=http://localhost:8000` | Testes pré-produção |
| **DYNAMODB_AWS** | DynamoDB AWS | `DATABASE_PROVIDER=DYNAMODB`<br>(sem DYNAMODB_ENDPOINT) | Produção serverless |

---

## 🎯 Ações Rápidas

### Preciso decidir qual banco usar?

👉 Leia: [GUIA_DECISAO_DATABASE.md](docs/02-CONFIGURACAO/GUIA_DECISAO_DATABASE.md)

### Como usar no Swagger?

👉 Leia: [GUIA_SELECAO_BANCO_SWAGGER.md](docs/03-GUIAS/GUIA_SELECAO_BANCO_SWAGGER.md)

### Como configurar DynamoDB Local?

👉 Leia: [GUIA_DYNAMODB_LOCAL.md](docs/03-GUIAS/GUIA_DYNAMODB_LOCAL.md)

### Como fazer deploy na AWS?

👉 Leia: [GUIA_DEPLOY_AWS.md](docs/05-INFRAESTRUTURA/GUIA_DEPLOY_AWS.md)

### O que mudou na v3.0.0?

👉 Leia: [RESUMO_ATUALIZACAO_v3.0.0.md](docs/RESUMO_ATUALIZACAO_v3.0.0.md)

---

## ✅ Status

- **Implementação:** ✅ 100%
- **Documentação:** ✅ 100%
- **Testes:** ✅ Funcional
- **Versão:** **3.0.0**
- **Status:** ✅ **Production Ready** 🚀

---

**Última Atualização:** 16/10/2025  
**Versão:** 3.0.0
