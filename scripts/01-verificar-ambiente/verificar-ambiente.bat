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
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                    🔍 VERIFICAÇÃO DO AMBIENTE                            ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

:: Verificar Docker
echo %BOLD%%CYAN%[1/6]%RESET% %YELLOW%Verificando Docker...%RESET%
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%     ❌ Docker não está rodando%RESET%
    set "DOCKER_OK=0"
) else (
    echo %GREEN%     ✅ Docker está funcionando%RESET%
    set "DOCKER_OK=1"
)
echo.

:: Verificar Node.js
echo %BOLD%%CYAN%[2/6]%RESET% %YELLOW%Verificando Node.js...%RESET%
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%     ❌ Node.js não está instalado%RESET%
    set "NODE_OK=0"
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo %GREEN%     ✅ Node.js instalado - !NODE_VERSION!%RESET%
    set "NODE_OK=1"
)
echo.

:: Verificar npm
echo %BOLD%%CYAN%[3/6]%RESET% %YELLOW%Verificando npm...%RESET%
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%     ❌ npm não está instalado%RESET%
    set "NPM_OK=0"
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo %GREEN%     ✅ npm instalado - v!NPM_VERSION!%RESET%
    set "NPM_OK=1"
)
echo.

:: Verificar portas
echo %BOLD%%CYAN%[4/6]%RESET% %YELLOW%Verificando portas...%RESET%

netstat -ano | findstr :4000 >nul
if errorlevel 1 (
    echo %GREEN%     ✅ Porta 4000 (API) está livre%RESET%
) else (
    echo %YELLOW%     ⚠️  Porta 4000 (API) está em uso%RESET%
)

netstat -ano | findstr :27017 >nul
if errorlevel 1 (
    echo %GREEN%     ✅ Porta 27017 (MongoDB) está livre%RESET%
) else (
    echo %YELLOW%     ⚠️  Porta 27017 (MongoDB) está em uso%RESET%
)

netstat -ano | findstr :8000 >nul
if errorlevel 1 (
    echo %GREEN%     ✅ Porta 8000 (DynamoDB) está livre%RESET%
) else (
    echo %YELLOW%     ⚠️  Porta 8000 (DynamoDB) está em uso%RESET%
)

netstat -ano | findstr :5555 >nul
if errorlevel 1 (
    echo %GREEN%     ✅ Porta 5555 (Prisma Studio) está livre%RESET%
) else (
    echo %YELLOW%     ⚠️  Porta 5555 (Prisma Studio) está em uso%RESET%
)
echo.

:: Verificar arquivos
echo %BOLD%%CYAN%[5/6]%RESET% %YELLOW%Verificando arquivos...%RESET%

if exist .env (
    echo %GREEN%     ✅ Arquivo .env existe%RESET%
    
    findstr "DATABASE_PROVIDER=PRISMA" .env >nul
    if errorlevel 1 (
        findstr "DATABASE_PROVIDER=DYNAMODB" .env >nul
        if errorlevel 1 (
            echo %RED%     ❌ DATABASE_PROVIDER não configurado no .env%RESET%
        ) else (
            echo %CYAN%     📊 Configurado para: DynamoDB%RESET%
        )
    ) else (
        echo %CYAN%     🗄️  Configurado para: MongoDB + Prisma%RESET%
    )
) else (
    echo %YELLOW%     ⚠️  Arquivo .env não existe%RESET%
)

if exist node_modules (
    echo %GREEN%     ✅ node_modules existe%RESET%
) else (
    echo %YELLOW%     ⚠️  node_modules não existe - execute 'npm install'%RESET%
)

if exist package.json (
    echo %GREEN%     ✅ package.json existe%RESET%
) else (
    echo %RED%     ❌ package.json não encontrado!%RESET%
)
echo.

:: Verificar containers Docker
echo %BOLD%%CYAN%[6/6]%RESET% %YELLOW%Verificando containers Docker...%RESET%
if "%DOCKER_OK%"=="1" (
    docker ps --filter "name=blogapi" --format "table {{.Names}}\t{{.Status}}" >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%     ⚠️  Nenhum container BlogAPI rodando%RESET%
    ) else (
        echo %GREEN%     ✅ Containers BlogAPI encontrados:%RESET%
        docker ps --filter "name=blogapi" --format "     - {{.Names}}: {{.Status}}"
    )
) else (
    echo %RED%     ❌ Não foi possível verificar (Docker não está rodando)%RESET%
)
echo.

:: Resumo
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                            📋 RESUMO DA VERIFICAÇÃO                      ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

if "%DOCKER_OK%%NODE_OK%%NPM_OK%"=="111" (
    if exist .env (
        if exist node_modules (
            echo %GREEN%✨ Ambiente pronto para uso!%RESET%
            echo %CYAN%Execute: %YELLOW%iniciar-ambiente-local.bat%RESET% ou %YELLOW%iniciar-ambiente-dynamodb.bat%RESET%
        ) else (
            echo %YELLOW%⚠️  Quase pronto! Execute: %GREEN%npm install%RESET%
        )
    ) else (
        echo %YELLOW%⚠️  Configure o ambiente primeiro com um dos scripts de inicialização%RESET%
    )
) else (
    echo %RED%❌ Ambiente com problemas. Verifique os erros acima.%RESET%
)

echo.
pause

