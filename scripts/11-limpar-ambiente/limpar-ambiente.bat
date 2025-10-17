@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
cls

:: =============================================================================
:: Configuração de Cores ANSI para Windows
:: =============================================================================
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

set "RESET=%DEL%%DEL%[0m"
set "BOLD=%DEL%%DEL%[1m"
set "RED=%DEL%%DEL%[91m"
set "GREEN=%DEL%%DEL%[92m"
set "YELLOW=%DEL%%DEL%[93m"
set "BLUE=%DEL%%DEL%[94m"
set "MAGENTA=%DEL%%DEL%[95m"
set "CYAN=%DEL%%DEL%[96m"
set "WHITE=%DEL%%DEL%[97m"
set "BG_RED=%DEL%%DEL%[41m"
set "BG_BLUE=%DEL%%DEL%[44m"
set "BG_GREEN=%DEL%%DEL%[42m"

:: =============================================================================
:: Banner Principal - Reset Completo
:: =============================================================================
echo.
echo %BOLD%%BG_RED%%WHITE% ╔══════════════════════════════════════════════════════════════════════════╗ %RESET%
echo %BOLD%%BG_RED%%WHITE% ║                       🧹 RESET COMPLETO DO AMBIENTE                      ║ %RESET%
echo %BOLD%%BG_RED%%WHITE% ║                  LIMPEZA TOTAL DOCKER + NODE + DADOS                     ║ %RESET%
echo %BOLD%%BG_RED%%WHITE% ╚══════════════════════════════════════════════════════════════════════════╝ %RESET%
echo.

:: =============================================================================
:: Aviso de Destrutividade
:: =============================================================================
echo %BOLD%%RED%⚠️  ⚠️  ⚠️  ATENÇÃO: ESTA OPERAÇÃO É DESTRUTIVA! ⚠️  ⚠️  ⚠️%RESET%
echo.
echo %RED%🔴 %BOLD%Esta operação irá remover:%RESET%
echo %WHITE%   ┌─ %RED%Todos os containers Docker%RESET% (rodando e parados)%RESET%
echo %WHITE%   ├─ %RED%Todas as imagens Docker%RESET%
echo %WHITE%   ├─ %RED%Todos os volumes Docker%RESET% (DADOS SERÃO PERDIDOS)%RESET%
echo %WHITE%   ├─ %RED%Todas as redes Docker%RESET%
echo %WHITE%   ├─ %RED%Todos os processos Node.js%RESET%
echo %WHITE%   ├─ %RED%node_modules%RESET%
echo %WHITE%   ├─ %RED%Arquivo .env%RESET%
echo %WHITE%   └─ %RED%Logs e arquivos temporários%RESET%
echo.

echo %YELLOW%💡 %BOLD%Use esta operação quando quiser:%RESET%
echo %WHITE%   • Recomeçar completamente do zero%RESET%
echo %WHITE%   • Solucionar problemas persistentes%RESET%
echo %WHITE%   • Limpar antes de demonstrar o projeto%RESET%
echo %WHITE%   • Preparar para deploy%RESET%
echo.

choice /C SN /N /M "%BOLD%%RED%CONFIRMAR RESET COMPLETO? [S]im ou [N]ão:%RESET% "
if errorlevel 2 (
    echo.
    echo %GREEN%✅ %BOLD%Operação cancelada pelo usuário.%RESET%
    timeout /t 2 >nul
    exit /b 0
)

echo.
echo %BOLD%%RED%🚀 INICIANDO RESET COMPLETO...%RESET%
echo.

:: =============================================================================
:: 1. Parar Todos os Processos Node.js
:: =============================================================================
echo %BOLD%%CYAN%[1/7]%RESET% %YELLOW%🛑 PARANDO PROCESSOS NODE.JS...%RESET%
echo.

set "node_processes=0"
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul && (
    echo %YELLOW%🔍 %BOLD%Encontrados processos Node.js ativos%RESET%
    taskkill /F /IM node.exe >nul 2>&1
    if not errorlevel 1 (
        set "node_processes=1"
        echo %GREEN%✅ %BOLD%Processos Node.js finalizados%RESET%
    )
)

if "!node_processes!"=="0" (
    echo %GREEN%✅ %BOLD%Nenhum processo Node.js encontrado%RESET%
)

:: Verificar e matar processos em portas específicas
for /F "tokens=5" %%P in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    echo %YELLOW%🔌 %BOLD%Finalizando processo na porta 4000 (PID: %%P)...%RESET%
    taskkill /F /PID %%P >nul 2>&1
)

for /F "tokens=5" %%P in ('netstat -ano ^| findstr :5555 ^| findstr LISTENING') do (
    echo %YELLOW%🔌 %BOLD%Finalizando processo na porta 5555 (PID: %%P)...%RESET%
    taskkill /F /PID %%P >nul 2>&1
)

