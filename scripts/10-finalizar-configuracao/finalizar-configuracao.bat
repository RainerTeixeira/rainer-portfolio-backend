@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     ✨ FINALIZAR CONFIGURAÇÃO DO AMBIENTE                    ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script prepara tudo para produção:
echo   ✅ AWS CLI
echo   ✅ Tabelas DynamoDB
echo   ✅ Dados MongoDB
echo   ✅ Validação completa
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0finalizar-configuracao.ps1"

echo.
pause

