# ✅ Migração Completa: cognitoSub como Chave Primária

## 📋 Resumo

Migração completa do projeto para usar `cognitoSub` como chave primária (`@id`) da tabela `User` no MongoDB/Prisma, atualizando todas as referências em tabelas relacionadas (Post, Comment, Like, Bookmark, Notification).

## 🔄 Mudanças Implementadas

### 1. **Schema Prisma** (`src/prisma/schema.prisma`)
- ✅ `cognitoSub` agora é `@id @map("_id")` (chave primária)
- ✅ Campo `id` autoincremental removido do modelo `User`
- ✅ Relacionamentos atualizados:
  - `Post.authorId` → referencia `User.cognitoSub`
  - `Comment.authorId` → referencia `User.cognitoSub`
  - `Like.userId` → referencia `User.cognitoSub`
  - `Bookmark.userId` → referencia `User.cognitoSub`
  - `Notification.userId` → referencia `User.cognitoSub`

### 2. **Tabelas DynamoDB** (`src/prisma/dynamodb.tables.ts`)
- ✅ `USERS` table: `cognitoSub` como partition key (HASH)
- ✅ Removido índice `CognitoSubIndex` (não é mais necessário, é a chave primária)
- ✅ Atualizado `AttributeDefinitions` para remover `id`

### 3. **Seeds**
- ✅ **MongoDB Seed** (`src/prisma/mongodb.seed.ts`):
  - Usa `upsert` com `where: { cognitoSub }` ao invés de `create`
  - Todos `authorId` e `userId` agora usam `user.cognitoSub`
  - Atualizações usam `where: { cognitoSub }` ao invés de `where: { id }`
  
- ✅ **DynamoDB Seed** (`src/prisma/dynamodb.seed.ts`):
  - Usuários criados com `cognitoSub` como chave primária
  - Todos `authorId` e `userId` agora usam `user.cognitoSub`

### 4. **Backend - Repositórios e Serviços**

#### `UsersRepository` (`src/modules/users/users.repository.ts`)
- ✅ `findById(cognitoSub)` → busca por `cognitoSub`
- ✅ `update(cognitoSub, data)` → atualiza usando `cognitoSub`
- ✅ `delete(cognitoSub)` → deleta usando `cognitoSub`
- ✅ `updateUserRole(cognitoSub, role)` → atualiza usando `cognitoSub`
- ✅ `incrementPostsCount(cognitoSub)` → incrementa usando `cognitoSub`
- ✅ `incrementCommentsCount(cognitoSub)` → incrementa usando `cognitoSub`

#### `UsersService` (`src/modules/users/users.service.ts`)
- ✅ `getUserById(cognitoSub)` → busca por `cognitoSub`
- ✅ `updateUser(cognitoSub, data)` → atualiza usando `cognitoSub`
- ✅ `deleteUser(cognitoSub)` → deleta usando `cognitoSub`

#### `UsersController` (`src/modules/users/users.controller.ts`)
- ✅ Rotas `/:id` agora interpretam `id` como `cognitoSub`
- ✅ Documentação Swagger atualizada

#### `PostsRepository` (`src/modules/posts/posts.repository.ts`)
- ✅ `create` usa `connect: { cognitoSub: data.authorId }` ao invés de `connect: { id: data.authorId }`

### 5. **Frontend**

#### `AuthService` (`lib/api/services/auth.service.ts`)
- ✅ Salva `loginResponse.user.cognitoSub` no localStorage como `userId`

#### `ProfileHeader` (`components/dashboard/profile-header.tsx`)
- ✅ Usa `user?.cognitoSub` ao invés de `user?.id`

#### `AuthProvider` (`components/providers/auth-provider.tsx`)
- ✅ Usa `loginResponse.user.cognitoSub` para `id` do usuário

### 6. **Testes**

#### Testes E2E
- ✅ `mongodb-backend.e2e.test.ts`: Usa `user.cognitoSub` para todas as operações
- ✅ Verificações atualizadas para usar `cognitoSub` ao invés de `id`

#### Testes de Integração
- ✅ `mongodb-prisma.integration.test.ts`: Todos `authorId` e `userId` usam `cognitoSub`
- ✅ `users-posts-comments.integration.test.ts`: Atualizado para usar `cognitoSub`

