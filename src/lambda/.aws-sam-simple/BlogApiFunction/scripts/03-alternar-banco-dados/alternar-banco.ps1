# ═══════════════════════════════════════════════════════════════════════════
# Script: Alternar Entre MongoDB (Prisma) e DynamoDB Local
# Descrição: Facilita a troca do DATABASE_PROVIDER no .env
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("PRISMA", "DYNAMODB", "status")]
    [string]$Provider = "status"
)

$envFile = ".env"

function Write-Header {
    param([string]$Text)
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Get-CurrentProvider {
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        if ($content -match 'DATABASE_PROVIDER=(\w+)') {
            return $matches[1]
        }
    }
    return "Não configurado"
}

function Show-Status {
    Write-Header "STATUS ATUAL DO BANCO DE DADOS"
    
    $current = Get-CurrentProvider
    
    Write-Host "📊 Provider Ativo: " -NoNewline
    if ($current -eq "PRISMA") {
        Write-Host "MongoDB (PRISMA)" -ForegroundColor Green
        Write-Host "`n🗄️  MongoDB:" -ForegroundColor Cyan
        Write-Host "   Connection: mongodb://localhost:27017/blog?replicaSet=rs0" -ForegroundColor White
        Write-Host "   GUI: http://localhost:5555 (Prisma Studio)" -ForegroundColor White
    } elseif ($current -eq "DYNAMODB") {
        Write-Host "DynamoDB Local (DYNAMODB)" -ForegroundColor Green
        Write-Host "`n📊 DynamoDB Local:" -ForegroundColor Cyan
        Write-Host "   Endpoint: http://localhost:8000" -ForegroundColor White
        Write-Host "   GUI: http://localhost:8001 (DynamoDB Admin)" -ForegroundColor White
    } else {
        Write-Host $current -ForegroundColor Red
    }
    
    Write-Host "`n💡 Para alternar:" -ForegroundColor Yellow
    Write-Host "   .\scripts\alternar-banco.ps1 PRISMA" -ForegroundColor White
    Write-Host "   .\scripts\alternar-banco.ps1 DYNAMODB`n" -ForegroundColor White
}

function Set-Provider {
    param([string]$NewProvider)
    
    Write-Header "ALTERANDO BANCO DE DADOS"
    
    $current = Get-CurrentProvider
    
    if ($current -eq $NewProvider) {
        Write-Host "⚠️  Já está usando: $NewProvider" -ForegroundColor Yellow
        return
    }
    
    Write-Host "De: $current" -ForegroundColor Yellow
    Write-Host "Para: $NewProvider`n" -ForegroundColor Green
    
    # Atualizar .env
    $content = Get-Content $envFile -Raw
    $content = $content -replace 'DATABASE_PROVIDER=\w+', "DATABASE_PROVIDER=$NewProvider"
    Set-Content $envFile -Value $content -NoNewline
    
    Write-Host "✅ Provider alterado para: $NewProvider`n" -ForegroundColor Green
    
    if ($NewProvider -eq "PRISMA") {
        Write-Host "🗄️  MongoDB (Prisma):" -ForegroundColor Cyan
        Write-Host "   • Certifique-se que o MongoDB está rodando" -ForegroundColor White
        Write-Host "   • Execute: docker-compose up -d mongodb" -ForegroundColor White
        Write-Host "   • Ou: .\scripts\docker-ambiente-completo.ps1 start" -ForegroundColor White
        Write-Host "`n   • Gerar Prisma Client: npm run prisma:generate" -ForegroundColor Yellow
        Write-Host "   • Sincronizar schema: npm run prisma:push" -ForegroundColor Yellow
        Write-Host "   • Visualizar dados: npm run prisma:studio`n" -ForegroundColor Yellow
    } else {
        Write-Host "📊 DynamoDB Local:" -ForegroundColor Cyan
        Write-Host "   • Certifique-se que o DynamoDB Local está rodando" -ForegroundColor White
        Write-Host "   • Execute: docker-compose up -d dynamodb-local" -ForegroundColor White
        Write-Host "   • Ou: .\scripts\docker-ambiente-completo.ps1 start" -ForegroundColor White
        Write-Host "`n   • Criar tabelas: npm run dynamodb:create-tables" -ForegroundColor Yellow
        Write-Host "   • Seed de dados: npm run dynamodb:seed" -ForegroundColor Yellow
        Write-Host "   • Visualizar dados: http://localhost:8001`n" -ForegroundColor Yellow
    }
    
    Write-Host "🚀 Reinicie a aplicação para aplicar as mudanças!" -ForegroundColor Green
}

# Executar
if ($Provider -eq "status") {
    Show-Status
} else {
    Set-Provider -NewProvider $Provider
}

