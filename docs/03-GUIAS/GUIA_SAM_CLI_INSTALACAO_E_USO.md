
# 🚀 Guia Completo: AWS SAM CLI - Instalação e Uso

**Objetivo:** Instalar e configurar AWS SAM CLI para build e deploy serverless  
**Nível:** Intermediário  
**Tempo estimado:** 15-30 minutos  
**Pré-requisitos:** Docker Desktop, AWS CLI (opcional)

---

## 📋 Índice

1. [O que é AWS SAM CLI](#-o-que-é-aws-sam-cli)
2. [Instalação](#-instalação)
3. [Validação](#-validação)
4. [Uso no Projeto](#-uso-no-projeto)
5. [Comandos Essenciais](#-comandos-essenciais)
6. [Troubleshooting](#-troubleshooting)

---

## 🎯 O que é AWS SAM CLI

### AWS SAM (Serverless Application Model)

**SAM** é um framework open-source da AWS para construir aplicações serverless.

**SAM CLI** é a ferramenta de linha de comando que permite:

- ✅ **Validar** templates SAM/CloudFormation
- ✅ **Build** de funções Lambda localmente
- ✅ **Testar** Lambda functions localmente
- ✅ **Deploy** para AWS com um comando
- ✅ **Debug** de funções em ambiente local
- ✅ **Logs** em tempo real das funções

### Por que Usar?

| Recurso | Benefício |
|---------|-----------|
| **Local Testing** | Teste Lambda sem deploy |
| **Infrastructure as Code** | `template.yaml` define toda infra |
| **Simplified Deploy** | Um comando vs configuração manual |
| **AWS Integration** | Integração nativa com serviços AWS |
| **Cost-Effective** | Ferramenta gratuita |

### Quando é Necessário?

| Cenário | SAM CLI Necessário? |
|---------|---------------------|
| **Desenvolvimento Local** | ❌ Não (usa `npm run dev`) |
| **Testes Unitários** | ❌ Não (usa Jest) |
| **Build TypeScript** | ❌ Não (usa `nest build`) |
| **Validar Template** | ✅ Sim |
| **Build Lambda Package** | ✅ Sim |
| **Deploy para AWS** | ✅ Sim |
| **Teste Lambda Local** | ✅ Sim |

---

## 📥 Instalação

### Windows

#### Opção 1: Chocolatey (Recomendado)

```powershell
# 1. Instalar Chocolatey (se não tiver)
# Abrir PowerShell como Administrador e executar:
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Instalar AWS SAM CLI
choco install aws-sam-cli -y

# 3. Fechar e reabrir terminal

# 4. Verificar instalação
sam --version
```

#### Opção 2: MSI Installer

```powershell
# 1. Baixar instalador oficial
# URL: https://github.com/aws/aws-sam-cli/releases/latest

# 2. Baixar arquivo: AWS_SAM_CLI_64_PY3.msi

# 3. Executar instalador (Next > Next > Install)

# 4. Fechar e reabrir terminal

# 5. Verificar
sam --version
```

#### Opção 3: pip (Python)

```powershell
# 1. Instalar Python 3.8+ (se não tiver)
choco install python -y

# 2. Instalar SAM CLI via pip
pip install aws-sam-cli

# 3. Verificar
sam --version
```

### Mac

```bash
# Usando Homebrew
brew tap aws/tap
brew install aws-sam-cli

# Verificar
sam --version
```

### Linux

```bash
# Ubuntu/Debian
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install

# Verificar
sam --version
```

---

## ✅ Validação da Instalação

### 1. Verificar Versão

```bash
sam --version
```

**Saída esperada:**

```
SAM CLI, version 1.xx.x
```

### 2. Verificar Docker

SAM CLI precisa do Docker para rodar localmente:

```bash
docker --version
```

**Saída esperada:**

```
Docker version 24.x.x
```

### 3. Testar Comando de Ajuda

```bash
sam --help
```

**Saída esperada:**

```
Usage: sam [OPTIONS] COMMAND [ARGS]...

  AWS Serverless Application Model (SAM) CLI

Commands:
  build       Build your Lambda function code
  deploy      Deploy an AWS SAM application
  init        Initialize a serverless application
  local       Run your AWS Serverless application locally
  validate    Validate an AWS SAM template
  ...
```

---

## 🎯 Uso no Projeto

### Estrutura do Projeto

```
rainer-portfolio-backend/
├── src/
│   └── lambda/
│       ├── template.yaml      # ← Template SAM
│       ├── handler.ts          # ← Lambda handler
│       └── samconfig.toml      # ← Configuração SAM
└── package.json                # ← Scripts NPM
```

### Scripts NPM Configurados

```json
{
  "scripts": {
    "sam:validate": "cd src/lambda && sam validate",
    "sam:build": "cd src/lambda && sam build",
    "sam:local": "cd src/lambda && sam local start-api --port 4000",
    "sam:deploy": "npm run build && cd src/lambda && sam deploy",
    "sam:deploy:dev": "npm run build && cd src/lambda && sam deploy --config-env dev",
    "sam:deploy:staging": "npm run build && cd src/lambda && sam deploy --config-env staging",
    "sam:deploy:prod": "npm run build && cd src/lambda && sam deploy --config-env prod",
    "sam:deploy:guided": "npm run build && cd src/lambda && sam deploy --guided"
  }
}
```

---

## 🔧 Comandos Essenciais

### 1. Validar Template

**Propósito:** Verificar se o `template.yaml` está correto

```bash
# Via NPM (recomendado)
npm run sam:validate

# Ou diretamente
cd src/lambda
sam validate
```

**Saída esperada:**

```
✅ /path/to/template.yaml is a valid SAM Template
```

### 2. Build da Aplicação

**Propósito:** Empacotar Lambda function com dependências

```bash
# Via NPM (recomendado)
npm run sam:build

# Ou diretamente
cd src/lambda
sam build
```

**O que faz:**

1. Lê `template.yaml`
2. Cria pasta `.aws-sam/build/`
3. Copia código compilado de `../../dist/`
4. Instala dependências de produção
5. Empacota tudo para deploy

**Saída esperada:**

```
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml

Commands you can use next
=========================
[*] Validate SAM template: sam validate
[*] Invoke Function: sam local invoke
[*] Test Function in the Cloud: sam sync --stack-name {{stack-name}} --watch
[*] Deploy: sam deploy --guided
```

### 3. Testar Localmente

**Propósito:** Executar Lambda localmente sem fazer deploy

```bash
# Iniciar API local (emula API Gateway)
npm run sam:local

# Ou diretamente
cd src/lambda
sam local start-api --port 4000
```

**URLs locais:**

- `http://localhost:4000` - API emulada
- `http://localhost:4000/health` - Health check
- `http://localhost:4000/users` - Endpoint users

**Requisitos:**

- Docker rodando
- Build executado (`npm run sam:build`)

### 4. Invocar Função Diretamente

**Propósito:** Testar uma função específica

```bash
cd src/lambda
sam local invoke BlogApiFunction -e events/test-event.json
```

### 5. Deploy para AWS

**Propósito:** Fazer deploy para ambiente AWS

#### Deploy Guiado (primeira vez)

```bash
npm run sam:deploy:guided
```

**Perguntas durante deploy:**

```
Stack Name [blog-backend-api]: blog-backend-api-dev
AWS Region [us-east-1]: us-east-1
Parameter Environment [dev]: dev
Confirm changes before deploy [Y/n]: Y
Allow SAM CLI IAM role creation [Y/n]: Y
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: samconfig.toml
SAM configuration environment [default]: dev
```

#### Deploy Automático (após primeira vez)

```bash
# Development
npm run sam:deploy:dev

# Staging
npm run sam:deploy:staging

# Production
npm run sam:deploy:prod
```

### 6. Ver Logs

**Propósito:** Acompanhar logs da Lambda em tempo real

```bash
# Via NPM
npm run sam:logs

# Ou diretamente
cd src/lambda
sam logs -n BlogApiFunction --stack-name blog-backend-api --tail
```

### 7. Deletar Stack

**Propósito:** Remover todos os recursos da AWS

```bash
# Via NPM
npm run sam:delete

# Ou diretamente
cd src/lambda
sam delete --stack-name blog-backend-api
```

---

## 🔄 Workflow Completo

### Desenvolvimento Local (Sem SAM)

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar ambiente
.\iniciar-servidor-completo.bat

# 3. Desenvolver
npm run dev

# 4. Testar
npm test
```

**SAM não é necessário para desenvolvimento local!** ✅

### Deploy para AWS (Com SAM)

```bash
# 1. Build NestJS
npm run build

# 2. Validar template
npm run sam:validate

# 3. Build Lambda
npm run sam:build

# 4. Testar localmente (opcional)
npm run sam:local

# 5. Deploy
npm run sam:deploy:dev
```

---

## 📊 Comparação: Com vs Sem SAM

### Sem SAM CLI (Desenvolvimento Local)

```bash
# Iniciar
npm run dev

# Acessar
http://localhost:4000
http://localhost:4000/docs
```

**Vantagens:**

- ✅ Mais rápido (sem overhead de Lambda)
- ✅ Hot reload automático
- ✅ Debug mais fácil
- ✅ Não precisa Docker para Lambda

**Uso:** Desenvolvimento diário ⭐

### Com SAM CLI (Testes Pré-Deploy)

```bash
# Build e iniciar
npm run sam:build
npm run sam:local

# Acessar
http://localhost:4000
```

**Vantagens:**

- ✅ Ambiente idêntico à produção
- ✅ Testa empacotamento Lambda
- ✅ Valida IAM policies
- ✅ Simula API Gateway

**Uso:** Antes de fazer deploy para AWS

---

## 🧪 Testes com SAM

### 1. Validar Template

```bash
npm run sam:validate
```

**O que valida:**

- ✅ Sintaxe YAML correta
- ✅ Propriedades SAM válidas
- ✅ Referências corretas
- ✅ Parâmetros configurados

### 2. Build Local

```bash
npm run build         # Build NestJS primeiro
npm run sam:build     # Build Lambda package
```

**Verifica:**

- ✅ Dependências resolvidas
- ✅ Código compilado presente
- ✅ Estrutura correta

### 3. Teste Local (API)

```bash
# Terminal 1: Iniciar API local
npm run sam:local

# Terminal 2: Testar endpoints
curl http://localhost:4000/health
curl http://localhost:4000/users
curl http://localhost:4000/posts
```

### 4. Teste de Função Individual

```bash
# Criar evento de teste
echo '{"httpMethod":"GET","path":"/health"}' > src/lambda/events/health.json

# Invocar função
cd src/lambda
sam local invoke BlogApiFunction -e events/health.json
```

---

## 📝 Template SAM do Projeto

### Estrutura Atual

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  Environment:
    Type: String
    Default: dev

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 30
    MemorySize: 512

Resources:
  BlogApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ../../dist/
      Handler: lambda/handler.handler
      Environment:
        Variables:
          NODE_ENV: !Ref Environment
      FunctionUrlConfig:
        AuthType: NONE
        Cors:
          AllowOrigins: ['*']
          AllowMethods: ['*']
          AllowHeaders: ['*']
```

### Recursos Criados no Deploy

1. **Lambda Function** - `BlogApiFunction`
2. **IAM Role** - Role para a função
3. **CloudWatch Logs** - Logs automáticos
4. **Function URL** - URL HTTPS pública

---

## 🔍 Troubleshooting

### Problema: "sam: command not found"

**Causa:** SAM CLI não instalado ou não no PATH

**Soluções:**

```powershell
# Opção 1: Instalar via Chocolatey
choco install aws-sam-cli -y

# Opção 2: Baixar MSI
# https://github.com/aws/aws-sam-cli/releases/latest
# Instalar e reiniciar terminal

# Opção 3: Usar pip
pip install aws-sam-cli

# Verificar PATH
$env:Path -split ';' | Select-String sam
```

**Após instalação:**

```powershell
# Fechar e reabrir terminal
# Ou recarregar PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
sam --version
```

### Problema: "Error: Running AWS SAM projects locally requires Docker"

**Causa:** Docker não está rodando

**Solução:**

```bash
# 1. Abrir Docker Desktop
# 2. Aguardar ícone ficar verde
# 3. Verificar
docker ps

# 4. Tentar novamente
npm run sam:local
```

### Problema: "Build Failed: Unable to find code"

**Causa:** Build do NestJS não foi executado

**Solução:**

```bash
# 1. Build NestJS primeiro
npm run build

# 2. Verificar se dist/ foi criado
ls dist/

# 3. Build SAM
npm run sam:build
```

### Problema: "Template validation failed"

**Causa:** Erro de sintaxe no template.yaml

**Solução:**

```bash
# 1. Validar template
npm run sam:validate

# 2. Ver erro específico
cd src/lambda
sam validate --debug

# 3. Corrigir template.yaml
# 4. Validar novamente
```

### Problema: "Access Denied" no deploy

**Causa:** Credenciais AWS não configuradas ou sem permissões

**Solução:**

```bash
# 1. Configurar AWS CLI
aws configure

# Inserir:
# - Access Key ID
# - Secret Access Key
# - Region: us-east-1
# - Format: json

# 2. Verificar credenciais
aws sts get-caller-identity

# 3. Verificar permissões IAM necessárias:
# - CloudFormation (criar/atualizar stacks)
# - Lambda (criar/atualizar funções)
# - S3 (upload de código)
# - IAM (criar roles - se guided)
```

---

## 🎓 Conceitos Importantes

### SAM vs CloudFormation

| SAM | CloudFormation |
|-----|----------------|
| Sintaxe simplificada | Sintaxe verbosa |
| Foco em serverless | Qualquer recurso AWS |
| `AWS::Serverless::Function` | `AWS::Lambda::Function` |
| Deploy automático de API | Configuração manual |

**SAM é transformado em CloudFormation** durante deploy!

### CodeUri vs Handler

```yaml
CodeUri: ../../dist/           # Onde está o código
Handler: lambda/handler.handler # Qual função executar
```

**Estrutura esperada:**

```
dist/
└── lambda/
    └── handler.js
        └── export async function handler(event, context)
```

### Environments (dev/staging/prod)

```bash
# Cada ambiente pode ter:
# - Stack name diferente
# - Parâmetros diferentes
# - Region diferente
# - Configuração no samconfig.toml

[dev.deploy.parameters]
stack_name = "blog-backend-api-dev"
region = "us-east-1"

[prod.deploy.parameters]
stack_name = "blog-backend-api-prod"
region = "us-east-1"
```

---

## 🚀 Workflow Recomendado

### Para Desenvolvimento Diário

```bash
# NÃO use SAM CLI!
# Use desenvolvimento local normal:

npm run dev                    # Mais rápido
http://localhost:4000/docs     # Testar
```

### Para Testar Lambda Localmente

```bash
# 1. Build tudo
npm run build
npm run sam:build

# 2. Testar localmente
npm run sam:local

# 3. Testar endpoints
curl http://localhost:4000/health
```

### Para Deploy AWS

```bash
# 1. Build e validar
npm run build
npm run sam:validate
npm run sam:build

# 2. Deploy
npm run sam:deploy:dev        # Dev
npm run sam:deploy:staging    # Staging
npm run sam:deploy:prod       # Prod
```

---

## 📚 Comandos Detalhados

### sam validate

```bash
# Validar template
sam validate

# Com debug
sam validate --debug

# Específico um template
sam validate --template template.yaml
```

### sam build

```bash
# Build padrão
sam build

# Build com cache
sam build --cached

# Build paralelo (mais rápido)
sam build --parallel

# Build com debug
sam build --debug
```

### sam local

```bash
# Iniciar API local
sam local start-api --port 4000

# Com variáveis de ambiente
sam local start-api --env-vars env.json

# Com hot reload
sam local start-api --warm-containers EAGER

# Invocar função específica
sam local invoke BlogApiFunction -e event.json
```

### sam deploy

```bash
# Deploy guiado (primeira vez)
sam deploy --guided

# Deploy com configuração salva
sam deploy

# Deploy específico ambiente
sam deploy --config-env dev
sam deploy --config-env prod

# Deploy sem confirmação
sam deploy --no-confirm-changeset

# Deploy com override de parâmetros
sam deploy --parameter-overrides Environment=staging
```

### sam logs

```bash
# Ver logs em tempo real
sam logs -n BlogApiFunction --stack-name blog-backend-api --tail

# Ver logs das últimas 2 horas
sam logs -n BlogApiFunction --stack-name blog-backend-api --start-time '2h ago'

# Filtrar logs
sam logs -n BlogApiFunction --stack-name blog-backend-api --filter ERROR
```

### sam delete

```bash
# Deletar stack
sam delete --stack-name blog-backend-api

# Sem confirmação
sam delete --stack-name blog-backend-api --no-prompts
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Validação Rápida

```bash
# Validar tudo antes de commitar
npm run build           # Build NestJS
npm run sam:validate    # Validar template
npm run sam:build       # Build Lambda
npm test                # Rodar testes

# Se tudo OK = commit
git add .
git commit -m "feat: nova funcionalidade"
```

### Exemplo 2: Teste Local Completo

```bash
# 1. Build
npm run build
npm run sam:build

# 2. Iniciar ambiente local
docker-compose up -d          # MongoDB + DynamoDB
npm run sam:local             # Lambda local

# 3. Testar (em outro terminal)
curl http://localhost:4000/health
curl http://localhost:4000/users
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blog.com","password":"test"}'
```

### Exemplo 3: Deploy Completo

```bash
# 1. Validar tudo
npm run build
npm run sam:validate
npm run sam:build
npm test

# 2. Deploy dev
npm run sam:deploy:dev

# 3. Obter URL da função
aws cloudformation describe-stacks \
  --stack-name blog-backend-api-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`FunctionUrl`].OutputValue' \
  --output text

# 4. Testar na AWS
curl https://sua-url-lambda.lambda-url.us-east-1.on.aws/health
```

---

## 📋 Checklist de Validação SAM

### Antes de Instalar

- [ ] Docker Desktop instalado
- [ ] Docker rodando
- [ ] Espaço em disco (>500MB)
- [ ] Python 3.8+ (se usar pip)

### Após Instalação

- [ ] `sam --version` funciona
- [ ] `sam --help` mostra comandos
- [ ] Docker acessível
- [ ] Terminal reiniciado

### Validação no Projeto

- [ ] `npm run sam:validate` OK
- [ ] `npm run sam:build` OK
- [ ] Pasta `.aws-sam/build/` criada
- [ ] Handler empacotado

### Teste Local (Opcional)

- [ ] `npm run sam:local` inicia
- [ ] `http://localhost:4000/health` responde
- [ ] Endpoints funcionam

### Deploy AWS (Opcional)

- [ ] AWS CLI configurado
- [ ] Credenciais válidas
- [ ] `npm run sam:deploy:dev` funciona
- [ ] Function URL retornada

---

## 🔗 Recursos Adicionais

### Documentação Oficial

- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [SAM Template Specification](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html)

### Guias do Projeto

- `docs/03-GUIAS/GUIA_COMPLETO_SCRIPTS_INICIALIZACAO.md` - Scripts de ambiente
- `docs/05-INFRAESTRUTURA/GUIA_INFRAESTRUTURA_AWS.md` - Infraestrutura AWS
- `src/lambda/README.md` - Estrutura Lambda
- `RELATORIO_VALIDACAO_COMPLETO.md` - Relatório de validação

### Ferramentas Relacionadas

- **AWS CLI:** `aws --version`
- **Docker:** `docker --version`
- **Node.js:** `node --version`
- **NestJS CLI:** `npx nest --version`

---

## ✅ Resumo de Instalação

### Método Recomendado (Windows)

```powershell
# 1. Abrir PowerShell como Administrador

# 2. Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 3. Instalar SAM CLI
choco install aws-sam-cli -y

# 4. Fechar e reabrir terminal

# 5. Verificar
sam --version
```

### Validação Rápida

```bash
# 1. Versão
sam --version

# 2. Comandos disponíveis
sam --help

# 3. Validar template do projeto
cd C:\Desenvolvimento\rainer-portfolio-backend
npm run sam:validate

# 4. Se validar OK = INSTALADO COM SUCESSO! ✅
```

---

## 💡 Dicas Finais

### Quando Usar SAM CLI

✅ **USE quando:**

- Validar template antes de commitar
- Testar Lambda localmente antes de deploy
- Fazer deploy para AWS
- Debug de problemas em produção

❌ **NÃO USE quando:**

- Desenvolvimento local diário (use `npm run dev`)
- Testes unitários (use `npm test`)
- Build TypeScript (use `npm run build`)

### Performance

```
Desenvolvimento local (sem SAM):  ~2s (hot reload)
Teste com SAM local:              ~10s (cold start)
Deploy para AWS:                  ~5min (primeira vez)
Deploy subsequente:               ~2min
```

### Custo

- ✅ **SAM CLI:** Gratuito (open-source)
- ✅ **Testes locais:** Gratuito (usa Docker)
- ⚠️ **Deploy AWS:** Custos de Lambda/DynamoDB/CloudWatch

---

## 🎉 Conclusão

### Status de Instalação

O SAM CLI é **opcional para desenvolvimento local**, mas **necessário para deploy na AWS**.

**Para este projeto:**

- ✅ **Desenvolvimento:** SAM não necessário (use `npm run dev`)
- ⚠️ **Deploy AWS:** SAM necessário (instalar quando for fazer deploy)

### Alternativas

Se não quiser instalar SAM agora:

1. ✅ Desenvolva localmente com `npm run dev`
2. ✅ Teste com Jest (`npm test`)
3. ✅ Deploy manual via AWS Console (quando necessário)

### Recomendação

**Instale SAM CLI quando:**

- For fazer deploy para AWS
- Quiser testar Lambda localmente
- Precisar validar template SAM

**Por enquanto, pode continuar desenvolvendo sem SAM CLI!** ✅

---

## 📞 Suporte

### Links Úteis

- [SAM CLI Installation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [SAM CLI GitHub](https://github.com/aws/aws-sam-cli)
- [Chocolatey Package](https://community.chocolatey.org/packages/aws-sam-cli)

### Comandos de Diagnóstico

```bash
# Verificar instalação
sam --version
docker --version
aws --version

# Verificar PATH
echo $env:Path | Select-String sam

# Testar comandos
sam --help
sam validate --help
```

---

**Criado em:** 17/10/2025  
**Versão:** 1.0  
**Status:** ✅ Guia Completo  
**Público:** Desenvolvedores backend e DevOps
