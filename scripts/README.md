# 📚 Índice de Scripts - Guia Completo

> **Todos os scripts organizados em pastas descritivas**

## 🎯 Estrutura Organizada

### 📂 Todos na Pasta scripts/

- **12 pastas numeradas (00 a 11)** - Scripts organizados por ordem lógica

Cada pasta contém:
- ✅ **README.txt** - Documentação completa do script
- ✅ **script.bat** - Atalho Windows (duplo clique)
- ✅ **script.ps1** - PowerShell (Windows avançado)

---

## Scripts Disponíveis

### 00. Iniciar Ambiente 

**Pasta:** `00-iniciar-ambiente/`

Setup completo do projeto com três opções diferentes (início mais rápido!)

- Opção 1: MongoDB + Prisma (desenvolvimento)  
- Opção 2: DynamoDB Local (pré-deploy)  
- Opção 3: Ambiente Completo (ambos)

```bash
# Windows - MongoDB
.\00-iniciar-ambiente\iniciar-mongodb.bat

# Windows - DynamoDB
.\00-iniciar-ambiente\iniciar-dynamodb.bat

# Windows - Completo
.\00-iniciar-ambiente\iniciar-completo.bat

# PowerShell
.\00-iniciar-ambiente\iniciar-mongodb.ps1
.\00-iniciar-ambiente\iniciar-dynamodb.ps1
.\00-iniciar-ambiente\iniciar-completo.ps1

# Linux/Mac
./00-iniciar-ambiente/iniciar-mongodb.sh
./00-iniciar-ambiente/iniciar-dynamodb.sh
./00-iniciar-ambiente/iniciar-completo.sh
```

---

### 01. Verificar Ambiente

**Pasta:** `01-verificar-ambiente/`

Diagnóstico completo do ambiente

- Verifica Docker, Node.js, npm  
- Verifica portas disponíveis  
- Verifica arquivos e configurações  
- Status dos containers

```bash
# Windows
.\01-verificar-ambiente\verificar-ambiente.bat

# PowerShell
.\01-verificar-ambiente\verificar-ambiente.ps1

# Linux/Mac
./01-verificar-ambiente/verificar-ambiente.sh
```

---

### 02. Gerenciar Docker

**Pasta:** `02-gerenciar-docker/`

Gerencia MongoDB, DynamoDB e interfaces gráficas

- Iniciar/parar/reiniciar todos os serviços  
- Ver status detalhado  
- Visualizar logs  
- Limpar volumes

```bash
# Windows
.\02-gerenciar-docker\gerenciar-docker.bat

# PowerShell
.\02-gerenciar-docker\gerenciar-docker.ps1 [start|stop|status|logs|clean]

# Linux/Mac
./02-gerenciar-docker/gerenciar-docker.sh start
```

---

### 03. Alternar Banco de Dados

**Pasta:** `03-alternar-banco-dados/`

Alterna entre MongoDB (Prisma) e DynamoDB Local

- Detecção automática do banco atual  
- Backup automático do .env  
- Instruções pós-configuração  

```bash
# Windows
.\03-alternar-banco-dados\alternar-banco.bat

# PowerShell
.\03-alternar-banco-dados\alternar-banco.ps1 [PRISMA|DYNAMODB]

# Linux/Mac
./03-alternar-banco-dados/alternar-banco.sh
```

---

### 04. Status dos Containers

**Pasta:** `04-status-containers/`

Visualiza status de todos containers

- Nome, status e portas  
- Health check  
- URLs de acesso  
- Comandos úteis  

```bash
# Windows
.\04-status-containers\status-containers.bat

# PowerShell
.\04-status-containers\status-containers.ps1

# Linux/Mac
./04-status-containers/status-containers.sh
```

---

### Scripts de Teste (Organizados em `testes/`)

### 05. Testar MongoDB

**Pasta:** `testes/05-testar-mongodb/`

Validação completa MongoDB + Prisma

- Testes de integração  
- Testes E2E  
- Cobertura de código  
- Setup automático  

```bash
# Windows
.\testes\05-testar-mongodb\testar-mongodb.bat

# PowerShell
.\testes\05-testar-mongodb\testar-mongodb.ps1 [-Quick|-E2E|-Coverage]

# Linux/Mac
./testes/05-testar-mongodb/testar-mongodb.sh
```

---

### 06. Testar DynamoDB

**Pasta:** `testes/06-testar-dynamodb/`

Validação completa DynamoDB Local

- Testes de integração  
- Testes E2E  
- Cobertura de código  
- Criação automática de tabelas  

```bash
# Windows
.\testes\06-testar-dynamodb\testar-dynamodb.bat

# PowerShell
.\testes\06-testar-dynamodb\testar-dynamodb.ps1 [-Quick|-E2E|-Coverage]

# Linux/Mac
./testes/06-testar-dynamodb/testar-dynamodb.sh
```

---

### 07. Testar API Completo

