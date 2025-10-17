@echo off
:: ============================================================================
:: Script UNIFICADO para testar TODAS as rotas com CRUD completo
:: Combina os melhores recursos dos scripts bash e PowerShell
:: ============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║    🧪 TESTE COMPLETO DE TODAS AS ROTAS - BLOG API (CRUD COMPLETO)       ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.
echo Este script testa:
echo   ✅ Health Check
echo   ✅ Autenticacao (registro, login, refresh)
echo   ✅ CRUD completo de Usuarios
echo   ✅ CRUD completo de Categorias e Subcategorias
echo   ✅ CRUD completo de Posts
echo   ✅ CRUD completo de Comentarios
echo   ✅ Likes, Bookmarks e Notificacoes
echo   ✅ Opcao de deletar dados de teste
echo.

:: Executar script PowerShell unificado
powershell -ExecutionPolicy Bypass -File "%~dp0testar-todas-rotas-completo.ps1"

echo.
pause

