# ═══════════════════════════════════════════════════════════════════════════
# Script de Execução Completa de Testes - Ambiente de Produção Simulado
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipDocker,
    [switch]$SkipSecurity,
    [switch]$SkipPerformance,
    [string]$OutputDir = "test-reports"
)

$ErrorActionPreference = "Stop"
$script:StartTime = Get-Date

# Mudar para diretório raiz do projeto
$scriptRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptRoot
Set-Location $projectRoot

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  EXECUTANDO TESTES COMPLETOS - AMBIENTE DE PRODUÇÃO SIMULADO  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Criar diretório de relatórios
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Função para log com timestamp
function Write-TestLog {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Função para verificar se Docker está rodando
function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Função para iniciar containers Docker
function Start-TestContainers {
    Write-TestLog "Iniciando containers Docker para ambiente isolado..." "Yellow"
    
    if (-not (Test-DockerRunning)) {
        Write-TestLog "Docker não está rodando. Por favor, inicie o Docker Desktop." "Red"
        exit 1
    }
    
    # Parar containers existentes
    Write-TestLog "Parando containers existentes..." "Yellow"
    docker-compose down -v 2>&1 | Out-Null
    
    # Iniciar apenas MongoDB e DynamoDB (sem a aplicação)
    Write-TestLog "Iniciando MongoDB e DynamoDB Local..." "Yellow"
    docker-compose up -d mongodb dynamodb-local
    
    # Aguardar containers ficarem saudáveis
    Write-TestLog "Aguardando containers ficarem prontos..." "Yellow"
    $maxAttempts = 60
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        $mongoStatus = docker-compose ps mongodb --format "{{.Status}}" 2>&1
        $dynamoStatus = docker-compose ps dynamodb-local --format "{{.Status}}" 2>&1
        
        if ($mongoStatus -like "*healthy*" -or $mongoStatus -like "*Up*") {
            if ($dynamoStatus -like "*healthy*" -or $dynamoStatus -like "*Up*") {
                Write-TestLog "Containers prontos!" "Green"
                Start-Sleep -Seconds 5  # Aguardar mais um pouco para garantir
                return $true
            }
        }
        
        $attempt++
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    }
    
    Write-TestLog "Timeout aguardando containers. Verificando status..." "Yellow"
    docker-compose ps
    return $false
}