#### Testes Unitários
- ✅ `auth.service.test.ts`: `LoginResponse` agora verifica `result.user.cognitoSub`
- ✅ `users.service.test.ts`: Usa `cognitoSub` nas chamadas de `update`
- ✅ `posts.*.test.ts`: Todos `authorId` atualizados para usar valores `cognito-*`
- ✅ `comments.*.test.ts`: Todos `authorId` atualizados para usar valores `cognito-*`
- ✅ `mocks.ts`: Mock de usuário atualizado para refletir nova estrutura

## 📝 Exemplos de Uso

### Prisma Client Queries

#### 🔍 Operações Básicas com `cognitoSub`

```typescript
// ✅ Buscar usuário por cognitoSub (chave primária)
const user = await prisma.user.findUnique({
  where: { cognitoSub: 'cognito-sub-uuid' }
});

// ✅ Criar usuário (cognitoSub é obrigatório e único)
const user = await prisma.user.create({
  data: {
    cognitoSub: 'cognito-sub-uuid', // Chave primária (obrigatória)
    fullName: 'João Silva',
    email: 'joao@example.com',
    role: 'AUTHOR'
  }
});

// ✅ Atualizar usuário (usando cognitoSub como where)
const updated = await prisma.user.update({
  where: { cognitoSub: 'cognito-sub-uuid' },
  data: { fullName: 'João Silva Atualizado' }
});

// ✅ Deletar usuário (usando cognitoSub como where)
await prisma.user.delete({
  where: { cognitoSub: 'cognito-sub-uuid' }
});

// ✅ Upsert (criar ou atualizar)
const user = await prisma.user.upsert({
  where: { cognitoSub: 'cognito-sub-uuid' },
  update: { fullName: 'Nome Atualizado' },
  create: {
    cognitoSub: 'cognito-sub-uuid',
    fullName: 'Novo Usuário',
    role: 'SUBSCRIBER'
  }
});
```

#### 📄 Posts com Relacionamento via `cognitoSub`

```typescript
// ✅ Criar post (authorId referencia cognitoSub)
const post = await prisma.post.create({
  data: {
    title: 'Meu Post',
    slug: 'meu-post',
    content: {},
    authorId: 'cognito-sub-uuid', // Referencia cognitoSub do User
    subcategoryId: 'subcategory-id',
    status: 'PUBLISHED'
  }
});

// ✅ Buscar posts de um autor específico
const posts = await prisma.post.findMany({
  where: { authorId: 'cognito-sub-uuid' },
  include: { 
    author: true, // Inclui dados do autor (User)
    subcategory: true 
  },
  orderBy: { createdAt: 'desc' }
});

// ✅ Buscar post com autor relacionado
const post = await prisma.post.findUnique({
  where: { id: 'post-id' },
  include: {
    author: {
      select: {
        cognitoSub: true,
        fullName: true,
        avatar: true,
        role: true
      }
    }
  }
});

// ✅ Contar posts de um autor
const postCount = await prisma.post.count({
  where: { authorId: 'cognito-sub-uuid' }
});

// ✅ Atualizar post (mantendo relacionamento com author)
await prisma.post.update({
  where: { id: 'post-id' },
  data: {
    title: 'Título Atualizado',
    // authorId permanece o mesmo (não precisa alterar)
  }
});
```

#### 💬 Comentários com Relacionamento via `cognitoSub`

```typescript
// ✅ Criar comentário (authorId referencia cognitoSub)
const comment = await prisma.comment.create({
  data: {
    content: 'Ótimo post!',
    postId: 'post-id',
    authorId: 'cognito-sub-uuid', // Referencia cognitoSub
    isApproved: true
  }
});

// ✅ Buscar comentários de um autor
const comments = await prisma.comment.findMany({
  where: { authorId: 'cognito-sub-uuid' },
  include: {
    post: {
      select: { title: true, slug: true }
    },
    author: {
      select: { fullName: true, avatar: true }
    }
  }
});

// ✅ Comentários de um post com autores
const postComments = await prisma.comment.findMany({
  where: { 
    postId: 'post-id',
    isApproved: true 
  },
  include: {
    author: {
      select: {
        cognitoSub: true,
        fullName: true,
        avatar: true
      }
    }
  },
  orderBy: { createdAt: 'asc' }
});
```

