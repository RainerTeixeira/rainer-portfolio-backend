# 🔄 Plano de Refatoração - Estrutura Modular

## 🎯 Objetivo

Refatorar de estrutura **tradicional** (routes/, controllers/, services/ separados) para estrutura **modular** (modules/users/, modules/posts/, etc.).

---

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Estrutura Tradicional)

```
src/
├── routes/
│   ├── users.routes.ts
│   ├── posts.routes.ts
│   └── ...
├── controllers/
│   ├── users.controller.ts
│   ├── posts.controller.ts
│   └── ...
├── services/
│   ├── users.service.ts
│   ├── posts.service.ts
│   └── ...
├── schemas/
│   ├── users.schema.ts
│   ├── posts.schema.ts
│   └── ...
└── repositories/
    └── ...
```

**Problema:** Arquivos relacionados espalhados em 5 pastas diferentes

---

### ✅ DEPOIS (Estrutura Modular)

```
src/
├── modules/
│   ├── users/
│   │   ├── user.model.ts       # Definição do modelo
│   │   ├── user.schema.ts      # Validação Zod
│   │   ├── user.repository.ts  # Acesso a dados
│   │   ├── user.service.ts     # Regras de negócio
│   │   └── user.controller.ts  # Rotas + Controllers
│   │
│   ├── posts/
│   │   ├── post.model.ts
│   │   ├── post.schema.ts
│   │   ├── post.repository.ts
│   │   ├── post.service.ts
│   │   └── post.controller.ts
│   │
│   └── ... (7 módulos totais)
│
├── config/
│   ├── database.ts             # Abstração de DB
│   ├── prisma.ts               # Cliente Prisma
│   └── dynamo-client.ts        # Cliente DynamoDB
│
├── routes/
│   └── index.ts                # Registro de rotas
│
└── utils/
    ├── logger.ts
    ├── error-handler.ts
    └── pagination.ts
```

**Benefício:** Tudo relacionado a "users" em uma pasta!

---

## 📋 Módulos a Criar (7 totais)

| # | Módulo | Arquivos | Status |
|---|---|---|---|
| 1️⃣ | users | 5 | 🔄 Em progresso |
| 2️⃣ | posts | 5 | ⏳ Pendente |
| 3️⃣ | categories | 5 | ⏳ Pendente |
| 4️⃣ | comments | 5 | ⏳ Pendente |
| 5️⃣ | likes | 5 | ⏳ Pendente |
| 6️⃣ | bookmarks | 5 | ⏳ Pendente |
| 7️⃣ | notifications | 5 | ⏳ Pendente |
| 🏥 | health | 3 | ⏳ Pendente |

**Total:** ~38 arquivos a criar/mover

---

## 🔧 Estrutura de Cada Módulo

### Exemplo: `modules/users/`

```typescript
// user.model.ts - Definição do modelo
export interface User {
  id: string;
  email: string;
  // ... todos os campos
}

// user.schema.ts - Validação Zod
export const createUserSchema = z.object({ ... });
export const updateUserSchema = z.object({ ... });

// user.repository.ts - Acesso a dados
export class UserRepository {
  async create(data) {
    if (provider === 'PRISMA') {
      return prisma.user.create({ data });
    } else {
      return dynamodb.send(new PutCommand({ ... }));
    }
  }
}

// user.service.ts - Regras de negócio
export class UserService {
  async createUser(data) {
    // Validações de negócio
    const user = await userRepository.create(data);
    return user;
  }
}

// user.controller.ts - Rotas Fastify
export async function userRoutes(app: FastifyInstance) {
  app.post('/users', async (request, reply) => {
    const user = await userService.createUser(request.body);
    return { success: true, data: user };
  });
}
```

---

## ✅ Arquivos Já Criados

- [x] `src/config/database.ts`
- [x] `src/config/prisma.ts`
- [x] `src/config/dynamo-client.ts`
- [x] `src/modules/users/user.model.ts`
- [x] `src/modules/users/user.schema.ts` (copiado)

---

## ⏳ Próximos Passos

### 1. Completar Módulo Users

- [ ] user.repository.ts
- [ ] user.service.ts
- [ ] user.controller.ts

### 2. Criar Outros 6 Módulos

- [ ] modules/posts/
- [ ] modules/categories/
- [ ] modules/comments/
- [ ] modules/likes/
- [ ] modules/bookmarks/
- [ ] modules/notifications/

### 3. Criar Utilitários Simplificados

- [ ] utils/logger.ts
- [ ] utils/error-handler.ts
- [ ] utils/pagination.ts

### 4. Criar Routes Centralizado

- [ ] routes/index.ts

### 5. Criar Lambda Handler

- [ ] lambda/handler.ts
- [ ] lambda/serverless.yml

### 6. Marcar Arquivos Antigos

- [ ] Renomear routes/, controllers/, services/, schemas/ antigos com "old."

---

## 📊 Estimativa

- **Arquivos a criar:** ~45
- **Arquivos a adaptar:** ~15
- **Arquivos a marcar old:** ~50
- **Tempo estimado:** Grandes (muitos arquivos)

---

**Status Atual:** 🔄 Refatoração Iniciada  
**Próximo:** Completar módulo users