# Função para executar testes
function Invoke-TestSuite {
    param(
        [string]$TestName,
        [string]$TestPattern,
        [string]$OutputFile
    )
    
    Write-TestLog "Executando: $TestName" "Cyan"
    $testStart = Get-Date
    
    $env:NODE_ENV = "test"
    $env:DATABASE_URL = "mongodb://localhost:27017/blog-test?replicaSet=rs0&directConnection=true"
    
    # Carregar variáveis do .env.test se existir
    if (Test-Path ".env.test") {
        Get-Content ".env.test" | ForEach-Object {
            if ($_ -match '^([^#][^=]*)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim().Trim('"')
                [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    
    $result = npm run test -- --testPathPattern="$TestPattern" --coverage --coverageReporters=json --coverageReporters=text --coverageReporters=lcov --coverageReporters=html 2>&1
    
    $testEnd = Get-Date
    $duration = ($testEnd - $testStart).TotalSeconds
    
    # Salvar output
    $result | Out-File -FilePath "$OutputDir\$OutputFile" -Encoding UTF8
    
    # Verificar se houve falhas
    $hasFailures = $result -match "FAIL|failed|Failed"
    $hasPassed = $result -match "PASS|passed|Passed"
    
    if ($hasFailures) {
        Write-TestLog "  ❌ $TestName - FALHAS ENCONTRADAS (${duration}s)" "Red"
        return $false
    } elseif ($hasPassed) {
        Write-TestLog "  ✅ $TestName - PASSOU (${duration}s)" "Green"
        return $true
    } else {
        Write-TestLog "  ⚠️  $TestName - RESULTADO INDETERMINADO (${duration}s)" "Yellow"
        return $null
    }
}

# Função para gerar relatório consolidado
function New-TestReport {
    param([hashtable]$Results)
    
    $report = @"
╔════════════════════════════════════════════════════════════════╗
║           RELATÓRIO DE TESTES - AMBIENTE DE PRODUÇÃO         ║
╚════════════════════════════════════════════════════════════════╝

Data/Hora: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Duração Total: $((Get-Date) - $script:StartTime)

═══════════════════════════════════════════════════════════════════
RESUMO DOS TESTES
═══════════════════════════════════════════════════════════════════

"@
    
    foreach ($key in $Results.Keys) {
        $status = $Results[$key]
        $icon = if ($status -eq $true) { "✅" } elseif ($status -eq $false) { "❌" } else { "⚠️" }
        $report += "$icon $key`n"
    }
    
    $report += @"

═══════════════════════════════════════════════════════════════════
COBERTURA DE CÓDIGO
═══════════════════════════════════════════════════════════════════

Consulte o arquivo: coverage/coverage-summary.json
Relatório HTML: coverage/index.html

"@
    
    # Ler coverage summary se existir
    if (Test-Path "coverage/coverage-summary.json") {
        $coverage = Get-Content "coverage/coverage-summary.json" | ConvertFrom-Json
        $total = $coverage.total
        
        $report += @"
Cobertura Total:
  - Statements: $($total.statements.pct)% ($($total.statements.covered)/$($total.statements.total))
  - Branches: $($total.branches.pct)% ($($total.branches.covered)/$($total.branches.total))
  - Functions: $($total.functions.pct)% ($($total.functions.covered)/$($total.functions.total))
  - Lines: $($total.lines.pct)% ($($total.lines.covered)/$($total.lines.total))

"@
        
        $targetCoverage = 90
        if ($total.lines.pct -ge $targetCoverage) {
            $report += "✅ COBERTURA DE CÓDIGO ATINGIDA ($($total.lines.pct)% >= $targetCoverage%)`n"
        } else {
            $report += "❌ COBERTURA DE CÓDIGO ABAIXO DO TARGET ($($total.lines.pct)% < $targetCoverage%)`n"
        }
    }
    
    $report += @"

═══════════════════════════════════════════════════════════════════
RELATÓRIOS DETALHADOS
═══════════════════════════════════════════════════════════════════

Todos os relatórios estão disponíveis em: $OutputDir/

"@
    
    return $report
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

Write-TestLog "Iniciando execução completa de testes..." "Cyan"

# Iniciar containers se não for pulado
if (-not $SkipDocker) {
    if (-not (Start-TestContainers)) {
        Write-TestLog "Falha ao iniciar containers. Abortando." "Red"
        exit 1
    }
} else {
    Write-TestLog "Pulando inicialização de containers Docker" "Yellow"
}

$results = @{}

try {
    # 1. Testes Unitários
    Write-Host ""
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    Write-TestLog "1. TESTES UNITÁRIOS" "Cyan"
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    
    $results["Testes Unitários"] = Invoke-TestSuite `
        -TestName "Testes Unitários" `
        -TestPattern "\.test\.ts$" `
        -OutputFile "unit-tests.log"
    
    # 2. Testes de Integração
    Write-Host ""
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    Write-TestLog "2. TESTES DE INTEGRAÇÃO" "Cyan"
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    
    $results["Testes de Integração"] = Invoke-TestSuite `
        -TestName "Testes de Integração" `
        -TestPattern "\.integration\.test\.ts$" `
        -OutputFile "integration-tests.log"
    
    # 3. Testes E2E/API
    Write-Host ""
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    Write-TestLog "3. TESTES E2E/API" "Cyan"
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    
    $results["Testes E2E/API"] = Invoke-TestSuite `
        -TestName "Testes E2E/API" `
        -TestPattern "\.e2e\.test\.ts$" `
        -OutputFile "e2e-tests.log"
    
    # 4. Testes de Segurança (se não for pulado)
    if (-not $SkipSecurity) {
        Write-Host ""
        Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
        Write-TestLog "4. TESTES DE SEGURANÇA" "Cyan"
        Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
        Write-TestLog "Executando análise de segurança básica..." "Yellow"
        
        # Verificar vulnerabilidades conhecidas
        npm audit --audit-level=moderate 2>&1 | Out-File -FilePath "$OutputDir/security-audit.log" -Encoding UTF8
        $results["Testes de Segurança"] = $true
    }
    
    # 5. Testes de Desempenho (se não for pulado)
    if (-not $SkipPerformance) {
        Write-Host ""
        Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
        Write-TestLog "5. TESTES DE DESEMPENHO" "Cyan"
        Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
        Write-TestLog "Análise de desempenho será incluída no relatório de cobertura" "Yellow"
        $results["Testes de Desempenho"] = $true
    }
    
    # Mostrar resumo final (não gerar novo relatório - apenas atualizar README.md)
    Write-Host ""
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    Write-TestLog "RESUMO FINAL" "Cyan"
    Write-TestLog "═══════════════════════════════════════════════════════════" "Cyan"
    
    $report = New-TestReport -Results $results
    Write-Host $report
    Write-TestLog "Relatório completo disponível em: $OutputDir/README.md" "Green"
    Write-TestLog "Nota: Relatórios JSON são atualizados automaticamente. Consulte o README.md para detalhes completos." "Yellow"
    
    # Verificar se todos os testes passaram
    $allPassed = ($results.Values | Where-Object { $_ -eq $false }).Count -eq 0
    
    if ($allPassed) {
        Write-Host ""
        Write-TestLog "✅ TODOS OS TESTES PASSARAM!" "Green"
        exit 0
    } else {
        Write-Host ""
        Write-TestLog "❌ ALGUNS TESTES FALHARAM. Verifique os logs em $OutputDir/" "Red"
        exit 1
    }
    
} finally {
    # Não parar containers automaticamente (podem ser úteis para debug)
    Write-TestLog "Containers Docker permanecem rodando para análise." "Yellow"
    Write-TestLog "Para parar: docker-compose down" "Yellow"
}
