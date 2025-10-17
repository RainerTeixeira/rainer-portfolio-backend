# 🐛 Guia de Troubleshooting - Scripts de Inicialização

**Objetivo:** Resolver problemas comuns nos scripts de inicialização  
**Nível:** Todos  
**Atualizado:** 17/10/2025

---

## 📋 Índice

1. [Script Trava na Criação de Tabelas DynamoDB](#-script-trava-na-criação-de-tabelas-dynamodb)
2. [MongoDB Replica Set Não Inicializa](#-mongodb-replica-set-não-inicializa)
3. [Porta em Uso](#-porta-em-uso)
4. [Docker Não Está Rodando](#-docker-não-está-rodando)
5. [Prisma Client Não Encontrado](#-prisma-client-não-encontrado)
6. [Soluções Rápidas](#-soluções-rápidas)

---

## 🔴 Script Trava na Criação de Tabelas DynamoDB

### Sintoma

```
🔍 Verificando conexão...
[TRAVA AQUI - não continua]
```

### Causa Raiz

O script `dynamodb:create-tables` está tentando se conectar ao DynamoDB Local, mas pode haver um problema de:
1. Timeout muito longo
2. Credenciais não configuradas corretamente
3. DynamoDB ainda não pronto (apesar do healthcheck)

### ✅ Solução 1: Pular Criação de Tabelas (Recomendado)

O DynamoDB Local **já está rodando e funcional**, mas as tabelas são opcionais. O script pode continuar mesmo sem criar as tabelas agora.

**Modificação no script:**

```batch
:: Linha 213-221 do iniciar-servidor-completo.bat
echo %YELLOW%🏗️  %BOLD%Criando tabelas no DynamoDB...%RESET%
call npm run dynamodb:create-tables

:: ALTERAR PARA (adicionar timeout):
start /B cmd /c "timeout /t 30 >nul && taskkill /F /IM tsx.exe /FI \"WINDOWTITLE eq dynamodb*\" >nul 2>&1"
call npm run dynamodb:create-tables

:: Ou comentar completamente:
REM call npm run dynamodb:create-tables
```

### ✅ Solução 2: Criar Tabelas Manualmente Depois

```bash
# 1. Deixe o script continuar (ou use Ctrl+C)

# 2. Aguardar mais 10 segundos para DynamoDB estabilizar
timeout /t 10

# 3. Criar tabelas manualmente
npm run dynamodb:create-tables

# 4. Se travar novamente, use comando direto:
$env:AWS_ACCESS_KEY_ID="local"
$env:AWS_SECRET_ACCESS_KEY="local"  
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# 5. Criar tabelas uma por uma via AWS CLI (mais confiável)
```

### ✅ Solução 3: Aumentar Tempo de Espera do DynamoDB

```batch
:: No script, linha 128-144
:: ALTERAR DE:
set "steps=5"

:: PARA:
set "steps=15"

:: Isso dá 15 segundos para DynamoDB se estabilizar completamente
```

### ✅ Solução 4: Verificar e Reiniciar DynamoDB

```bash
# 1. Parar script atual (Ctrl+C)

# 2. Verificar container
docker ps | findstr dynamodb

# 3. Ver logs
docker logs blogapi-dynamodb --tail 50

# 4. Reiniciar container
docker restart blogapi-dynamodb

# 5. Aguardar 10 segundos
timeout /t 10

# 6. Testar conexão
curl http://localhost:8000

# 7. Criar tabelas
npm run dynamodb:create-tables
```

### 💡 Workaround Temporário

**Se o script sempre travar no DynamoDB, use esta versão simplificada:**

```batch
:: Comente as linhas 204-222 do script
:: E continue apenas com MongoDB

:: Ou execute o script modificado:
iniciar-ambiente-local-MongoDB+Prisma.bat
```

**Este script:**
- ✅ Inicia apenas MongoDB
- ✅ Configura Prisma
- ✅ Popula dados
- ✅ Inicia servidor
- ✅ **Não depende de DynamoDB**

---

## 🔴 MongoDB Replica Set Não Inicializa

### Sintoma

```
⚠️  Replica Set ainda não está pronto
MongoServerError: not master and slaveOk=false
```

### Solução

```bash
# 1. Aguardar mais tempo (até 30s)
timeout /t 30

# 2. Verificar status do Replica Set
docker exec -it blogapi-mongodb mongosh --eval "rs.status()"

# 3. Inicializar manualmente se necessário
docker exec -it blogapi-mongodb mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"

# 4. Confirmar iniciado
docker exec -it blogapi-mongodb mongosh --eval "rs.status().ok"

# 5. Re-executar script
.\iniciar-servidor-completo.bat
```

---

## 🔴 Porta em Uso

### Sintoma

```
Error: Port 4000 is already in use
Error: bind: address already in use
```

### Solução

```bash
# Ver o que está usando cada porta
netstat -ano | findstr :4000    # API
netstat -ano | findstr :27017   # MongoDB
netstat -ano | findstr :8000    # DynamoDB
netstat -ano | findstr :5555    # Prisma Studio

# Parar containers
docker-compose down

# Ou matar processo específico
taskkill /PID [PID_NUMBER] /F

# Re-executar script
.\iniciar-servidor-completo.bat
```

---

## 🔴 Docker Não Está Rodando

### Sintoma

```
❌ Docker não está rodando!
error during connect: this error may indicate that the docker daemon is not running
```

### Solução

```bash
# 1. Abrir Docker Desktop

# 2. Aguardar ícone ficar verde (Engine running)

# 3. Verificar
docker ps

# 4. Executar script novamente
.\iniciar-servidor-completo.bat
```

---

## 🔴 Prisma Client Não Encontrado

### Sintoma

```
Error: Cannot find module '@prisma/client'
PrismaClientInitializationError
```

### Solução

```bash
# 1. Gerar Prisma Client
npm run prisma:generate

# 2. Se persistir, reinstalar
npm install @prisma/client
npm run prisma:generate

# 3. Executar script novamente
.\iniciar-servidor-completo.bat
```

---

## ⚡ Soluções Rápidas

### Reset Completo

```bash
# 1. Parar tudo
docker-compose down -v

# 2. Limpar
.\scripts\limpar-ambiente.bat

# 3. Reinstalar
npm install

# 4. Iniciar tudo
.\iniciar-servidor-completo.bat
```

### Pular DynamoDB Temporariamente

```bash
# Use o script alternativo que só usa MongoDB
.\iniciar-ambiente-local-MongoDB+Prisma.bat

# Vantagens:
# ✅ Mais rápido (~20s vs ~30s)
# ✅ Não depende de DynamoDB
# ✅ Tudo funciona perfeitamente
# ✅ Pode adicionar DynamoDB depois
```

### Verificar Ambiente Antes de Iniciar

```bash
# Sempre execute primeiro:
.\verificar-ambiente.bat

# Isso mostra:
# ✅ O que está funcionando
# ❌ O que precisa corrigir
# 💡 Sugestões de solução
```

---

## 🔧 Modificações Recomendadas no Script

### 1. Tornar DynamoDB Opcional

**Arquivo:** `iniciar-servidor-completo.bat`  
**Linha:** 213-221

```batch
:: ANTES:
call npm run dynamodb:create-tables

:: DEPOIS (com timeout):
start /B cmd /c "timeout /t 30 >nul && taskkill /F /IM tsx.exe 2>nul"
call npm run dynamodb:create-tables

:: Ou totalmente opcional:
echo %YELLOW%Criando tabelas DynamoDB (pode levar até 30s)...%RESET%
echo %WHITE%   Pressione Ctrl+C se travar e continue manualmente depois%RESET%
timeout /t 3 /nobreak >nul
start /min cmd /c "npm run dynamodb:create-tables"
timeout /t 5 /nobreak >nul
```

### 2. Aumentar Tempo de Espera do DynamoDB

**Linha:** 131

```batch
:: ANTES:
set "steps=5"

:: DEPOIS:
set "steps=15"
```

Isso dá 15 segundos (ao invés de 5) para o DynamoDB se estabilizar.

### 3. Adicionar Verificação de Saúde

**Após linha 144:**

```batch
:: Verificar se DynamoDB está realmente pronto
echo %CYAN%🔍 Verificando DynamoDB...%RESET%
curl -s http://localhost:8000 >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠️  DynamoDB pode não estar totalmente pronto%RESET%
    echo %WHITE%   Aguardando mais 10 segundos...%RESET%
    timeout /t 10 /nobreak >nul
)
```

---

## 📊 Diagnóstico Completo

### Executar em Ordem

```bash
# 1. Verificar ambiente
.\verificar-ambiente.bat

# 2. Ver status containers
.\status-containers.bat

# 3. Ver logs dos containers
docker-compose logs -f

# 4. Testar conectividade DynamoDB
curl http://localhost:8000

# 5. Testar AWS CLI local
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# 6. Ver processos tsx rodando
Get-Process tsx -ErrorAction SilentlyContinue
```

---

## 💡 Recomendações

### Para Desenvolvimento Rápido

**Use:** `iniciar-ambiente-local-MongoDB+Prisma.bat`

- ✅ Mais confiável
- ✅ Mais rápido
- ✅ MongoDB completo
- ✅ Prisma Studio
- ✅ Servidor rodando
- ⏭️ DynamoDB pode ser adicionado depois se necessário

### Para Ambiente Completo

**Use:** `iniciar-servidor-completo.bat` mas:
1. Aguarde pacientemente (pode levar 30-40s total)
2. Se travar no DynamoDB, pressione Ctrl+C
3. Continue apenas com MongoDB (já está rodando)
4. Crie tabelas DynamoDB depois manualmente

### Para DynamoDB Apenas

**Use:** `iniciar-ambiente-dynamodb-Local.bat`

- Se precisar especificamente de DynamoDB
- Mais rápido (~20s)
- Foco em testes pré-produção

---

## 🎯 Fluxo Recomendado

```batch
:: 1. SEMPRE verificar ambiente primeiro
.\verificar-ambiente.bat

:: 2. Escolher script baseado na necessidade:

:: Opção A: Desenvolvimento diário (MAIS RÁPIDO)
.\iniciar-ambiente-local-MongoDB+Prisma.bat

:: Opção B: Ambiente completo (MAIS COMPLETO)
.\iniciar-servidor-completo.bat
:: Se travar no DynamoDB: Ctrl+C e continuar com MongoDB

:: Opção C: Apenas DynamoDB (PRÉ-DEPLOY)
.\iniciar-ambiente-dynamodb-Local.bat

:: 3. Após ambiente rodando:
npm run dev                          :: Iniciar servidor
http://localhost:4000/docs           :: Testar API
```

---

## 📝 Logs Úteis

### Localização

```
logs/
├── seed.log                    # Seed do MongoDB
├── dynamodb-create-tables.log  # Criação de tabelas DynamoDB
├── docker-up.log               # Docker compose up
├── test.log                    # Testes
└── build.log                   # Build NestJS
```

### Como Ver

```bash
# Ver log específico
Get-Content logs/dynamodb-create-tables.log

# Ver em tempo real
Get-Content logs/dynamodb-create-tables.log -Wait

# Ver últimas 20 linhas
Get-Content logs/dynamodb-create-tables.log -Tail 20
```

---

## 🚀 Conclusão

### Se o Script Travar

1. ✅ **Não entre em pânico** - MongoDB já está rodando
2. ✅ **Use Ctrl+C** - Para o script
3. ✅ **Inicie servidor** - `npm run dev`
4. ✅ **Crie tabelas DynamoDB depois** - Quando precisar

### Alternativa Simples

```bash
# Versão sem DynamoDB (SEMPRE FUNCIONA):
.\iniciar-ambiente-local-MongoDB+Prisma.bat

# + Se precisar de DynamoDB:
docker-compose up -d dynamodb-local
npm run dynamodb:create-tables  # Execute manualmente
```

**MongoDB é suficiente para desenvolvimento!** 🎉

---

**Criado em:** 17/10/2025  
**Versão:** 1.0  
**Status:** ✅ Guia de Troubleshooting Completo

