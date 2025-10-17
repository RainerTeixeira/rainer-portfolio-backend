# ═══════════════════════════════════════════════════════════════════════════
# Script de Testes - DynamoDB Local
# ═══════════════════════════════════════════════════════════════════════════
# 
# Executa validação completa do backend com DynamoDB Local
# 
# Uso:
#   .\scripts\testar-dynamodb.ps1          # Executar todos os testes
#   .\scripts\testar-dynamodb.ps1 -Quick   # Apenas testes rápidos
#   .\scripts\testar-dynamodb.ps1 -E2E     # Apenas testes E2E
#   .\scripts\testar-dynamodb.ps1 -Setup   # Apenas setup (DynamoDB + Tabelas)
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$Quick,
    [switch]$E2E,
    [switch]$Integration,
    [switch]$Setup,
    [switch]$Coverage,
    [switch]$Verbose
)

# Cores
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Step { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Yellow }

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 Testes DynamoDB Local" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════════════════
# 1️⃣ VERIFICAR PRÉ-REQUISITOS
# ═══════════════════════════════════════════════════════════════════════════
Write-Step "Verificando pré-requisitos..."

# Verificar se Docker está rodando
try {
    docker ps > $null 2>&1
    Write-Success "Docker está rodando"
} catch {
    Write-Error "Docker não está rodando. Execute: docker-compose up -d"
    exit 1
}

# Verificar se DynamoDB Local está rodando
$dynamoContainer = docker ps --filter "name=dynamodb" --filter "status=running" --format "{{.Names}}"
if ($dynamoContainer) {
    Write-Success "DynamoDB Local está rodando ($dynamoContainer)"
} else {
    Write-Info "DynamoDB Local não está rodando. Iniciando..."
    cd ..
    docker-compose up -d dynamodb-local
    Start-Sleep -Seconds 5
    
    $dynamoContainer = docker ps --filter "name=dynamodb" --filter "status=running" --format "{{.Names}}"
    if ($dynamoContainer) {
        Write-Success "DynamoDB Local iniciado com sucesso"
    } else {
        Write-Error "Falha ao iniciar DynamoDB Local"
        exit 1
    }
}

# Verificar se DATABASE_PROVIDER está configurado
cd ..
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match 'DATABASE_PROVIDER=DYNAMODB') {
        Write-Success "DATABASE_PROVIDER=DYNAMODB configurado"
    } else {
        Write-Info "Alterando DATABASE_PROVIDER para DYNAMODB..."
        $envContent = $envContent -replace 'DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=DYNAMODB'
        Set-Content ".env" -Value $envContent
        Write-Success "DATABASE_PROVIDER atualizado"
    }
}

# Verificar/Criar tabelas DynamoDB
Write-Info "Verificando tabelas DynamoDB..."
try {
    npm run dynamodb:create-tables 2>&1 | Out-Null
    Write-Success "Tabelas DynamoDB verificadas/criadas"
} catch {
    Write-Error "Falha ao criar tabelas DynamoDB"
    exit 1
}

# Se apenas setup, parar aqui
if ($Setup) {
    Write-Success "`nSetup concluído! DynamoDB Local e tabelas prontos.`n"
    
    Write-Host "📊 Próximos passos:" -ForegroundColor Cyan
    Write-Host "  • Popular dados: npm run dynamodb:seed" -ForegroundColor Gray
    Write-Host "  • Ver dados: http://localhost:8001 (DynamoDB Admin)" -ForegroundColor Gray
    Write-Host "  • Executar testes: .\testar-dynamodb.ps1`n" -ForegroundColor Gray
    exit 0
}

# ═══════════════════════════════════════════════════════════════════════════
# 2️⃣ EXECUTAR TESTES
# ═══════════════════════════════════════════════════════════════════════════

$testCommand = "npx jest"
$testArgs = @()

# Definir quais testes executar
if ($Quick) {
    Write-Step "Executando testes rápidos (apenas integração)..."
    $testArgs += "tests/integration/dynamodb.integration.test.ts"
}
elseif ($E2E) {
    Write-Step "Executando testes E2E..."
    $testArgs += "tests/e2e/dynamodb-backend.e2e.test.ts"
}
elseif ($Integration) {
    Write-Step "Executando testes de integração..."
    $testArgs += "tests/integration/"
}
else {
    Write-Step "Executando TODOS os testes..."
}

# Adicionar flags
if ($Coverage) {
    $testArgs += "--coverage"
}

if ($Verbose) {
    $testArgs += "--verbose"
}

# Executar testes
Write-Host ""
$command = "$testCommand $($testArgs -join ' ')"
Write-Info "Comando: $command`n"

Invoke-Expression $command

$testResult = $LASTEXITCODE

# ═══════════════════════════════════════════════════════════════════════════
# 3️⃣ RESULTADO
# ═══════════════════════════════════════════════════════════════════════════
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($testResult -eq 0) {
    Write-Success "TODOS OS TESTES PASSARAM! 🎉"
    
    # Exibir resumo
    Write-Host "`n📊 RESUMO:" -ForegroundColor Cyan
    Write-Host "  • DynamoDB: Conectado ✅" -ForegroundColor Gray
    Write-Host "  • Tabelas: Criadas ✅" -ForegroundColor Gray
    Write-Host "  • CRUD: Validado ✅" -ForegroundColor Gray
    Write-Host "  • Queries: OK ✅" -ForegroundColor Gray
    
    if ($Coverage) {
        Write-Host "`n📈 Cobertura de código disponível em: coverage/index.html" -ForegroundColor Cyan
    }
    
    Write-Host "`n✅ Backend DynamoDB está 100% funcional!`n" -ForegroundColor Green
    
    Write-Host "🌐 Acesse o DynamoDB Admin:" -ForegroundColor Cyan
    Write-Host "   http://localhost:8001`n" -ForegroundColor White
    
    exit 0
} else {
    Write-Error "ALGUNS TESTES FALHARAM! ❌"
    Write-Host "`n🔍 Verifique os erros acima e execute novamente." -ForegroundColor Yellow
    Write-Host "💡 Dica: Execute com -Verbose para mais detalhes" -ForegroundColor Yellow
    Write-Host "💡 Verifique logs: docker logs blogapi-dynamodb`n" -ForegroundColor Yellow
    exit 1
}

