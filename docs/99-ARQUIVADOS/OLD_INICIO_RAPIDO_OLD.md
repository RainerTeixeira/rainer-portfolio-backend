# 🚀 INÍCIO RÁPIDO - Ambiente Local

## ⚡ Comandos Principais

### 1️⃣ Opção 1: Apenas MongoDB (Recomendado para Desenvolvimento)

```powershell
# Iniciar MongoDB
docker-compose up -d mongodb

# Aguardar 10 segundos para o MongoDB inicializar
Start-Sleep -Seconds 10

# Iniciar a aplicação
npm run start:dev
```

**Acessar:**
- API: http://localhost:4000
- Swagger: http://localhost:4000/api
- Prisma Studio: `npm run prisma:studio` (depois acessar http://localhost:5555)

---

### 2️⃣ Opção 2: MongoDB com Interface Visual

```powershell
# Iniciar MongoDB + Prisma Studio
docker-compose up -d mongodb

# Aguardar MongoDB inicializar
Start-Sleep -Seconds 10

# Iniciar Prisma Studio (interface gráfica)
npm run prisma:studio

# Em outro terminal, iniciar a aplicação
npm run start:dev
```

**Acessar:**
- API: http://localhost:4000
- Swagger: http://localhost:4000/api
- Prisma Studio: http://localhost:5555

---

### 3️⃣ Opção 3: Apenas DynamoDB Local

```powershell
# Iniciar DynamoDB Local
docker-compose up -d dynamodb-local

# Aguardar DynamoDB inicializar
Start-Sleep -Seconds 5

# Alterar para DynamoDB no .env
.\scripts\alternar-banco.ps1 DYNAMODB

# Criar tabelas
npm run dynamodb:create-tables

# Iniciar a aplicação
npm run start:dev
```

**Acessar:**
- API: http://localhost:4000
- Swagger: http://localhost:4000/api
- DynamoDB Admin: Instalar com `npm install -g dynamodb-admin` e rodar `dynamodb-admin`

---

### 4️⃣ Opção 4: Tudo Junto (MongoDB + DynamoDB)

```powershell
# Iniciar MongoDB e DynamoDB simultaneamente
docker-compose up -d mongodb dynamodb-local

# Aguardar inicialização
Start-Sleep -Seconds 10

# Iniciar aplicação (usará o banco configurado no .env)
npm run start:dev
```

**Para alternar entre bancos:**

```powershell
# Ver qual banco está ativo
.\scripts\alternar-banco.ps1 status

# Mudar para MongoDB
.\scripts\alternar-banco.ps1 PRISMA

# Mudar para DynamoDB
.\scripts\alternar-banco.ps1 DYNAMODB
```

---

## 🔧 Comandos Úteis

### Verificar Status dos Containers

```powershell
docker ps
```

### Ver Logs

```powershell
# Logs de todos os serviços
docker-compose logs -f

# Logs do MongoDB
docker-compose logs -f mongodb

# Logs do DynamoDB
docker-compose logs -f dynamodb-local
```

### Parar Serviços

```powershell
# Parar tudo
docker-compose down

# Parar apenas MongoDB
docker-compose stop mongodb

# Parar apenas DynamoDB
docker-compose stop dynamodb-local
```

### Reiniciar

```powershell
# Reiniciar tudo
docker-compose restart

# Reiniciar apenas MongoDB
docker-compose restart mongodb
```

### Limpar Tudo (⚠️ APAGA DADOS!)

```powershell
# Parar e remover todos os volumes
docker-compose down -v
```

---

## 📊 Banco de Dados Atual

Verifique qual banco está ativo:

```powershell
.\scripts\alternar-banco.ps1 status
```

---

## 🎯 Workflow Recomendado

### Para Desenvolvimento Diário:

1. **Iniciar MongoDB:**
   ```powershell
   docker-compose up -d mongodb
   ```

2. **Iniciar Aplicação:**
   ```powershell
   npm run start:dev
   ```

3. **Acessar Swagger:**
   - http://localhost:4000/api

### Para Testar com DynamoDB:

1. **Alterar Banco:**
   ```powershell
   .\scripts\alternar-banco.ps1 DYNAMODB
   ```

2. **Iniciar DynamoDB:**
   ```powershell
   docker-compose up -d dynamodb-local
   ```

3. **Criar Tabelas:**
   ```powershell
   npm run dynamodb:create-tables
   ```

4. **Reiniciar Aplicação:**
   ```powershell
   npm run start:dev
   ```

---

## 🆘 Problemas Comuns

### Porta já em uso

```powershell
# Encontrar processo na porta 27017 (MongoDB)
netstat -ano | findstr :27017

# Ou porta 8000 (DynamoDB)
netstat -ano | findstr :8000

# Matar processo (substitua <PID>)
taskkill /PID <PID> /F
```

### Container não inicia

```powershell
# Ver logs
docker-compose logs mongodb

# Remover e recriar
docker-compose down
docker-compose up -d mongodb
```

### MongoDB "Replica set not initialized"

```powershell
# Conectar ao MongoDB
docker exec -it blogapi-mongodb mongosh

# Inicializar replica set
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})
```

---

## 📚 Mais Informações

Veja o guia completo em: [GUIA_AMBIENTE_LOCAL.md](./GUIA_AMBIENTE_LOCAL.md)

---

## ✅ Checklist Rápido

- [ ] Docker Desktop está rodando
- [ ] Executou `npm install`
- [ ] Iniciou MongoDB ou DynamoDB
- [ ] Configurou o `.env` corretamente
- [ ] Executou `npm run start:dev`
- [ ] Acessou http://localhost:4000/api

---

**Pronto para começar!** 🎉

