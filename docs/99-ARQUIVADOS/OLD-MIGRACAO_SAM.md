# ✅ Migração para AWS SAM - Concluída

## 📋 Resumo das Mudanças

A infraestrutura do projeto foi migrada do **Serverless Framework** para **AWS SAM** (Serverless Application Model).

### 🗑️ Arquivos Removidos

1. ❌ `serverless.yml` (raiz do projeto)
2. ❌ `src/lambda/serverless.yml`

### ✨ Arquivos Criados

1. ✅ `src/lambda/template.yaml` - Template SAM (único arquivo de IaC)
2. ✅ `src/lambda/README.md` - Documentação completa do SAM
3. ✅ `src/lambda/samconfig.toml.example` - Exemplo de configuração
4. ✅ `src/lambda/.gitignore` - Ignorar arquivos SAM temporários
5. ✅ `MIGRAÇÃO_SAM.md` - Este arquivo

### 🔄 Arquivos Modificados

1. ✏️ `package.json` - Scripts atualizados para SAM
2. ✏️ `.gitignore` - Adicionado entradas do SAM

---

## 🎯 Nova Estrutura

```
lambda/
├── handler.ts              # ✅ Adaptador NestJS → Lambda (mantido)
├── template.yaml           # ✅ Infraestrutura SAM (NOVO)
├── samconfig.toml.example  # ✅ Exemplo de configuração (NOVO)
├── .gitignore             # ✅ Ignora arquivos temporários (NOVO)
└── README.md              # ✅ Documentação completa (NOVO)
```

---

## 🚀 Como Usar

### 1. Pré-requisitos

```bash
# Instalar AWS CLI (se não tiver)
choco install awscli

# Instalar SAM CLI (se não tiver)
choco install aws-sam-cli

# Configurar credenciais AWS
aws configure
```

### 2. Validar Template

```bash
npm run sam:validate
```

### 3. Build da Aplicação

```bash
npm run build
```

### 4. Deploy

#### Deploy Guiado (Primeira Vez)

```bash
npm run sam:deploy:guided
```

Responda as perguntas:

- **Stack Name**: `blog-backend-api`
- **AWS Region**: `us-east-1`
- **Parameter Environment**: `dev`
- **Confirm changes**: `Y`
- **Allow IAM role creation**: `Y`
- **Save arguments**: `Y`

#### Deploys Subsequentes

```bash
# Deploy padrão (usa samconfig.toml)
npm run sam:deploy

# Deploy por ambiente
npm run sam:deploy:dev
npm run sam:deploy:staging
npm run sam:deploy:prod
```

### 5. Testar Localmente

```bash
# Iniciar API local na porta 4000
npm run sam:local

# Em outro terminal
curl http://localhost:4000/api/health
```

### 6. Ver Logs

```bash
npm run sam:logs
```

### 7. Deletar Stack (Cuidado!)

```bash
npm run sam:delete
```

---

## 📦 Recursos Criados

### Lambda Function

- **Nome**: `blog-backend-api-{ambiente}`
- **Runtime**: Node.js 18.x
- **Memória**: 512 MB
- **Timeout**: 30 segundos
- **Function URL**: Sim (com CORS)

### Tabelas DynamoDB (7 tabelas)

Todas com `PAY_PER_REQUEST` (sem custos fixos):

1. **users** - Usuários e autores
   - Índices: email, username, cognitoId
2. **posts** - Posts/artigos
   - Índices: slug, author, category, status
3. **categories** - Categorias
   - Índices: slug, parent
4. **comments** - Comentários
   - Índices: post, author, parent
5. **likes** - Curtidas
   - Índices: post, user, user-post
6. **bookmarks** - Posts salvos
   - Índices: post, user, user-post
7. **notifications** - Notificações
   - Índices: user, user-read

### Permissões IAM

- DynamoDB: Todas as operações CRUD
- CloudWatch: Logs
- X-Ray: Tracing

---

## 🔧 Scripts NPM Disponíveis

### SAM

```bash
npm run sam:validate          # Validar template.yaml
npm run sam:build            # Build da aplicação
npm run sam:local            # Iniciar API local
npm run sam:deploy           # Deploy padrão
npm run sam:deploy:dev       # Deploy dev
npm run sam:deploy:staging   # Deploy staging
npm run sam:deploy:prod      # Deploy prod
npm run sam:deploy:guided    # Deploy guiado (primeira vez)
npm run sam:logs             # Ver logs em tempo real
npm run sam:delete           # Deletar stack
npm run deploy               # Alias para sam:deploy
```

### Outros (mantidos)

