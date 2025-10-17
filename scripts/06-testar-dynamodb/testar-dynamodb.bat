@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     📊 TESTAR DYNAMODB LOCAL                                 ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script valida:
echo   ✅ Conexao DynamoDB Local
echo   ✅ Tabelas criadas
echo   ✅ Operacoes CRUD
echo   ✅ Queries e Scans
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0testar-dynamodb.ps1" %*

echo.
pause

