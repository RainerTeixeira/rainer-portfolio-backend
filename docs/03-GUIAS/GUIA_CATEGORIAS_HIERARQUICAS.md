# 🌳 Guia: Categorias Hierárquicas (2 Níveis)

**Objetivo:** Entender a hierarquia de categorias e por que posts usam subcategorias.

**Tempo estimado:** 15 minutos  
**Nível:** Iniciante/Intermediário  
**Pré-requisitos:** Conhecimento básico do schema Prisma

---

## 📚 O Que Você Vai Aprender

Neste guia, você aprenderá:

- ✅ O que são categorias hierárquicas
- ✅ Por que posts usam `subcategoryId` (não `categoryId`)
- ✅ Como criar categorias e subcategorias
- ✅ Como criar posts corretamente
- ✅ Vantagens da estrutura hierárquica

---

## 🎯 Conceito: Hierarquia de 2 Níveis

### ❌ Estrutura Simples (Limitada)

```
Post → Category (1 nível)

Exemplo:
- Post "Como fazer café" → Category "Culinária"
- Post "Receita de bolo" → Category "Culinária"
```

**Problema:** Não permite organização detalhada!

---

### ✅ Estrutura Hierárquica (Implementada)

```
Post → Subcategory → Category Principal (2 níveis)

Exemplo:
Category "Tecnologia" (principal)
├── Subcategory "Frontend"
│   ├── Post "React vs Vue"
│   └── Post "CSS Grid"
├── Subcategory "Backend"
│   ├── Post "Node.js"
│   └── Post "Python"
└── Subcategory "DevOps"
    └── Post "Docker"
```

**Vantagens:**

- ✅ Organização muito melhor
- ✅ URLs mais descritivas
- ✅ SEO aprimorado
- ✅ Navegação mais intuitiva

---

## 🔍 Por Que `subcategoryId` é Crítico?

### ⚠️ O Ponto Crítico

Se você usar `categoryId` em vez de `subcategoryId`, a aplicação **quebra**!

#### ❌ ERRADO (Não funciona)

```typescript
export interface Post {
  categoryId: string;  // ← Campo NÃO existe no schema!
}
```

**Resultado:**

```bash
❌ Erro ao rodar aplicação:
PrismaClientValidationError: Invalid field categoryId
```

#### ✅ CORRETO (Compatível com schema)

```typescript
export interface Post {
  subcategoryId: string;  // ← Campo correto do schema!
}
```

---

## 📖 Schema Prisma Explicado

### Model Post

```prisma
model Post {
  id            String   @id
  title         String
  subcategoryId String   @db.ObjectId  ← NOME DO CAMPO NO BANCO
  
  // Relação com subcategoria
  subcategory   Category @relation(
    name: "SubcategoryPosts", 
    fields: [subcategoryId],    ← Usa subcategoryId
    references: [id]
  )
}
```

### Model Category

```prisma
model Category {
  id       String     @id
  name     String
  parentId String?    @db.ObjectId  ← null = principal, não-null = subcategoria
  
  // Posts que pertencem a esta categoria (quando é subcategoria)
  posts    Post[]     @relation(name: "SubcategoryPosts")
  
  // Relação hierárquica
  parent   Category?  @relation(name: "CategoryHierarchy", ...)
  children Category[] @relation(name: "CategoryHierarchy")
}
```

**Ponto chave:** `parentId` determina se é categoria principal ou subcategoria.

---

## 🚀 Tutorial Passo a Passo

### Passo 1: Criar Categoria Principal

```typescript
// POST /categories
const tecnologia = await prisma.category.create({
  data: {
    name: "Tecnologia",
    slug: "tecnologia",
    color: "#3498DB",
    icon: "code",
    parentId: null,  // ← null = categoria PRINCIPAL
  }
});
```

### Passo 2: Criar Subcategoria

```typescript
// POST /categories
const frontend = await prisma.category.create({
  data: {
    name: "Frontend",
    slug: "frontend",
    color: "#61DAFB",
    icon: "react",
    parentId: tecnologia.id,  // ← ID da categoria pai
  }
});
```

### Passo 3: Criar Post na Subcategoria