#### ❤️ Likes com Relacionamento via `cognitoSub`

```typescript
// ✅ Criar like (userId referencia cognitoSub)
const like = await prisma.like.create({
  data: {
    userId: 'cognito-sub-uuid', // Referencia cognitoSub
    postId: 'post-id'
  }
});

// ✅ Buscar likes de um usuário
const userLikes = await prisma.like.findMany({
  where: { userId: 'cognito-sub-uuid' },
  include: {
    post: {
      select: { title: true, slug: true }
    }
  }
});

// ✅ Verificar se usuário curtiu um post
const hasLiked = await prisma.like.findUnique({
  where: {
    userId_postId: {
      userId: 'cognito-sub-uuid',
      postId: 'post-id'
    }
  }
});

// ✅ Contar likes de um post
const likeCount = await prisma.like.count({
  where: { postId: 'post-id' }
});

// ✅ Remover like (usando userId que é cognitoSub)
await prisma.like.delete({
  where: {
    userId_postId: {
      userId: 'cognito-sub-uuid',
      postId: 'post-id'
    }
  }
});
```

#### 🔖 Bookmarks com Relacionamento via `cognitoSub`

```typescript
// ✅ Criar bookmark (userId referencia cognitoSub)
const bookmark = await prisma.bookmark.create({
  data: {
    userId: 'cognito-sub-uuid', // Referencia cognitoSub
    postId: 'post-id',
    collection: 'Favoritos',
    notes: 'Post interessante sobre React'
  }
});

// ✅ Buscar bookmarks de um usuário
const bookmarks = await prisma.bookmark.findMany({
  where: { userId: 'cognito-sub-uuid' },
  include: {
    post: {
      select: {
        title: true,
        slug: true,
        excerpt: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
});

// ✅ Bookmarks por coleção
const collectionBookmarks = await prisma.bookmark.findMany({
  where: {
    userId: 'cognito-sub-uuid',
    collection: 'Favoritos'
  }
});

// ✅ Atualizar bookmark
await prisma.bookmark.update({
  where: { id: 'bookmark-id' },
  data: {
    collection: 'Lidos',
    notes: 'Atualizado'
  }
});
```

#### 🔔 Notificações com Relacionamento via `cognitoSub`

```typescript
// ✅ Criar notificação (userId referencia cognitoSub)
const notification = await prisma.notification.create({
  data: {
    userId: 'cognito-sub-uuid', // Referencia cognitoSub
    type: 'NEW_COMMENT',
    title: 'Novo comentário',
    message: 'Alguém comentou no seu post',
    link: '/posts/post-id'
  }
});

// ✅ Buscar notificações de um usuário
const notifications = await prisma.notification.findMany({
  where: { userId: 'cognito-sub-uuid' },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// ✅ Notificações não lidas
const unread = await prisma.notification.findMany({
  where: {
    userId: 'cognito-sub-uuid',
    isRead: false
  }
});

// ✅ Marcar como lida
await prisma.notification.update({
  where: { id: 'notification-id' },
  data: { isRead: true }
});

// ✅ Contar não lidas
const unreadCount = await prisma.notification.count({
  where: {
    userId: 'cognito-sub-uuid',
    isRead: false
  }
});
```

#### 🔗 Consultas com Múltiplos Relacionamentos

```typescript
// ✅ Buscar usuário com todos os seus dados relacionados
const userProfile = await prisma.user.findUnique({
  where: { cognitoSub: 'cognito-sub-uuid' },
  include: {
    posts: {
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true
      }
    },
    comments: {
      take: 10,
      orderBy: { createdAt: 'desc' }
    },
    likes: {
      include: {
        post: {
          select: { title: true, slug: true }
        }
      }
    },
    bookmarks: {
      include: {
        post: {
          select: { title: true, slug: true }
        }
      }
    },
    notifications: {
      where: { isRead: false },
      take: 5
    }
  }
});

// ✅ Buscar post completo com autor e interações
const postWithDetails = await prisma.post.findUnique({
  where: { id: 'post-id' },
  include: {
    author: {
      select: {
        cognitoSub: true,
        fullName: true,
        avatar: true,
        role: true
      }
    },
    comments: {
      where: { isApproved: true },
      include: {
        author: {
          select: { fullName: true, avatar: true }
        }
      }
    },
    likes: {
      include: {
        user: {
          select: { fullName: true, avatar: true }
        }
      }
    },
    subcategory: {
      include: {
        category: true
      }
    }
  }
});
```

