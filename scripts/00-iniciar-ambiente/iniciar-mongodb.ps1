# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente MongoDB + Prisma
# Descrição: Setup completo com MongoDB, Prisma ORM e dados de teste
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║         🚀 INICIANDO AMBIENTE LOCAL                          ║" -ForegroundColor Blue
Write-Host "║         PRISMA + MONGODB + EXPRESS                           ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Blue

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

# Iniciar MongoDB
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 🐳 INICIANDO MONGODB                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🔄 Iniciando container MongoDB..." -ForegroundColor Yellow
docker-compose up -d mongodb

Write-Host "✅ MongoDB iniciado" -ForegroundColor Green
Write-Host "⏳ Aguardando Replica Set (30s)...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Configurar Prisma
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                 🔧 CONFIGURANDO PRISMA                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📦 Gerando Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
Write-Host "✅ Prisma Client gerado`n" -ForegroundColor Green

Write-Host "🔄 Sincronizando schema..." -ForegroundColor Yellow
npm run prisma:push
Write-Host "✅ Schema sincronizado`n" -ForegroundColor Green

Write-Host "🌱 Populando banco de dados..." -ForegroundColor Yellow
npm run seed
Write-Host "✅ Dados populados`n" -ForegroundColor Green

# Resumo
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✨ AMBIENTE CONFIGURADO COM SUCESSO!               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🌐 URLS DO SISTEMA:" -ForegroundColor Magenta
Write-Host "   • API:            http://localhost:4000"
Write-Host "   • Documentação:   http://localhost:4000/docs"
Write-Host "   • Prisma Studio:  http://localhost:5555`n"

Write-Host "⚡ COMANDOS RÁPIDOS:" -ForegroundColor Yellow
Write-Host "   • npm run dev              - Iniciar servidor"
Write-Host "   • npm run prisma:studio    - Abrir Prisma Studio`n"

# Iniciar servidor
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "⏰ Iniciando em 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

npm run dev

