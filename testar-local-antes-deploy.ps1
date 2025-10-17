# ═══════════════════════════════════════════════════════════════════════════
# 🧪 SCRIPT DE TESTE LOCAL ANTES DE DEPLOY AWS
# ═══════════════════════════════════════════════════════════════════════════
#
# Este script testa sua aplicação localmente com DynamoDB Local
# para garantir que tudo funciona ANTES de fazer deploy na AWS.
#
# Uso:
#   .\testar-local-antes-deploy.ps1
#
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 TESTE LOCAL COMPLETO - SIMULANDO AMBIENTE AWS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ═════════════════════════════════════════════════════════════════════════════
# FASE 1: Verificar Pré-requisitos
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "📋 FASE 1: Verificando pré-requisitos...`n" -ForegroundColor Yellow

# Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✅ Docker instalado" -ForegroundColor Green
} else {
    Write-Host "❌ Docker não encontrado! Instale: https://www.docker.com/" -ForegroundColor Red
    exit 1
}

# Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    exit 1
}

# .env
if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo .env não encontrado! Copie de env.example" -ForegroundColor Red
    exit 1
}

# ═════════════════════════════════════════════════════════════════════════════
# FASE 2: Configurar .env para DynamoDB Local
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n📝 FASE 2: Configurando .env para DynamoDB Local...`n" -ForegroundColor Yellow

# Backup do .env atual
Copy-Item .env .env.backup -Force
Write-Host "   ✓ Backup criado: .env.backup" -ForegroundColor Gray

# Garantir que está usando DynamoDB Local
$envContent = Get-Content .env
$envContent = $envContent -replace '^DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=DYNAMODB'

# Garantir que DYNAMODB_ENDPOINT está definido
if ($envContent -notmatch 'DYNAMODB_ENDPOINT=') {
    $envContent += "`nDYNAMODB_ENDPOINT=http://localhost:8000"
} else {
    $envContent = $envContent -replace '^#?\s*DYNAMODB_ENDPOINT=.*', 'DYNAMODB_ENDPOINT=http://localhost:8000'
}

$envContent | Set-Content .env
Write-Host "✅ .env configurado para DynamoDB Local" -ForegroundColor Green

# ═════════════════════════════════════════════════════════════════════════════
# FASE 3: Iniciar Containers
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n🐳 FASE 3: Iniciando containers Docker...`n" -ForegroundColor Yellow

Write-Host "   Iniciando MongoDB (para comparação)..." -ForegroundColor Gray
docker-compose up -d mongodb 2>&1 | Out-Null
Write-Host "   ✓ MongoDB rodando" -ForegroundColor Gray

Write-Host "   Iniciando DynamoDB Local..." -ForegroundColor Gray
docker-compose up -d dynamodb-local 2>&1 | Out-Null
Write-Host "   ✓ DynamoDB Local rodando" -ForegroundColor Gray

Write-Host "`n   Aguardando inicialização (10 segundos)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "✅ Containers prontos!`n" -ForegroundColor Green

# ═════════════════════════════════════════════════════════════════════════════
# FASE 4: Criar Tabelas DynamoDB
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "🗄️  FASE 4: Criando tabelas DynamoDB...`n" -ForegroundColor Yellow

npm run dynamodb:create-tables

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Tabelas criadas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erro ao criar tabelas!" -ForegroundColor Red
    Write-Host "   Verifique se DynamoDB Local está rodando: docker ps | grep dynamodb" -ForegroundColor Yellow
    exit 1
}

# ═════════════════════════════════════════════════════════════════════════════
# FASE 5: Popular Dados
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n🌱 FASE 5: Populando DynamoDB com dados de teste...`n" -ForegroundColor Yellow

npm run dynamodb:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Dados inseridos com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erro ao popular dados!" -ForegroundColor Red
    exit 1
}

# ═════════════════════════════════════════════════════════════════════════════
# FASE 6: Iniciar Servidor
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n🚀 FASE 6: Iniciando servidor...`n" -ForegroundColor Yellow
Write-Host "   Pressione Ctrl+C para parar o servidor quando terminar os testes.`n" -ForegroundColor Gray

# Inicia servidor em background
$serverJob = Start-Job -ScriptBlock { npm run dev }

# Aguarda servidor iniciar
Start-Sleep -Seconds 5

# ═════════════════════════════════════════════════════════════════════════════
# FASE 7: Testar Endpoints
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "🧪 FASE 7: Testando endpoints...`n" -ForegroundColor Yellow

