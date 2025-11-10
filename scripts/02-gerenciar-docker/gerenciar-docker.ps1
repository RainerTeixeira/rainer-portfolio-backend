# ═══════════════════════════════════════════════════════════════════════════
# Script: Gerenciar Ambiente Completo de Desenvolvimento
# Descrição: Inicia MongoDB e DynamoDB Local simultaneamente com interfaces gráficas
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "clean")]
    [string]$Action = "start"
)

$ErrorActionPreference = "Continue"

# Cores para output
function Write-Header {
    param([string]$Text)
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

# Verificar se Docker está rodando
function Test-Docker {
    try {
        docker ps | Out-Null
        return $true
    } catch {
        Write-Error-Custom "Docker não está rodando!"
        Write-Info "Inicie o Docker Desktop e tente novamente."
        return $false
    }
}

# Iniciar ambiente completo
function Start-Environment {
    Write-Header "INICIANDO AMBIENTE COMPLETO DE DESENVOLVIMENTO"
    
    if (-not (Test-Docker)) { return }
    
    Write-Info "Iniciando MongoDB + DynamoDB Local + Interfaces Gráficas..."
    
    docker-compose up -d mongodb dynamodb-local prisma-studio dynamodb-admin
    
    Write-Host "`n"
    Start-Sleep -Seconds 3
    
    Write-Success "Ambiente iniciado com sucesso!"
    Write-Host "`n"
    
    Show-Status
}

# Parar ambiente
function Stop-Environment {
    Write-Header "PARANDO AMBIENTE DE DESENVOLVIMENTO"
    
    Write-Info "Parando todos os serviços..."
    docker-compose down
    
    Write-Success "Ambiente parado com sucesso!"
}

# Reiniciar ambiente
function Restart-Environment {
    Write-Header "REINICIANDO AMBIENTE DE DESENVOLVIMENTO"
    
    Stop-Environment
    Start-Sleep -Seconds 2
    Start-Environment
}

# Mostrar status
function Show-Status {
    Write-Header "STATUS DOS SERVIÇOS"
    
    $services = @(
        @{Name="MongoDB"; Container="blogapi-mongodb"; Port=27017},
        @{Name="DynamoDB Local"; Container="blogapi-dynamodb"; Port=8000},
        @{Name="Prisma Studio"; Container="blogapi-prisma-studio"; Port=5555},
        @{Name="DynamoDB Admin"; Container="blogapi-dynamodb-admin"; Port=8001}
    )
    
    foreach ($service in $services) {
        $status = docker ps --filter "fullName=$($service.Container)" --format "{{.Status}}" 2>$null
        
        if ($status) {
            Write-Success "$($service.Name) - Rodando (Porta: $($service.Port))"
        } else {
            Write-Warning "$($service.Name) - Parado"
        }
    }
    
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  ACESSE AS INTERFACES                                     ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    Write-Host "🗄️  MongoDB:" -ForegroundColor Cyan
    Write-Host "   Connection: mongodb://localhost:27017/blog?replicaSet=rs0" -ForegroundColor White
    Write-Host "   GUI: http://localhost:5555 (Prisma Studio)`n" -ForegroundColor White
    
    Write-Host "📊 DynamoDB Local:" -ForegroundColor Cyan
    Write-Host "   Endpoint: http://localhost:8000" -ForegroundColor White
    Write-Host "   GUI: http://localhost:8001 (DynamoDB Admin)`n" -ForegroundColor White
    
    Write-Host "🚀 Para iniciar a aplicação:" -ForegroundColor Green
    Write-Host "   npm run start:dev`n" -ForegroundColor White
}

# Ver logs
function Show-Logs {
    Write-Header "LOGS DO AMBIENTE"
    
    Write-Info "Pressione Ctrl+C para sair"
    docker-compose logs -f mongodb dynamodb-local
}

# Limpar volumes
function Clean-Environment {
    Write-Header "LIMPANDO AMBIENTE"
    
    Write-Warning "Isso irá apagar TODOS OS DADOS dos bancos locais!"
    $confirm = Read-Host "Tem certeza? (S/N)"
    
    if ($confirm -eq 'S' -or $confirm -eq 's') {
        docker-compose down -v
        Write-Success "Volumes removidos com sucesso!"
    } else {
        Write-Info "Operação cancelada"
    }
}

# Executar ação
switch ($Action) {
    "start" { Start-Environment }
    "stop" { Stop-Environment }
    "restart" { Restart-Environment }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "clean" { Clean-Environment }
}

