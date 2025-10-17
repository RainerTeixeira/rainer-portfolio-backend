# 🗄️ Guia Completo - DynamoDB Local

Este guia completo mostra como configurar e usar o DynamoDB Local para desenvolvimento e testes antes do deploy na AWS.

## 📋 Índice

- [Por que usar DynamoDB Local?](#-por-que-usar-dynamodb-local)
- [Pré-requisitos](#-pré-requisitos)
- [Início Rápido](#-início-rápido)
- [Configuração Manual](#-configuração-manual)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura das Tabelas](#-estrutura-das-tabelas)
- [Ferramentas de Gerenciamento](#-ferramentas-de-gerenciamento)
- [Comandos AWS CLI](#-comandos-aws-cli)
- [Diferenças entre Local e Produção](#-diferenças-entre-local-e-produção)
- [Solução de Problemas](#-solução-de-problemas)

---

## 🎯 Por que usar DynamoDB Local?

### Benefícios

✅ **Desenvolvimento Offline**: Desenvolva sem conexão com a AWS  
✅ **Custo Zero**: Não há cobranças durante o desenvolvimento  
✅ **Velocidade**: Testes mais rápidos sem latência de rede  
✅ **Ambiente Isolado**: Não afeta dados de produção  
✅ **Paridade com Produção**: Mesmo comportamento do DynamoDB real  

### Quando usar cada opção

| Cenário | MongoDB (Prisma) | DynamoDB Local |
|---------|------------------|----------------|
| Desenvolvimento rápido | ✅ Recomendado | ❌ |
| Testes de integração | ✅ Recomendado | ❌ |
| Testes pré-produção | ❌ | ✅ Recomendado |
| Validação de deploy AWS | ❌ | ✅ Recomendado |
| CI/CD Pipeline | ✅ | ✅ Ambos |

---

## 📦 Pré-requisitos

### Obrigatórios

- ✅ **Docker Desktop** instalado e rodando
- ✅ **Node.js** 18+ instalado
- ✅ **npm** ou **yarn** instalado

### Opcionais

- **AWS CLI** (para comandos avançados)
- **NoSQL Workbench** (GUI oficial da AWS)
- **DynamoDB Admin** (interface web simples)

---

## 🚀 Início Rápido

### Opção 1: Script PowerShell Automatizado (Recomendado)

```powershell
# Iniciar DynamoDB Local
.\scripts\docker-ambiente-completo.ps1 start

# Alternar para DynamoDB
.\scripts\alternar-banco.ps1 DYNAMODB

# Criar tabelas
npm run dynamodb:create-tables

# Popular com dados de teste (opcional)
npm run dynamodb:seed

# Iniciar servidor
npm run start:dev
```

### Opção 2: Script Batch (Windows)

```bash
# Windows
iniciar-ambiente-dynamodb.bat

# Este script irá:
# 1. Verificar se Docker está rodando
# 2. Criar arquivo .env (se não existir)
# 3. Iniciar DynamoDB Local no Docker
# 4. Criar todas as tabelas necessárias
# 5. Popular com dados de teste (opcional)
# 6. Iniciar o servidor de desenvolvimento
```

### Opção 3: Passo a Passo Manual

```bash
# 1. Criar arquivo .env
cp env.example .env

# 2. Configurar para usar DynamoDB
# Edite o arquivo .env e altere:
# DATABASE_PROVIDER=DYNAMODB

# 3. Iniciar DynamoDB Local
npm run docker:dynamodb

# 4. Criar tabelas
npm run dynamodb:create-tables

# 5. Popular dados de teste (opcional)
npm run dynamodb:seed

# 6. Iniciar servidor
npm run dev
```

---

## ⚙️ Configuração Manual

### 1. Variáveis de Ambiente

Edite o arquivo `.env` ou use o script de alternância:

```powershell
# Usar script (recomendado)
.\scripts\alternar-banco.ps1 DYNAMODB
```

Ou edite manualmente o arquivo `.env`:

```env
# Escolha o provider
DATABASE_PROVIDER=DYNAMODB

# Configuração do DynamoDB Local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=fakeAccessKeyId
AWS_SECRET_ACCESS_KEY=fakeSecretAccessKey
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_PREFIX=blog

# AWS Cognito (Configurado)
COGNITO_USER_POOL_ID=us-east-1_wryiyhbWC
COGNITO_CLIENT_ID=3ueos5ofu499je6ebc5u98n35h
COGNITO_REGION=us-east-1
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_wryiyhbWC
JWT_SECRET=<gerado_automaticamente>
```

### 2. Docker Compose

O `docker-compose.yml` já está configurado:

```yaml
services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: blogapi-dynamodb
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
    volumes:
      - dynamodb-data:/home/dynamodblocal/data
```

### 3. Verificar Status

```bash
# Verificar se o container está rodando
docker ps | findstr blogapi-dynamodb

# Verificar logs
docker logs blogapi-dynamodb

# Testar conectividade
npm run dynamodb:list-tables
```

---

## 📜 Scripts Disponíveis

### Scripts NPM

```bash
# Docker
npm run docker:dynamodb          # Iniciar apenas DynamoDB Local
npm run docker:up                # Iniciar todos os containers (MongoDB + DynamoDB)
npm run docker:down              # Parar todos os containers
npm run docker:logs              # Ver logs de todos os containers

# DynamoDB - Gerenciamento
npm run dynamodb:create-tables   # Criar todas as tabelas
npm run dynamodb:seed            # Popular com dados de teste
npm run dynamodb:list-tables     # Listar tabelas existentes
npm run dynamodb:admin           # Instruções para DynamoDB Admin

# Prisma (MongoDB)
npm run prisma:generate          # Gerar Prisma Client
npm run prisma:push              # Sincronizar schema com MongoDB
npm run prisma:seed              # Popular MongoDB com dados
npm run prisma:studio            # Interface visual do Prisma

# Desenvolvimento
npm run dev                      # Iniciar servidor (usa DATABASE_PROVIDER do .env)
npm run test                     # Executar testes
npm run build                    # Build para produção
```

### Scripts Batch (Windows)

```bash
# Iniciar ambiente com MongoDB + Prisma
iniciar-ambiente-local.bat

# Iniciar ambiente com DynamoDB
iniciar-ambiente-dynamodb.bat

# Iniciar servidor completo (híbrido)
iniciar-servidor-completo.bat
```

### Scripts PowerShell (Novos)

```powershell
# Gerenciar ambiente Docker completo
.\scripts\docker-ambiente-completo.ps1 start    # Iniciar tudo
.\scripts\docker-ambiente-completo.ps1 status   # Ver status
.\scripts\docker-ambiente-completo.ps1 stop     # Parar tudo
.\scripts\docker-ambiente-completo.ps1 logs     # Ver logs
.\scripts\docker-ambiente-completo.ps1 restart  # Reiniciar
.\scripts\docker-ambiente-completo.ps1 clean    # Limpar volumes

# Alternar entre bancos de dados
.\scripts\alternar-banco.ps1 status    # Ver banco atual
.\scripts\alternar-banco.ps1 PRISMA    # Mudar para MongoDB
.\scripts\alternar-banco.ps1 DYNAMODB  # Mudar para DynamoDB

# Atualizar credenciais AWS
.\scripts\update-aws-credentials.ps1
```

---

## 🗃️ Estrutura das Tabelas

### Tabelas Criadas

O script `dynamodb.tables.ts` cria as seguintes tabelas:

#### 1. **blog-users**

- **Partition Key**: `id` (String)
- **GSI**: `EmailIndex` (email)
- **GSI**: `CognitoIdIndex` (cognitoId)
- **Uso**: Armazenar usuários e autores

#### 2. **blog-posts**

- **Partition Key**: `id` (String)
- **GSI**: `AuthorIndex` (authorId + createdAt)
- **GSI**: `StatusIndex` (status + createdAt)
- **Uso**: Armazenar posts/artigos

#### 3. **blog-categories**

- **Partition Key**: `id` (String)
- **GSI**: `SlugIndex` (slug)
- **Uso**: Armazenar categorias

#### 4. **blog-comments**

- **Partition Key**: `id` (String)
- **GSI**: `PostIndex` (postId + createdAt)
- **Uso**: Armazenar comentários

#### 5. **blog-likes**

- **Partition Key**: `id` (String)
- **GSI**: `PostIndex` (postId)
- **GSI**: `UserIndex` (userId)
- **Uso**: Armazenar likes em posts

#### 6. **blog-bookmarks**

- **Partition Key**: `id` (String)
- **GSI**: `PostIndex` (postId)
- **GSI**: `UserIndex` (userId)
- **Uso**: Armazenar bookmarks/favoritos

#### 7. **blog-notifications**

- **Partition Key**: `id` (String)
- **GSI**: `UserIndex` (userId + createdAt)
- **Uso**: Armazenar notificações

### Exemplo de Item (User)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Maria Silva",
  "email": "maria@blog.com",
  "cognitoId": "cognito-maria-123",
  "role": "AUTHOR",
  "bio": "Desenvolvedora Full Stack",
  "avatar": "https://i.pravatar.cc/150?img=5",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🛠️ Ferramentas de Gerenciamento

### 1. DynamoDB Admin (Recomendado)

Interface web simples e prática:

```bash
# Instalar globalmente
npm install -g dynamodb-admin

# Iniciar (em outro terminal)
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin

# Acessar
# http://localhost:8001
```

**Recursos:**

- ✅ Visualizar todas as tabelas
- ✅ Adicionar/editar/remover itens
- ✅ Executar queries e scans
- ✅ Interface intuitiva

### 2. AWS CLI

Para usuários avançados:

```bash
# Instalar AWS CLI
# https://aws.amazon.com/cli/

# Configurar alias (opcional)
alias dynamodb-local="aws dynamodb --endpoint-url http://localhost:8000 --region us-east-1"

# Listar tabelas
dynamodb-local list-tables

# Descrever tabela
dynamodb-local describe-table --table-name blog-users

# Scan completo (todos os itens)
dynamodb-local scan --table-name blog-users

# Query por email
dynamodb-local query \
  --table-name blog-users \
  --index-name EmailIndex \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email":{"S":"maria@blog.com"}}'
```

### 3. NoSQL Workbench (GUI Oficial AWS)

Download: <https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html>

**Recursos:**

- ✅ Modelagem visual de dados
- ✅ Editor de queries
- ✅ Visualização de GSI/LSI
- ✅ Importação/exportação de dados

---

## 💻 Comandos AWS CLI

### Listar e Descrever

```bash
# Listar todas as tabelas
aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Descrever estrutura de uma tabela
aws dynamodb describe-table \
  --table-name blog-users \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### Consultar Dados

```bash
# Buscar item por ID (GetItem)
aws dynamodb get-item \
  --table-name blog-users \
  --key '{"id":{"S":"550e8400-e29b-41d4-a716-446655440000"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Scan (retorna todos os itens - use com cuidado)
aws dynamodb scan \
  --table-name blog-posts \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Query usando GSI
aws dynamodb query \
  --table-name blog-posts \
  --index-name StatusIndex \
  --key-condition-expression "#status = :status" \
  --expression-attribute-names '{"#status":"status"}' \
  --expression-attribute-values '{":status":{"S":"PUBLISHED"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### Inserir e Atualizar

```bash
# Inserir item (PutItem)
aws dynamodb put-item \
  --table-name blog-users \
  --item '{
    "id": {"S": "test-123"},
    "name": {"S": "Test User"},
    "email": {"S": "test@example.com"},
    "createdAt": {"S": "2024-01-15T10:00:00Z"}
  }' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Atualizar item (UpdateItem)
aws dynamodb update-item \
  --table-name blog-users \
  --key '{"id":{"S":"test-123"}}' \
  --update-expression "SET #name = :name" \
  --expression-attribute-names '{"#name":"name"}' \
  --expression-attribute-values '{":name":{"S":"Updated Name"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Deletar item
aws dynamodb delete-item \
  --table-name blog-users \
  --key '{"id":{"S":"test-123"}}' \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### Gerenciar Tabelas

```bash
# Deletar tabela
aws dynamodb delete-table \
  --table-name blog-test \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Contar itens em uma tabela
aws dynamodb scan \
  --table-name blog-posts \
  --select COUNT \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

---

## ⚖️ Diferenças entre Local e Produção

### Comportamento Idêntico

✅ **API**: Todas as operações funcionam igual  
✅ **Queries e Scans**: Mesma sintaxe e resultado  
✅ **GSI/LSI**: Índices funcionam da mesma forma  
✅ **Transações**: Suportadas (dentro dos limites)  

### Diferenças Importantes

| Aspecto | DynamoDB Local | DynamoDB AWS |
|---------|----------------|--------------|
| **Performance** | Mais lento | Otimizado |
| **Throughput** | Ilimitado | Configurável (RCU/WCU) |
| **Latência** | Variável | ~10ms (single-digit) |
| **Backup/Restore** | Manual | Automático disponível |
| **Streams** | ❌ Não suportado | ✅ Suportado |
| **DAX** | ❌ Não suportado | ✅ Suportado |
| **TTL** | ❌ Não suportado | ✅ Suportado |
| **Encryption** | ❌ Não necessário | ✅ Recomendado |
| **IAM** | ❌ Não validado | ✅ Obrigatório |

### Credenciais

```bash
# Local - Pode usar valores fake
AWS_ACCESS_KEY_ID=fakeAccessKeyId
AWS_SECRET_ACCESS_KEY=fakeSecretAccessKey

# Produção - Usar IAM Role ou credenciais reais
# (Em Lambda, não é necessário configurar - usa IAM Role automaticamente)
```

---

## 🔧 Solução de Problemas

### Problema: "Cannot connect to DynamoDB"

**Sintomas:**

```
❌ Erro ao conectar com DynamoDB: NetworkingError: connect ECONNREFUSED 127.0.0.1:8000
```

**Soluções:**

```bash
# 1. Verificar se container está rodando
docker ps | findstr dynamodb

# 2. Se não estiver, iniciar
docker-compose up -d dynamodb-local

# 3. Verificar logs
docker logs blogapi-dynamodb

# 4. Testar endpoint manualmente
curl http://localhost:8000
```

### Problema: "ResourceNotFoundException: Cannot do operations on a non-existent table"

**Sintomas:**

```
❌ ResourceNotFoundException: Cannot do operations on a non-existent table
```

**Soluções:**

```bash
# 1. Criar as tabelas
npm run dynamodb:create-tables

# 2. Verificar se tabelas foram criadas
npm run dynamodb:list-tables

# 3. Se problema persistir, recriar container
docker-compose down
docker-compose up -d dynamodb-local
npm run dynamodb:create-tables
```

### Problema: "ValidationException: One or more parameter values were invalid"

**Sintomas:**

```
❌ ValidationException: One or more parameter values were invalid
```

**Possíveis causas:**

- Formato de atributo incorreto (String vs Number)
- Falta de atributos obrigatórios
- GSI configurado incorretamente

**Solução:**

```bash
# Verificar estrutura da tabela
aws dynamodb describe-table \
  --table-name blog-users \
  --endpoint-url http://localhost:8000 \
  --region us-east-1

# Comparar com a definição em dynamodb.tables.ts
```

### Problema: Container DynamoDB não inicia

**Sintomas:**

```
Error starting userland proxy: listen tcp4 0.0.0.0:8000: bind: address already in use
```

**Solução:**

```bash
# 1. Verificar qual processo está usando a porta 8000
netstat -ano | findstr :8000

# 2. Matar o processo (Windows - PowerShell)
Stop-Process -Id <PID> -Force

# 3. Ou alterar porta no docker-compose.yml
# Mudar de "8000:8000" para "8001:8000"
# E atualizar DYNAMODB_ENDPOINT=http://localhost:8001
```

### Problema: Dados não persistem após reiniciar

**Sintomas:**

- Dados desaparecem ao reiniciar o container

**Solução:**

```bash
# Verificar se volume está configurado
docker volume ls | findstr dynamodb

# Se não houver volume, os dados estão em memória
# Certifique-se de que o docker-compose.yml tem:
volumes:
  - ./dynamodb-data:/home/dynamodblocal/data
```

### Problema: Performance muito lenta

**Possíveis causas:**

- Container com poucos recursos
- Muitos itens em scan (ao invés de query)
- Falta de índices adequados

**Soluções:**

```bash
# 1. Aumentar recursos do Docker Desktop
# Settings > Resources > aumentar CPU/Memory

# 2. Usar Query ao invés de Scan
# Query é O(log n), Scan é O(n)

# 3. Adicionar GSI para consultas frequentes
# Editar dynamodb.tables.ts e adicionar índice
```

---

## 📚 Recursos Adicionais

### Documentação

- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Local Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

### Ferramentas

- [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html)
- [DynamoDB Admin](https://www.npmjs.com/package/dynamodb-admin)
- [AWS CLI](https://aws.amazon.com/cli/)
- [DynamoDB Toolbox](https://github.com/jeremydaly/dynamodb-toolbox)

### Tutoriais

- [Getting Started with DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStartedDynamoDB.html)
- [DynamoDB Data Modeling](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-modeling-nosql.html)
- [Single Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)

---

## ✅ Checklist de Validação

Antes de fazer deploy para produção, verifique:

- [ ] Todas as tabelas criadas corretamente
- [ ] GSI configurados para queries frequentes
- [ ] Validação de dados implementada
- [ ] Testes de integração passando
- [ ] Performance adequada (< 100ms por request)
- [ ] Tratamento de erros implementado
- [ ] Paginação implementada para lists
- [ ] Limites de throughput calculados
- [ ] Monitoramento configurado (CloudWatch)
- [ ] Backup strategy definida

---

## 🎯 Próximos Passos

1. ✅ Configure o DynamoDB Local
2. ✅ Crie as tabelas
3. ✅ Popule com dados de teste
4. ✅ Teste sua aplicação localmente
5. 📝 Documente suas queries e padrões de acesso
6. 🧪 Escreva testes de integração
7. 🚀 Faça deploy para AWS
8. 📊 Configure monitoramento
9. 🔄 Implemente backup strategy

---

## 💡 Dicas Finais

### Performance

- Use **Query** ao invés de **Scan** sempre que possível
- Projete **GSI** baseado em seus access patterns
- Implemente **paginação** em listas
- Use **BatchGetItem** para múltiplos itens

### Custo (Produção)

- Use **On-Demand** para workloads imprevisíveis
- Use **Provisioned** para workloads estáveis e previsíveis
- Configure **Auto Scaling** para otimizar custos
- Monitore **throttling** e ajuste capacidade

### Segurança

- Use **IAM Roles** (não credenciais hardcoded)
- Implemente **least privilege** nas policies
- Ative **encryption at rest**
- Use **VPC Endpoints** para tráfego privado

---

## 📞 Suporte

- 📖 Documentação do projeto: `/docs`
- 🐛 Issues: Crie uma issue no repositório
- 💬 Dúvidas: Entre em contato com a equipe

---

---

## 🆕 Atualizações Recentes

### Novos Scripts PowerShell

- ✅ **docker-ambiente-completo.ps1** - Gerenciamento completo do ambiente
- ✅ **alternar-banco.ps1** - Troca rápida entre MongoDB e DynamoDB
- ✅ **update-aws-credentials.ps1** - Atualização de credenciais AWS

### Configurações Atualizadas

- ✅ **AWS Cognito** configurado (RainerSoftCognito)
- ✅ **JWT Secret** gerado automaticamente
- ✅ **Docker Compose** atualizado com todas as interfaces

### Documentação Adicional

- **[COMECE_AQUI.txt](../../COMECE_AQUI.txt)** - Início rápido visual
- **[INICIO_RAPIDO_OLD.md](../../INICIO_RAPIDO_OLD.md)** - Comandos principais
- **[GUIA_AMBIENTE_LOCAL_OLD.md](../../GUIA_AMBIENTE_LOCAL_OLD.md)** - Guia detalhado

---

**Criado em:** 16/10/2024  
**Última atualização:** 16/10/2025  
**Versão:** 2.0.0 (Atualizado com novos scripts e configurações)
