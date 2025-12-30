# 🚀 Guia de Produção

## 🎯 Visão Geral

Checklist completo e guia para deploy da arquitetura Cognito + MongoDB em produção.

---

## ✅ Status Atual

**Sistema:** 100% Completo e Testado

- ✅ Backend implementado
- ✅ Testes passando (6/6)
- ✅ Índices corrigidos
- ✅ Seed funcional
- ✅ Zero erros

---

## 📋 Checklist Pré-Deploy

### 1. Código
- [x] Schema Prisma sem campo email
- [x] Seed não insere email
- [x] Repository usa findByCognitoSub
- [x] Controller tem endpoint /cognito/:cognitoSub
- [x] Service valida que email não é aceito
- [x] Swagger documentado

### 2. Testes
- [x] Testes unitários passando (6/6)
- [x] Seed executado com sucesso
- [x] MongoDB sem campos email
- [x] Todos usuários têm cognitoSub

### 3. Índices MongoDB
- [x] Índice antigo users_email_key removido
- [x] Script de correção criado
- [x] Validação executada

### 4. Documentação
- [x] Arquitetura documentada
- [x] Implementação documentada
- [x] Guia de produção criado

---

## 🔧 Scripts de Correção

### 1. Remover Índice Antigo

**Arquivo:** `scripts/fix-mongodb-indexes.mjs`

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIndexes() {
  try {
    console.log('🔍 Removendo índice antigo users_email_key...');
    
    await prisma.$runCommandRaw({
      dropIndexes: 'users',
      index: 'users_email_key'
    });
    
    console.log('✅ Índice removido com sucesso!');
  } catch (error) {
    if (error.message.includes('index not found')) {
      console.log('ℹ️  Índice já foi removido anteriormente');
    } else {
      console.error('❌ Erro:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixIndexes();
```

**Executar:**
```bash
node scripts/fix-mongodb-indexes.mjs
```

### 2. Popular Banco

```bash
npx tsx src/prisma/mongodb.seed.ts
```

**Saída esperada:**
```
🌱 Iniciando seed do MongoDB...
✅ 5 usuários criados (email gerenciado pelo Cognito)
✅ Seed concluído com sucesso!
```

---

## 🔍 Validações

### 1. MongoDB

```bash
# Verificar que não há emails
mongosh mongodb://localhost:27017/blog --eval "db.users.find({email: {\$exists: true}}).count()"
# Resultado esperado: 0

# Verificar cognitoSub
mongosh mongodb://localhost:27017/blog --eval "db.users.find({cognitoSub: {\$exists: false}}).count()"
# Resultado esperado: 0

# Listar usuários
mongosh mongodb://localhost:27017/blog --eval "db.users.find({}, {username: 1, cognitoSub: 1}).pretty()"
```

### 2. Endpoints

```bash
# Testar endpoint de busca por cognitoSub
curl http://localhost:4000/users/cognito/cognito-abc123

# Testar que update não aceita email
curl -X PATCH http://localhost:4000/users/123 \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Deve retornar erro 400
```

### 3. Testes

```bash
npm run test
```

**Resultado esperado:**
```
Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total

✅ MongoDB Seed
  ✅ should not have email field in User model
  ✅ should have cognitoSub field in User model
  ✅ should create user without email field

✅ UsersRepository
  ✅ should not have findByEmail method
  ✅ should have findByCognitoSub method
  ✅ should find user by cognitoSub
```

---

## 🚀 Deploy em Produção

### Passo 1: Backup

```bash
# Backup do MongoDB
mongodump --uri="mongodb://production-uri" --out=backup-$(date +%Y%m%d)

# Verificar backup
ls -lh backup-*
```

### Passo 2: Executar Script de Correção

```bash
# Em produção
NODE_ENV=production node scripts/fix-mongodb-indexes.mjs
```

### Passo 3: Validar Índices

```bash
# Verificar índices
mongosh mongodb://production-uri --eval "db.users.getIndexes()"

# Não deve conter users_email_key
```

### Passo 4: Deploy da Aplicação

```bash
# Build
npm run build

# Iniciar
npm run start:prod
```

### Passo 5: Validação Pós-Deploy

```bash
# Health check
curl https://api.production.com/health

# Verificar endpoint
curl https://api.production.com/users/cognito/cognito-abc123

# Verificar Swagger
curl https://api.production.com/docs
```

---

## 📊 Monitoramento

### Métricas a Monitorar

1. **Erros de Autenticação**
   - Taxa de falha de login
   - Erros de token inválido
   - Tentativas de acesso não autorizado

2. **Performance**
   - Tempo de resposta dos endpoints
   - Queries no MongoDB
   - Latência do Cognito

3. **Dados**
   - Usuários sem cognitoSub (deve ser 0)
   - Usuários com email no MongoDB (deve ser 0)
   - Índices corretos

### Logs Importantes

```typescript
// Monitorar estes logs
logger.error('Email não pode ser atualizado aqui');
logger.warn('Usuário não encontrado por cognitoSub');
logger.info('Usuário criado com sucesso');
```

---

## ⚠️ Troubleshooting

### Problema: Índice antigo ainda existe

**Solução:**
```bash
# Remover manualmente
mongosh mongodb://uri --eval "db.users.dropIndex('users_email_key')"
```

### Problema: Seed falha

**Solução:**
```bash
# Verificar conexão
mongosh mongodb://uri --eval "db.runCommand({ping: 1})"

# Limpar e recriar
npm run prisma:reset
npx tsx src/prisma/mongodb.seed.ts
```

### Problema: Endpoint não encontra usuário

**Solução:**
```bash
# Verificar cognitoSub no MongoDB
mongosh mongodb://uri --eval "db.users.findOne({cognitoSub: 'cognito-abc123'})"

# Verificar se usuário existe no Cognito
aws cognito-idp admin-get-user --user-pool-id <pool-id> --username <username>
```

---

## 🔄 Rollback

### Se necessário reverter

1. **Restaurar backup**
```bash
mongorestore --uri="mongodb://uri" --drop backup-20250101/
```

2. **Reverter código**
```bash
git revert <commit-hash>
git push
```

3. **Validar**
```bash
npm run test
curl https://api.production.com/health
```

---

## 📈 Métricas de Sucesso

### Técnicas
- ✅ 0 erros em produção
- ✅ 100% dos testes passando
- ✅ 0 campos email no MongoDB
- ✅ Tempo de resposta < 200ms

### Negócio
- ✅ 0 reclamações de usuários
- ✅ 100% dos fluxos funcionando
- ✅ 0 downtime não planejado

---

## 🎯 Checklist Final

### Antes do Deploy
- [x] Código revisado
- [x] Testes passando
- [x] Documentação atualizada
- [x] Backup criado
- [x] Script de correção testado

### Durante o Deploy
- [ ] Executar script de correção
- [ ] Deploy da aplicação
- [ ] Validar endpoints
- [ ] Verificar logs

### Após o Deploy
- [ ] Monitorar por 24h
- [ ] Validar fluxos principais
- [ ] Coletar feedback
- [ ] Documentar lições aprendidas

---

## 🔗 Links Relacionados

- [ARQUITETURA_COGNITO_MONGODB.md](ARQUITETURA_COGNITO_MONGODB.md) - Arquitetura
- [GUIA_IMPLEMENTACAO_BACKEND.md](GUIA_IMPLEMENTACAO_BACKEND.md) - Implementação
- [03-GUIAS/GUIA_INTEGRACAO_AUTH.md](../03-GUIAS/GUIA_INTEGRACAO_AUTH.md) - Integração

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Produção