```bash
npm run dev                  # Desenvolvimento local (NestJS)
npm run build                # Build
npm run dynamodb:create-tables  # Criar tabelas DynamoDB local
npm run dynamodb:seed        # Popular dados de teste
npm run prisma:seed          # Seed Prisma (MongoDB)
```

---

## 📊 Comparação: Serverless vs SAM

| Aspecto | Serverless Framework | AWS SAM |
|---------|---------------------|---------|
| Suporte | Comunidade | AWS Oficial |
| Sintaxe | YAML customizado | CloudFormation + Sugar |
| Local Testing | Offline plugin | Native (`sam local`) |
| Integração AWS | Wrapper | Nativo |
| Custo | Grátis (open-source) | Grátis (AWS native) |
| Curva de aprendizado | Baixa | Média |
| Controle | Médio | Alto (CloudFormation) |
| Recomendação | Multi-cloud | AWS Only ✅ |

---

## 💰 Custos Estimados

### Free Tier (12 meses)

- **Lambda**: 1M requisições/mês + 400.000 GB-s compute
- **DynamoDB**: 25 GB storage + 25 WCU + 25 RCU
- **CloudWatch**: 5 GB logs

### Após Free Tier

- **Dev**: ~$0-5/mês (uso mínimo)
- **Staging**: ~$5-20/mês (uso moderado)
- **Production**: ~$20-100/mês (uso alto)

---

## 🆘 Troubleshooting

### Erro: "Stack already exists"

```bash
# Atualizar stack existente
cd src/lambda
sam deploy --no-confirm-changeset
```

### Erro: "Insufficient permissions"

```bash
# Verificar usuário IAM
aws iam get-user
aws sts get-caller-identity
```

### Function URL não retorna

```bash
# Obter URL criada
aws cloudformation describe-stacks \
  --stack-name blog-backend-api \
  --query 'Stacks[0].Outputs[?OutputKey==`BlogApiFunctionUrl`].OutputValue' \
  --output text
```

### Build falha

```bash
# Garantir que dist/ existe
npm run build

# Verificar se template.yaml está correto
npm run sam:validate
```

---

## 📚 Documentação

- **SAM**: Ver `src/lambda/README.md` (completo)
- **AWS SAM Docs**: <https://docs.aws.amazon.com/serverless-application-model/>
- **SAM CLI**: <https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html>

---

## ✅ Checklist de Migração

- [x] Criar template.yaml
- [x] Remover serverless.yml (raiz)
- [x] Remover serverless.yml (lambda/)
- [x] Atualizar scripts package.json
- [x] Atualizar .gitignore
- [x] Criar documentação
- [x] Criar exemplo samconfig.toml
- [ ] Testar deploy em ambiente de dev
- [ ] Configurar CI/CD (se aplicável)
- [ ] Atualizar documentação do projeto principal

---

## 🔜 Próximos Passos

1. **Testar localmente**:

   ```bash
   npm run sam:validate
   npm run build
   npm run sam:local
   ```

2. **Fazer primeiro deploy**:

   ```bash
   npm run sam:deploy:guided
   ```

3. **Verificar Function URL**:
   - AWS Console → CloudFormation → Stacks → blog-backend-api
   - Tab "Outputs" → `BlogApiFunctionUrl`

4. **Testar API**:

   ```bash
   curl https://{function-url}/api/health
   ```

5. **Configurar domínio customizado** (opcional):
   - Route 53 + API Gateway Custom Domain
   - Ou CloudFront + Function URL

---

## 🎉 Benefícios da Migração

1. ✅ **Suporte oficial AWS** - Manutenção e atualizações garantidas
2. ✅ **CloudFormation nativo** - Melhor integração com ecosystem AWS
3. ✅ **Sem dependências externas** - Não precisa do serverless-framework
4. ✅ **Teste local nativo** - `sam local` sem plugins
5. ✅ **Melhor debugging** - Integração com AWS Toolkit
6. ✅ **Infrastructure as Code** - Versionável, replicável, auditável
7. ✅ **Multi-ambiente** - Dev, Staging, Prod isolados
8. ✅ **Rollback automático** - CloudFormation gerencia state

---

## 📞 Suporte

Dúvidas ou problemas? Consulte:

1. `src/lambda/README.md` - Documentação completa
2. AWS SAM Docs - <https://docs.aws.amazon.com/serverless-application-model/>
3. AWS Support - <https://console.aws.amazon.com/support/>

---

**Data da Migração**: 16/10/2025  
**Versão**: 1.0.0  
**Status**: ✅ Concluída