$baseUrl = "http://localhost:4000"
$headers = @{
    "X-Database-Provider" = "DYNAMODB"
}

$testsResults = @()

# Teste 1: Health Check
Write-Host "   1. Health Check..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Headers $headers -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host " ✅" -ForegroundColor Green
        $testsResults += $true
    } else {
        Write-Host " ❌" -ForegroundColor Red
        $testsResults += $false
    }
} catch {
    Write-Host " ❌ (erro: $_)" -ForegroundColor Red
    $testsResults += $false
}

# Teste 2: Listar Usuários
Write-Host "   2. Listar Usuários..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Headers $headers -TimeoutSec 5
    if ($response.Count -gt 0) {
        Write-Host " ✅ ($($response.Count) usuários)" -ForegroundColor Green
        $testsResults += $true
    } else {
        Write-Host " ⚠️  (vazio)" -ForegroundColor Yellow
        $testsResults += $false
    }
} catch {
    Write-Host " ❌" -ForegroundColor Red
    $testsResults += $false
}

# Teste 3: Listar Posts
Write-Host "   3. Listar Posts..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/posts" -Headers $headers -TimeoutSec 5
    if ($response.Count -gt 0) {
        Write-Host " ✅ ($($response.Count) posts)" -ForegroundColor Green
        $testsResults += $true
    } else {
        Write-Host " ⚠️  (vazio)" -ForegroundColor Yellow
        $testsResults += $false
    }
} catch {
    Write-Host " ❌" -ForegroundColor Red
    $testsResults += $false
}

# Teste 4: Listar Categorias
Write-Host "   4. Listar Categorias..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Headers $headers -TimeoutSec 5
    if ($response.Count -gt 0) {
        Write-Host " ✅ ($($response.Count) categorias)" -ForegroundColor Green
        $testsResults += $true
    } else {
        Write-Host " ⚠️  (vazio)" -ForegroundColor Yellow
        $testsResults += $false
    }
} catch {
    Write-Host " ❌" -ForegroundColor Red
    $testsResults += $false
}

# Teste 5: Swagger
Write-Host "   5. Swagger UI..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/docs" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅" -ForegroundColor Green
        $testsResults += $true
    } else {
        Write-Host " ❌" -ForegroundColor Red
        $testsResults += $false
    }
} catch {
    Write-Host " ❌" -ForegroundColor Red
    $testsResults += $false
}

# ═════════════════════════════════════════════════════════════════════════════
# FASE 8: Resultado Final
# ═════════════════════════════════════════════════════════════════════════════

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 RESULTADO DOS TESTES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$passed = ($testsResults | Where-Object {$_ -eq $true}).Count
$total = $testsResults.Count
$percentage = [math]::Round(($passed / $total) * 100)

Write-Host "   Testes passados: $passed/$total ($percentage%)`n" -ForegroundColor $(if ($percentage -eq 100) { "Green" } else { "Yellow" })

if ($percentage -eq 100) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "`n✅ Sua aplicação está pronta para deploy na AWS!`n" -ForegroundColor Green
    
    Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Configure AWS CLI: aws configure"
    Write-Host "   2. Build: cd src/lambda && sam build"
    Write-Host "   3. Deploy: sam deploy --guided"
    Write-Host "   4. Teste: curl https://sua-url/health`n"
    
} else {
    Write-Host "⚠️  ALGUNS TESTES FALHARAM!" -ForegroundColor Yellow
    Write-Host "`n❌ Corrija os erros antes de fazer deploy na AWS!`n" -ForegroundColor Red
}

Write-Host "🌐 Links úteis:" -ForegroundColor Cyan
Write-Host "   • API: http://localhost:4000"
Write-Host "   • Swagger: http://localhost:4000/docs"
Write-Host "   • Health: http://localhost:4000/health`n"

Write-Host "💡 Para testar manualmente:" -ForegroundColor Cyan
Write-Host "   Deixe o servidor rodando e teste no Swagger!"
Write-Host "   Pressione Ctrl+C quando terminar.`n"

# Para o servidor quando usuário pressionar Ctrl+C
try {
    Wait-Job $serverJob
} finally {
    Write-Host "`n🛑 Parando servidor..." -ForegroundColor Yellow
    Stop-Job $serverJob
    Remove-Job $serverJob
    
    Write-Host "✅ Script finalizado!`n" -ForegroundColor Green
}

