@echo off
chcp 65001 > nul
cls

:: Configuração de cores
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

set "RESET=%DEL%%DEL%[0m"
set "BOLD=%DEL%%DEL%[1m"
set "RED=%DEL%%DEL%[91m"
set "GREEN=%DEL%%DEL%[92m"
set "YELLOW=%DEL%%DEL%[93m"
set "CYAN=%DEL%%DEL%[96m"

echo.
echo %BOLD%%RED%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%RED%║                    🧹 LIMPEZA COMPLETA DO AMBIENTE                       ║%RESET%
echo %BOLD%%RED%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%⚠️  %BOLD%ATENÇÃO: Esta operação irá:%RESET%
echo %RED%   • Parar e remover todos os containers Docker%RESET%
echo %RED%   • Remover todos os volumes (DADOS SERÃO PERDIDOS)%RESET%
echo %RED%   • Remover node_modules%RESET%
echo %RED%   • Remover arquivo .env%RESET%
echo.

choice /C SN /N /M "Deseja continuar? [S]im ou [N]ão: "
if errorlevel 2 (
    echo.
    echo %CYAN%Operação cancelada pelo usuário.%RESET%
    pause
    exit /b 0
)

echo.
echo %BOLD%%CYAN%[1/4]%RESET% %YELLOW%Parando e removendo containers Docker...%RESET%
docker-compose down -v
if errorlevel 1 (
    echo %RED%❌ Erro ao parar containers%RESET%
) else (
    echo %GREEN%✅ Containers removidos com sucesso%RESET%
)
echo.

echo %BOLD%%CYAN%[2/4]%RESET% %YELLOW%Removendo node_modules...%RESET%
if exist node_modules (
    rmdir /s /q node_modules
    echo %GREEN%✅ node_modules removido%RESET%
) else (
    echo %YELLOW%⏭️  node_modules não existe%RESET%
)
echo.

echo %BOLD%%CYAN%[3/4]%RESET% %YELLOW%Removendo arquivo .env...%RESET%
if exist .env (
    del .env
    echo %GREEN%✅ Arquivo .env removido%RESET%
) else (
    echo %YELLOW%⏭️  Arquivo .env não existe%RESET%
)
echo.

echo %BOLD%%CYAN%[4/4]%RESET% %YELLOW%Removendo logs antigos...%RESET%
if exist logs\*.log (
    del /q logs\*.log
    echo %GREEN%✅ Logs removidos%RESET%
) else (
    echo %YELLOW%⏭️  Nenhum log encontrado%RESET%
)
echo.

echo %BOLD%%GREEN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%GREEN%║                    ✨ AMBIENTE LIMPO COM SUCESSO!                        ║%RESET%
echo %BOLD%%GREEN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %CYAN%📋 Próximos passos:%RESET%
echo %YELLOW%   1. Execute: %GREEN%npm install%RESET%
echo %YELLOW%   2. Execute: %GREEN%iniciar-ambiente-local.bat%RESET% ou %GREEN%iniciar-ambiente-dynamodb.bat%RESET%
echo.

pause