```typescript
// POST /posts
await prisma.post.create({
  data: {
    title: "Introdução ao React",
    slug: "introducao-react",
    content: { type: "doc", content: [...] },
    authorId: "user123",
    subcategoryId: frontend.id,  // ← SEMPRE usa subcategoria!
  }
});
```

**✅ Sucesso!** Post criado com hierarquia completa.

---

## 🌳 Visualização da Hierarquia Completa

### Exemplo Real do Blog

```
📦 Banco de dados
│
├── 📁 Categoria "Tecnologia" (parentId: null)
│   ├── 📂 Subcategoria "Frontend" (parentId: tecnologia.id)
│   │   ├── 📄 Post "React vs Vue" (subcategoryId: frontend.id)
│   │   └── 📄 Post "CSS Grid" (subcategoryId: frontend.id)
│   │
│   ├── 📂 Subcategoria "Backend" (parentId: tecnologia.id)
│   │   ├── 📄 Post "Node.js" (subcategoryId: backend.id)
│   │   └── 📄 Post "Python" (subcategoryId: backend.id)
│   │
│   └── 📂 Subcategoria "DevOps" (parentId: tecnologia.id)
│       └── 📄 Post "Docker" (subcategoryId: devops.id)
│
└── 📁 Categoria "Culinária" (parentId: null)
    ├── 📂 Subcategoria "Doces" (parentId: culinaria.id)
    │   └── 📄 Post "Bolo de chocolate" (subcategoryId: doces.id)
    │
    └── 📂 Subcategoria "Salgados" (parentId: culinaria.id)
        └── 📄 Post "Pizza caseira" (subcategoryId: salgados.id)
```

---

## 🔄 Fluxo de Criação Completo

### Exemplo Prático: Blog de Culinária

#### Passo 1: Criar Categoria Principal

```bash
curl -X POST http://localhost:4000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Culinária",
    "slug": "culinaria",
    "color": "#E74C3C",
    "icon": "utensils",
    "parentId": null
  }'
```

**Retorna:**

```json
{
  "id": "cat-culinaria",
  "name": "Culinária",
  "parentId": null  // ← Categoria PRINCIPAL
}
```

#### Passo 2: Criar Subcategorias

```bash
# Subcategoria "Doces"
curl -X POST http://localhost:4000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Doces",
    "slug": "doces",
    "parentId": "cat-culinaria",
    "color": "#F39C12"
  }'

# Subcategoria "Salgados"
curl -X POST http://localhost:4000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salgados",
    "slug": "salgados",
    "parentId": "cat-culinaria",
    "color": "#D35400"
  }'
```

#### Passo 3: Criar Post na Subcategoria

```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Receita de Bolo de Chocolate",
    "slug": "bolo-chocolate",
    "content": { "type": "doc", "content": [...] },
    "subcategoryId": "cat-doces",
    "authorId": "user123",
    "status": "PUBLISHED"
  }'
```

**✅ Resultado:** Post criado com caminho completo:

```
Culinária → Doces → Bolo de Chocolate
```

---

## 🎯 Por Que Isso é Importante?

### 1. **Compatibilidade com Schema**

```typescript
// ❌ Prisma NÃO ACEITA:
const post = await prisma.post.create({
  data: {
    categoryId: "abc123"  // ← ERRO! Campo não existe
  }
});

// ✅ Prisma ACEITA:
const post = await prisma.post.create({
  data: {
    subcategoryId: "abc123"  // ← OK! Campo existe
  }
});
```

### 2. **URLs Hierárquicas (SEO)**

**Com subcategoryId:**

```
/tecnologia/frontend/introducao-react
 ↑          ↑         ↑
categoria  subcat.   post
```

**Sem subcategoryId:**

```
/tecnologia/introducao-react
 ↑          ↑
categoria  post (sem organização!)
```

### 3. **Queries Otimizadas**

Buscar post com categoria completa:

```typescript
const post = await prisma.post.findUnique({
  where: { id: "post123" },
  include: {
    subcategory: {  // ✅ Inclui subcategoria
      include: {
        parent: true  // ✅ Inclui categoria principal
      }
    }
  }
});
```

**Resultado:**

```json
{
  "title": "Introdução ao React",
  "subcategory": {
    "name": "Frontend",
    "parent": {
      "name": "Tecnologia"
    }
  }
}
```

