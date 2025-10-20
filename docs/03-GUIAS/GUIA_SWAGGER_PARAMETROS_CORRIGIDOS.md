# 🎯 Guia: Parâmetros Swagger Corrigidos

## 📌 Problema Identificado

Anteriormente, a documentação Swagger não exibia os parâmetros do corpo (body) das requisições POST/PUT, mostrando apenas "No parameters".

## ✅ Solução Implementada

Adicionado o decorador `@ApiBody()` em todos os endpoints que recebem dados no corpo da requisição.

## 🔍 Antes vs Depois

### ❌ Antes

```typescript
@Post()
@ApiOperation({ summary: '🔖 Salvar Post' })
async create(@Body() data: CreateBookmarkData) {
  // ...
}
```

**No Swagger UI:**

```
POST /bookmarks
Parameters: No parameters
```

### ✅ Depois

```typescript
@Post()
@ApiOperation({ summary: '🔖 Salvar Post' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
      postId: { type: 'string', example: '507f1f77bcf86cd799439022' },
      collection: { type: 'string', example: 'Favoritos', nullable: true },
      notes: { type: 'string', example: 'Artigo interessante', nullable: true },
    },
    required: ['userId', 'postId'],
  },
})
async create(@Body() data: CreateBookmarkData) {
  // ...
}
```

**No Swagger UI:**

```
POST /bookmarks
Request Body (required):
{
  "userId": "string" (required),
  "postId": "string" (required),
  "collection": "string" (optional),
  "notes": "string" (optional)
}

Example Value:
{
  "userId": "507f1f77bcf86cd799439011",
  "postId": "507f1f77bcf86cd799439022",
  "collection": "Favoritos",
  "notes": "Artigo interessante"
}
```

## 📋 Lista Completa de Endpoints Corrigidos

### 🔐 Autenticação (6 endpoints)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/auth/register` | email, password, username, name |
| POST | `/auth/confirm-email` | email, code |
| POST | `/auth/login` | email, password |
| POST | `/auth/refresh` | refreshToken |
| POST | `/auth/forgot-password` | email |
| POST | `/auth/reset-password` | email, code, newPassword |

### 👤 Usuários (2 endpoints)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/users` | username, email, password, name, bio, avatar, role |
| PUT | `/users/:id` | name, bio, avatar, role |

### 📄 Posts (2 endpoints)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/posts` | title, slug, content, excerpt, subcategoryId, authorId, coverImage, tags, status, featured |
| PUT | `/posts/:id` | title, content, excerpt, coverImage, tags, featured |

### 🏷️ Categorias (2 endpoints)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/categories` | name, slug, description, parentId |
| PUT | `/categories/:id` | name, slug, description |

### 💬 Comentários (2 endpoints)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/comments` | content, postId, authorId, parentId |
| PUT | `/comments/:id` | content |

### ❤️ Likes (1 endpoint)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/likes` | userId, postId |

### 🔖 Bookmarks (2 endpoints)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/bookmarks` | userId, postId, collection, notes |
| PUT | `/bookmarks/:id` | collection, notes |

### 🔔 Notificações (2 endpoints)

| Método | Rota | Parâmetros Documentados |
|--------|------|------------------------|
| POST | `/notifications` | userId, type, title, message, relatedId |
| PUT | `/notifications/:id` | isRead |

## 🎨 Features do @ApiBody

O decorador `@ApiBody` suporta:

### 1. **Tipos de Dados**

```typescript
properties: {
  name: { type: 'string' },      // String
  age: { type: 'number' },       // Number
  active: { type: 'boolean' },   // Boolean
  tags: { 
    type: 'array',               // Array
    items: { type: 'string' }
  }
}
```

### 2. **Valores Obrigatórios**

```typescript
required: ['email', 'password']  // Campos obrigatórios
```

### 3. **Valores Opcionais (Nullable)**

```typescript
bio: { 
  type: 'string', 
  nullable: true                 // Campo opcional
}
```

### 4. **Enums**

```typescript
role: { 
  type: 'string', 
  enum: ['USER', 'ADMIN', 'MODERATOR']  // Valores fixos
}
```

### 5. **Exemplos**

```typescript
email: { 
  type: 'string', 
  example: 'user@example.com'    // Exemplo de valor
}
```

## 🚀 Como Usar

1. **Acesse a documentação:**

   ```
   http://localhost:4000/docs
   ```

2. **Selecione um endpoint POST ou PUT**

3. **Clique em "Try it out"**

4. **Veja todos os parâmetros disponíveis com:**
   - ✅ Descrição de tipo
   - ✅ Exemplo de valor
   - ✅ Indicação de obrigatoriedade
   - ✅ Enums quando aplicável

5. **Preencha os valores e execute!**

## 💡 Dicas

### ✨ Formato Consistente

Todos os endpoints seguem o mesmo padrão de documentação, facilitando o uso da API.

### 🔍 Validação Automática

O Swagger UI valida automaticamente:

- Campos obrigatórios
- Tipos de dados
- Valores de enums

### 📚 Documentação Viva

A documentação é gerada automaticamente a partir do código, sempre atualizada!

### 🎯 Testes Rápidos

Use o botão "Try it out" para testar endpoints diretamente no navegador.

## 📝 Padrão de Código

Para adicionar documentação em novos endpoints:

```typescript

import { ApiBody } from '@nestjs/swagger';

@Post('endpoint')
@ApiOperation({ summary: 'Descrição do endpoint' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      campo1: { 
        type: 'string', 
        example: 'valor exemplo',
        nullable: false  // ou true se for opcional
      },
      campo2: { 
        type: 'number', 
        example: 123 
      },
    },
    required: ['campo1'],  // Lista de campos obrigatórios
  },
})
async nomeDoMetodo(@Body() data: TipoDTO) {
  // implementação
}
```

## ✅ Verificação

Para confirmar que tudo está funcionando:

```bash

# 1. Build do projeto
npm run build

# 2. Verificação de tipos
npx tsc --noEmit

# 3. Iniciar servidor
npm run start:dev

# 4. Acessar docs
# http://localhost:4000/docs
```

---

**✨ Documentação Swagger 100% funcional!**
