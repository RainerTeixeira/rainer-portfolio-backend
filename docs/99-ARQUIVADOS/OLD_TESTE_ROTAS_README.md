# 🧪 Script de Teste de Rotas - README

## ✅ Scripts Disponíveis

### 1. **testar-todas-rotas-completo.ps1** (PowerShell - Windows) ⭐ RECOMENDADO

Script UNIFICADO completo com CRUD em todas as rotas da API.

**Características:**

- ✅ Testa TODAS as rotas (GET, POST, PUT, PATCH, DELETE)
- ✅ Cria dados de teste e relacionamentos entre entidades
- ✅ Extrai IDs automaticamente para testes dependentes
- ✅ Detecção automática de DATABASE_PROVIDER do .env
- ✅ Health Check obrigatório antes de iniciar
- ✅ Relatório detalhado com estatísticas
- ✅ Testes de deleção opcionais (pergunta antes)
- ✅ Tratamento de erros robusto
- ✅ Formatação colorida e emojis

**Módulos testados:**

1. ❤️ **Health Check** (crítico - aborta se falhar)
2. 🔐 **Autenticação**
   - Registro, login, refresh token, esqueci senha
3. 👤 **Usuários**
   - Criar, listar, buscar por ID/username, atualizar
4. 🏷️ **Categorias e Subcategorias**
   - CRUD completo, buscar por slug, listar hierarquia
5. 📄 **Posts**
   - CRUD completo, publicar/despublicar, buscar por autor/subcategoria/slug
6. 💬 **Comentários**
   - CRUD completo, aprovar/reprovar, listar por post/usuário
7. ❤️ **Likes**
   - Curtir, descurtir, contar, verificar status
8. 🔖 **Bookmarks**
   - Salvar, listar, organizar em coleções, atualizar notas
9. 🔔 **Notificações**
   - Criar, listar, marcar como lida, contar não lidas
10. 🗑️ **Limpeza** (opcional)
    - Deleta todos os dados de teste criados

### 2. **testar-todas-rotas-completo.bat** (Batch - Windows)

Atalho para executar o script PowerShell completo facilmente.

### 3. **test-api-curls.sh** (Bash - Linux/Mac/WSL)

Versão bash do script completo usando curl.

**Características:**

- ✅ Compatível com Linux, Mac e WSL
- ✅ Usa curl para todas as requisições
- ✅ Formatação JSON com `jq` (opcional)
- ✅ Mesma funcionalidade do script PowerShell
- ✅ Testes de deleção interativos

---

## 🚀 Como Usar

### Windows - PowerShell (Recomendado)

```powershell
# Método 1: Executar diretamente
.\scripts\testar-todas-rotas-completo.ps1

# Método 2: Com parâmetros
.\scripts\testar-todas-rotas-completo.ps1 -DatabaseProvider DYNAMODB

# Método 3: URL customizada
.\scripts\testar-todas-rotas-completo.ps1 -BaseUrl "http://localhost:4000"

# Método 4: Pular deleção
.\scripts\testar-todas-rotas-completo.ps1 -SkipDelete
```

### Windows - Batch File

```cmd
# Executar batch
.\scripts\testar-todas-rotas-completo.bat

# Ou duplo clique no arquivo
```

### Linux/Mac/WSL - Bash

```bash
# Dar permissão de execução (primeira vez)
chmod +x scripts/test-api-curls.sh

# Executar
bash scripts/test-api-curls.sh

# Ou diretamente
./scripts/test-api-curls.sh
```

---

## 📋 Parâmetros (PowerShell)

### `-DatabaseProvider`

Especifica qual banco usar (PRISMA ou DYNAMODB)

```powershell
.\scripts\testar-todas-rotas-completo.ps1 -DatabaseProvider DYNAMODB
```

Se não informado, lê do arquivo `.env`

### `-BaseUrl`

