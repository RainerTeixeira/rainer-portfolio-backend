@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     🔧 CORRIGIR PROBLEMAS DO WSL PARA DOCKER                 ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script diagnostica e corrige problemas comuns do WSL
echo que impedem o Docker Desktop de iniciar corretamente.
echo.
echo Erro comum: 0x80070422 - Serviço WSL desabilitado
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0corrigir-wsl.ps1" %*

echo.
pause

