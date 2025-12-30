# 🚀 Comece Aqui - DynamoDB Local

Guia de início rápido para rodar o DynamoDB Local em 5 minutos!

---

## ⚡ Início Ultra-Rápido

### 1️⃣ Execute o script

```bash
iniciar-ambiente-dynamodb.bat
```

**Pronto!** ✅ O script faz tudo automaticamente.

---

## 📋 O que o script faz?

1. ✅ Verifica se o Docker está rodando
2. ✅ Cria o arquivo `.env` (se não existir)
3. ✅ Inicia o DynamoDB Local no Docker
4. ✅ Cria 7 tabelas automaticamente
5. ✅ Pergunta se quer popular com dados de teste
6. ✅ Inicia o servidor da API

---

## 🌐 URLs Importantes

Depois de rodar o script, acesse:

| URL | Descrição |
|-----|-----------|
| <http://localhost:4000> | API Backend |
| <http://localhost:4000/api/docs> | Swagger (Documentação interativa) |
| <http://localhost:4000/health> | Health Check |
| <http://localhost:8000> | DynamoDB Local |

---

## 📊 Dados de Teste

Se você escolheu popular o banco, terá:

### Usuários criados

- `admin@blog.com` - **ADMIN**
- `editor@blog.com` - **EDITOR**
- `maria@blog.com` - **AUTHOR**
- `joao@blog.com` - **AUTHOR**
- `ana@blog.com` - **SUBSCRIBER**

### Conteúdo

- ✅ 3 categorias
- ✅ 5 posts (4 publicados, 1 rascunho)
- ✅ Comentários, likes e bookmarks

---

## 🔧 Comandos Úteis

```bash
# Ver containers rodando
docker ps

# Ver logs do DynamoDB
docker logs dynamodb-local

# Listar tabelas criadas
npm run dynamodb:list-tables

# Parar tudo
docker-compose down

# Reiniciar DynamoDB
docker-compose restart dynamodb-local
```

---

## 🗃️ Tabelas Criadas

O ambiente cria 7 tabelas:

1. ✅ `blog-users` - Usuários
2. ✅ `blog-posts` - Posts
3. ✅ `blog-categories` - Categorias
4. ✅ `blog-comments` - Comentários
5. ✅ `blog-likes` - Curtidas
6. ✅ `blog-bookmarks` - Favoritos
7. ✅ `blog-notifications` - Notificações

---

## 🛠️ Ferramenta Visual (Opcional)

Quer ver os dados visualmente?

```bash
# Instalar DynamoDB Admin
npm install -g dynamodb-admin

# Executar (em outro terminal)
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin

# Acessar
http://localhost:8001
```

---

## 🔄 Alternar entre MongoDB e DynamoDB

### MongoDB (Desenvolvimento Rápido)

```bash
# Editar .env
DATABASE_PROVIDER=PRISMA

# Executar
iniciar-ambiente-local.bat
```

### DynamoDB (Testes Pré-Deploy)

```bash
# Editar .env
DATABASE_PROVIDER=DYNAMODB

# Executar
iniciar-ambiente-dynamodb.bat
```

---

## ❓ Problema?

### Container não inicia?

```bash
# Verificar se porta 8000 está livre
netstat -ano | findstr :8000

# Reiniciar Docker Desktop
```

### Tabelas não aparecem?

```bash
# Criar tabelas manualmente
npm run dynamodb:create-tables

# Verificar
npm run dynamodb:list-tables
```

### API não responde?

```bash
# Verificar se servidor está rodando
# Deve mostrar: "Server listening on http://0.0.0.0:4000"

# Se não estiver, executar:
npm run dev
```

---

## 📚 Mais Informações

- **[README_DYNAMODB.md](README_DYNAMODB.md)** - Guia rápido completo
- **[SETUP_DYNAMODB_CONCLUIDO.md](SETUP_DYNAMODB_CONCLUIDO.md)** - Detalhes da configuração
- **[guias/GUIA_DYNAMODB_LOCAL.md](guias/GUIA_DYNAMODB_LOCAL.md)** - Guia avançado (670+ linhas)

---

## ✅ Checklist Rápido

- [ ] Docker Desktop rodando?
- [ ] Script executado com sucesso?
- [ ] API respondendo em <http://localhost:4000/health> ?
- [ ] Swagger acessível em <http://localhost:4000/api/docs> ?
- [ ] Tabelas criadas? (`npm run dynamodb:list-tables`)

**Tudo OK?** 🎉 **Você está pronto para desenvolver!**

---

## 🎯 Próximo Passo

Abra o Swagger e comece a testar a API:

👉 **<http://localhost:4000/api/docs>**

---

## 💡 Dica

Use **MongoDB** para desenvolvimento diário (mais rápido) e **DynamoDB** para testar antes de fazer deploy na AWS!

---

**Dúvidas?** Consulte a [documentação completa](guias/GUIA_DYNAMODB_LOCAL.md) 📖
