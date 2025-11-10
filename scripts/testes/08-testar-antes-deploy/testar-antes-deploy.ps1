# ═══════════════════════════════════════════════════════════════════════════
# 🧪 SCRIPT DE TESTE LOCAL ANTES DE DEPLOY AWS
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 TESTE LOCAL COMPLETO - SIMULANDO AMBIENTE AWS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Ler PORT do .env (fallback para 4000)
$PORT = "4000"
if (Test-Path ".env") {
    $portLine = Get-Content ".env" | Where-Object { $_ -match "^PORT\s*=\s*(\d+)" }
    if ($portLine -match "PORT\s*=\s*(\d+)") {
        $PORT = $matches[1]
    }
}
$BaseUrl = "http://localhost:$PORT"
Write-Host "🔧 Usando porta do .env: $PORT`n" -ForegroundColor Cyan

# Verificar Docker
Write-Host "📋 Verificando Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está rodando`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando!`n" -ForegroundColor Red
    exit 1
}

# Configurar .env
Write-Host "📝 Configurando .env para DynamoDB Local..." -ForegroundColor Yellow
cd ../..
Copy-Item ".env" ".env.backup" -Force -ErrorAction SilentlyContinue
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace 'DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=DYNAMODB'
Set-Content ".env" -Value $envContent
Write-Host "✅ .env configurado`n" -ForegroundColor Green

# Iniciar DynamoDB
Write-Host "🐳 Iniciando DynamoDB Local..." -ForegroundColor Yellow
docker-compose up -d dynamodb-local
Start-Sleep -Seconds 5
Write-Host "✅ DynamoDB Local iniciado`n" -ForegroundColor Green

# Criar tabelas
Write-Host "🗄️  Criando tabelas DynamoDB..." -ForegroundColor Yellow
npm run dynamodb:create-tables
Write-Host "✅ Tabelas criadas`n" -ForegroundColor Green

# Popular dados
Write-Host "🌱 Populando dados..." -ForegroundColor Yellow
npm run dynamodb:seed
Write-Host "✅ Dados inseridos`n" -ForegroundColor Green

# Testar endpoints
Write-Host "🧪 Testando endpoints..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host "   1. Health Check... ✅" -ForegroundColor Green
    }
} catch {
    Write-Host "   1. Health Check... ❌" -ForegroundColor Red
}

Write-Host "`n✅ Teste concluído!`n" -ForegroundColor Green

Write-Host "📝 Próximos passos para deploy AWS:" -ForegroundColor Cyan
Write-Host "   1. aws configure"
Write-Host "   2. cd src/lambda && sam build"
Write-Host "   3. sam deploy --guided`n"

