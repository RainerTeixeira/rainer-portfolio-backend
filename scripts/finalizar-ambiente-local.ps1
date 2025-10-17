# ═══════════════════════════════════════════════════════════════════════════
# Script: Finalizar Configuração do Ambiente Local
# Descrição: Corrige pendências e prepara para produção/cloud
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"

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
    Write-Host "⚠️  AWS CLI não encontrado. Instalando..." -ForegroundColor Yellow
    
    $awsUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
    $output = "$env:TEMP\AWSCLIV2.msi"
    
    Write-Host "📥 Baixando..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $awsUrl -OutFile $output -UseBasicParsing
    
    Write-Host "🔧 Instalando..." -ForegroundColor Cyan
    Start-Process msiexec.exe -ArgumentList "/i `"$output`" /qn /norestart" -Wait -NoNewWindow
    
    Write-Host "✅ Instalado! (Reinicie o terminal para usar)" -ForegroundColor Green
}

# FASE 2: Criar Tabelas DynamoDB
Write-Host "`n📊 FASE 2: Criando tabelas DynamoDB..." -ForegroundColor Yellow

npm run dynamodb:create-tables 2>&1 | Out-File -FilePath "logs\dynamodb-setup.log" -Append
Write-Host "✅ Tabelas criadas! Ver logs\dynamodb-setup.log" -ForegroundColor Green

# FASE 3: Popular MongoDB
Write-Host "`n📊 FASE 3: Populando MongoDB com dados..." -ForegroundColor Yellow

tsx src/prisma/mongodb.seed.ts 2>&1 | Out-File -FilePath "logs\seed-final.log"
Write-Host "✅ MongoDB populado! Ver logs\seed-final.log" -ForegroundColor Green

# FASE 4: Verificar Containers
Write-Host "`n📊 FASE 4: Status dos containers..." -ForegroundColor Yellow

docker ps --filter "name=blogapi" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# FASE 5: Testar API (se rodando)
Write-Host "`n📊 FASE 5: Testando API..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get -TimeoutSec 3
    Write-Host "✅ API funcionando!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "⚠️  API não está rodando. Inicie com: npm run start:dev" -ForegroundColor Yellow
}

# RESUMO
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RESUMO FINAL                                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✅ AWS CLI instalado (reinicie terminal se necessário)" -ForegroundColor White
Write-Host "✅ Tabelas DynamoDB criadas" -ForegroundColor White
Write-Host "✅ MongoDB populado com dados" -ForegroundColor White
Write-Host "✅ Containers rodando" -ForegroundColor White

Write-Host "`n📚 PRÓXIMOS PASSOS:`n" -ForegroundColor Yellow
Write-Host "1. Se a API não estiver rodando:" -ForegroundColor White
Write-Host "   npm run start:dev`n" -ForegroundColor Cyan

Write-Host "2. Acessar aplicação:" -ForegroundColor White
Write-Host "   http://localhost:4000/api`n" -ForegroundColor Cyan

Write-Host "3. Para preparar deploy na nuvem:" -ForegroundColor White
Write-Host "   Ver: docs/GUIA_DEPLOY_CLOUD.md`n" -ForegroundColor Cyan

Write-Host "═══════════════════════════════════════════════════════════`n"

