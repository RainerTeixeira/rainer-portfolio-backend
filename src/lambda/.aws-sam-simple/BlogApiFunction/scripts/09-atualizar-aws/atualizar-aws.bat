@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     🔑 ATUALIZAR CREDENCIAIS AWS                             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script atualiza de forma segura:
echo   ✅ AWS_ACCESS_KEY_ID
echo   ✅ AWS_SECRET_ACCESS_KEY
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0atualizar-aws.ps1"

echo.
pause

