# 🗄️ DynamoDB Local - Guia Rápido

Documentação rápida para usar o DynamoDB Local no projeto.

## 🚀 Início Rápido

### 1. Iniciar DynamoDB Local

```bash
# Windows - Script automático (recomendado)
iniciar-ambiente-dynamodb.bat

# Ou manualmente
npm run docker:dynamodb
npm run dynamodb:create-tables
npm run dynamodb:seed  # (opcional)
npm run dev
```

### 2. Verificar Status

```bash
# Ver containers rodando
docker ps

# Listar tabelas criadas
npm run dynamodb:list-tables

# Ver logs
docker logs dynamodb-local
```

### 3. Acessar a API

```
http://localhost:4000              # API
http://localhost:4000/api/docs     # Swagger
http://localhost:4000/health       # Health Check
http://localhost:8000              # DynamoDB Local
```

## 📦 Scripts Principais

```bash
# Docker
npm run docker:dynamodb          # Iniciar DynamoDB Local
npm run docker:up                # Iniciar todos os containers
npm run docker:down              # Parar todos os containers

# DynamoDB
npm run dynamodb:create-tables   # Criar tabelas
npm run dynamodb:seed            # Popular com dados de teste
npm run dynamodb:list-tables     # Listar tabelas

# Desenvolvimento
npm run dev                      # Iniciar servidor
```

## 🗃️ Tabelas Criadas

O ambiente cria automaticamente 7 tabelas:

1. **blog-users** - Usuários e autores
2. **blog-posts** - Posts e artigos
3. **blog-categories** - Categorias
4. **blog-comments** - Comentários
5. **blog-likes** - Curtidas
6. **blog-bookmarks** - Favoritos
7. **blog-notifications** - Notificações

## ⚙️ Configuração

### Arquivo .env

```env
# Escolher provider
DATABASE_PROVIDER=DYNAMODB

# Configuração DynamoDB Local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=fakeAccessKeyId
AWS_SECRET_ACCESS_KEY=fakeSecretAccessKey
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE_PREFIX=blog
```

### Alternar entre MongoDB e DynamoDB

```env
# Para usar MongoDB + Prisma (desenvolvimento)
DATABASE_PROVIDER=PRISMA
DATABASE_URL="mongodb://localhost:27017/blog?replicaSet=rs0"

# Para usar DynamoDB (teste pré-produção)
DATABASE_PROVIDER=DYNAMODB
DYNAMODB_ENDPOINT=http://localhost:8000
```

## 🛠️ Ferramentas de Gerenciamento

### DynamoDB Admin (Recomendado)

```bash
# Instalar
npm install -g dynamodb-admin

# Executar
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin

# Acessar
http://localhost:8001
```

### AWS CLI

```bash
# Listar tabelas
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1

# Scan tabela
aws dynamodb scan --table-fullName blog-users --endpoint-url http://localhost:8000 --region us-east-1

# Descrever tabela
aws dynamodb describe-table --table-fullName blog-users --endpoint-url http://localhost:8000 --region us-east-1
```

## 🐛 Solução de Problemas

### Container não inicia

```bash
# Verificar se porta 8000 está livre
netstat -ano | findstr :8000

# Reiniciar container
docker-compose down
docker-compose up -d dynamodb-local
```

### Tabelas não existem

```bash
# Criar tabelas novamente
npm run dynamodb:create-tables

# Verificar criação
npm run dynamodb:list-tables
```

### Erro de conexão

```bash
# Verificar se Docker está rodando
docker info

# Verificar logs do DynamoDB
docker logs dynamodb-local

# Testar endpoint
curl http://localhost:8000
```

## 📊 Dados de Teste

O comando `npm run dynamodb:seed` cria:

- 5 usuários (ADMIN, EDITOR, 2 AUTHORS, 1 SUBSCRIBER)
- 3 categorias principais
- 5 posts (4 publicados, 1 rascunho)
- Comentários, likes e bookmarks
- Notificações de exemplo

### Credenciais de Teste

```
admin@blog.com     - ADMIN
editor@blog.com    - EDITOR
maria@blog.com     - AUTHOR
joao@blog.com      - AUTHOR
ana@blog.com       - SUBSCRIBER
```

## 🔄 Workflow de Desenvolvimento

### 1. Desenvolvimento Local (MongoDB)

```bash
# Usar MongoDB para desenvolvimento rápido
iniciar-ambiente-local.bat

# Configuração .env
DATABASE_PROVIDER=PRISMA
```

### 2. Testes Pré-Produção (DynamoDB)

```bash
# Testar com DynamoDB antes do deploy
iniciar-ambiente-dynamodb.bat

# Configuração .env
DATABASE_PROVIDER=DYNAMODB
```

### 3. Deploy para AWS

```bash
# Build da aplicação
npm run build

# Deploy (serverless)
npm run deploy:serverless

# Configuração produção (Lambda usa IAM Role automaticamente)
DATABASE_PROVIDER=DYNAMODB
# DYNAMODB_ENDPOINT não definido (usa DynamoDB AWS)
```

## 📚 Documentação Completa

Para mais detalhes, veja:

- **[Guia Completo DynamoDB Local](guias/GUIA_DYNAMODB_LOCAL.md)** - Documentação detalhada
- **[Setup Completo](SETUP_DYNAMODB_CONCLUIDO.md)** - Resumo da configuração
- **[Guia Seed](guias/GUIA_SEED_BANCO_DADOS.md)** - Como popular o banco
- **[Estrutura do Projeto](ESTRUTURA_PROJETO_FINAL.md)** - Arquitetura geral

## 🌐 Links Úteis

- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Local Setup](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html)

## 💡 Dicas

- Use **MongoDB (Prisma)** para desenvolvimento rápido
- Use **DynamoDB Local** para validar antes do deploy
- Use **Query** ao invés de **Scan** para melhor performance
- Implemente **paginação** em listas grandes
- Configure **GSI** para queries frequentes
- Monitore **throttling** em produção

## ✅ Checklist

- [ ] Docker Desktop instalado e rodando
- [ ] Arquivo .env configurado
- [ ] DynamoDB Local iniciado
- [ ] Tabelas criadas com sucesso
- [ ] Dados de teste inseridos (opcional)
- [ ] API respondendo corretamente
- [ ] Testes passando

## 🆘 Precisa de Ajuda?

1. Verifique os logs: `docker logs dynamodb-local`
2. Consulte a [documentação completa](guias/GUIA_DYNAMODB_LOCAL.md)
3. Veja os [exemplos de código](../src/prisma/)
4. Entre em contato com a equipe

---

**Ambiente configurado?** Execute `npm run dev` e acesse <http://localhost:4000/api/docs> 🚀
