@echo off
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
set "BG_BLUE=%DEL%%DEL%[44m"
set "BG_GREEN=%DEL%%DEL%[42m"
set "BG_CYAN=%DEL%%DEL%[46m"
set "BG_PURPLE=%DEL%%DEL%[45m"

:: =============================================================================
:: Banner Principal - DynamoDB
:: =============================================================================
echo.
echo %BOLD%%BG_PURPLE%%WHITE% ╔══════════════════════════════════════════════════════════════════════════╗ %RESET%
echo %BOLD%%BG_PURPLE%%WHITE% ║                         🚀 INICIANDO AMBIENTE LOCAL                      ║ %RESET%
echo %BOLD%%BG_PURPLE%%WHITE% ║                         DYNAMODB + EXPRESS                               ║ %RESET%
echo %BOLD%%BG_PURPLE%%WHITE% ╚══════════════════════════════════════════════════════════════════════════╝ %RESET%
echo.

:: =============================================================================
:: Verificação do Docker
:: =============================================================================
echo %BOLD%%CYAN%🔍 VERIFICANDO DEPENDÊNCIAS...%RESET%
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ %BOLD%Docker não está rodando!%RESET%
    echo.
    echo %YELLOW%💡 Por favor, inicie o Docker Desktop e tente novamente.%RESET%
    echo.
    pause
    exit /b 1
)

echo %GREEN%✅ %BOLD%Docker detectado e funcionando%RESET%
echo.

:: =============================================================================
:: Configuração do Ambiente
:: =============================================================================
echo %BOLD%%CYAN%⚙️  CONFIGURANDO AMBIENTE...%RESET%
echo.

if not exist .env (
    echo %YELLOW%📝 %BOLD%Criando arquivo .env...%RESET%
    copy env.example .env >nul
    
    echo %YELLOW%🔄 %BOLD%Configurando para DynamoDB...%RESET%
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PROVIDER=PRISMA', 'DATABASE_PROVIDER=DYNAMODB' | Set-Content .env"
    
    echo %GREEN%✅ %BOLD%Arquivo .env criado e configurado para DynamoDB%RESET%
    echo.
) else (
    echo %GREEN%📁 %BOLD%Arquivo .env encontrado%RESET%
    echo %YELLOW%⚠️  Verifique se DATABASE_PROVIDER=DYNAMODB no arquivo .env%RESET%
    echo.
)

:: =============================================================================
:: Seção DynamoDB Local
:: =============================================================================
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                         🗄️  INICIANDO DYNAMODB LOCAL                      ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%🔄 %BOLD%Iniciando container DynamoDB Local...%RESET%
docker-compose up -d dynamodb-local