---

## 📊 Resumo: categoryId vs subcategoryId

| Aspecto | categoryId (❌) | subcategoryId (✅) |
|---|---|---|
| **Existe no schema?** | ❌ Não | ✅ Sim |
| **Prisma aceita?** | ❌ Erro | ✅ Funciona |
| **Hierarquia?** | ❌ Não suporta | ✅ 2 níveis |
| **Organização?** | ⚠️ Simples | ✅ Avançada |
| **SEO?** | ⚠️ Básico | ✅ Melhor |
| **URLs?** | ⚠️ Flat | ✅ Hierárquicas |

---

## 🧪 Exercício Prático

### Desafio: Criar Blog de Tecnologia

Siga estes passos:

#### 1. Criar categoria principal "Programação"

```typescript
const programacao = await prisma.category.create({
  data: {
    name: "Programação",
    slug: "programacao",
    parentId: null,
  }
});
```

#### 2. Criar 2 subcategorias

```typescript
// JavaScript
const javascript = await prisma.category.create({
  data: {
    name: "JavaScript",
    slug: "javascript",
    parentId: programacao.id,
  }
});

// Python
const python = await prisma.category.create({
  data: {
    name: "Python",
    slug: "python",
    parentId: programacao.id,
  }
});
```

#### 3. Criar 1 post em cada subcategoria

```typescript
// Post em JavaScript
await prisma.post.create({
  data: {
    title: "Async/Await no JavaScript",
    slug: "async-await-js",
    content: {...},
    subcategoryId: javascript.id,  // ← JavaScript
    authorId: "user123",
  }
});

// Post em Python
await prisma.post.create({
  data: {
    title: "Decorators no Python",
    slug: "decorators-python",
    content: {...},
    subcategoryId: python.id,  // ← Python
    authorId: "user123",
  }
});
```

**✅ Parabéns!** Você criou uma hierarquia completa!

---

## ✅ Checklist de Validação

Verifique se entendeu:

- [ ] Categorias principais têm `parentId = null`
- [ ] Subcategorias têm `parentId = <id da categoria>`
- [ ] Posts **sempre** usam `subcategoryId`
- [ ] Posts **nunca** usam `categoryId`
- [ ] É possível ter 2 níveis (principal → sub)
- [ ] URLs ficam hierárquicas (/categoria/subcategoria/post)

---

## 🐛 Erros Comuns e Soluções

### Erro 1: "Invalid field categoryId"

```bash
❌ PrismaClientValidationError: Invalid field categoryId
```

**Causa:** Tentou usar `categoryId` em vez de `subcategoryId`

**Solução:**

```typescript
// ❌ Errado
data: { categoryId: "abc" }

// ✅ Correto
data: { subcategoryId: "abc" }
```

### Erro 2: "Category must be a subcategory"

**Causa:** Tentou criar post em categoria principal

**Solução:**

```typescript
// ❌ Errado - categoria principal
const tecnologia = await prisma.category.findUnique({
  where: { slug: "tecnologia", parentId: null }
});

// ✅ Correto - subcategoria
const frontend = await prisma.category.findUnique({
  where: { slug: "frontend", parentId: { not: null } }
});

await prisma.post.create({
  data: {
    subcategoryId: frontend.id  // ✅ Subcategoria
  }
});
```

---

## 💡 Boas Práticas

### 1. **Sempre Valide se é Subcategoria**

```typescript
async function validateSubcategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id }
  });
  
  if (!category) {
    throw new Error('Categoria não encontrada');
  }
  
  if (category.parentId === null) {
    throw new Error('Post deve pertencer a uma subcategoria, não categoria principal');
  }
  
  return category;
}
```

### 2. **Crie Subcategorias com Categoria Principal**

```typescript
// Sempre inclua o parent ao criar subcategoria
await prisma.category.create({
  data: {
    name: "Frontend",
    slug: "frontend",
    parentId: tecnologia.id,  // ✅ Obrigatório
  }
});
```

### 3. **Use Include ao Buscar Posts**

