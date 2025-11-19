@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     🔧 CORREÇÃO RÁPIDA DO WSL - Erro 0x80070422              ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script corrige o erro: "The service cannot be started"
echo.
echo ⚠️  IMPORTANTE: Execute como Administrador!
echo.
echo Como executar como Admin:
echo   1. Clique com botão direito neste arquivo (.bat)
echo   2. Selecione "Executar como administrador"
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0fix-wsl-simple.ps1"

echo.
pause