if errorlevel 1 (
    echo %RED%❌ %BOLD%Erro ao iniciar DynamoDB Local%RESET%
    echo %YELLOW%💡 Verifique se a porta 8000 está disponível%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ %BOLD%DynamoDB Local iniciado com sucesso%RESET%
echo.

echo %YELLOW%⏳ %BOLD%Aguardando inicialização do DynamoDB...%RESET%
echo %WHITE%   Aguardando 5 segundos para inicialização completa%RESET%

:: Barra de progresso animada para DynamoDB
set "steps=10"
for /L %%i in (1,1,%steps%) do (
    set /a "percent=%%i*100/steps"
    set "bar="
    for /L %%j in (1,1,%%i) do set "bar=!bar!█"
    set "empty="
    for /L %%j in (%%i,1,%steps%) do set "empty=!empty!░"
    echo %CYAN%   [!bar!!empty!] !percent!%%%RESET%
    timeout /t 0.5 /nobreak >nul
    if %%i lss %steps% echo %DEL%%DEL%[1A%DEL%%DEL%[K
)

echo %GREEN%   [████████████████████████████████████████] 100%%%RESET%
echo.

:: =============================================================================
:: Seção Criação de Tabelas
:: =============================================================================
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                         📊 CRIANDO TABELAS NO DYNAMODB                   ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%🏗️  %BOLD%Criando tabelas no DynamoDB...%RESET%
call npm run dynamodb:create-tables

if errorlevel 1 (
    echo %RED%❌ %BOLD%Erro ao criar tabelas no DynamoDB%RESET%
    echo.
    echo %YELLOW%🔍 %BOLD%Solução de problemas:%RESET%
    echo %WHITE%   • Verifique se o DynamoDB está rodando: %CYAN%docker ps%RESET%
    echo %WHITE%   • Verifique os logs: %CYAN%docker-compose logs dynamodb-local%RESET%
    echo %WHITE%   • Teste a conexão: %CYAN%aws dynamodb list-tables --endpoint-url http://localhost:8000%RESET%
    echo.
    pause
    exit /b 1
)

echo %GREEN%✅ %BOLD%Tabelas criadas com sucesso no DynamoDB%RESET%
echo.

:: =============================================================================
:: Seção População de Dados (Opcional)
:: =============================================================================
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                         🌱 POPULAÇÃO DE DADOS (OPCIONAL)                 ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%❓ %BOLD%Deseja popular o DynamoDB com dados de teste?%RESET%
echo %WHITE%   Isso criará usuários, posts e dados de exemplo%RESET%
echo.
choice /C SN /N /M "Digite S para Sim ou N para Não: "

if errorlevel 2 (
    echo %YELLOW%⏭️  %BOLD%Pulando população de dados%RESET%
    echo %WHITE%   Execute depois com: %CYAN%npm run dynamodb:seed%RESET%
    echo.
) else (
    echo.
    echo %YELLOW%🌱 %BOLD%Populando DynamoDB com dados de teste...%RESET%
    call npm run dynamodb:seed
    
    if errorlevel 1 (
        echo %YELLOW%⚠️  %BOLD%Erro ao popular banco de dados%RESET%
        echo %WHITE%   Você pode tentar novamente com: %CYAN%npm run dynamodb:seed%RESET%
        echo.
    ) else (
        echo %GREEN%✅ %BOLD%Dados de teste inseridos com sucesso!%RESET%
        echo.
    )
)

:: =============================================================================
:: Resumo Final - DynamoDB
:: =============================================================================
echo %BOLD%%BG_GREEN%%WHITE%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%BG_GREEN%%WHITE%║               ✨ AMBIENTE DYNAMODB CONFIGURADO COM SUCESSO!              ║%RESET%
echo %BOLD%%BG_GREEN%%WHITE%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %BOLD%%MAGENTA%🌐 URLS DO SISTEMA:%RESET%
echo %WHITE%   ┌─ %CYAN%DynamoDB Local%RESET%      http://localhost:8000%RESET%
echo %WHITE%   ├─ %GREEN%API Principal%RESET%       http://localhost:4000%RESET%
echo %WHITE%   ├─ %BLUE%Documentação%RESET%         http://localhost:4000/docs%RESET%
echo %WHITE%   └─ %RED%Health Check%RESET%         http://localhost:4000/health%RESET%
echo.

echo %BOLD%%YELLOW%⚡ COMANDOS RÁPIDOS:%RESET%
echo %WHITE%   ┌─ %GREEN%npm run dev%RESET%                      Iniciar servidor%RESET%
echo %WHITE%   ├─ %CYAN%npm run dynamodb:list-tables%RESET%     Listar tabelas%RESET%
echo %WHITE%   ├─ %BLUE%npm run dynamodb:create-tables%RESET%   Recriar tabelas%RESET%
echo %WHITE%   └─ %MAGENTA%npm run dynamodb:seed%RESET%            Popular dados%RESET%
echo.

echo %BOLD%%CYAN%🔧 FERRAMENTAS DYNAMODB:%RESET%
echo %WHITE%   ┌─ %YELLOW%DynamoDB Admin%RESET%    npm install -g dynamodb-admin && dynamodb-admin%RESET%
echo %WHITE%   └─ %WHITE%AWS CLI%RESET%           aws dynamodb list-tables --endpoint-url http://localhost:8000%RESET%
echo.

echo %BOLD%%BLUE%🐳 COMANDOS DOCKER:%RESET%
echo %WHITE%   ┌─ %CYAN%docker-compose logs blogapi-dynamodb%RESET%   Ver logs%RESET%
echo %WHITE%   └─ %RED%docker-compose down%RESET%                   Parar containers%RESET%
echo.

:: =============================================================================
:: Inicialização do Servidor
:: =============================================================================
echo %BOLD%%BG_CYAN%%WHITE%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%BG_CYAN%%WHITE%║                  🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO                ║%RESET%
echo %BOLD%%BG_CYAN%%WHITE%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%⏰ %BOLD%Iniciando servidor em 3 segundos...%RESET%
timeout /t 3 /nobreak >nul

echo %GREEN%🎯 %BOLD%Servidor Node.js iniciado! Use Ctrl+C para parar%RESET%
echo %WHITE%   Acesse a API em: %CYAN%http://localhost:4000%RESET%
echo %WHITE%   Documentação: %GREEN%http://localhost:4000/docs%RESET%
echo.

:: =============================================================================
:: Iniciar Servidor de Desenvolvimento
:: =============================================================================
npm run dev