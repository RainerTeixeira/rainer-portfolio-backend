# Deploy AWS Free Tier - Custo Zero Permanente
# Executa deploy otimizado para Free Tier

Write-Host "🚀 Deploy AWS Free Tier - Custo R$ 0,00 permanente" -ForegroundColor Green

# 1. Build otimizado
Write-Host "📦 Building aplicação..." -ForegroundColor Yellow
pnpm run build

# 2. Deploy produção
Write-Host "☁️ Deploy AWS SAM..." -ForegroundColor Yellow
pnpm run sam:deploy:prod

# 3. Mostrar URLs
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "📊 Verifique custos: https://console.aws.amazon.com/billing/" -ForegroundColor Cyan