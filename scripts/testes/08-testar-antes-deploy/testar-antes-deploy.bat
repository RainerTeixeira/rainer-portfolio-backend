@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     🧪 TESTAR LOCAL ANTES DE DEPLOY AWS                      ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script simula ambiente AWS localmente:
echo   ✅ DynamoDB Local
echo   ✅ Testes de endpoints
echo   ✅ Validação pré-deploy
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0testar-antes-deploy.ps1"

echo.
pause

