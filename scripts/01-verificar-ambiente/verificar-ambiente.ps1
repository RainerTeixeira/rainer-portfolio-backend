# ═══════════════════════════════════════════════════════════════════════════
# Script: Verificar Ambiente de Desenvolvimento
# Descrição: Diagnóstico completo do ambiente
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                🔍 VERIFICAÇÃO DO AMBIENTE                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$allOk = $true

# 1. Docker
Write-Host "[1/6] Verificando Docker..." -ForegroundColor Cyan
try {
    docker ps | Out-Null
    Write-Host "     ✅ Docker está funcionando`n" -ForegroundColor Green
} catch {
    Write-Host "     ❌ Docker não está rodando`n" -ForegroundColor Red
    $allOk = $false
}

# 2. Node.js
Write-Host "[2/6] Verificando Node.js..." -ForegroundColor Cyan
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "     ✅ Node.js instalado - $nodeVersion`n" -ForegroundColor Green
} else {
    Write-Host "     ❌ Node.js não instalado`n" -ForegroundColor Red
    $allOk = $false
}

# 3. npm
Write-Host "[3/6] Verificando npm..." -ForegroundColor Cyan
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "     ✅ npm instalado - v$npmVersion`n" -ForegroundColor Green
} else {
    Write-Host "     ❌ npm não instalado`n" -ForegroundColor Red
    $allOk = $false
}

# 4. Portas
Write-Host "[4/6] Verificando portas..." -ForegroundColor Cyan
$ports = @(4000, 27017, 8000, 5555, 8001)
$portNames = @{4000="API"; 27017="MongoDB"; 8000="DynamoDB"; 5555="Prisma Studio"; 8001="DynamoDB Admin"}

foreach ($port in $ports) {
    $inUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($inUse) {
        Write-Host "     ⚠️  Porta $port ($($portNames[$port])) está em uso" -ForegroundColor Yellow
    } else {
        Write-Host "     ✅ Porta $port ($($portNames[$port])) está livre" -ForegroundColor Green
    }
}
Write-Host ""

# 5. Arquivos
Write-Host "[5/6] Verificando arquivos..." -ForegroundColor Cyan
if (Test-Path "../.env") {
    Write-Host "     ✅ Arquivo .env existe" -ForegroundColor Green
    $envContent = Get-Content "../.env" -Raw
    if ($envContent -match 'DATABASE_PROVIDER=PRISMA') {
        Write-Host "     🗄️  Configurado para: MongoDB + Prisma" -ForegroundColor Cyan
    } elseif ($envContent -match 'DATABASE_PROVIDER=DYNAMODB') {
        Write-Host "     📊 Configurado para: DynamoDB" -ForegroundColor Cyan
    }
} else {
    Write-Host "     ⚠️  Arquivo .env não existe" -ForegroundColor Yellow
}

if (Test-Path "../node_modules") {
    Write-Host "     ✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "     ⚠️  node_modules não existe - execute 'npm install'" -ForegroundColor Yellow
}

if (Test-Path "../package.json") {
    Write-Host "     ✅ package.json existe`n" -ForegroundColor Green
} else {
    Write-Host "     ❌ package.json não encontrado!`n" -ForegroundColor Red
    $allOk = $false
}

# 6. Containers
Write-Host "[6/6] Verificando containers Docker..." -ForegroundColor Cyan
try {
    $containers = docker ps --filter "name=blogapi" --format "{{.Names}}: {{.Status}}"
    if ($containers) {
        Write-Host "     ✅ Containers BlogAPI encontrados:" -ForegroundColor Green
        foreach ($container in $containers) {
            Write-Host "     - $container" -ForegroundColor White
        }
    } else {
        Write-Host "     ⚠️  Nenhum container BlogAPI rodando" -ForegroundColor Yellow
    }
} catch {
    Write-Host "     ❌ Não foi possível verificar containers" -ForegroundColor Red
}

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                📋 RESUMO DA VERIFICAÇÃO                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "✨ Ambiente pronto para uso!" -ForegroundColor Green
    Write-Host "Execute: iniciar-ambiente-local.bat`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Ambiente com problemas. Verifique os erros acima.`n" -ForegroundColor Yellow
}

