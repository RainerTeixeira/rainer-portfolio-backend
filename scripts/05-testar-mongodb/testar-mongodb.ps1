# ═══════════════════════════════════════════════════════════════════════════
# Script de Testes - MongoDB + Prisma
# ═══════════════════════════════════════════════════════════════════════════
# 
# Executa validação completa do backend com MongoDB/Prisma
# 
# Uso:
#   .\scripts\test-mongodb.ps1          # Executar todos os testes
#   .\scripts\test-mongodb.ps1 -Quick   # Apenas testes rápidos
#   .\scripts\test-mongodb.ps1 -E2E     # Apenas testes E2E
#   .\scripts\test-mongodb.ps1 -Setup   # Apenas setup (MongoDB + Prisma)
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
Write-Host "  🧪 Testes MongoDB + Prisma" -ForegroundColor Cyan
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

# Verificar se MongoDB está rodando
$mongoContainer = docker ps --filter "name=mongodb" --filter "status=running" --format "{{.Names}}"
if ($mongoContainer) {
    Write-Success "MongoDB está rodando ($mongoContainer)"
} else {
    Write-Info "MongoDB não está rodando. Iniciando..."
    docker-compose up -d mongodb
    Start-Sleep -Seconds 3
    
    $mongoContainer = docker ps --filter "name=mongodb" --filter "status=running" --format "{{.Names}}"
    if ($mongoContainer) {
        Write-Success "MongoDB iniciado com sucesso"
    } else {
        Write-Error "Falha ao iniciar MongoDB"
        exit 1
    }
}

# Verificar Prisma Client
if (Test-Path "node_modules/@prisma/client") {
    Write-Success "Prisma Client está instalado"
} else {
    Write-Info "Prisma Client não encontrado. Gerando..."
    npm run prisma:generate
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Prisma Client gerado"
    } else {
        Write-Error "Falha ao gerar Prisma Client"
        exit 1
    }
}

# Se apenas setup, parar aqui
if ($Setup) {
    Write-Success "`nSetup concluído! MongoDB e Prisma prontos.`n"
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
    $testArgs += "tests/integration/mongodb-prisma.integration.test.ts"
}
elseif ($E2E) {
    Write-Step "Executando testes E2E..."
    $testArgs += "tests/e2e/mongodb-backend.e2e.test.ts"
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
    Write-Host "  • MongoDB: Conectado ✅" -ForegroundColor Gray
    Write-Host "  • Prisma: Funcionando ✅" -ForegroundColor Gray
    Write-Host "  • CRUD: Validado ✅" -ForegroundColor Gray
    Write-Host "  • Relacionamentos: OK ✅" -ForegroundColor Gray
    
    if ($Coverage) {
        Write-Host "`n📈 Cobertura de código disponível em: coverage/index.html" -ForegroundColor Cyan
    }
    
    Write-Host "`n✅ Backend MongoDB/Prisma está 100% funcional!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Error "ALGUNS TESTES FALHARAM! ❌"
    Write-Host "`n🔍 Verifique os erros acima e execute novamente." -ForegroundColor Yellow
    Write-Host "💡 Dica: Execute com -Verbose para mais detalhes`n" -ForegroundColor Yellow
    exit 1
}

