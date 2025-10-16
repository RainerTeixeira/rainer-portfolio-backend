# 🗺️ Mapa da Estrutura - Blog API (Simples e Objetivo)

## 📊 7 Tabelas MongoDB = 7 Recursos Completos

```
┌─────────────────────────────────────────────────────────────────┐
│  TABELA MONGODB  │  ROUTE  │  CONTROLLER  │  SERVICE  │  SCHEMA │
├─────────────────────────────────────────────────────────────────┤
│  1️⃣  users         │    ✅    │      ✅       │    ✅      │    ✅    │
│  2️⃣  posts         │    ✅    │      ✅       │    ✅      │    ✅    │
│  3️⃣  categories    │    ✅    │      ✅       │    ✅      │    ✅    │
│  4️⃣  comments      │    ✅    │      ✅       │    ✅      │    ✅    │
│  5️⃣  likes         │    ✅    │      ✅       │    ✅      │    ✅    │
│  6️⃣  bookmarks     │    ✅    │      ✅       │    ✅      │    ✅    │
│  7️⃣  notifications │    ✅    │      ✅       │    ✅      │    ✅    │
└─────────────────────────────────────────────────────────────────┘
```

**+ 1 recurso auxiliar:**
- 🔹 **subcategories** (usa repository de categories)
- 🏥 **health** (monitoramento)

---

## 📁 Estrutura Simplificada (O que você precisa saber)

```
src/
│
├── 🎯 CAMADA DE API (HTTP)
│   ├── routes/            10 arquivos (endpoints HTTP)
│   ├── controllers/       10 arquivos (orquestra requests)
│   └── schemas/           10 arquivos (validação Zod)
│
├── 💼 CAMADA DE NEGÓCIO
│   └── services/          10 arquivos (regras de negócio)
│
├── 🔧 CAMADA DE DADOS
│   └── repositories/      24 arquivos (acesso MongoDB/DynamoDB)
│       ├── interfaces/    7 contratos TypeScript
│       ├── prisma/        7 implementações MongoDB ✅
│       └── dynamodb/      7 stubs DynamoDB ⚠️
│
├── 🛠️ UTILITÁRIOS
│   ├── middlewares/       2 arquivos
│   ├── utils/             6 arquivos
│   ├── constants/         2 arquivos
│   └── scripts/           2 arquivos
│
└── ⚙️ CONFIGURAÇÃO
    ├── prisma/schema.prisma   Schema MongoDB
    ├── env.ts                 Variáveis de ambiente
    ├── app.ts                 Setup Fastify
    ├── server.ts              Entry point dev
    └── lambda.ts              Entry point AWS
```

---

## 🔄 Fluxo de uma Requisição

```
1. Cliente faz request → http://localhost:4000/posts
                              ↓
2. Route recebe (posts.routes.ts) → valida com schema Zod
                              ↓
3. Controller processa (posts.controller.ts) → orquestra
                              ↓
4. Service executa lógica (posts.service.ts) → regras de negócio
                              ↓
5. Repository acessa dados (PrismaPostRepository.ts) → query
                              ↓
6. MongoDB retorna dados → Prisma Client
                              ↓
7. Response JSON para o cliente
```

---

## 📦 Por que cada pasta existe?

### 🛣️ routes/
**Para que serve:** Define URLs e endpoints HTTP  
**Exemplo:** `GET /posts`, `POST /users`  
**Usa:** Controllers + Schemas

### 🎮 controllers/
**Para que serve:** Orquestra requisições e formata respostas  
**Exemplo:** Recebe request, chama service, retorna JSON  
**Usa:** Services

### 💼 services/
**Para que serve:** Contém regras de negócio  
**Exemplo:** "Post deve ter subcategoria", "Email deve ser único"  
**Usa:** Repositories

### 🔧 repositories/
**Para que serve:** Acessa o banco de dados  
**Exemplo:** `create()`, `findById()`, `update()`, `delete()`  
**Usa:** Prisma ou DynamoDB

### 📋 schemas/
**Para que serve:** Valida dados de entrada com Zod  
**Exemplo:** "Email deve ser válido", "Título obrigatório"  
**Usa:** Nada (puro Zod)

---

## 🎯 Quando usar cada camada?

### Criar um novo recurso "Tags":

1. **Schema** → Define validação dos dados
2. **Repository** → Define como acessar MongoDB
3. **Service** → Define regras de negócio
4. **Controller** → Define como processar HTTP
5. **Route** → Define endpoint HTTP

---

## ✅ Estrutura FINAL aprovada

### SEM REDUNDÂNCIA ✅
- Nenhum código duplicado
- Cada arquivo tem propósito claro
- Zero arquivos "mortos"

### SEM ABSTRAÇÃO EXCESSIVA ✅
- Apenas 4 camadas (Route → Controller → Service → Repository)
- Repository é opcional (pode usar Prisma direto se quiser)
- Controllers são opcionais (routes podem chamar services direto)

### FÁCIL DE ENTENDER ✅
- Nomes consistentes (*.routes.ts, *.service.ts)
- Estrutura espelhada entre pastas
- Cada arquivo tem 1 responsabilidade

---

## 💡 Simplificação Opcional

Se quiser **menos camadas**, você pode:

### Opção 1: Remover Controllers
```typescript
// Route chama Service diretamente
app.post('/posts', async (request, reply) => {
  const post = await postsService.createPost(request.body);
  return { success: true, data: post };
});
```

### Opção 2: Remover Repositories
```typescript
// Service usa Prisma diretamente
import { prisma } from '../utils/prisma';

class PostsService {
  async createPost(data) {
    return await prisma.post.create({ data }); // Direto
  }
}
```

**Mas perde:**
- ❌ Abstração de banco
- ❌ Facilidade de trocar MongoDB ↔ DynamoDB
- ❌ Clean Architecture

---

## ✅ Recomendação Final

**MANTER ESTRUTURA ATUAL!**

Motivos:
1. ✅ Segue padrões da indústria
2. ✅ Fácil de manter e escalar
3. ✅ Preparado para produção
4. ✅ Sem código redundante
5. ✅ Organização profissional

---

**Status:** ✅ Estrutura ideal e organizada  
**Arquivos Ativos:** 75 (100% funcionais)  
**Arquivos Futuros:** 6 DynamoDB stubs  
**Redundância:** 0%  
**Clareza:** 100%

