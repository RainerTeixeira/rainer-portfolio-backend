@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     🗄️  TESTAR MONGODB + PRISMA                              ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Este script valida:
echo   ✅ Conexão MongoDB
echo   ✅ Prisma Client
echo   ✅ Operações CRUD
echo   ✅ Relacionamentos
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0testar-mongodb.ps1" %*

echo.
pause

