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
echo %BOLD%%MAGENTA%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%MAGENTA%║                    🔄 ALTERNAR BANCO DE DADOS                            ║%RESET%
echo %BOLD%%MAGENTA%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

:: Verificar se .env existe
if not exist .env (
    echo %RED%❌ Arquivo .env não encontrado!%RESET%
    echo %YELLOW%💡 Execute um dos scripts de inicialização primeiro:%RESET%
    echo %CYAN%   - iniciar-ambiente-local.bat%RESET%
    echo %CYAN%   - iniciar-ambiente-dynamodb.bat%RESET%
    echo.
    pause
    exit /b 1
)

:: Detectar banco atual
echo %BOLD%%CYAN%🔍 Detectando configuração atual...%RESET%
echo.

findstr "DATABASE_PROVIDER=PRISMA" .env >nul
if errorlevel 1 (
    findstr "DATABASE_PROVIDER=DYNAMODB" .env >nul
    if errorlevel 1 (
        set "CURRENT=DESCONHECIDO"
        echo %RED%⚠️  Banco de dados atual: DESCONHECIDO%RESET%
    ) else (
        set "CURRENT=DYNAMODB"
        echo %YELLOW%📊 Banco de dados atual: DynamoDB Local%RESET%
    )
) else (
    set "CURRENT=PRISMA"
    echo %CYAN%🗄️  Banco de dados atual: MongoDB + Prisma%RESET%
)

echo.
echo %BOLD%%YELLOW%═══════════════════════════════════════════════════════════════════════════%RESET%
echo.
echo %BOLD%Escolha o banco de dados:%RESET%
echo.
echo %CYAN%[1]%RESET% MongoDB + Prisma ORM
echo %YELLOW%    ✓ Desenvolvimento rápido e produtivo%RESET%
echo %YELLOW%    ✓ Prisma Studio (GUI visual)%RESET%
echo %YELLOW%    ✓ Type-safe queries%RESET%
echo %YELLOW%    ✓ Porta: 27017%RESET%
echo.
echo %CYAN%[2]%RESET% DynamoDB Local
echo %YELLOW%    ✓ Testes pré-produção%RESET%
echo %YELLOW%    ✓ Compatível com AWS Lambda%RESET%
echo %YELLOW%    ✓ Serverless local%RESET%
echo %YELLOW%    ✓ Porta: 8000%RESET%
echo.
echo %CYAN%[0]%RESET% Cancelar
echo.
echo %BOLD%%YELLOW%═══════════════════════════════════════════════════════════════════════════%RESET%
echo.

choice /C 120 /N /M "Digite sua escolha (1, 2 ou 0): "

if errorlevel 3 (
    echo.
    echo %YELLOW%⏭️  Operação cancelada%RESET%
    echo.
    pause
    exit /b 0
)

if errorlevel 2 (
    set "CHOICE=DYNAMODB"
    set "CHOICE_NAME=DynamoDB Local"
    goto :configurar
)

if errorlevel 1 (
    set "CHOICE=PRISMA"
    set "CHOICE_NAME=MongoDB + Prisma"
    goto :configurar
)

:configurar
echo.
echo %BOLD%%CYAN%⚙️  Configurando para %CHOICE_NAME%...%RESET%
echo.

:: Verificar se já está configurado
if "%CURRENT%"=="%CHOICE%" (
    echo %YELLOW%⚠️  Já está configurado para %CHOICE_NAME%!%RESET%
    echo.
    pause
    exit /b 0
)

:: Fazer backup do .env
echo %YELLOW%📦 Criando backup do .env...%RESET%
copy .env .env.backup >nul
echo %GREEN%✅ Backup criado: .env.backup%RESET%
echo.

:: Configurar para escolha
if "%CHOICE%"=="PRISMA" (
    echo %YELLOW%🔄 Alterando DATABASE_PROVIDER para PRISMA...%RESET%
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PROVIDER=DYNAMODB', 'DATABASE_PROVIDER=PRISMA' | Set-Content .env"
    
    echo %YELLOW%🔄 Configurando DATABASE_URL...%RESET%
    powershell -Command "$content = Get-Content .env; if ($content -notmatch 'DATABASE_URL=') { Add-Content .env 'DATABASE_URL=mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true' }"
    
    echo %GREEN%✅ Configurado para MongoDB + Prisma%RESET%
    echo.
    echo %BOLD%%CYAN%📋 Próximos passos:%RESET%
    echo %YELLOW%   1. Certifique-se que MongoDB está rodando:%RESET%
    echo %WHITE%      docker-compose up -d mongodb%RESET%
    echo %YELLOW%   2. Gere o Prisma Client:%RESET%
    echo %WHITE%      npm run prisma:generate%RESET%
    echo %YELLOW%   3. Sincronize o schema:%RESET%
    echo %WHITE%      npm run prisma:push%RESET%
    echo %YELLOW%   4. Inicie o servidor:%RESET%
    echo %WHITE%      npm run dev%RESET%
    echo.
    echo %CYAN%   OU simplesmente execute:%RESET%
    echo %GREEN%   iniciar-ambiente-local.bat%RESET%
)

if "%CHOICE%"=="DYNAMODB" (
    echo %YELLOW%🔄 Alterando DATABASE_PROVIDER para DYNAMODB...%RESET%
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PROVIDER=PRISMA', 'DATABASE_PROVIDER=DYNAMODB' | Set-Content .env"
    
    echo %YELLOW%🔄 Verificando configurações DynamoDB...%RESET%
    powershell -Command "$content = Get-Content .env; if ($content -notmatch 'DYNAMODB_ENDPOINT=') { Add-Content .env 'DYNAMODB_ENDPOINT=http://localhost:8000' }"
    powershell -Command "$content = Get-Content .env; if ($content -notmatch 'DYNAMODB_TABLE_PREFIX=') { Add-Content .env 'DYNAMODB_TABLE_PREFIX=blog' }"
    
    echo %GREEN%✅ Configurado para DynamoDB Local%RESET%
    echo.
    echo %BOLD%%CYAN%📋 Próximos passos:%RESET%
    echo %YELLOW%   1. Certifique-se que DynamoDB está rodando:%RESET%
    echo %WHITE%      docker-compose up -d dynamodb-local%RESET%
    echo %YELLOW%   2. Crie as tabelas:%RESET%
    echo %WHITE%      npm run dynamodb:create-tables%RESET%
    echo %YELLOW%   3. Popule os dados (opcional):%RESET%
    echo %WHITE%      npm run dynamodb:seed%RESET%
    echo %YELLOW%   4. Inicie o servidor:%RESET%
    echo %WHITE%      npm run dev%RESET%
    echo.
    echo %CYAN%   OU simplesmente execute:%RESET%
    echo %GREEN%   iniciar-ambiente-dynamodb.bat%RESET%
)

echo.
echo %BOLD%%GREEN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%GREEN%║                  ✨ CONFIGURAÇÃO ALTERADA COM SUCESSO!                   ║%RESET%
echo %BOLD%%GREEN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%💾 Backup anterior salvo em: .env.backup%RESET%
echo %CYAN%🔧 Nova configuração: %CHOICE_NAME%%RESET%
echo.

pause

