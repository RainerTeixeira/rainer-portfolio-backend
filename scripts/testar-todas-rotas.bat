@echo off
:: ============================================================================
:: Script para testar TODAS as rotas da API do Swagger
:: Para na primeira rota que falhar
:: ============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║      🧪 TESTE COMPLETO DE TODAS AS ROTAS - SWAGGER (PARA NA FALHA)      ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

:: Executar script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0testar-todas-rotas.ps1"

echo.
