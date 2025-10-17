@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     🐳 GERENCIAR AMBIENTE DOCKER COMPLETO                    ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script gerencia todos os serviços Docker:
echo   ✅ MongoDB + Replica Set
echo   ✅ DynamoDB Local
echo   ✅ Prisma Studio
echo   ✅ DynamoDB Admin
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0gerenciar-docker.ps1" %*

echo.
pause

