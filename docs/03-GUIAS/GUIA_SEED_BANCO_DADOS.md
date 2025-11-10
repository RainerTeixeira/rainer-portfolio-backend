# 🌱 Guia Completo: Seed do Banco de Dados

**Objetivo:** Popular o banco com dados realistas para desenvolvimento e testes.

**Tempo estimado:** 10 minutos  
**Nível:** Iniciante  
**Pré-requisitos:** MongoDB rodando, Prisma configurado

---

## 📚 O Que Você Vai Aprender

- ✅ Como executar o seed
- ✅ Quais dados são criados (48 registros)
- ✅ Como verificar e testar os dados
- ✅ Como personalizar os dados
- ✅ Resolver problemas comuns

---

## ⚡ Quick Start (3 Passos)

### Opção 1: Usando Script Automatizado (Recomendado)

```powershell
# Iniciar MongoDB
.\scripts\docker-ambiente-completo.ps1 start

# Gerar Prisma Client e criar schema
npm run prisma:generate
npm run prisma:push

# Executar seed
npm run seed
```

### Opção 2: Comandos Manuais

```bash
# 1. Garantir MongoDB rodando
docker-compose up -d mongodb

# Aguardar 10 segundos
Start-Sleep -Seconds 10

# 2. Gerar Prisma Client e criar schema
npm run prisma:generate
npm run prisma:push

# 3. Executar seed
npm run seed
```

**🎉 Pronto!** Banco populado com 48 registros!

---

## 📊 Dados Criados Automaticamente

### 👥 Usuários (5)

| Username | Email | Role | Descrição |
|----------|-------|------|-----------|
| `admin` | <admin@blog.com> | ADMIN | Administrador do sistema |
| `editor` | <editor@blog.com> | EDITOR | Editora de conteúdo |
| `joaodev` | <joao@blog.com> | AUTHOR | Desenvolvedor Full Stack |
| `anadesigner` | <ana@blog.com> | AUTHOR | Designer UX/UI |
| `carlosleitor` | <carlos@example.com> | SUBSCRIBER | Leitor do blog |

**⚠️ Importante:** Usuários **não têm senha no Cognito**. Para login real, use `/auth/register`.

### 📂 Categorias Hierárquicas (9)

```
📂 Tecnologia (#3498DB)
   ├── 📁 Frontend (#61DAFB) - 2 posts
   ├── 📁 Backend (#68A063) - 2 posts
   └── 📁 DevOps (#FF6B35) - 2 posts

📂 Design (#E74C3C)
   ├── 📁 UX/UI Design (#9B59B6) - 2 posts
   └── 📁 Design Gráfico (#E67E22) - 0 posts

📂 Carreira (#2ECC71)
   └── 📁 Produtividade (#1ABC9C) - 1 post
```

### 📝 Posts (8 total)

| Título | Subcategoria | Autor | Views | Likes | Status |
|--------|--------------|-------|-------|-------|--------|
| Introdução ao React 18 | Frontend | João | 1250 | 3 | PUBLISHED ⭐ |
| Next.js 14: Server Actions | Frontend | João | 890 | 2 | PUBLISHED ⭐ |
| NestJS: Arquitetura Modular | Backend | João | 650 | 2 | PUBLISHED |
| Prisma ORM: Do Zero à Produção | Backend | João | 420 | 0 | PUBLISHED |
| Docker para Desenvolvedores | DevOps | João | 580 | 1 | PUBLISHED |
| Princípios de Design de Interface | UX/UI | Ana | 720 | 2 | PUBLISHED ⭐ |
| Figma: Do Básico ao Avançado | UX/UI | Ana | 310 | 1 | PUBLISHED |
| AWS Lambda: Serverless | DevOps | João | 0 | 0 | DRAFT |

**Características:**

- 7 publicados, 1 rascunho
- 3 em destaque (featured)
- Conteúdo Tiptap JSON válido

### 💬 Comentários (5) + Interações

- ✅ Comentário de Carlos no post de React
- ✅ Resposta de João para Carlos (thread)
- ✅ Comentário de Ana no post de Next.js
- ✅ Comentário de Carlos no post de NestJS
- ✅ 1 comentário aguardando moderação