**Pasta:** `testes/07-testar-api-completo/`

Testa **TODAS** as rotas da API (87+ requisições)

- CRUD completo em todos módulos  
- Criação automática de dados de teste  
- Relatório detalhado com estatísticas  
- Limpeza opcional  

```bash
# Windows
.\testes\07-testar-api-completo\testar-api.bat

# PowerShell
.\testes\07-testar-api-completo\testar-api.ps1 [-DatabaseProvider DYNAMODB]

# Linux/Mac
./testes/07-testar-api-completo/testar-api.sh
```

---

### 08. Testar Antes de Deploy

**Pasta:** `testes/08-testar-antes-deploy/`

Simula ambiente AWS localmente

- Configura DynamoDB Local  
- Cria tabelas e popula dados  
- Testa endpoints críticos  
- Relatório de aprovação  

```bash
# Windows
.\testes\08-testar-antes-deploy\testar-antes-deploy.bat

# PowerShell
.\testes\08-testar-antes-deploy\testar-antes-deploy.ps1

# Linux/Mac
./testes/08-testar-antes-deploy/testar-antes-deploy.sh
```

---

### 08. Memória do Projeto

**Pasta:** `08-memoria/`

Gerenciamento de memórias do projeto para IA e ferramentas MCP

- Atualizar memórias
- Ler memórias
- Carregar memórias
- Testar memórias

```bash
# TypeScript scripts
npm run memory:update
npm run memory:read
npm run memory:read:initial
npm run memory:read:technical
npm run memory:read:code
npm run memory:load
npm run memory:load:text
```

---

### 09. Atualizar Credenciais AWS

**Pasta:** `09-atualizar-aws/`

Atualiza credenciais AWS no .env

- Entrada interativa segura  
- Mascaramento de Secret Key  
- Backup automático  
- Confirmação antes de salvar  

```bash
# Windows
.\09-atualizar-aws\atualizar-aws.bat

# PowerShell
.\09-atualizar-aws\atualizar-aws.ps1

# Linux/Mac
./09-atualizar-aws/atualizar-aws.sh
```

---

### 10. Finalizar Configuração

**Pasta:** `10-finalizar-configuracao/`

Preparação completa para produção

- Instala AWS CLI  
- Cria tabelas DynamoDB  
- Popula MongoDB  
- Valida ambiente completo  

```bash
# Windows
.\10-finalizar-configuracao\finalizar-configuracao.bat

# PowerShell
.\10-finalizar-configuracao\finalizar-configuracao.ps1

# Linux/Mac
./10-finalizar-configuracao/finalizar-configuracao.sh
```

---

### 11. Limpar Ambiente

**Pasta:** `11-limpar-ambiente/`

Reset completo: containers, volumes, node_modules, .env

- Remove tudo (Docker + Node.js)  
- Limpeza rápida ou completa  
- Confirmação antes de executar  

```bash
# Windows
.\11-limpar-ambiente\limpar-ambiente.bat

# PowerShell
.\11-limpar-ambiente\limpar-ambiente.ps1

# Linux/Mac
./11-limpar-ambiente/limpar-ambiente.sh
```

---

## Guia Rápido de Uso

### Primeira Vez no Projeto?

**Opção Simples (Recomendado):**

- Entre na pasta `scripts/` e execute:

```bash
# Windows
cd scripts
.\00-iniciar-ambiente\iniciar-mongodb.bat      # Para desenvolvimento
.\00-iniciar-ambiente\iniciar-dynamodb.bat     # Para testes AWS
.\00-iniciar-ambiente\iniciar-completo.bat     # Para ter ambos

# PowerShell
cd scripts
.\00-iniciar-ambiente\iniciar-mongodb.ps1
.\00-iniciar-ambiente\iniciar-dynamodb.ps1
.\00-iniciar-ambiente\iniciar-completo.ps1

# Linux/Mac
cd scripts
./00-iniciar-ambiente/iniciar-mongodb.sh
./00-iniciar-ambiente/iniciar-dynamodb.sh
./00-iniciar-ambiente/iniciar-completo.sh
```

