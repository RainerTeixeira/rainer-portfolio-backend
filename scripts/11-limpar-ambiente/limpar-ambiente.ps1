# ═══════════════════════════════════════════════════════════════════════════
# Script: Limpeza Completa do Ambiente
# Descrição: Remove todos containers, volumes, node_modules e configurações
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red -BackgroundColor White
Write-Host "║         🧹 RESET COMPLETO DO AMBIENTE                       ║" -ForegroundColor Red -BackgroundColor White
Write-Host "║      LIMPEZA TOTAL DOCKER + NODE + DADOS                    ║" -ForegroundColor Red -BackgroundColor White
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Red -BackgroundColor White
Write-Host ""

Write-Host "⚠️  ⚠️  ⚠️  ATENÇÃO: ESTA OPERAÇÃO É DESTRUTIVA! ⚠️  ⚠️  ⚠️`n" -ForegroundColor Red

Write-Host "🔴 Esta operação irá remover:" -ForegroundColor Red
Write-Host "   • Todos os containers Docker" -ForegroundColor White
Write-Host "   • Todas as imagens Docker" -ForegroundColor White
Write-Host "   • Todos os volumes Docker (DADOS SERÃO PERDIDOS)" -ForegroundColor White
Write-Host "   • Todas as redes Docker" -ForegroundColor White
Write-Host "   • Todos os processos Node.js" -ForegroundColor White
Write-Host "   • node_modules" -ForegroundColor White
Write-Host "   • Arquivo .env" -ForegroundColor White
Write-Host "   • Logs e arquivos temporários`n" -ForegroundColor White

$confirm = Read-Host "CONFIRMAR RESET COMPLETO? [S]im ou [N]ão"

if ($confirm -notmatch '^[Ss]$') {
    Write-Host "`n✅ Operação cancelada pelo usuário.`n" -ForegroundColor Green
    exit 0
}

Write-Host "`n🚀 INICIANDO RESET COMPLETO...`n" -ForegroundColor Red

# 1. Parar processos Node.js
Write-Host "[1/7] 🛑 PARANDO PROCESSOS NODE.JS..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "      ✅ Processos Node.js finalizados`n" -ForegroundColor Green

# 2. Parar e remover containers
Write-Host "[2/7] 🐳 PARANDO E REMOVENDO CONTAINERS DOCKER..." -ForegroundColor Cyan
docker ps -aq | ForEach-Object { docker stop $_ 2>$null; docker rm -f $_ 2>$null }
Write-Host "      ✅ Todos os containers removidos`n" -ForegroundColor Green

# 3. Remover imagens
Write-Host "[3/7] 📦 REMOVENDO IMAGENS DOCKER..." -ForegroundColor Cyan
docker images -q | ForEach-Object { docker rmi -f $_ 2>$null }
Write-Host "      ✅ Todas as imagens removidas`n" -ForegroundColor Green

# 4. Remover volumes
Write-Host "[4/7] 💾 REMOVENDO VOLUMES DOCKER..." -ForegroundColor Cyan
docker volume ls -q | ForEach-Object { docker volume rm -f $_ 2>$null }
Write-Host "      ✅ Todos os volumes removidos`n" -ForegroundColor Green

# 5. Limpeza do sistema Docker
Write-Host "[5/7] 🧹 LIMPEZA DO SISTEMA DOCKER..." -ForegroundColor Cyan
docker system prune -a -f --volumes 2>$null
docker network prune -f 2>$null
Write-Host "      ✅ Sistema Docker limpo`n" -ForegroundColor Green

# 6. Limpar arquivos do projeto
Write-Host "[6/7] 📁 LIMPANDO ARQUIVOS DO PROJETO..." -ForegroundColor Cyan

if (Test-Path "../node_modules") {
    Remove-Item "../node_modules" -Recurse -Force
    Write-Host "      ✅ node_modules removido" -ForegroundColor Green
}

if (Test-Path "../.env") {
    Copy-Item "../.env" "../.env.backup" -Force
    Remove-Item "../.env" -Force
    Write-Host "      ✅ Arquivo .env removido (backup criado)" -ForegroundColor Green
}

if (Test-Path "../logs") {
    Remove-Item "../logs" -Recurse -Force
    Write-Host "      ✅ Logs removidos" -ForegroundColor Green
}

Remove-Item "../*.log" -Force -ErrorAction SilentlyContinue
Remove-Item "../*.tmp" -Force -ErrorAction SilentlyContinue
Write-Host "      ✅ Arquivos temporários removidos`n" -ForegroundColor Green

# 7. Limpar cache npm
Write-Host "[7/7] 📦 LIMPANDO CACHE NPM..." -ForegroundColor Cyan
npm cache clean --force 2>$null
Write-Host "      ✅ Cache do npm limpo`n" -ForegroundColor Green

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green -BackgroundColor White
Write-Host "║         🎉 RESET COMPLETO COM SUCESSO!                      ║" -ForegroundColor Green -BackgroundColor White
Write-Host "║      AMBIENTE 100% LIMPO - PRONTO PARA COMEÇAR              ║" -ForegroundColor Green -BackgroundColor White
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green -BackgroundColor White

Write-Host "🚀 PARA COMEÇAR DO ZERO:" -ForegroundColor Green
Write-Host "   1. npm install                       - Instalar dependências" -ForegroundColor White
Write-Host "   2. iniciar-servidor-completo.bat    - Iniciar ambiente`n" -ForegroundColor White