**Threads:**

```
Post "React 18"
└── Carlos: "Excelente artigo! O Concurrent Rendering..."
    └── João: "Que bom que gostou! Já experimentou o Suspense?"
```

### ❤️ Likes (11) | 🔖 Bookmarks (5) | 🔔 Notificações (5)

**Bookmarks com coleções:**

- Carlos: "Para Ler Depois", "Estudar"
- Ana: "Favoritos", "Aprender Backend"
- João: "Design Inspiration"

**Notificações:**

- João: 3 notificações (1 não lida)
- Ana: 1 notificação (não lida)
- Carlos: 1 notificação (sistema)

---

## 📊 Output ao Executar

```
🌱 Iniciando seed do banco de dados...

═══════════════════════════════════════════════════════
🧹 Limpando banco de dados...
✅ Banco limpo!

👥 Criando usuários...
   ✅ Administrador Sistema (@admin) - ADMIN
   ✅ Maria Silva (@editor) - EDITOR
   ✅ João Desenvolvedor (@joaodev) - AUTHOR
   ✅ Ana Designer (@anadesigner) - AUTHOR
   ✅ Carlos Leitor (@carlosleitor) - SUBSCRIBER

📂 Criando categorias...
   ✅ Tecnologia, Design, Carreira (principais)
   ✅ Frontend, Backend, DevOps, UX/UI, etc (subcategorias)

📝 Criando posts...
   ✅ 8 posts (7 PUBLISHED, 1 DRAFT)

💬 Comentários, ❤️ Likes, 🔖 Bookmarks, 🔔 Notificações...
   ✅ Todos criados com sucesso

═══════════════════════════════════════════════════════

✅ Seed concluído!

📊 Resumo:
   • 5 usuários
   • 9 categorias (3 principais + 6 subcategorias)
   • 8 posts (7 publicados, 1 rascunho)
   • 5 comentários (4 aprovados)
   • 11 likes
   • 5 bookmarks
   • 5 notificações

🎉 Banco pronto para uso!
```

---

## 🧪 Como Verificar os Dados

### Opção 1: Via API

```bash
# Inicie o servidor
npm run dev

# Teste endpoints
curl http://localhost:4000/users
curl http://localhost:4000/posts
curl http://localhost:4000/categories
```

### Opção 2: Prisma Studio (Visual)

```bash
npm run prisma:studio
```

Abre em: **<http://localhost:5555>**

### Opção 3: Swagger UI

1. Acesse: **<http://localhost:4000/docs>**
2. Teste qualquer endpoint GET
3. Veja os dados retornados

---

## 🎨 Personalizar Dados

### Adicionar Mais Usuários

```typescript
// src/prisma/mongodb.seed.ts
const users = [
  // ... usuários existentes
  {
    cognitoSub: nanoid(),
    email: 'novo@email.com',
    username: 'novousuario',
    fullName: 'Novo Usuário',
    role: 'AUTHOR',
  },
];
```

### Adicionar Mais Posts

```typescript
const posts = [
  // ... posts existentes
  {
    title: 'Meu Novo Post',
    slug: 'meu-novo-post',
    content: { 
      type: 'doc', 
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: 'Conteúdo...' }]
      }] 
    },
    subcategoryId: categories.frontend.id,
    authorId: users[2].id,
    status: 'PUBLISHED',
  },
];
```

### Execute Novamente

```bash
npm run seed  # Limpa e recria tudo
```

---

## 🔄 Re-executar o Seed

### ⚠️ Atenção: Seed LIMPA o banco antes

```bash
npm run seed
```

Isso vai:

1. ✅ Deletar **todos** os dados existentes
2. ✅ Criar dados novos do zero

**Cuidado:** Não use seed em produção! Use migrations.

---

## 🔄 Alternar Entre MongoDB e DynamoDB

Você pode usar o script para alternar facilmente:

```powershell
# Ver qual banco está ativo
.\scripts\alternar-banco.ps1 status

# Usar MongoDB (Prisma)
.\scripts\alternar-banco.ps1 PRISMA
npm run prisma:seed

# Usar DynamoDB Local
.\scripts\alternar-banco.ps1 DYNAMODB
npm run dynamodb:seed
```

