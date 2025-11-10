# 🚀 AWS SAM - Infraestrutura como Código

Este diretório contém a infraestrutura serverless da aplicação usando **AWS SAM (Serverless Application Model)**.

## 📁 Estrutura

```
lambda/
├── handler.ts        # Adaptador NestJS → Lambda
├── template.yaml     # Infraestrutura SAM (único arquivo de IaC)
└── README.md         # Este arquivo
```

## 🎯 Por que SAM?

AWS SAM é um framework open-source da AWS para construir aplicações serverless:

- ✅ **Nativo AWS**: Suporte oficial da AWS
- ✅ **Simples**: Sintaxe mais simples que CloudFormation puro
- ✅ **Integrado**: Funciona com CloudFormation, CodePipeline, etc.
- ✅ **Local Testing**: Teste localmente com `sam local`
- ✅ **Custo Zero**: Sem custos adicionais, apenas recursos AWS

## 📦 Pré-requisitos

```bash
# Instalar AWS CLI
# Windows (via Chocolatey)
choco install awscli

# Instalar SAM CLI
# Windows (via Chocolatey)
choco install aws-sam-cli

# Verificar instalação
aws --version
sam --version
```

## 🔧 Configuração AWS

```bash
# Configurar credenciais AWS
aws configure

# Inserir:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

## 🚀 Deployment

### 1. Build da aplicação

```bash
# Na raiz do projeto
npm run build
```

### 2. Deploy com SAM

```bash
# Deploy interativo (primeira vez)
cd src/lambda
sam deploy --guided

# Configurações sugeridas:
# - Stack Name: blog-backend-api
# - AWS Region: us-east-1
# - Parameter Environment: dev
# - Confirm changes before deploy: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to configuration file: Y

# Deploys subsequentes (usa samconfig.toml)
sam deploy
```

### 3. Deploy para diferentes ambientes

```bash
# Development
sam deploy --parameter-overrides Environment=dev

# Staging
sam deploy --parameter-overrides Environment=staging --stack-fullName blog-backend-api-staging

# Production
sam deploy --parameter-overrides Environment=prod --stack-fullName blog-backend-api-prod
```

## 🧪 Teste Local

### Iniciar API localmente

```bash
# Iniciar Lambda local
sam local start-api --port 4000

# Testar
curl http://localhost:${PORT:-4000}/api/health  # Usa PORT do .env
```

### Invocar função diretamente

```bash
# Invocar função com evento
sam local invoke BlogApiFunction --event events/test-event.json
```

## 📊 Recursos Criados

O `template.yaml` cria automaticamente:

### Lambda Function

- **Nome**: `{StackName}-api-{Environment}`
- **Runtime**: Node.js 18.x
- **Memória**: 512 MB
- **Timeout**: 30 segundos
- **URL**: Function URL com CORS habilitado

### Tabelas DynamoDB (7 tabelas)

1. **users** - Usuários e autores
2. **posts** - Posts/artigos
3. **categories** - Categorias
4. **comments** - Comentários
5. **likes** - Curtidas
6. **bookmarks** - Posts salvos
7. **notifications** - Notificações

Todas com:

- **Billing**: Pay-per-request (sem custos fixos)
- **Indexes**: GSIs otimizados para queries
- **Backup**: Point-in-time recovery (apenas prod)
- **Streams**: Habilitados para auditoria

### IAM Roles

- Permissões automáticas para DynamoDB
- CloudWatch Logs
- X-Ray Tracing

## 📝 Comandos Úteis

```bash
# Validar template
sam validate

# Ver logs em tempo real
sam logs -n BlogApiFunction --stack-fullName blog-backend-api --tail

# Listar stacks
aws cloudformation list-stacks

# Ver outputs da stack
aws cloudformation describe-stacks --stack-fullName blog-backend-api --query 'Stacks[0].Outputs'

# Deletar stack (cuidado!)
sam delete --stack-fullName blog-backend-api
```

## 🔐 Variáveis de Ambiente

As seguintes variáveis são configuradas automaticamente:

```yaml
NODE_ENV: dev|staging|prod
DATABASE_PROVIDER: DYNAMODB
AWS_REGION: us-east-1
DYNAMODB_TABLE_PREFIX: {StackName}-{Environment}
LOG_LEVEL: debug|info|warn
```

## 💰 Custos

Camada gratuita AWS (12 meses):

- **Lambda**: 1M requisições/mês + 400.000 GB-s compute
- **DynamoDB**: 25 GB storage + 25 WCU + 25 RCU
- **CloudWatch**: 5 GB logs + 10 métricas customizadas

Custos estimados (após free tier):

- **Dev**: ~$0.00 - $5.00/mês (uso mínimo)
- **Prod**: ~$10 - $50/mês (uso moderado)

## 📖 Documentação

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## 🆘 Troubleshooting

### Erro: "Stack already exists"

```bash
# Atualizar stack existente
sam deploy --no-confirm-changeset
```

### Erro: "Insufficient permissions"

```bash
# Verificar permissões IAM do usuário AWS
aws iam get-user
```

### Function URL não funciona

```bash
# Verificar URL criada
aws cloudformation describe-stacks --stack-fullName blog-backend-api \
  --query 'Stacks[0].Outputs[?OutputKey==`BlogApiFunctionUrl`].OutputValue' \
  --output text
```

## 🔄 Migrações

### De Serverless Framework para SAM

✅ **Concluído!**

- ❌ Removido: `serverless.yml` (raiz)
- ❌ Removido: `src/lambda/serverless.yml`
- ✅ Criado: `src/lambda/template.yaml`

Benefícios:

- Nativo AWS (melhor integração)
- Sem dependências externas (serverless-framework)
- CloudFormation puro (mais controle)
- Suporte oficial AWS

## 📞 Suporte

- **AWS Support**: [Console AWS](https://console.aws.amazon.com/support/)
- **SAM Issues**: [GitHub](https://github.com/aws/aws-sam-cli/issues)
- **Documentação do Projeto**: Ver `/docs`
