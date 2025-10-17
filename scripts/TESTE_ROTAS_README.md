# 🧪 Script de Teste de Rotas - README

## ✅ O que foi criado

### 1. **testar-todas-rotas.ps1** (PowerShell Script)
Script completo que testa TODAS as rotas GET da API do Swagger.

**Características:**
- ✅ **ETAPA 1**: Testa a saúde da API PRIMEIRO
  - Se a API não estiver rodando, PARA e pede para iniciar o servidor
  - Mostra mensagem clara: "INICIE O SERVIDOR PRIMEIRO!"
  - Sugere comando: `npm run start:dev`
  
- ✅ **ETAPA 2**: Testa todas as rotas (somente se API estiver saudável)
  - Para na PRIMEIRA rota que falhar
  - Mostra mensagem de erro detalhada
  - Pede ENTER para sair

**Detecção Automática:**
- Lê `DATABASE_PROVIDER` do arquivo `.env`
- Fallback para variável de ambiente do sistema
- **SEM valor padrão** - exige configuração obrigatória

### 2. **testar-todas-rotas.bat** (Batch Script)  
Atalho para executar o PowerShell script facilmente.

---

## 🚀 Como Usar

### Método 1: PowerShell Direto (Recomendado)
```powershell
.\scripts\testar-todas-rotas.ps1
```

### Método 2: Batch File
```cmd
.\scripts\testar-todas-rotas.bat
```

### Método 3: Duplo Clique
Dê duplo clique no arquivo `testar-todas-rotas.bat` no Windows Explorer

---

## 📋 Rotas Testadas

### ❤️ Health Check (OBRIGATÓRIO - Testa PRIMEIRO)
- `/health` - Health Check Básico
- `/health/detailed` - Health Check Detalhado

### 👤 Usuários
- `/users` - Listar Usuários
- `/users?page=1&limit=5` - Listar Usuários (Paginado)
- `/users?role=ADMIN` - Filtrar Usuários por Role
- `/users/{id}` - Buscar Usuário por ID
- `/users/username/{username}` - Buscar por Username

### 📄 Posts
- `/posts` - Listar Posts
- `/posts?status=PUBLISHED` - Posts Publicados
- `/posts?status=DRAFT` - Posts Rascunhos
- `/posts?featured=true` - Posts em Destaque
- `/posts?page=1&limit=5` - Posts Paginados
- `/posts/{id}` - Buscar Post por ID
- `/posts/slug/{slug}` - Buscar Post por Slug
- `/posts/author/{authorId}` - Posts por Autor
- `/posts/subcategory/{subcategoryId}` - Posts por Subcategoria

### 🏷️ Categorias
- `/categories` - Listar Categorias
- `/categories/{id}` - Buscar Categoria
- `/categories/slug/{slug}` - Buscar por Slug
- `/categories/{id}/subcategories` - Listar Subcategorias

### 💬 Comentários
- `/comments?limit=10` - Listar Comentários
- `/comments/{id}` - Buscar Comentário
- `/comments/post/{postId}` - Comentários do Post
- `/comments/user/{authorId}` - Comentários do Usuário

### ❤️ Likes
- `/likes/post/{postId}` - Likes do Post
- `/likes/user/{userId}` - Likes do Usuário
- `/likes/post/{postId}/count` - Contar Likes
- `/likes/{userId}/{postId}/check` - Verificar Like

### 🔖 Bookmarks
- `/bookmarks/user/{userId}` - Bookmarks do Usuário
- `/bookmarks/user/{userId}/collection` - Bookmarks por Coleção

### 🔔 Notificações
- `/notifications/user/{userId}` - Notificações do Usuário
- `/notifications/user/{userId}/unread/count` - Contar Não Lidas
- `/notifications/{id}` - Buscar Notificação

---

## ⚠️ Comportamento

1. **Se a API não estiver rodando:**
   ```
   ╔═══════════════════════════════════════════════════════════════╗
   ║  ❌ API NAO ESTA RODANDO! INICIE O SERVIDOR PRIMEIRO!        ║
   ╚═══════════════════════════════════════════════════════════════╝
   
   Para iniciar a API, execute:
      npm run start:dev
   
   Aguarde o servidor iniciar completamente (porta 4000)
   e execute este script novamente.
   
   Pressione ENTER para sair
   ```

2. **Se alguma rota falhar:**
   - Para imediatamente
   - Mostra mensagem de erro
   - Pede ENTER para sair

3. **Se todos os testes passarem:**
   ```
   ╔═══════════════════════════════════════════════════════════════╗
   ║                    ✅ TODOS OS TESTES PASSARAM!               ║
   ╚═══════════════════════════════════════════════════════════════╝
   
   📊 RESUMO:
      Total de rotas testadas: X
      Rotas com sucesso:       X
      Taxa de sucesso:         100%
   
   🎉 O banco de dados esta populado e todas as rotas funcionam!
   ```

---

## 🔧 Pré-requisitos

1. **Servidor rodando:**
   ```bash
   npm run start:dev
   ```

2. **Banco de dados populado:**
   ```bash
   npm run seed
   ```

3. **DATABASE_PROVIDER configurado no .env:**
   ```
   DATABASE_PROVIDER=PRISMA
   ```

---

## 📊 Resumo do que fizemos hoje

1. ✅ **Populamos o banco de dados** com dados de exemplo
   - 5 usuários
   - 9 categorias (3 principais + 6 subcategorias)
   - 9 posts (8 publicados + 1 rascunho)
   - 5 comentários, 11 likes, 5 bookmarks, 5 notificações

2. ✅ **Criamos script completo de teste** que:
   - Detecta DATABASE_PROVIDER automaticamente do .env
   - Testa saúde da API PRIMEIRO
   - Para se a API não estiver rodando
   - Testa todas as rotas GET do Swagger
   - Para na primeira falha
   - Pede ENTER para sair

3. ✅ **Script está pronto para uso!**

---

## 🎯 Próximos Passos

1. Execute o servidor se ainda não estiver rodando:
   ```bash
   npm run start:dev
   ```

2. Execute o script de teste:
   ```bash
   .\scripts\testar-todas-rotas.ps1
   ```

3. Aguarde o relatório completo!

---

Criado com ❤️ para garantir que sua API está funcionando perfeitamente! 🚀