URL base da API (padrão: <http://localhost:4000>)

```powershell
.\scripts\testar-todas-rotas-completo.ps1 -BaseUrl "https://api.production.com"
```

### `-SkipDelete`

Pula a etapa de limpeza de dados

```powershell
.\scripts\testar-todas-rotas-completo.ps1 -SkipDelete
```

---

## 🔧 Pré-requisitos

### 1. Servidor Rodando

```bash
npm run start:dev
```

O script verifica automaticamente se a API está online

### 2. DATABASE_PROVIDER Configurado

No arquivo `.env`:

```env
DATABASE_PROVIDER=PRISMA
```

Ou via parâmetro:

```powershell
-DatabaseProvider PRISMA
```

### 3. Banco de Dados (Opcional)

Para testes mais completos, popule o banco:

```bash
npm run seed
```

Mas o script cria seus próprios dados de teste!

### 4. Para Bash (Linux/Mac)

Instalar `jq` para formatação JSON (opcional):

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Fedora
sudo dnf install jq
```

---

## 📊 Exemplo de Saída

```
╔═══════════════════════════════════════════════════════════════╗
║  🧪 TESTE COMPLETO DE TODAS AS ROTAS - BLOG API              ║
╚═══════════════════════════════════════════════════════════════╝

📌 Configurações:
   Base URL:  http://localhost:4000
   Database:  PRISMA
   Ambiente:  LOCAL

════════════════════════════════════════════════════════════════
❤️ 1. HEALTH CHECK (OBRIGATÓRIO)
════════════════════════════════════════════════════════════════

[1] 📍 GET /health
    Health Check Básico
    ✅ OK (Status: 200)
    📄 {"status":"ok","timestamp":"2024-..."}

[2] 📍 GET /health/detailed
    Health Check Detalhado
    ✅ OK (Status: 200)

✅ API ESTÁ SAUDÁVEL! Continuando...

════════════════════════════════════════════════════════════════
🔐 2. AUTENTICAÇÃO
════════════════════════════════════════════════════════════════

[3] 📍 POST /auth/register
    Registrar Usuário
    ✅ OK (Status: 201)
    👤 UserID: 64f8a9b2c3d4e5f6a7b8c9d0

[4] 📍 POST /auth/login
    Login
    ✅ OK (Status: 200)
    🔑 Token obtido com sucesso!

...

╔═══════════════════════════════════════════════════════════════╗
║  📊 RELATÓRIO FINAL                                           ║
╚═══════════════════════════════════════════════════════════════╝

✅ TESTES CONCLUÍDOS COM SUCESSO!

📈 Estatísticas:
   Total de requisições:  87
   Requisições bem-sucedidas:  85
   Requisições com falha:  2
   Taxa de sucesso:  97.7%

🎯 IDs Gerados:
   UserID:         64f8a9b2c3d4e5f6a7b8c9d0
   CategoryID:     64f8a9b2c3d4e5f6a7b8c9d1
   SubcategoryID:  64f8a9b2c3d4e5f6a7b8c9d2
   PostID:         64f8a9b2c3d4e5f6a7b8c9d3
   CommentID:      64f8a9b2c3d4e5f6a7b8c9d4
   BookmarkID:     64f8a9b2c3d4e5f6a7b8c9d5
   NotificationID: 64f8a9b2c3d4e5f6a7b8c9d6

🔗 Links Rápidos:
   API:     http://localhost:4000
   Swagger: http://localhost:4000/docs
   Health:  http://localhost:4000/health

═══════════════════════════════════════════════════════════════
✨ Todos os endpoints foram testados!
═══════════════════════════════════════════════════════════════
```

---

## ⚠️ Comportamentos

### 1. Se a API não estiver rodando

```
❌ TESTE CRÍTICO FALHOU! Abortando...
⛔ ERRO CRÍTICO! Verifique se o servidor está rodando:
   npm run start:dev
```

O script para imediatamente.

### 2. Limpeza de Dados

Ao final, o script pergunta:

```
⚠️  Deseja deletar os dados de teste criados? [S/N]:
```

- **S**: Deleta todos os dados criados durante o teste
- **N**: Mantém os dados para inspeção manual

### 3. Tratamento de Erros

- ❌ Erros críticos (health check) = aborta
- ⚠️ Erros não-críticos = continua testando
- 📊 Relatório final mostra taxa de sucesso

---

## 🎯 Casos de Uso

### 1. Teste Rápido

```powershell
# Testar tudo rapidamente
.\scripts\testar-todas-rotas-completo.bat
```

### 2. Teste em Produção

```powershell
# Testar ambiente remoto
.\scripts\testar-todas-rotas-completo.ps1 -BaseUrl "https://api.production.com"
```

### 3. Teste com DynamoDB

```powershell
# Forçar uso do DynamoDB
.\scripts\testar-todas-rotas-completo.ps1 -DatabaseProvider DYNAMODB
```

### 4. CI/CD Pipeline

```powershell
# Rodar sem interação (pula deleção)
.\scripts\testar-todas-rotas-completo.ps1 -SkipDelete

# Verificar código de saída
if ($LASTEXITCODE -ne 0) {
    Write-Error "Testes falharam!"
}
```

### 5. Debugging

```powershell
# Manter dados para análise
.\scripts\testar-todas-rotas-completo.ps1 -SkipDelete

# Depois inspecionar via Swagger
# http://localhost:4000/docs
```

---

## 🔍 Troubleshooting

### Erro: "Não foi possível executar o script"

```powershell
# Permitir execução de scripts
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Erro: "DATABASE_PROVIDER não encontrado"

Crie ou edite o arquivo `.env`:

```env
DATABASE_PROVIDER=PRISMA
```

### Erro: "jq: command not found" (Bash)

O script funciona sem `jq`, mas não formata JSON:

```bash
# Instalar jq (opcional)
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS
```

### Muitas falhas nos testes

1. Verifique se o servidor está rodando
2. Verifique se o banco está acessível
3. Veja logs do servidor para detalhes

---

## 📝 Notas

### Diferenças entre Scripts

| Recurso | PowerShell Completo | Bash (curl) |
|---------|-------------------|-------------|
| Plataforma | Windows | Linux/Mac/WSL |
| Cores/Formatação | ✅ Completa | ✅ Completa |
| CRUD Completo | ✅ | ✅ |
| Detecção auto DB | ✅ | ⚠️ Manual no script |
| Parâmetros CLI | ✅ | ❌ |
| Relatório final | ✅ Detalhado | ✅ Simples |
| Código de saída | ✅ | ✅ |

### Scripts Removidos

- ❌ `testar-todas-rotas.ps1` - Substituído pelo completo
- ❌ `testar-todas-rotas.bat` - Substituído pelo completo
- ❌ `test-rotas.ps1` - Funcionalidade incorporada

### Manutenção

Este é o script **UNIFICADO** e **DEFINITIVO** para testes de rotas. Todos os novos recursos devem ser adicionados aqui.

---

## 🎉 Resumo

- ✅ **1 script completo** para Windows (PowerShell)
- ✅ **1 script completo** para Linux/Mac (Bash)
- ✅ **CRUD completo** em todos os módulos
- ✅ **87+ requisições** testadas
- ✅ **Relatório detalhado** com estatísticas
- ✅ **Pronto para CI/CD**

---

Criado com ❤️ para garantir que sua API está funcionando perfeitamente! 🚀
