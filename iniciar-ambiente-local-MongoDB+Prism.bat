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

:: =============================================================================
:: Banner Principal
:: =============================================================================
echo.
echo %BOLD%%BG_BLUE%%WHITE% ╔══════════════════════════════════════════════════════════════════════════╗ %RESET%
echo %BOLD%%BG_BLUE%%WHITE% ║                            🚀 INICIANDO AMBIENTE LOCAL                    ║ %RESET%
echo %BOLD%%BG_BLUE%%WHITE% ║                        PRISMA + MONGODB + EXPRESS                        ║ %RESET%
echo %BOLD%%BG_BLUE%%WHITE% ╚══════════════════════════════════════════════════════════════════════════╝ %RESET%
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

if not exist .env (
    echo %YELLOW%📝 %BOLD%Criando arquivo .env...%RESET%
    copy env.example .env >nul
    echo %GREEN%✅ Arquivo .env criado com sucesso%RESET%
)
echo.

:: =============================================================================
:: Seção MongoDB
:: =============================================================================
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                            🐳 INICIANDO MONGODB                          ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%🔄 %BOLD%Iniciando container MongoDB...%RESET%
docker-compose up -d mongodb

if errorlevel 1 (
    echo %RED%❌ %BOLD%Erro ao iniciar MongoDB%RESET%
    echo %YELLOW%💡 Verifique se a porta 27017 está disponível%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ %BOLD%MongoDB iniciado com sucesso%RESET%
echo.

echo %YELLOW%⏳ %BOLD%Aguardando inicialização do Replica Set...%RESET%
echo %WHITE%   Aguardando 30 segundos para inicialização completa%RESET%

:: Barra de progresso animada
set "steps=30"
for /L %%i in (1,1,%steps%) do (
    set /a "percent=%%i*100/steps"
    set "bar="
    for /L %%j in (1,1,%%i) do set "bar=!bar!■"
    set "empty="
    for /L %%j in (%%i,1,%steps%) do set "empty=!empty! "
    echo %YELLOW%   [!bar!!empty!] !percent!%%%RESET%
    timeout /t 1 /nobreak >nul
    if %%i lss %steps% echo %DEL%%DEL%[1A%DEL%%DEL%[K
)

echo %GREEN%   [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■] 100%%%RESET%
echo.

echo %YELLOW%🔍 %BOLD%Verificando status do Replica Set...%RESET%
docker exec -it blogapi-mongodb mongosh --eval "rs.status().ok" --quiet 2>nul | findstr "1" >nul
if errorlevel 1 (
    echo %YELLOW%⚠️  %BOLD%Replica Set ainda não está pronto, aguardando mais 10 segundos...%RESET%
    timeout /t 10 /nobreak >nul
)

echo %GREEN%✅ %BOLD%MongoDB Replica Set pronto!%RESET%
echo.

:: =============================================================================
:: Seção Prisma
:: =============================================================================
echo %BOLD%%CYAN%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%CYAN%║                         🔧 CONFIGURANDO PRISMA                           ║%RESET%
echo %BOLD%%CYAN%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %YELLOW%📦 %BOLD%Gerando Prisma Client...%RESET%
call npm run prisma:generate

if errorlevel 1 (
    echo %RED%❌ %BOLD%Erro ao gerar Prisma Client%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ %BOLD%Prisma Client gerado com sucesso%RESET%
echo.

echo %YELLOW%🔄 %BOLD%Sincronizando schema com MongoDB...%RESET%
call npm run prisma:push

if errorlevel 1 (
    echo %RED%❌ %BOLD%Erro ao sincronizar schema%RESET%
    echo.
    echo %YELLOW%💡 %BOLD%Dica de solução:%RESET%
    echo %WHITE%   docker exec -it blogapi-mongodb mongosh blog --eval "db.dropDatabase()"%RESET%
    echo %WHITE%   Execute novamente este script após limpar o banco.%RESET%
    echo.
    pause
    exit /b 1
)

echo %GREEN%✅ %BOLD%Schema sincronizado com sucesso%RESET%
echo.

echo %YELLOW%🌱 %BOLD%Populando banco de dados...%RESET%
call npm run seed

if errorlevel 1 (
    echo %RED%❌ %BOLD%Erro ao popular banco de dados%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ %BOLD%Banco de dados populado com sucesso%RESET%
echo.

:: =============================================================================
:: Resumo Final
:: =============================================================================
echo %BOLD%%BG_GREEN%%WHITE%╔══════════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%%BG_GREEN%%WHITE%║                  ✨ AMBIENTE CONFIGURADO COM SUCESSO!                   ║%RESET%
echo %BOLD%%BG_GREEN%%WHITE%╚══════════════════════════════════════════════════════════════════════════╝%RESET%
echo.

echo %BOLD%%CYAN%📊 DADOS CRIADOS NO BANCO:%RESET%
echo %WHITE%   ┌─ %GREEN%5 usuários%WHITE% (admin, editor, 2 authors, 1 subscriber)%RESET%
echo %WHITE%   ├─ %GREEN%9 categorias%WHITE% (3 principais + 6 subcategorias)%RESET%
echo %WHITE%   ├─ %GREEN%9 posts%WHITE% (8 publicados, 1 rascunho)%RESET%
echo %WHITE%   └─ %GREEN%5 comentários, 11 likes, 5 bookmarks%RESET%
echo.

echo %BOLD%%MAGENTA%🌐 URLS DO SISTEMA:%RESET%
echo %WHITE%   ┌─ %CYAN%API Principal%RESET%       http://localhost:4000%RESET%
echo %WHITE%   ├─ %GREEN%Documentação%RESET%       http://localhost:4000/docs%RESET%
echo %WHITE%   ├─ %RED%Health Check%RESET%        http://localhost:4000/health%RESET%
echo %WHITE%   └─ %YELLOW%Prisma Studio%RESET%      http://localhost:5555%RESET%
echo.

echo %BOLD%%YELLOW%⚡ COMANDOS RÁPIDOS:%RESET%
echo %WHITE%   ┌─ %GREEN%npm run dev%RESET%              Iniciar servidor%RESET%
echo %WHITE%   ├─ %BLUE%npm run prisma:studio%RESET%    Abrir Prisma Studio%RESET%
echo %WHITE%   ├─ %YELLOW%npm run docker:logs%RESET%      Ver logs do MongoDB%RESET%
echo %WHITE%   └─ %RED%npm run docker:down%RESET%       Parar containers%RESET%
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

echo %GREEN%🎯 %BOLD%Servidor iniciado! Use Ctrl+C para parar%RESET%
echo %WHITE%   Acesse: %CYAN%http://localhost:4000%RESET%
echo.

:: =============================================================================
:: Iniciar Servidor de Desenvolvimento
:: =============================================================================
npm run dev