echo.

:: =============================================================================
:: 2. Parar e Remover Todos os Containers Docker
:: =============================================================================
echo %BOLD%%CYAN%[2/7]%RESET% %YELLOW%🐳 PARANDO E REMOVENDO CONTAINERS DOCKER...%RESET%
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠️  %BOLD%Docker não está rodando%RESET%
) else (
    echo %YELLOW%🔍 %BOLD%Verificando containers ativos...%RESET%
    
    :: Parar containers
    for /f "tokens=*" %%i in ('docker ps -q 2^>nul') do (
        echo %YELLOW%🛑 %BOLD%Parando container %%i...%RESET%
        docker stop %%i >nul 2>&1
    )
    
    :: Remover todos os containers
    for /f "tokens=*" %%i in ('docker ps -aq 2^>nul') do (
        echo %YELLOW%🗑️  %BOLD%Removendo container %%i...%RESET%
        docker rm -f %%i >nul 2>&1
    )
    
    echo %GREEN%✅ %BOLD%Todos os containers removidos%RESET%
)

echo.

:: =============================================================================
:: 3. Remover Todas as Imagens Docker
:: =============================================================================
echo %BOLD%%CYAN%[3/7]%RESET% %YELLOW%📦 REMOVENDO IMAGENS DOCKER...%RESET%
echo.

docker info >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%🔍 %BOLD%Verificando imagens...%RESET%
    
    :: Remover todas as imagens
    for /f "tokens=*" %%i in ('docker images -q 2^>nul') do (
        echo %YELLOW%🗑️  %BOLD%Removendo imagem %%i...%RESET%
        docker rmi -f %%i >nul 2>&1
    )
    
    echo %GREEN%✅ %BOLD%Todas as imagens removidas%RESET%
)

echo.

:: =============================================================================
:: 4. Remover Todos os Volumes Docker
:: =============================================================================
echo %BOLD%%CYAN%[4/7]%RESET% %YELLOW%💾 REMOVENDO VOLUMES DOCKER...%RESET%
echo.

docker info >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%🔍 %BOLD%Verificando volumes...%RESET%
    
    :: Remover todos os volumes
    for /f "tokens=*" %%i in ('docker volume ls -q 2^>nul') do (
        echo %YELLOW%🗑️  %BOLD%Removendo volume %%i...%RESET%
        docker volume rm -f %%i >nul 2>&1
    )
    
    echo %GREEN%✅ %BOLD%Todos os volumes removidos%RESET%
)

echo.

:: =============================================================================
:: 5. Limpeza do Sistema Docker
:: =============================================================================
echo %BOLD%%CYAN%[5/7]%RESET% %YELLOW%🧹 LIMPEZA DO SISTEMA DOCKER...%RESET%
echo.

docker info >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%🔧 %BOLD%Executando docker system prune...%RESET%
    docker system prune -a -f --volumes >nul 2>&1
    echo %GREEN%✅ %BOLD%Sistema Docker limpo%RESET%
    
    echo %YELLOW%🔧 %BOLD%Executando docker network prune...%RESET%
    docker network prune -f >nul 2>&1
    echo %GREEN%✅ %BOLD%Redes Docker limpas%RESET%
)

echo.

:: =============================================================================
:: 6. Limpeza de Arquivos do Projeto
:: =============================================================================
echo %BOLD%%CYAN%[6/7]%RESET% %YELLOW%📁 LIMPANDO ARQUIVOS DO PROJETO...%RESET%
echo.

echo %YELLOW%🗑️  %BOLD%Removendo node_modules...%RESET%
if exist node_modules (
    rmdir /s /q node_modules >nul 2>&1
    echo %GREEN%✅ %BOLD%node_modules removido%RESET%
) else (
    echo %GREEN%✅ %BOLD%node_modules não existe%RESET%
)

echo %YELLOW%🗑️  %BOLD%Removendo arquivo .env...%RESET%
if exist .env (
    del .env >nul 2>&1
    echo %GREEN%✅ %BOLD%Arquivo .env removido%RESET%
) else (
    echo %GREEN%✅ %BOLD%Arquivo .env não existe%RESET%
)

echo %YELLOW%🗑️  %BOLD%Removendo logs...%RESET%
if exist logs (
    rmdir /s /q logs >nul 2>&1
    echo %GREEN%✅ %BOLD%Logs removidos%RESET%
) else (
    echo %GREEN%✅ %BOLD%Pasta logs não existe%RESET%
)

echo %YELLOW%🗑️  %BOLD%Removendo arquivos temporários...%RESET%
del /Q /F *.log >nul 2>&1
del /Q /F *.tmp >nul 2>&1
del /Q /F npm-debug.log >nul 2>&1
echo %GREEN%✅ %BOLD%Arquivos temporários removidos%RESET%

