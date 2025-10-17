# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente Completo
# Descrição: Setup completo com MongoDB + DynamoDB + Prisma
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 INICIANDO AMBIENTE COMPLETO                       ║" -ForegroundColor Cyan
Write-Host "║         MONGODB + DYNAMODB + PRISMA + SERVIDOR               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar Docker
Write-Host "🔍 Verificando Docker..." -ForegroundColor Cyan
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está rodando`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "💡 Inicie Docker Desktop e tente novamente`n" -ForegroundColor Yellow
    exit 1
}

# Criar .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Arquivo .env criado`n" -ForegroundColor Green
}

# MONGODB
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 🐳 INICIANDO MONGODB                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🔄 Iniciando container MongoDB..." -ForegroundColor Yellow
docker-compose up -d mongodb
Write-Host "✅ MongoDB iniciado" -ForegroundColor Green
Write-Host "⏳ Aguardando Replica Set (15s)...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 15

# DYNAMODB
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              🗄️  INICIANDO DYNAMODB LOCAL                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🔄 Iniciando container DynamoDB..." -ForegroundColor Yellow
docker-compose up -d dynamodb-local
Write-Host "✅ DynamoDB iniciado" -ForegroundColor Green
Write-Host "⏳ Aguardando inicialização (5s)...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 5

# PRISMA
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 🔧 CONFIGURANDO PRISMA                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📦 Gerando Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
Write-Host "✅ Prisma Client gerado`n" -ForegroundColor Green

Write-Host "🔄 Sincronizando schema..." -ForegroundColor Yellow
npm run prisma:push
Write-Host "✅ Schema sincronizado`n" -ForegroundColor Green

# POPULAR DADOS
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 🌱 POPULANDO BANCO DE DADOS                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🌱 Populando MongoDB..." -ForegroundColor Yellow
npm run seed
Write-Host "✅ MongoDB populado`n" -ForegroundColor Green

# DYNAMODB TABELAS (background)
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 📊 CONFIGURANDO DYNAMODB                     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🏗️  Criando tabelas DynamoDB (em background)..." -ForegroundColor Yellow
Write-Host "   Isso pode levar 30-60 segundos. Continuando...`n" -ForegroundColor White
Start-Job -ScriptBlock { npm run dynamodb:create-tables } | Out-Null
Start-Sleep -Seconds 3
Write-Host "✅ Processo iniciado em background`n" -ForegroundColor Green

# RESUMO
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       ✨ AMBIENTE COMPLETO CONFIGURADO COM SUCESSO!         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🗄️  BANCOS DE DADOS ATIVOS:" -ForegroundColor Cyan
Write-Host "   • MongoDB:        mongodb://localhost:27017 (PRONTO)" -ForegroundColor Green
Write-Host "   • DynamoDB Local: http://localhost:8000 (DISPONÍVEL)`n" -ForegroundColor Yellow

Write-Host "🌐 URLS DO SISTEMA:" -ForegroundColor Magenta
Write-Host "   • API:            http://localhost:4000"
Write-Host "   • Documentação:   http://localhost:4000/docs"
Write-Host "   • Prisma Studio:  http://localhost:5555"
Write-Host "   • DynamoDB:       http://localhost:8000`n"

Write-Host "⚡ COMANDOS RÁPIDOS:" -ForegroundColor Yellow
Write-Host "   • npm run prisma:studio           - Abrir Prisma Studio"
Write-Host "   • npm run dynamodb:list-tables    - Listar tabelas DynamoDB`n"

Write-Host "🔄 ALTERNAR BANCO:" -ForegroundColor Cyan
Write-Host "   Use: scripts\01-alternar-banco-dados\alternar-banco.bat`n"

# INICIAR SERVIDOR
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "⏰ Iniciando em 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

npm run dev

