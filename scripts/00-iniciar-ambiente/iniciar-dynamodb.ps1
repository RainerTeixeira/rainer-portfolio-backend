# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente DynamoDB Local
# Descrição: Setup completo com DynamoDB Local e criação de tabelas
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║         🚀 INICIANDO AMBIENTE LOCAL                          ║" -ForegroundColor Magenta
Write-Host "║         DYNAMODB + EXPRESS                                   ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

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

# Criar/configurar .env
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
}

Write-Host "🔄 Configurando para DynamoDB..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace 'DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=DYNAMODB'
Set-Content ".env" -Value $envContent
Write-Host "✅ Configurado para DynamoDB`n" -ForegroundColor Green

# Iniciar DynamoDB
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              🗄️  INICIANDO DYNAMODB LOCAL                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🔄 Iniciando container DynamoDB..." -ForegroundColor Yellow
docker-compose up -d dynamodb-local

Write-Host "✅ DynamoDB iniciado" -ForegroundColor Green
Write-Host "⏳ Aguardando inicialização (5s)...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Criar tabelas
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              📊 CRIANDO TABELAS NO DYNAMODB                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🏗️  Criando tabelas..." -ForegroundColor Yellow
npm run dynamodb:create-tables
Write-Host "✅ Tabelas criadas`n" -ForegroundColor Green

# Popular dados (opcional)
Write-Host "❓ Deseja popular o DynamoDB com dados de teste? [S/N]" -ForegroundColor Yellow
$resposta = Read-Host

if ($resposta -match '^[Ss]$') {
    Write-Host "`n🌱 Populando DynamoDB..." -ForegroundColor Yellow
    npm run dynamodb:seed
    Write-Host "✅ Dados inseridos`n" -ForegroundColor Green
} else {
    Write-Host "⏭️  Pulando população de dados`n" -ForegroundColor Yellow
}

# Resumo
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       ✨ AMBIENTE DYNAMODB CONFIGURADO COM SUCESSO!         ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🌐 URLS DO SISTEMA:" -ForegroundColor Magenta
Write-Host "   • DynamoDB Local: http://localhost:8000"
Write-Host "   • API:            http://localhost:4000"
Write-Host "   • Documentação:   http://localhost:4000/docs`n"

Write-Host "⚡ COMANDOS RÁPIDOS:" -ForegroundColor Yellow
Write-Host "   • npm run dev                      - Iniciar servidor"
Write-Host "   • npm run dynamodb:list-tables     - Listar tabelas`n"

# Iniciar servidor
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "⏰ Iniciando em 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

npm run dev