#### 📊 Agregações e Estatísticas

```typescript
// ✅ Estatísticas de um usuário
const userStats = {
  postsCount: await prisma.post.count({
    where: { authorId: 'cognito-sub-uuid' }
  }),
  commentsCount: await prisma.comment.count({
    where: { authorId: 'cognito-sub-uuid' }
  }),
  likesCount: await prisma.like.count({
    where: { userId: 'cognito-sub-uuid' }
  }),
  bookmarksCount: await prisma.bookmark.count({
    where: { userId: 'cognito-sub-uuid' }
  }),
  unreadNotifications: await prisma.notification.count({
    where: {
      userId: 'cognito-sub-uuid',
      isRead: false
    }
  })
};

// ✅ Posts mais curtidos de um autor
const popularPosts = await prisma.post.findMany({
  where: { authorId: 'cognito-sub-uuid' },
  include: {
    _count: {
      select: { likes: true }
    }
  },
  orderBy: {
    likes: {
      _count: 'desc'
    }
  },
  take: 5
});

// ✅ Usuários mais ativos (por número de posts)
const activeUsers = await prisma.user.findMany({
  include: {
    _count: {
      select: { posts: true, comments: true }
    }
  },
  orderBy: {
    posts: {
      _count: 'desc'
    }
  },
  take: 10
});
```

#### 🔄 Transações com `cognitoSub`

```typescript
// ✅ Criar usuário e post em uma transação
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      cognitoSub: 'cognito-sub-uuid',
      fullName: 'Novo Autor',
      role: 'AUTHOR'
    }
  });

  const post = await tx.post.create({
    data: {
      title: 'Primeiro Post',
      slug: 'primeiro-post',
      content: {},
      authorId: user.cognitoSub, // Usa o cognitoSub criado
      subcategoryId: 'subcategory-id'
    }
  });

  return { user, post };
});

// ✅ Atualizar contadores em transação
await prisma.$transaction(async (tx) => {
  await tx.user.update({
    where: { cognitoSub: 'cognito-sub-uuid' },
    data: {
      postsCount: {
        increment: 1
      }
    }
  });

  await tx.post.create({
    data: {
      title: 'Novo Post',
      slug: 'novo-post',
      content: {},
      authorId: 'cognito-sub-uuid',
      subcategoryId: 'subcategory-id'
    }
  });
});
```

#### 🎯 Filtros e Buscas

```typescript
// ✅ Buscar usuários por nome (usando cognitoSub como retorno)
const users = await prisma.user.findMany({
  where: {
    fullName: {
      contains: 'João',
      mode: 'insensitive'
    }
  },
  select: {
    cognitoSub: true, // cognitoSub sempre disponível
    fullName: true,
    email: true,
    avatar: true
  }
});

// ✅ Posts de múltiplos autores
const posts = await prisma.post.findMany({
  where: {
    authorId: {
      in: [
        'cognito-sub-1',
        'cognito-sub-2',
        'cognito-sub-3'
      ]
    }
  },
  include: {
    author: {
      select: {
        cognitoSub: true,
        fullName: true
      }
    }
  }
});

// ✅ Buscar por relacionamento
const postsLikedByUser = await prisma.post.findMany({
  where: {
    likes: {
      some: {
        userId: 'cognito-sub-uuid'
      }
    }
  },
  include: {
    author: true,
    _count: {
      select: { likes: true, comments: true }
    }
  }
});
```

#### ⚡ Dicas de Performance

```typescript
// ✅ Selecionar apenas campos necessários
const user = await prisma.user.findUnique({
  where: { cognitoSub: 'cognito-sub-uuid' },
  select: {
    cognitoSub: true,
    fullName: true,
    email: true
    // Não seleciona campos desnecessários
  }
});

// ✅ Usar paginação
const posts = await prisma.post.findMany({
  where: { authorId: 'cognito-sub-uuid' },
  skip: 0,
  take: 10,
  orderBy: { createdAt: 'desc' }
});

// ✅ Usar índices implicitamente (cognitoSub é chave primária)
// Busca direta por cognitoSub é sempre rápida
const user = await prisma.user.findUnique({
  where: { cognitoSub: 'cognito-sub-uuid' } // Indexed automatically
});
```

