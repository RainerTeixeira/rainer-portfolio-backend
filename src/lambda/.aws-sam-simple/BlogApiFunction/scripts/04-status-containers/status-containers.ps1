# ═══════════════════════════════════════════════════════════════════════════
# Script: Status dos Containers Docker
# Descrição: Visualiza status detalhado dos containers
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            🐳 STATUS DOS CONTAINERS DOCKER                   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar Docker
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está rodando`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "💡 Inicie o Docker Desktop e tente novamente.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Containers do BlogAPI:`n" -ForegroundColor Yellow

# Listar containers
$containers = docker ps -a --filter "fullName=blogapi" --format "{{.Names}}|{{.Status}}|{{.Ports}}"

if ($containers) {
    Write-Host "Container                Status                    Portas" -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    
    foreach ($container in $containers) {
        $parts = $container -split '\|'
        $fullName = $parts[0]
        $status = $parts[1]
        $ports = $parts[2]
        
        if ($status -match "Up") {
            Write-Host "$fullName  " -NoNewline -ForegroundColor Green
        } else {
            Write-Host "$fullName  " -NoNewline -ForegroundColor Red
        }
        Write-Host "$status  $ports"
    }
    
    Write-Host ""
} else {
    Write-Host "⚠️  Nenhum container BlogAPI encontrado`n" -ForegroundColor Yellow
}

# Resumo
$total = ($containers | Measure-Object).Count
$running = (docker ps --filter "fullName=blogapi" -q | Measure-Object).Count

Write-Host "📊 Resumo Geral:" -ForegroundColor Yellow
Write-Host "   Total de containers BlogAPI: $total"
Write-Host "   Containers rodando: $running`n" -ForegroundColor Green

# URLs
Write-Host "🌐 URLs Disponíveis:`n" -ForegroundColor Yellow

if (docker ps --filter "fullName=blogapi-mongodb" --filter "status=running" -q) {
    Write-Host "   ✅ MongoDB:        mongodb://localhost:27017" -ForegroundColor Green
}
if (docker ps --filter "fullName=blogapi-dynamodb" --filter "status=running" -q) {
    Write-Host "   ✅ DynamoDB:       http://localhost:8000" -ForegroundColor Green
}
if (docker ps --filter "fullName=blogapi-prisma-studio" --filter "status=running" -q) {
    Write-Host "   ✅ Prisma Studio:  http://localhost:5555" -ForegroundColor Green
}
if (docker ps --filter "fullName=blogapi-dynamodb-admin" --filter "status=running" -q) {
    Write-Host "   ✅ DynamoDB Admin: http://localhost:8001" -ForegroundColor Green
}

Write-Host ""

