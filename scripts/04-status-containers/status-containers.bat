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
set "MAGENTA=%DEL%%DEL%[95m"

echo.
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                    🐳 STATUS DOS CONTAINERS DOCKER                       ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker não está rodando!%RESET%
    echo %YELLOW%💡 Inicie o Docker Desktop e tente novamente.%RESET%
    echo.
    pause
    exit /b 1
)

echo %BOLD%%GREEN%✅ Docker está rodando%RESET%
echo.

echo %BOLD%%YELLOW%🔍 Containers do BlogAPI:%RESET%
echo.

:: Listar containers do blogapi
docker ps -a --filter "fullName=blogapi" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul | findstr /V "NAMES" >nul
if errorlevel 1 (
    echo %YELLOW%⚠️  Nenhum container BlogAPI encontrado%RESET%
    echo.
) else (
    echo %CYAN%┌─────────────────────────┬──────────────────────────┬─────────────────────────┐%RESET%
    echo %CYAN%│ CONTAINER               │ STATUS                   │ PORTAS                  │%RESET%
    echo %CYAN%├─────────────────────────┼──────────────────────────┼─────────────────────────┤%RESET%
    
    for /f "skip=1 tokens=1-3 delims=	" %%a in ('docker ps -a --filter "fullName=blogapi" --format "{{.Names}}	{{.Status}}	{{.Ports}}"') do (
        echo %%b | findstr "Up" >nul
        if errorlevel 1 (
            echo %RED%│ %%a%RESET%
        ) else (
            echo %%b | findstr "healthy" >nul
            if errorlevel 1 (
                echo %%b | findstr "unhealthy" >nul
                if errorlevel 1 (
                    echo %YELLOW%│ %%a%RESET%
                ) else (
                    echo %YELLOW%│ %%a%RESET%
                )
            ) else (
                echo %GREEN%│ %%a%RESET%
            )
        )
    )
    
    echo %CYAN%└─────────────────────────┴──────────────────────────┴─────────────────────────┘%RESET%
    echo.
)

echo %BOLD%%YELLOW%📊 Resumo Geral:%RESET%
echo.

:: Contar containers
for /f %%i in ('docker ps --filter "fullName=blogapi" -q ^| find /c /v ""') do set RUNNING=%%i
for /f %%i in ('docker ps -a --filter "fullName=blogapi" -q ^| find /c /v ""') do set TOTAL=%%i

echo %CYAN%   Total de containers BlogAPI: %RESET%%TOTAL%
echo %GREEN%   Containers rodando: %RESET%%RUNNING%
echo.

echo %BOLD%%YELLOW%🌐 URLs Disponíveis:%RESET%
echo.

:: Verificar cada serviço
docker ps --filter "fullName=blogapi-mongodb" --filter "status=running" >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%   ✅ MongoDB:        %RESET%mongodb://localhost:27017
)

docker ps --filter "fullName=blogapi-dynamodb" --filter "status=running" >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%   ✅ DynamoDB:       %RESET%http://localhost:8000
)

docker ps --filter "fullName=blogapi-prisma-studio" --filter "status=running" >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%   ✅ Prisma Studio:  %RESET%http://localhost:5555
)

REM Ler PORT do .env
for /f %%i in ('powershell -Command "if(Test-Path .env){($c=Get-Content .env|Where-Object{$_ -match '^PORT\s*=\s*(\d+)'});if($c -match 'PORT\s*=\s*(\d+)'){$matches[1]}}else{'4000'}"') do set API_PORT=%%i
if not defined API_PORT set API_PORT=4000

docker ps --filter "fullName=blogapi-app" --filter "status=running" >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%   ✅ API:            %RESET%http://localhost:%API_PORT%
    echo %GREEN%   ✅ Swagger:        %RESET%http://localhost:%API_PORT%/docs
    echo %GREEN%   ✅ Health:         %RESET%http://localhost:%API_PORT%/health
)

echo.

echo %BOLD%%YELLOW%⚡ Comandos Úteis:%RESET%
echo.
echo %CYAN%   Ver logs de um container:%RESET%
echo %WHITE%   docker-compose logs -f [container-fullName]%RESET%
echo.
echo %CYAN%   Parar todos os containers:%RESET%
echo %WHITE%   docker-compose down%RESET%
echo.
echo %CYAN%   Reiniciar um container:%RESET%
echo %WHITE%   docker-compose restart [service-fullName]%RESET%
echo.
echo %CYAN%   Ver logs em tempo real:%RESET%
echo %WHITE%   docker-compose logs -f%RESET%
echo.

pause

