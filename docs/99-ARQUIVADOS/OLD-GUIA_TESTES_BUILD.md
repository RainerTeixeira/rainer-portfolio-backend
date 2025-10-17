# 🧪 Guia Completo de Testes - Build & Deploy

## 📋 **Checklist de Validação**

### ✅ **Fase 1: Validação de Arquivos**
- [ ] Schema Prisma válido
- [ ] Template SAM válido
- [ ] TypeScript compila sem erros
- [ ] Linter sem erros críticos

### ✅ **Fase 2: Build Local**
- [ ] `npm run build` - NestJS compila
- [ ] Arquivos em `dist/` gerados
- [ ] Lambda handler presente

### ✅ **Fase 3: Validação SAM**
- [ ] `npm run sam:validate` - Template válido
- [ ] `npm run sam:build` - Lambda empacotado

### ✅ **Fase 4: Testes**
- [ ] `npm run test` - Testes unitários
- [ ] `npm run test:coverage` - Cobertura mínima
- [ ] `npm run lint` - Código limpo

### ✅ **Fase 5: Ambiente Local**
- [ ] MongoDB rodando (Docker)
- [ ] DynamoDB Local rodando (Docker)
- [ ] Servidor dev iniciando (`npm run dev`)

### ✅ **Fase 6: Deploy (Opcional)**
- [ ] `npm run sam:deploy:dev` - Deploy teste

---

## 🚀 **EXECUÇÃO - Passo a Passo**

### **1️⃣ Validar Prisma**
```bash
npm run prisma:format
npm run prisma:generate
```
**Esperado**: ✅ Cliente Prisma gerado

---

### **2️⃣ Build Local (NestJS)**
```bash
npm run build
```
**Esperado**: 
- ✅ Pasta `dist/` criada
- ✅ Arquivo `dist/main.js` existe
- ✅ Arquivo `dist/lambda/handler.js` existe

**Verificar**:
```bash
ls dist/
ls dist/lambda/
```

---

### **3️⃣ Validar Template SAM**
```bash
npm run sam:validate
```
**Esperado**: ✅ `template.yaml is a valid SAM Template`

**Ver log**:
```bash
cat logs/sam-validate.log
```

---

### **4️⃣ Build SAM (empacotamento Lambda)**
```bash
npm run sam:build
```
**Esperado**:
- ✅ `.aws-sam/build/` criado
- ✅ Dependências copiadas
- ✅ Código compilado empacotado

**Ver log**:
```bash
cat logs/sam-build.log
```

**Verificar estrutura**:
```bash
ls src/lambda/.aws-sam/build/BlogApiFunction/
```

---

### **5️⃣ Testes Unitários**
```bash
npm run test
```
**Esperado**: ✅ Todos os testes passando

**Ver resultado**:
```bash
cat logs/test.log
```

---

### **6️⃣ Cobertura de Código**
```bash
npm run test:coverage
```
**Esperado**: 
- ✅ Cobertura > 80%
- ✅ Relatório em `coverage/`

**Ver relatório**:
```bash
start coverage/index.html   # Windows
# ou
open coverage/index.html    # Mac/Linux
```

---

### **7️⃣ Linter**
```bash
npm run lint
```
**Esperado**: ✅ Sem erros críticos

**Ver log**:
```bash
cat logs/lint.log
```

---

### **8️⃣ Testar Servidor Local**
```bash
# Terminal 1: Subir infraestrutura
docker-compose up -d

# Terminal 2: Iniciar servidor
npm run dev
```

**Esperado**:
- ✅ MongoDB conectado
- ✅ Servidor rodando em `http://localhost:3000`
- ✅ Swagger em `http://localhost:3000/api`

**Testar API**:
```bash
curl http://localhost:3000/health
```

---

### **9️⃣ Seed de Dados (Opcional)**
```bash
# MongoDB
npm run mongodb:seed

# DynamoDB Local
npm run dynamodb:create-tables
npm run dynamodb:seed
```

---

### **🔟 Deploy SAM (AWS) - OPCIONAL**

⚠️ **ANTES DE FAZER DEPLOY**:
1. Configurar credenciais AWS: `aws configure`
2. Criar bucket S3: `aws s3 mb s3://seu-bucket-sam`

```bash
# Validar + Build + Deploy Dev
npm run sam:deploy:dev

# OU Deploy Guided (primeira vez)
npm run sam:deploy:guided
```

**Esperado**:
- ✅ Stack criada
- ✅ Lambda Function URL retornada
- ✅ DynamoDB tables criadas

---

## 📊 **Resumo dos Comandos**

| Comando | Finalidade | Tempo |
|---------|------------|-------|
| `npm run build` | Compilar TypeScript → `dist/` | ~30s |
| `npm run sam:validate` | Validar `template.yaml` | ~5s |
| `npm run sam:build` | Empacotar Lambda | ~1min |
| `npm run test` | Rodar testes unitários | ~20s |
| `npm run test:coverage` | Cobertura de código | ~30s |
| `npm run lint` | Verificar código | ~10s |
| `npm run dev` | Servidor local | ∞ |
| `npm run sam:deploy:dev` | Deploy AWS Dev | ~5min |

---

## 🎯 **Validação Rápida (5 minutos)**

```bash
# 1. Build
npm run build

# 2. Validar SAM
npm run sam:validate

# 3. Build SAM
npm run sam:build

# 4. Testes
npm run test

# 5. Lint
npm run lint

# ✅ Se todos passarem = PRONTO PARA DEPLOY!
```

---

## 🐛 **Troubleshooting**

### **Erro: `nest: command not found`**
```bash
npm install -g @nestjs/cli
```

### **Erro: `sam: command not found`**
```bash
# Windows
choco install aws-sam-cli

# Mac
brew install aws-sam-cli

# Linux
pip install aws-sam-cli
```

### **Erro: `dist/lambda/handler.js` não existe**
```bash
# Verificar se o build NestJS incluiu a pasta lambda
npm run build

# Se não criou, verificar tsconfig.json:
# "include": ["src/**/*"]
```

### **Erro: SAM Build falha**
```bash
# Limpar e reconstruir
rm -rf src/lambda/.aws-sam
npm run build
npm run sam:build
```

---

## 📚 **Documentação Relacionada**

- [NestJS Build](https://docs.nestjs.com/cli/overview#nest-build)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [Jest Testing](https://jestjs.io/docs/getting-started)

---

## ✅ **Critérios de Sucesso**

Para considerar o projeto **pronto para produção**:

1. ✅ `npm run build` - Sucesso
2. ✅ `npm run sam:validate` - Template válido
3. ✅ `npm run sam:build` - Build sem erros
4. ✅ `npm run test` - 100% dos testes passando
5. ✅ `npm run test:coverage` - Cobertura > 80%
6. ✅ `npm run lint` - Sem erros críticos
7. ✅ `npm run dev` - Servidor inicia sem erros
8. ✅ Swagger acessível em `/api`

---

**Status**: 🚀 **PRONTO PARA VALIDAÇÃO!**

