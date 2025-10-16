# 🚀 Guia de Ambiente Local - MongoDB + DynamoDB

Este guia mostra como rodar e testar simultaneamente **MongoDB** e **DynamoDB Local** no seu ambiente de desenvolvimento.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Início Rápido](#início-rápido)
3. [Gerenciar Ambiente](#gerenciar-ambiente)
4. [Alternar Entre Bancos](#alternar-entre-bancos)
5. [Interfaces Gráficas](#interfaces-gráficas)
6. [Comandos Úteis](#comandos-úteis)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

- ✅ **Docker Desktop** instalado e rodando
- ✅ **Node.js** 18+ instalado
- ✅ **Git** instalado
- ✅ Dependências instaladas: `npm install`

---

## ⚡ Início Rápido

### 1. Iniciar Todo o Ambiente

```powershell
# Opção 1: Usando script automatizado (RECOMENDADO)
.\scripts\docker-ambiente-completo.ps1 start

# Opção 2: Usando docker-compose diretamente
docker-compose up -d mongodb dynamodb-local prisma-studio dynamodb-admin
```

### 2. Verificar Status

```powershell
# Ver status dos serviços
.\scripts\docker-ambiente-completo.ps1 status

# Ou manualmente
docker-compose ps
```

### 3. Iniciar Aplicação

```powershell
# Com MongoDB (padrão)
npm run start:dev

# A aplicação estará disponível em:
# http://localhost:4000
# Swagger: http://localhost:4000/api
```

---

## 🔧 Gerenciar Ambiente

### Script de Gerenciamento (Recomendado)

```powershell
# Iniciar ambiente
.\scripts\docker-ambiente-completo.ps1 start

# Ver status
.\scripts\docker-ambiente-completo.ps1 status

# Ver logs
.\scripts\docker-ambiente-completo.ps1 logs

# Reiniciar
.\scripts\docker-ambiente-completo.ps1 restart

# Parar
.\scripts\docker-ambiente-completo.ps1 stop

# Limpar tudo (CUIDADO: apaga dados!)
.\scripts\docker-ambiente-completo.ps1 clean
```

### Comandos Docker Compose Manuais

```powershell
# Iniciar apenas MongoDB
docker-compose up -d mongodb

# Iniciar apenas DynamoDB Local
docker-compose up -d dynamodb-local

# Iniciar MongoDB + Interface
docker-compose up -d mongodb prisma-studio

# Iniciar DynamoDB + Interface
docker-compose up -d dynamodb-local dynamodb-admin

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Parar e remover volumes (apaga dados)
docker-compose down -v
```

---

## 🔄 Alternar Entre Bancos

Você pode alternar facilmente entre MongoDB e DynamoDB:

### Usando Script Automatizado

```powershell
# Ver banco atual
.\scripts\alternar-banco.ps1 status

# Usar MongoDB (Prisma)
.\scripts\alternar-banco.ps1 PRISMA

# Usar DynamoDB Local
.\scripts\alternar-banco.ps1 DYNAMODB
```

### Manual (Editando .env)

```env
# Para MongoDB (Desenvolvimento)
DATABASE_PROVIDER=PRISMA

# Para DynamoDB (Teste de Produção)
DATABASE_PROVIDER=DYNAMODB
```

### Após Alternar

**Se mudou para PRISMA (MongoDB):**

```powershell
npm run prisma:generate    # Gerar Prisma Client
npm run prisma:push        # Sincronizar schema
npm run prisma:seed        # Popular dados (opcional)
npm run start:dev          # Reiniciar aplicação
```

**Se mudou para DYNAMODB:**

```powershell
npm run dynamodb:create-tables  # Criar tabelas
npm run dynamodb:seed           # Popular dados (opcional)
npm run start:dev               # Reiniciar aplicação
```

---

## 🎨 Interfaces Gráficas

### MongoDB - Prisma Studio

- **URL:** http://localhost:5555
- **Descrição:** Interface visual para visualizar e editar dados do MongoDB
- **Recursos:**
  - Visualizar coleções
  - Editar documentos
  - Filtrar e buscar
  - Relacionamentos visuais

```powershell
# Abrir Prisma Studio standalone
npm run prisma:studio
```

### DynamoDB - DynamoDB Admin

- **URL:** http://localhost:8001
- **Descrição:** Interface visual para DynamoDB Local
- **Recursos:**
  - Visualizar tabelas
  - Consultar itens
  - Adicionar/Editar/Deletar
  - Ver capacidade e métricas

```powershell
# Instalar globalmente (se preferir)
npm install -g dynamodb-admin

# Executar
DYNAMO_ENDPOINT=http://localhost:8000 dynamodb-admin
```

---

## 🛠️ Comandos Úteis

### MongoDB (Prisma)

```powershell
# Gerar Prisma Client
npm run prisma:generate

# Sincronizar schema com banco
npm run prisma:push

# Abrir Prisma Studio
npm run prisma:studio

# Formatar schema
npm run prisma:format

# Popular banco com dados de teste
npm run prisma:seed
```

### DynamoDB Local

```powershell
# Criar tabelas
npm run dynamodb:create-tables

# Popular com dados de teste
npm run dynamodb:seed

# Listar tabelas
npm run dynamodb:list-tables

# Ver DynamoDB Admin
npm run dynamodb:admin
```

### Aplicação

```powershell
# Desenvolvimento (hot reload)
npm run start:dev

# Desenvolvimento com debug
npm run start:debug

# Build
npm run build

# Produção
npm run start:prod

# Testes
npm run test
npm run test:watch
npm run test:coverage
```

### Docker

```powershell
# Status dos containers
docker-compose ps

# Logs de todos os serviços
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f mongodb
docker-compose logs -f dynamodb-local

# Reiniciar um serviço
docker-compose restart mongodb

# Parar um serviço
docker-compose stop mongodb

# Remover containers e volumes
docker-compose down -v
```

---

## 🐛 Troubleshooting

### MongoDB não inicia

```powershell
# Verificar logs
docker-compose logs mongodb

# Reiniciar com volumes limpos
docker-compose down -v
docker-compose up -d mongodb

# Verificar se a porta está em uso
netstat -ano | findstr :27017
```

### DynamoDB Local não responde

```powershell
# Verificar logs
docker-compose logs dynamodb-local

# Reiniciar
docker-compose restart dynamodb-local

# Verificar se a porta está em uso
netstat -ano | findstr :8000
```

### Prisma Studio não abre

```powershell
# Verificar se MongoDB está saudável
docker-compose ps

# Reiniciar Prisma Studio
docker-compose restart prisma-studio

# Ver logs
docker-compose logs prisma-studio
```

### Erro "Replica set not initialized"

```powershell
# Conectar ao MongoDB e inicializar manualmente
docker exec -it blogapi-mongodb mongosh

# No mongosh, executar:
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})
```

### Port já em uso

```powershell
# Encontrar processo usando a porta
netstat -ano | findstr :<porta>

# Matar processo (substitua <PID>)
taskkill /PID <PID> /F

# Ou mudar a porta no docker-compose.yml
```

### Limpar tudo e recomeçar

```powershell
# Parar tudo e remover volumes
docker-compose down -v

# Remover containers órfãos
docker container prune -f

# Remover volumes não utilizados
docker volume prune -f

# Iniciar novamente
.\scripts\docker-ambiente-completo.ps1 start
```

---

## 📊 Comparação: MongoDB vs DynamoDB

| Aspecto | MongoDB (PRISMA) | DynamoDB Local |
|---------|------------------|----------------|
| **Uso Recomendado** | Desenvolvimento | Teste pré-produção |
| **Interface** | Prisma Studio (5555) | DynamoDB Admin (8001) |
| **Porta** | 27017 | 8000 |
| **Schema** | Flexível (Prisma) | Tabelas (NoSQL) |
| **Queries** | Type-safe (Prisma) | AWS SDK |
| **Performance** | Rápido local | Simula AWS |

---

## 🎯 Fluxo de Trabalho Recomendado

### Durante Desenvolvimento

1. Use **MongoDB (PRISMA)** para desenvolvimento rápido
2. Aproveite o Prisma Studio para visualizar dados
3. Use migrations e seeds para dados consistentes

### Antes de Deploy

1. Altere para **DynamoDB Local**
2. Teste todos os endpoints
3. Verifique performance
4. Valide com dados similares à produção

### Deploy

1. Configure credenciais AWS reais no `.env`
2. Use DynamoDB na AWS
3. Remova `DYNAMODB_ENDPOINT` do `.env` para produção

---

## 📚 Recursos Adicionais

- [Documentação Docker Compose](../docs/07-DOCKER/GUIA_DOCKER_COMPOSE.md)
- [Guia Prisma](../docs/03-GUIAS/GUIA_SEED_BANCO_DADOS.md)
- [Guia DynamoDB Local](../docs/03-GUIAS/GUIA_DYNAMODB_LOCAL.md)
- [Seleção de Banco](../docs/03-GUIAS/GUIA_SELECAO_BANCO_SWAGGER.md)

---

## 💡 Dicas

- 💾 Use volumes para persistir dados entre reinicializações
- 🔄 Alterne entre bancos para testar compatibilidade
- 📊 Use Prisma Studio e DynamoDB Admin para debug visual
- 🧪 Rode testes com ambos os bancos
- 🚀 Mantenha os scripts atualizados

---

**Criado com ❤️ para facilitar seu desenvolvimento!**