```typescript
// Buscar post com hierarquia completa
const post = await prisma.post.findUnique({
  where: { slug: "introducao-react" },
  include: {
    subcategory: {
      include: {
        parent: true  // Categoria principal
      }
    }
  }
});

// Resultado:
{
  title: "Introdução ao React",
  subcategory: {
    name: "Frontend",      // Subcategoria
    parent: {
      name: "Tecnologia"   // Categoria principal
    }
  }
}
```

---

## 🌲 Visualização da Estrutura no Banco

### Dados Criados pelo Seed

```
📦 Collection: categories
│
├── { id: "cat-tech", name: "Tecnologia", parentId: null }
│
├── { id: "cat-frontend", name: "Frontend", parentId: "cat-tech" }
│
├── { id: "cat-backend", name: "Backend", parentId: "cat-tech" }
│
└── { id: "cat-devops", name: "DevOps", parentId: "cat-tech" }

📦 Collection: posts
│
├── { title: "React 18", subcategoryId: "cat-frontend" }
│
├── { title: "NestJS", subcategoryId: "cat-backend" }
│
└── { title: "Docker", subcategoryId: "cat-devops" }
```

---

## 🎯 Exemplos de Queries

### Listar Categorias Principais

```typescript
const principais = await prisma.category.findMany({
  where: { parentId: null }  // ✅ Apenas principais
});
```

### Listar Subcategorias de uma Categoria

```typescript
const subcategorias = await prisma.category.findMany({
  where: { parentId: "cat-tech" }  // ✅ Filhas de Tecnologia
});
```

### Listar Posts de uma Subcategoria

```typescript
const posts = await prisma.post.findMany({
  where: { subcategoryId: "cat-frontend" }  // ✅ Posts de Frontend
});
```

### Buscar com Hierarquia Completa

```typescript
const posts = await prisma.post.findMany({
  include: {
    subcategory: {
      include: {
        parent: true  // Categoria principal
      }
    }
  }
});

// Resultado:
[
  {
    title: "React 18",
    subcategory: {
      name: "Frontend",
      parent: { name: "Tecnologia" }
    }
  }
]
```

---

## 📊 Comparação: Benefícios da Hierarquia

### URLs Geradas

| Estrutura | URL |
|-----------|-----|
| **Simples** | `/culinaria/bolo-chocolate` |
| **Hierárquica** | `/culinaria/doces/bolo-chocolate` ✅ |

### Navegação

| Estrutura | Navegação |
|-----------|-----------|
| **Simples** | Home → Culinária → Post |
| **Hierárquica** | Home → Culinária → Doces → Post ✅ |

### SEO

| Estrutura | SEO Score |
|-----------|-----------|
| **Simples** | ⭐⭐⭐ |
| **Hierárquica** | ⭐⭐⭐⭐⭐ ✅ |

---

## 💡 TL;DR (Resumo Rápido)

### O Ponto Crítico É

1. ✅ Schema Prisma define que **Post pertence a SUBCATEGORIA**
2. ❌ Se usar `categoryId`, a aplicação **quebra**
3. ✅ Subcategoria permite **hierarquia** (Tech → Frontend → Post)
4. ✅ É **obrigatório** usar `subcategoryId` para compatibilidade

### Regra de Ouro

> **Posts SEMPRE pertencem a SUBCATEGORIAS, nunca à categoria principal diretamente.**

---

## ✅ Checklist de Implementação

Na nossa aplicação, verificamos que:

- [x] `Post.subcategoryId` existe no model ✅
- [x] Repository usa `subcategory` no include ✅
- [x] Category tem `parentId` (hierarquia) ✅
- [x] Queries buscam subcategory (não category) ✅
- [x] Seed cria categorias em 2 níveis ✅
- [x] Validações impedem criar post em categoria principal ✅

**Tudo correto!** 🎉

---

## 📚 Recursos Relacionados

- **[GUIA_SEED_BANCO_DADOS.md](GUIA_SEED_BANCO_DADOS.md)** - Como popular categorias
- **[COMECE_AQUI_NESTJS.md](COMECE_AQUI_NESTJS.md)** - Estrutura do projeto
- **Prisma Schema:** `src/prisma/schema.prisma` (linhas 292-396)

---

**Criado em:** 16/10/2025  
**Atualizado em:** 16/10/2025  
**Tipo:** Guia Conceitual  
**Status:** ✅ Completo e Implementado