## 🔍 Migração de Dados

Se você já tem dados existentes usando `id` como chave primária, execute:

```bash
npm run migrate:cognito-sub
```

Este script:
1. Verifica se há dados existentes com `id` diferente de `cognitoSub`
2. Migra relacionamentos (`authorId`, `userId`) de `id` para `cognitoSub`
3. Opcionalmente renomeia `_id` do MongoDB para usar `cognitoSub`

## ✅ Validação

Para validar as mudanças:

```bash
# Gerar Prisma Client
npm run prisma:generate

# Aplicar schema ao banco
npm run prisma:push

# Popular com dados de teste
npm run prisma:seed

# Executar testes
npm test

# Testes específicos
npm run test:mongodb
npm run test:unit
```

## 🚨 Pontos de Atenção

1. **API Routes**: Rotas `/users/:id` agora interpretam `:id` como `cognitoSub`
2. **Frontend**: LocalStorage `userId` agora armazena `cognitoSub`
3. **Relacionamentos**: Todos `authorId` e `userId` devem ser valores de `cognitoSub`
4. **Testes**: Mock de usuário atualizado para ter `id === cognitoSub`

## 📚 Arquivos Modificados

### Backend
- `src/prisma/schema.prisma`
- `src/prisma/mongodb.seed.ts`
- `src/prisma/dynamodb.tables.ts`
- `src/prisma/dynamodb.seed.ts`
- `src/modules/users/users.repository.ts`
- `src/modules/users/users.service.ts`
- `src/modules/users/users.controller.ts`
- `src/modules/posts/posts.repository.ts`
- `scripts/migrate-cognito-sub-as-primary-key.ts`

### Frontend
- `lib/api/services/auth.service.ts`
- `components/dashboard/profile-header.tsx`
- `components/providers/auth-provider.tsx`

### Testes
- `tests/e2e/mongodb-backend.e2e.test.ts`
- `tests/integration/mongodb-prisma.integration.test.ts`
- `tests/integration/users-posts-comments.integration.test.ts`
- `tests/modules/auth/auth.service.test.ts`
- `tests/modules/users/users.service.test.ts`
- `tests/modules/posts/*.test.ts`
- `tests/modules/comments/*.test.ts`
- `tests/helpers/mocks.ts`

## 📖 Resumo dos Exemplos

Os exemplos acima cobrem:

1. ✅ **Operações Básicas**: CRUD completo com `cognitoSub` como chave primária
2. ✅ **Relacionamentos**: Posts, Comentários, Likes, Bookmarks, Notificações
3. ✅ **Consultas Complexas**: Múltiplos relacionamentos e agregações
4. ✅ **Transações**: Operações atômicas com `cognitoSub`
5. ✅ **Performance**: Otimizações e boas práticas

## 🎯 Próximos Passos Recomendados

1. ✅ **Executar Migração** (se houver dados existentes):
   ```bash
   npm run migrate:cognito-sub
   ```

2. ✅ **Validar Schema**:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

3. ✅ **Testar Seeds**:
   ```bash
   npm run prisma:seed
   npm run dynamodb:seed
   ```

4. ✅ **Executar Testes**:
   ```bash
   npm test
   ```

5. ✅ **Revisar Código**: Verificar se todas as referências foram atualizadas

---

✅ **Migração concluída com sucesso!**

## 📝 Checklist Final

- [x] Schema Prisma atualizado com `cognitoSub` como `@id`
- [x] Tabelas DynamoDB configuradas com `cognitoSub` como partition key
- [x] Seeds MongoDB e DynamoDB atualizados
- [x] Repositórios e serviços backend atualizados
- [x] Controllers atualizados
- [x] Frontend atualizado para usar `cognitoSub`
- [x] Testes atualizados (E2E, integração, unitários)
- [x] Documentação completa com exemplos
- [x] Script de migração criado
- [x] Exemplos de Prisma Client queries adicionados

🎉 **Todos os passos foram concluídos!**

