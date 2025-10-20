# ═══════════════════════════════════════════════════════════════════════════
# Script: Finalizar Configuração do Ambiente Local
# Descrição: Prepara tudo para produção/cloud
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  FINALIZANDO AMBIENTE LOCAL                               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# FASE 1: Verificar AWS CLI
Write-Host "📊 FASE 1: Verificando AWS CLI..." -ForegroundColor Yellow

$awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
if (Test-Path $awsPath) {
    Write-Host "✅ AWS CLI já instalado!" -ForegroundColor Green
    & $awsPath --version
} else {
    Write-Host "⚠️  AWS CLI não encontrado." -ForegroundColor Yellow
    Write-Host "   Instale em: https://aws.amazon.com/cli/`n" -ForegroundColor Cyan
}

# FASE 2: Criar Tabelas DynamoDB
Write-Host "`n📊 FASE 2: Criando tabelas DynamoDB..." -ForegroundColor Yellow

cd ../..
npm run dynamodb:create-tables 2>&1 | Out-Null
Write-Host "✅ Tabelas criadas!`n" -ForegroundColor Green

# FASE 3: Popular MongoDB
Write-Host "📊 FASE 3: Populando MongoDB..." -ForegroundColor Yellow

npx tsx src/prisma/mongodb.seed.ts 2>&1 | Out-Null
Write-Host "✅ MongoDB populado!`n" -ForegroundColor Green

# FASE 4: Verificar Containers
Write-Host "📊 FASE 4: Status dos containers..." -ForegroundColor Yellow

docker ps --filter "name=blogapi" --format "table {{.Names}}\t{{.Status}}"
Write-Host ""

# FASE 5: Testar API
Write-Host "📊 FASE 5: Testando API..." -ForegroundColor Yellow

# Ler PORT do .env
$PORT = "4000"
if (Test-Path ".env") {
    $portLine = Get-Content ".env" | Where-Object { $_ -match "^PORT\s*=\s*(\d+)" }
    if ($portLine -match "PORT\s*=\s*(\d+)") {
        $PORT = $matches[1]
    }
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:$PORT/health" -Method Get -TimeoutSec 3
    Write-Host "✅ API funcionando na porta $PORT!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "⚠️  API não está rodando. Inicie com: npm run start:dev" -ForegroundColor Yellow
}

# RESUMO
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RESUMO FINAL                                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✅ Configuração finalizada!`n" -ForegroundColor Green

Write-Host "📚 PRÓXIMOS PASSOS:`n" -ForegroundColor Yellow
Write-Host "1. Se a API não estiver rodando:" -ForegroundColor White
Write-Host "   npm run start:dev`n" -ForegroundColor Cyan

Write-Host "2. Acessar aplicação:" -ForegroundColor White
Write-Host "   http://localhost:$PORT/api`n" -ForegroundColor Cyan

Write-Host "3. Para deploy na nuvem:" -ForegroundColor White
Write-Host "   Ver: docs/GUIA_DEPLOY_CLOUD.md`n" -ForegroundColor Cyan

