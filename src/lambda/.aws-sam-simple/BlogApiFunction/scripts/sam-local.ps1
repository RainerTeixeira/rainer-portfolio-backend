#!/usr/bin/env pwsh
# Script para build e execução SAM local com DynamoDB

Write-Host "🚀 Iniciando ambiente SAM Local com DynamoDB" -ForegroundColor Cyan

# 1. Verificar DynamoDB Local
Write-Host "`n📦 Verificando DynamoDB Local..." -ForegroundColor Yellow
$dynamoContainer = docker ps --filter "name=rainer-blog-backend-dynamodb" --format "{{.Names}}"

if ($dynamoContainer -ne "rainer-blog-backend-dynamodb") {
    Write-Host "⚠️  DynamoDB Local não está rodando. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d dynamodb
    Start-Sleep -Seconds 5
} else {
    Write-Host "✅ DynamoDB Local já está rodando" -ForegroundColor Green
}

# 2. Validar template SAM
Write-Host "`n🔍 Validando template SAM..." -ForegroundColor Yellow
sam validate --template-file src/lambda/template.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na validação do template" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Template válido" -ForegroundColor Green

# 3. Build com container
Write-Host "`n🏗️  Executando build SAM com container..." -ForegroundColor Yellow
Write-Host "⏳ Isso pode levar alguns minutos na primeira vez..." -ForegroundColor Gray
sam build `
    --template-file src/lambda/template.yaml `
    --build-dir src/lambda/.aws-sam `
    --no-cached `
    --use-container `
    --parameter-overrides Environment=dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build SAM" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build concluído" -ForegroundColor Green

# 4. Iniciar SAM local
Write-Host "`n🚀 Iniciando SAM local na porta 4000..." -ForegroundColor Yellow
Write-Host "📝 Variáveis de ambiente:" -ForegroundColor Gray
Write-Host "   DATABASE_PROVIDER=DYNAMODB" -ForegroundColor Gray
Write-Host "   DYNAMODB_ENDPOINT=http://host.docker.internal:8000" -ForegroundColor Gray
Write-Host "   CORS_ORIGIN=http://localhost:3000" -ForegroundColor Gray
Write-Host "`n🌐 API disponível em: http://localhost:4000" -ForegroundColor Cyan
Write-Host "📚 Endpoints de teste:" -ForegroundColor Cyan
Write-Host "   - http://localhost:4000/health" -ForegroundColor Gray
Write-Host "   - http://localhost:4000/api/v1/health" -ForegroundColor Gray
Write-Host "   - http://localhost:4000/api/v1/posts" -ForegroundColor Gray
Write-Host "`n⚠️  Pressione Ctrl+C para parar o servidor`n" -ForegroundColor Yellow

sam local start-api `
    --template-file src/lambda/template.yaml `
    --port 4000 `
    --parameter-overrides Environment=dev `
    --skip-pull-image `
    --env-vars src/lambda/env.json
