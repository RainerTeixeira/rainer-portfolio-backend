# Lambda Functions - Blog API

🚀 **Arquitetura Serverless com AWS Lambda Function URLs (Free Tier)**

## 📋 Visão Geral

Este projeto implementa uma API serverless usando **AWS Lambda Function URLs**, eliminando completamente a dependência do API Gateway e mantendo-se dentro do **Free Tier da AWS**.

### ✅ Vantagens

- **🆓 Free Tier**: 1 milhão de requests/mês sempre grátis
- **💰 Sem custo de API Gateway**: Economia de ~$3.50/mês
- **⚡ Performance**: Latência menor sem API Gateway
- **🔧 Simplicidade**: Menos configuração e manutenção
- **📈 Escalabilidade**: Escala automática com Lambda
- **🛡️ Segurança**: CORS integrado e IAM roles

## 🏗️ Estrutura de Diretórios

```
src/lambda/
├── handlers/                      # Funções Lambda
│   ├── function-url.handler.ts    # Handler principal (Function URLs)
│   ├── api/                       # Handlers API (legado)
│   │   └── api-gateway.handler.ts
│   ├── auth/                      # Handlers de autenticação
│   └── shared/                    # Handlers base compartilhados
│       └── base.handler.ts
├── utils/                         # Utilitários
│   ├── response-builder.ts        # Builder de respostas HTTP
│   └── error-handler.ts           # Tratamento de erros
├── config/                        # Configurações
│   └── lambda.config.ts           # Configurações Lambda
├── infrastructure/                # Infraestrutura AWS
│   └── cloudformation/
│       ├── function-url-template.yaml  # Template CFN
│       ├── template.yaml          # Template legado
│       └── template-local.yaml    # Template local
├── scripts/                       # Scripts de deploy
│   └── deploy-function-url.sh    # Deploy Function URLs
├── tests/                         # Testes
│   └── handlers/
├── lambda-app.module.ts           # Módulo NestJS Lambda
└── README.md                      # Este arquivo
```

## 🚀 Deploy Rápido

### Pré-requisitos

```bash
# AWS CLI configurada
aws configure

# Node.js 20+
node --version

# Ferramentas necessárias
npm install -g aws-cdk
```

### Deploy Automático

```bash
# Deploy para desenvolvimento
chmod +x src/lambda/scripts/deploy-function-url.sh
./src/lambda/scripts/deploy-function-url.sh development

# Deploy para produção
./src/lambda/scripts/deploy-function-url.sh production
```

### Deploy Manual

```bash
# 1. Build do projeto
npm run build

# 2. Empacotar Lambda
zip -r lambda-function.zip dist/

# 3. Deploy CloudFormation
aws cloudformation deploy \
  --template-file src/lambda/infrastructure/cloudformation/function-url-template.yaml \
  --stack-name blog-api-function-url \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides Environment=development

# 4. Upload código
aws lambda update-function-code \
  --function-name development-blog-api-function \
  --zip-file fileb://lambda-function.zip
```

## 📊 Endpoints

### Base URL: `{FUNCTION_URL}`

| Método | Endpoint | Descrição |
|--------|----------|----------|
| GET | `/health` | Health check |
| GET | `/api/v1/users` | Lista usuários |
| GET | `/api/v1/posts` | Lista posts |
| OPTIONS | `/*` | CORS preflight |

### Exemplo de Uso

```bash
# Health check
curl {FUNCTION_URL}/health

# Listar posts
curl {FUNCTION_URL}/api/v1/posts

# Criar post
curl -X POST {FUNCTION_URL}/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Meu Post", "content": "Conteúdo..."}'
```

## 💰 Free Tier - Otimização de Custos

### ✅ O que está no Free Tier

- **Lambda Function URLs**: 1M requests/mês (sempre grátis)
- **Lambda Compute**: 400K GB-seconds/mês
- **CloudWatch Logs**: 5GB ingestão grátis
- **Data Transfer**: 1GB/mês grátis

### 🔧 Configuração Otimizada

```yaml
# function-url-template.yaml
LambdaMemory: 256MB      # Otimizado para free tier
LambdaTimeout: 30s       # Timeout razoável
AuthType: NONE          # Sem custos de autorização
InvokeMode: BUFFERED    # Melhor performance
```

### 💡 Dicas de Economia

1. **Memória**: Mantenha ≤512MB para melhor free tier utilization
2. **Timeout**: Use o mínimo necessário (15-30s)
3. **Logs**: Configure retention (14 dias)
4. **Monitoring**: Use CloudWatch free tier
5. **Cold Starts**: Otimize código para inicialização rápida

## 🛠️ Desenvolvimento

### Ambiente Local

```bash
# Instalar dependências
npm install

# Build TypeScript
npm run build

# Testes
npm test

# Test local (usando serverless-offline)
npm run dev
```

### Estrutura de Handler

```typescript
// handlers/function-url.handler.ts
export class FunctionURLHandler {
  static async handler(event: FunctionURLEvent, context: Context) {
    try {
      // Lógica de negócio
      return ResponseBuilder.success(data);
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }
}
```

### Middleware Pipeline

```typescript
// Adicionar middleware
const handler = new BaseHandler()
  .use(authMiddleware)
  .use(validationMiddleware)
  .use(loggingMiddleware);
```

## 🔐 Segurança

### CORS Configurado

```yaml
Cors:
  AllowOrigins: ['*']
  AllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  AllowHeaders: ['Content-Type', 'Authorization']
  MaxAge: 86400
```

### IAM Permissions

- Execução básica Lambda
- CloudWatch Logs
- Function URLs invoke

### Headers de Segurança

```typescript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400'
};
```

## 📈 Monitoramento

### CloudWatch Metrics

```bash
# Verificar métricas
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=blog-api-function
```

### Logs

```bash
# Verificar logs
aws logs tail /aws/lambda/blog-api-function --follow
```

### Health Check

```bash
# Monitoramento
curl -f {FUNCTION_URL}/health || echo "Service down"
```

## 🧪 Testes

### Unit Tests

```bash
# Testes unitários
npm run test

# Coverage
npm run test:coverage
```

### Integration Tests

```bash
# Testes de integração
npm run test:integration

# E2E tests
npm run test:e2e
```

### Load Testing

```bash
# Teste de carga (artillery)
artillery run load-test.yml
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Cold Start**: Otimizar código e manter memória baixa
2. **Timeout**: Ajustar timeout para operações longas
3. **Memory**: Monitorar uso e ajustar conforme necessário
4. **CORS**: Verificar headers na resposta

### Debug

```bash
# Verificar configuração
aws lambda get-function-configuration \
  --function-name blog-api-function

# Testar invoke
aws lambda invoke \
  --function-name blog-api-function \
  --payload '{}' response.json

# Verificar logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda
```

## 📚 Recursos

- [AWS Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [CloudFormation Docs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
- [NestJS Lambda](https://docs.nestjs.com/faq/serverless)

## 🤝 Contribuição

1. Fork o projeto
2. Criar feature branch
3. Fazer commit das mudanças
4. Push para o branch
5. Abrir Pull Request

## 📄 Licença

MIT License - [LICENSE](../../LICENSE)

---

**🎯 Mantido no Free Tier AWS | Sem custos de API Gateway | Performance otimizada**