**Nota:** O seed do Prisma funciona apenas com MongoDB. Para DynamoDB, use `npm run dynamodb:seed`.

---

## 🐛 Troubleshooting

### "Cannot connect to database"

```bash
# Verificar se MongoDB está rodando
docker ps

# Se não estiver, inicie:
npm run docker:up

# Aguarde 10 segundos
npm run seed
```

### "nanoid is not defined"

```bash
npm install nanoid
npm run seed
```

### "Prisma Client not generated"

```bash
npm run prisma:generate
npm run seed
```

### Limpar e Recriar Tudo

```bash
# Forçar reset
npm run prisma:push -- --force-reset

# Re-executar seed
npm run seed
```

---

## ✅ Checklist de Verificação

Após executar o seed:

- [ ] MongoDB está rodando (`docker ps`)
- [ ] Seed executou sem erros
- [ ] API responde (`curl http://localhost:4000/health`)
- [ ] Endpoints retornam dados:
  - [ ] `/users` - 5 usuários
  - [ ] `/posts` - 7 posts publicados
  - [ ] `/categories` - 3 categorias principais

---

## 📊 Estatísticas Finais

### Dados Criados

- **Users:** 5
- **Categories:** 9 (3 principais + 6 subcategorias)
- **Posts:** 8 (7 publicados + 1 rascunho)
- **Comments:** 5 (4 aprovados + 1 pendente)
- **Likes:** 11
- **Bookmarks:** 5 (com coleções e notas)
- **Notifications:** 5 (3 não lidas)

**Total:** 48 registros com relacionamentos completos!

### Relacionamentos Criados

- ✅ Posts → Authors (users)
- ✅ Posts → Subcategories
- ✅ Comments → Authors + Posts + Threads
- ✅ Likes → Users + Posts (unique constraint)
- ✅ Bookmarks → Users + Posts (unique constraint)
- ✅ Notifications → Users

---

## 🎯 Próximos Passos

1. ✅ **Explorar Swagger:** <http://localhost:4000/docs>
2. ✅ **Testar CRUD** com dados reais
3. ✅ **Ver hierarquia** de categorias
4. ✅ **Testar threads** de comentários
5. ✅ **Validar constraints** (likes, bookmarks)

---

## 📚 Recursos Relacionados

- **[COMECE_AQUI_NESTJS.md](COMECE_AQUI_NESTJS.md)** - Guia inicial
- **[GUIA_RAPIDO_TESTES.md](GUIA_RAPIDO_TESTES.md)** - Testar a API
- **[GUIA_CATEGORIAS_HIERARQUICAS.md](GUIA_CATEGORIAS_HIERARQUICAS.md)** - Entender categorias

---

---

## 🆕 Novos Scripts de Gerenciamento

### Scripts PowerShell Disponíveis

```powershell
# Gerenciar ambiente completo
.\scripts\docker-ambiente-completo.ps1 start    # Iniciar MongoDB + DynamoDB
.\scripts\docker-ambiente-completo.ps1 status   # Ver status
.\scripts\docker-ambiente-completo.ps1 stop     # Parar tudo

# Alternar entre bancos
.\scripts\alternar-banco.ps1 PRISMA    # MongoDB
.\scripts\alternar-banco.ps1 DYNAMODB  # DynamoDB
.\scripts\alternar-banco.ps1 status    # Ver atual

# Atualizar credenciais AWS
.\scripts\update-aws-credentials.ps1
```

### Documentação Adicional

- **[COMECE_AQUI.txt](../../COMECE_AQUI.txt)** - Início rápido
- **[INICIO_RAPIDO_OLD.md](../../INICIO_RAPIDO_OLD.md)** - Comandos principais
- **[GUIA_AMBIENTE_LOCAL_OLD.md](../../GUIA_AMBIENTE_LOCAL_OLD.md)** - Guia completo

---

**Criado em:** 16/10/2025  
**Atualizado em:** 16/10/2025  
**Tipo:** Guia Prático  
**Status:** ✅ Completo e Atualizado
