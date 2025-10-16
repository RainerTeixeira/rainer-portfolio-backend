# ⚡ Referência Rápida - Configuração de Ambiente

## 🎯 Escolha Seu Ambiente

### 🔵 Desenvolvimento Local (MongoDB) - RECOMENDADO

```bash
# .env
DATABASE_PROVIDER=PRISMA
DATABASE_URL="mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true"
```

**Setup:**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:7 --replSet rs0
docker exec mongodb mongosh --eval "rs.initiate()"
npm run prisma:generate
npm run prisma:push
npm run dev
```

### 🟠 Produção AWS Lambda (DynamoDB)

```bash
# .env
DATABASE_PROVIDER=DYNAMODB
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=blog-prod
# Sem DYNAMODB_ENDPOINT (usa AWS)
```

**Deploy:**
```bash
serverless deploy --stage prod
```

### 🟡 Testes Locais (DynamoDB Local)

```bash
# .env
DATABASE_PROVIDER=DYNAMODB
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_PREFIX=blog-test
```

**Setup:**
```bash
npm run docker:dynamodb
npm run dynamodb:create-tables
npm run dev
```

---

## 📋 Variáveis Essenciais

### Sempre Necessárias
```bash
NODE_ENV=development|production|test
PORT=4000
DATABASE_PROVIDER=PRISMA|DYNAMODB
```

### Se DATABASE_PROVIDER=PRISMA
```bash
DATABASE_URL="mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true"
```

### Se DATABASE_PROVIDER=DYNAMODB
```bash
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=blog
DYNAMODB_ENDPOINT=http://localhost:8000  # Apenas dev/test
```

### Cognito (Autenticação)
```bash
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
```

---

## 🚀 Comandos Rápidos

### Setup Inicial
```bash
cp env.example .env    # Copiar configuração
npm install            # Instalar dependências
```

### Prisma (MongoDB)
```bash
npm run prisma:generate    # Gerar Prisma Client
npm run prisma:push        # Sincronizar schema
npm run prisma:studio      # Abrir GUI
npm run seed               # Popular banco
```

### DynamoDB
```bash
npm run docker:dynamodb           # Subir DynamoDB Local
npm run dynamodb:create-tables    # Criar tabelas
npm run dynamodb:seed             # Popular banco
npm run dynamodb:list-tables      # Listar tabelas
```

### Desenvolvimento
```bash
npm run dev           # Servidor com hot reload
npm test              # Rodar testes
npm run build         # Build para produção
```

---

## 🗄️ Estrutura de Dados (7 Modelos)

Independente do provider, o projeto tem **7 modelos**:

1. **Users** - Usuários e perfis
2. **Posts** - Artigos do blog
3. **Categories** - Categorias (hierarquia 2 níveis)
4. **Comments** - Comentários (com threads)
5. **Likes** - Curtidas
6. **Bookmarks** - Favoritos
7. **Notifications** - Notificações

---

## ✅ Checklist Rápido

### MongoDB (PRISMA)
- [ ] MongoDB rodando
- [ ] Replica Set iniciado
- [ ] `DATABASE_URL` configurada
- [ ] Prisma Client gerado

### DynamoDB
- [ ] DynamoDB Local ou AWS configurado
- [ ] Tabelas criadas
- [ ] `DYNAMODB_TABLE_PREFIX` definido

### Geral
- [ ] `.env` criado
- [ ] `DATABASE_PROVIDER` definido
- [ ] Cognito configurado
- [ ] `npm run dev` funciona

---

## 🆘 Problemas Comuns

### MongoDB não conecta
```bash
# Verificar replica set
docker exec mongodb mongosh --eval "rs.status()"

# Reiniciar
docker restart mongodb
```

### Prisma Client não gerado
```bash
npm run prisma:generate
rm -rf node_modules/.prisma
npm install
```

### DynamoDB não conecta
```bash
# Verificar container
docker ps | grep blogapi-dynamodb

# Ver logs
docker logs blogapi-dynamodb
```

---

## 📚 Documentação Completa

- **[ATUALIZACAO_ENV_CONFIG.md](ATUALIZACAO_ENV_CONFIG.md)** - Guia detalhado
- **[README.md](../README.md)** - Documentação principal
- **[SETUP_DYNAMODB_CONCLUIDO.md](SETUP_DYNAMODB_CONCLUIDO.md)** - Setup DynamoDB

---

## 💡 Dica Pro

Use **MongoDB para desenvolvimento** (rápido, produtivo) e **DynamoDB para produção Lambda** (serverless, escalável):

```bash
# Desenvolvimento
DATABASE_PROVIDER=PRISMA

# Produção
DATABASE_PROVIDER=DYNAMODB
```

**Melhor dos dois mundos!** 🚀