echo.

:: =============================================================================
:: 7. Limpeza de Cache NPM
:: =============================================================================
echo %BOLD%%CYAN%[7/7]%RESET% %YELLOW%📦 LIMPANDO CACHE NPM...%RESET%
echo.

echo %YELLOW%🧹 %BOLD%Limpando cache do npm...%RESET%
npm cache clean --force >nul 2>&1
echo %GREEN%✅ %BOLD%Cache do npm limpo%RESET%

echo.

:: =============================================================================
:: Verificação Final
:: =============================================================================
echo %BOLD%%CYAN%🔍 VERIFICAÇÃO FINAL...%RESET%
echo.

set "clean_status=0"

echo %YELLOW%🔎 %BOLD%Verificando processos Node.js...%RESET%
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if not errorlevel 1 (
    echo %RED%⚠️  %BOLD%Processos Node.js ainda ativos%RESET%
    set "clean_status=1"
) else (
    echo %GREEN%✅ %BOLD%Nenhum processo Node.js ativo%RESET%
)

docker info >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%🔎 %BOLD%Verificando containers...%RESET%
    docker ps -aq >nul 2>&1
    if not errorlevel 1 (
        echo %RED%⚠️  %BOLD%Containers ainda existem%RESET%
        set "clean_status=1"
    ) else (
        echo %GREEN%✅ %BOLD%Nenhum container ativo%RESET%
    )
    
    echo %YELLOW%🔎 %BOLD%Verificando imagens...%RESET%
    docker images -q >nul 2>&1
    if not errorlevel 1 (
        echo %GREEN%✅ %BOLD%Imagens limpas%RESET%
    ) else (
        echo %GREEN%✅ %BOLD%Nenhuma imagem encontrada%RESET%
    )
)

echo.

:: =============================================================================
:: Relatório Final
:: =============================================================================
if "!clean_status!"=="1" (
    echo %BOLD%%BG_RED%%WHITE%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
    echo %BOLD%%BG_RED%%WHITE%║                    ⚠️  RESET PARCIALMENTE CONCLUÍDO                    ║%RESET%
    echo %BOLD%%BG_RED%%WHITE%║           ALGUNS RECURSOS AINDA ESTÃO ATIVOS/PRESENTES                 ║%RESET%
    echo %BOLD%%BG_RED%%WHITE%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
    echo.
    echo %YELLOW%💡 %BOLD%Recomendações:%RESET%
    echo %WHITE%   • Execute este script como Administrador%RESET%
    echo %WHITE%   • Reinicie o Docker Desktop%RESET%
    echo %WHITE%   • Execute o script novamente%RESET%
    echo.
) else (
    echo %BOLD%%BG_GREEN%%WHITE%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
    echo %BOLD%%BG_GREEN%%WHITE%║                    🎉 RESET COMPLETO COM SUCESSO!                      ║%RESET%
    echo %BOLD%%BG_GREEN%%WHITE%║              AMBIENTE 100%% LIMPO - PRONTO PARA COMEÇAR                 ║%RESET%
    echo %BOLD%%BG_GREEN%%WHITE%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
    echo.
)

:: =============================================================================
:: Estatísticas e Próximos Passos
:: =============================================================================
echo %BOLD%%CYAN%📊 RESUMO DA LIMPEZA:%RESET%
echo %WHITE%   ┌─ %RED%Processos Node.js%RESET%      Finalizados%RESET%
echo %WHITE%   ├─ %BLUE%Containers Docker%RESET%     Removidos%RESET%
echo %WHITE%   ├─ %YELLOW%Imagens Docker%RESET%       Removidas%RESET%
echo %WHITE%   ├─ %MAGENTA%Volumes Docker%RESET%      Removidos%RESET%
echo %WHITE%   ├─ %GREEN%node_modules%RESET%         Removido%RESET%
echo %WHITE%   ├─ %CYAN%Arquivo .env%RESET%          Removido%RESET%
echo %WHITE%   └─ %BLUE%Cache npm%RESET%             Limpo%RESET%
echo.

echo %BOLD%%GREEN%🚀 PARA COMEÇAR DO ZERO:%RESET%
echo %WHITE%   1. %CYAN%npm install%RESET%                       - Instalar dependências%RESET%
echo %WHITE%   2. %GREEN%iniciar-servidor-completo.bat%RESET%    - Iniciar ambiente%RESET%
echo.

echo %BOLD%%YELLOW%⏰ O ambiente está completamente limpo e pronto para um novo início!%RESET%
echo.

:: Aguardar entrada do usuário
echo %YELLOW%Pressione qualquer tecla para fechar...%RESET%
pause >nul

