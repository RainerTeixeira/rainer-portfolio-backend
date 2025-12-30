# 🧪 Scripts de Teste - Resumo Completo

## 📋 Scripts Disponíveis

### 1. **testar-api-completo** (Recomendado)
**Localização:** `scripts/testes/07-testar-api-completo/`

**Descrição:** Testa TODAS as rotas da API com operações CRUD completas (87+ requisições)

**Uso:**
```bash
# Windows
.\scripts\testes\07-testar-api-completo\testar-api.bat
.\scripts\testes\07-testar-api-completo\testar-api.ps1

# Com parâmetros
.\scripts\testes\07-testar-api-completo\testar-api.ps1 -DatabaseProvider DYNAMODB
.\scripts\testes\07-testar-api-completo\testar-api.ps1 -BaseUrl "http://localhost:4000"
.\scripts\testes\07-testar-api-completo\testar-api.ps1 -SkipDelete
```

**Testa:**
- ✅ Health Check
- ✅ Autenticação (registro, login, refresh)
- ✅ CRUD completo de Usuários
- ✅ CRUD completo de Categorias e Subcategorias
- ✅ CRUD completo de Posts
- ✅ CRUD completo de Comentários
- ✅ Likes, Bookmarks e Notificações
- ✅ Limpeza opcional de dados de teste

---

### 2. **testar-antes-deploy**
**Localização:** `scripts/testes/08-testar-antes-deploy/`

**Descrição:** Teste completo simulando ambiente AWS antes do deploy

**Uso:**
```bash
.\scripts\testes\08-testar-antes-deploy\testar-antes-deploy.ps1
```

**Faz:**
- ✅ Verifica Docker
- ✅ Configura .env para DynamoDB
- ✅ Inicia DynamoDB Local
- ✅ Cria tabelas
- ✅ Popula dados
- ✅ Testa endpoints

---

### 3. **testar-mongodb**
**Localização:** `scripts/testes/05-testar-mongodb/`

**Descrição:** Testa conexão e operações com MongoDB/Prisma

**Uso:**
```bash
.\scripts\testes\05-testar-mongodb\testar-mongodb.ps1
```

---

### 4. **testar-dynamodb**
**Localização:** `scripts/testes/06-testar-dynamodb/`

**Descrição:** Testa conexão e operações com DynamoDB

**Uso:**
```bash
.\scripts\testes\06-testar-dynamodb\testar-dynamodb.ps1
```

---

## 🚀 Como Executar Testes Completos

### Passo 1: Iniciar Servidor
```bash
pnpm run dev
```

### Passo 2: Executar Testes
```bash
# Teste completo de todas as rotas
.\scripts\testes\07-testar-api-completo\testar-api.ps1
```

### Passo 3: Verificar Resultados
O script exibirá:
- ✅ Total de requisições testadas
- ✅ Requisições bem-sucedidas
- ✅ Requisições com falha
- ✅ Taxa de sucesso
- ✅ IDs gerados durante os testes

---

## ⚙️ Pré-requisitos

1. **Servidor rodando:**
   ```bash
   pnpm run dev
   ```

2. **DATABASE_PROVIDER configurado no .env:**
   ```
   DATABASE_PROVIDER=PRISMA
   # ou
   DATABASE_PROVIDER=DYNAMODB
   ```

3. **Banco de dados configurado:**
   - MongoDB: `pnpm run prisma:generate && pnpm run prisma:push`
   - DynamoDB: `pnpm run dynamodb:create-tables`

---

## 📊 Exemplo de Saída

```
╔═══════════════════════════════════════════════════════════════╗
║  🧪 TESTE COMPLETO DE TODAS AS ROTAS - BLOG API              ║
╚═══════════════════════════════════════════════════════════════╝

📌 Configurações:
   Base URL:  http://localhost:4000
   Database:  PRISMA
   Ambiente:  LOCAL

════════════════════════════════════════════════════════════════
❤️ 1. HEALTH CHECK (OBRIGATÓRIO)
════════════════════════════════════════════════════════════════

[1] 📍 GET /health
    Health Check Básico
    ✅ OK (Status: 200)

✅ API ESTÁ SAUDÁVEL! Continuando...

... (87+ requisições) ...

╔═══════════════════════════════════════════════════════════════╗
║  📊 RELATÓRIO FINAL                                           ║
╚═══════════════════════════════════════════════════════════════╝

✅ TESTES CONCLUÍDOS COM SUCESSO!

📈 Estatísticas:
   Total de requisições:  87
   Requisições bem-sucedidas:  85
   Requisições com falha:  2
   Taxa de sucesso:  97.7%
```

---

## 🔧 Troubleshooting

### Erro: "API NÃO ESTÁ RESPONDENDO"
**Solução:** Certifique-se de que o servidor está rodando:
```bash
pnpm run dev
```

### Erro: "DATABASE_PROVIDER não encontrado"
**Solução:** Configure no `.env`:
```
DATABASE_PROVIDER=PRISMA
```

### Erro: "Connection refused"
**Solução:** Verifique se o banco de dados está rodando:
- MongoDB: `docker ps` (verificar container)
- DynamoDB: `pnpm run docker:dynamodb`

---

## 📚 Documentação Adicional

- **README completo:** `scripts/testes/07-testar-api-completo/README.txt`
- **Swagger:** http://localhost:4000/docs
- **Health Check:** http://localhost:4000/health

---

**Última atualização:** Janeiro 2025  
**Versão:** 4.1.0