**Opção Manual:**
1. **01-verificar-ambiente/** - Verificar se tudo está OK
2. **02-gerenciar-docker/** - Iniciar containers
3. **03-alternar-banco-dados/** - Escolher banco (PRISMA ou DYNAMODB)
4. **10-finalizar-configuracao/** - Preparar tudo

### Desenvolvimento Diário?

```bash
cd scripts  # Entre na pasta scripts/
```

1. **00-iniciar-ambiente/** - Iniciar tudo rapidamente OU
2. **02-gerenciar-docker/** start - Iniciar containers
3. **04-status-containers/** - Ver o que está rodando
4. **testes/07-testar-api-completo/** - Testar rotas

### Testando Bancos de Dados?

- **MongoDB/Prisma:** testes/05-testar-mongodb/
- **DynamoDB Local:** testes/06-testar-dynamodb/
- **API Completa:** testes/07-testar-api-completo/

### Problemas?

1. **01-verificar-ambiente/** - Diagnosticar
2. **04-status-containers/** - Ver containers
3. **11-limpar-ambiente/** - Reset completo (última opção)

### Antes de Deploy?

1. **testes/06-testar-dynamodb/** - Validar DynamoDB
2. **testes/08-testar-antes-deploy/** - Testar localmente
3. **09-atualizar-aws/** - Configurar credenciais
4. **10-finalizar-configuracao/** - Preparar tudo

---

## Dicas Úteis

**Importante:** Todos os comandos devem ser executados dentro da pasta `scripts/`

```bash
# Entre na pasta scripts primeiro
cd scripts

# Iniciar Rapidamente
.\00-iniciar-ambiente\iniciar-mongodb.bat      # Mais rápido para dev
.\00-iniciar-ambiente\iniciar-completo.bat     # Tudo configurado

# Trocar de banco rapidamente
.\03-alternar-banco-dados\alternar-banco.ps1 PRISMA
.\03-alternar-banco-dados\alternar-banco.ps1 DYNAMODB

# Ver status rápido
.\04-status-containers\status-containers.bat

# Testar API completa
.\07-testar-api-completo\testar-api.bat

# Testar MongoDB
.\testes\05-testar-mongodb\testar-mongodb.bat

# Testar DynamoDB
.\testes\06-testar-dynamodb\testar-dynamodb.bat

# Diagnosticar problemas
.\01-verificar-ambiente\verificar-ambiente.bat

# Reset completo
.\11-limpar-ambiente\limpar-ambiente.bat
```

---

## Formato dos Scripts

Cada pasta contém **4 arquivos**:

### README.txt
- Documentação completa
- Exemplos de uso
- Troubleshooting
- Casos de uso

### script.bat
- Atalho Windows
- Duplo clique para executar
- Mais fácil para iniciantes

### script.ps1
- PowerShell (Windows)
- Aceita parâmetros
- Mais flexível e poderoso

### script.sh
- Bash (Linux/Mac/WSL)
- Compatível com ambientes Unix
- `chmod +x` antes de usar

---

## Requisitos

### Ferramentas Necessárias:
- Docker Desktop
- Node.js v18+ e npm
- Git

### Opcional (mas recomendado):
- AWS CLI (para deploy)
- PowerShell 7+ (Windows)
- jq (Linux/Mac - para formatação JSON)

---

## Ajuda e Suporte

Cada pasta tem **README.txt completo** com:
- Descrição detalhada
- Como usar
- Exemplos práticos
- Troubleshooting
- Links relacionados

**Para ver documentação de qualquer script:**
1. Navegue até a pasta
2. Abra README.txt
3. Leia as instruções

---

## Documentação Adicional

- [Documentação principal](../docs/)
- [Guia de deploy AWS](../docs/GUIA_DEPLOY_CLOUD.md)
- [Troubleshooting](../docs/03-GUIAS/GUIA_TROUBLESHOOTING_SCRIPTS.md)

---

## Conclusão

Todos os scripts foram organizados de forma intuitiva e documentada.  
Cada pasta é independente e auto-explicativa.

### Estrutura do Projeto:

```
rainer-portfolio-backend/
  │
  └─ scripts/                        ← TODOS OS SCRIPTS AQUI
      ├─ README.md                   ← Este arquivo
      │
      ├─ 00-iniciar-ambiente/        ← ⭐ Início rápido
      │   ├─ iniciar-mongodb.*
      │   ├─ iniciar-dynamodb.*
      │   └─ iniciar-completo.*
      │
      ├─ 01-verificar-ambiente/
      ├─ 02-gerenciar-docker/
      ├─ 03-alternar-banco-dados/
      ├─ 04-status-containers/
      │
      ├─ testes/                       ← Scripts de teste organizados
      │   ├─ 04-testar-api-completo/
      │   ├─ 05-testar-mongodb/
      │   ├─ 06-testar-dynamodb/
      │   ├─ 07-testar-api-completo/
      │   └─ 08-testar-antes-deploy/
      │
      ├─ 08-memoria/                  ← Scripts TypeScript de memória
      │   ├─ update-memory.ts
      │   ├─ read-memory.ts
      │   ├─ memory-loader.ts
      │   ├─ test-memory-questions.ts
      │   └─ setup-memory-reader.js
      │
      ├─ 09-atualizar-aws/
      ├─ 10-finalizar-configuracao/
      └─ 11-limpar-ambiente/
```

**🚀 Para começar rapidamente:** `cd scripts` → Execute `00-iniciar-ambiente/`  
**🔧 Para gerenciar passo a passo:** Use os scripts de `00` a `11` em ordem

---

<div align="center">

**Criado com ❤️ para facilitar o desenvolvimento!** 🚀

*Última atualização: Outubro 2025*

</div>

