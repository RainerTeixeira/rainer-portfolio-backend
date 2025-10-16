# 🏗️ Nova Estrutura Modular - Blog API

## ✅ Estrutura Final Proposta (Aprovada)

```
src/
├── app.ts                          ✅ Entry point Fastify
├── env.ts                          ✅ Validação de variáveis de ambiente
│
├── config/                         ✅ Configurações centralizadas
│   ├── database.ts                 ✅ CRIADO - Abstração unificada
│   ├── prisma.ts                   ✅ CRIADO - Cliente Prisma
│   └── dynamo-client.ts            ✅ CRIADO - Cliente DynamoDB
│
├── modules/                        🔄 Módulos de domínio
│   ├── users/                      🔄 EM ANDAMENTO
│   │   ├── user.model.ts           ✅ CRIADO
│   │   ├── user.schema.ts          ✅ CRIADO
│   │   ├── user.repository.ts      ⏳ A CRIAR
│   │   ├── user.service.ts         ⏳ A CRIAR
│   │   └── user.controller.ts      ⏳ A CRIAR
│   │
│   ├── posts/                      ⏳ PENDENTE
│   │   ├── post.model.ts
│   │   ├── post.schema.ts
│   │   ├── post.repository.ts
│   │   ├── post.service.ts
│   │   └── post.controller.ts
│   │
│   ├── categories/                 ⏳ PENDENTE
│   │   ├── category.model.ts
│   │   ├── category.schema.ts
│   │   ├── category.repository.ts
│   │   ├── category.service.ts
│   │   └── category.controller.ts
│   │
│   ├── comments/                   ⏳ PENDENTE
│   │   ├── comment.model.ts
│   │   ├── comment.schema.ts
│   │   ├── comment.repository.ts
│   │   ├── comment.service.ts
│   │   └── comment.controller.ts
│   │
│   ├── likes/                      ⏳ PENDENTE
│   │   ├── like.model.ts
│   │   ├── like.schema.ts
│   │   ├── like.repository.ts
│   │   ├── like.service.ts
│   │   └── like.controller.ts
│   │
│   ├── bookmarks/                  ⏳ PENDENTE
│   │   ├── bookmark.model.ts
│   │   ├── bookmark.schema.ts
│   │   ├── bookmark.repository.ts
│   │   ├── bookmark.service.ts
│   │   └── bookmark.controller.ts
│   │
│   └── notifications/              ⏳ PENDENTE
│       ├── notification.model.ts
│       ├── notification.schema.ts
│       ├── notification.repository.ts
│       ├── notification.service.ts
│       └── notification.controller.ts
│
├── routes/                         ⏳ A REFATORAR
│   ├── index.ts                    # Registro global
│   └── health.ts                   # Health check simples
│
├── utils/                          ⏳ A REFATORAR
│   ├── logger.ts                   # Logger
│   ├── error-handler.ts            # Tratamento de erros
│   └── pagination.ts               # Paginação
│
├── lambda/                         ⏳ A CRIAR
│   ├── handler.ts                  # Adaptador Lambda
│   └── serverless.yml              # Config Serverless Framework
│
├── prisma/
│   └── schema.prisma               ✅ JÁ EXISTE
│
└── tests/                          ⏳ A ADAPTAR
    ├── users.test.ts
    └── posts.test.ts
```

---

## 🎯 Benefícios da Nova Estrutura

### 1. Coesão ✅
- Tudo relacionado a "users" em `modules/users/`
- Fácil de encontrar e modificar

### 2. Escalabilidade ✅
- Adicionar novo módulo = criar nova pasta
- Módulos independentes

### 3. Clareza ✅
- Nome singular (user.service.ts vs users.service.ts)
- Estrutura consistente entre módulos

### 4. Manutenibilidade ✅
- Deletar feature = deletar pasta
- Módulos autocontidos

---

## 📦 Estrutura de Cada Módulo

Cada módulo terá exatamente 5 arquivos:

```
modules/{nome}/
├── {nome}.model.ts          # Interfaces TypeScript
├── {nome}.schema.ts         # Validação Zod
├── {nome}.repository.ts     # CRUD (Prisma ou DynamoDB)
├── {nome}.service.ts        # Regras de negócio
└── {nome}.controller.ts     # Rotas Fastify
```

---

## ✅ Arquivos Criados

- [x] `src/config/database.ts`
- [x] `src/config/prisma.ts`
- [x] `src/config/dynamo-client.ts`
- [x] `src/modules/users/user.model.ts`
- [x] `src/modules/users/user.schema.ts`

**Progresso:** 5/45 arquivos (11%)

---

## ⏳ Próximos Passos

1. Completar módulo `users/`
2. Criar módulos `posts/`, `categories/`, `comments/`, `likes/`, `bookmarks/`, `notifications/`
3. Refatorar `routes/` e `utils/`
4. Criar `lambda/`
5. Marcar arquivos antigos com `old.`

---

**Status:** 🔄 Em Andamento  
**Estimativa:** Grande refatoração (muitos arquivos)

