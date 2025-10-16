@echo off
chcp 65001 > nul
cls

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   🚀 INICIANDO AMBIENTE LOCAL - PRISMA + MONGODB
echo ═══════════════════════════════════════════════════════════════════════════
echo.

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando!
    echo.
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo ✅ Docker detectado
echo.

REM Verificar se .env existe
if not exist .env (
    echo 📝 Criando arquivo .env...
    copy env.example .env >nul
    echo ✅ Arquivo .env criado
    echo.
)

echo ═══════════════════════════════════════════════════════════════════════════
echo   🐳 INICIANDO MONGODB
echo ═══════════════════════════════════════════════════════════════════════════
echo.

docker-compose up -d mongodb

if errorlevel 1 (
    echo ❌ Erro ao iniciar MongoDB
    pause
    exit /b 1
)

echo.
echo ✅ MongoDB iniciado
echo.
echo ⏳ Aguardando inicialização do Replica Set (30 segundos)...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 Verificando status do Replica Set...
docker exec -it blogapi-mongodb mongosh --eval "rs.status().ok" --quiet 2>nul | findstr "1" >nul
if errorlevel 1 (
    echo ⚠️  Replica Set ainda não está pronto, aguardando mais 10 segundos...
    timeout /t 10 /nobreak >nul
)

echo ✅ MongoDB Replica Set pronto!
echo.

echo ═══════════════════════════════════════════════════════════════════════════
echo   🔧 CONFIGURANDO PRISMA
echo ═══════════════════════════════════════════════════════════════════════════
echo.

echo 📦 Gerando Prisma Client...
call npm run prisma:generate

if errorlevel 1 (
    echo ❌ Erro ao gerar Prisma Client
    pause
    exit /b 1
)

echo.
echo 🔄 Sincronizando schema com MongoDB...
call npm run prisma:push

if errorlevel 1 (
    echo ❌ Erro ao sincronizar schema
    echo.
    echo 💡 Tente limpar o banco:
    echo    docker exec -it blogapi-mongodb mongosh blog --eval "db.dropDatabase()"
    echo    Depois execute este script novamente.
    pause
    exit /b 1
)

echo.
echo 🌱 Populando banco de dados...
call npm run seed

if errorlevel 1 (
    echo ❌ Erro ao popular banco de dados
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   ✨ AMBIENTE CONFIGURADO COM SUCESSO!
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo 📊 Dados criados:
echo    • 5 usuários (admin, editor, 2 authors, 1 subscriber)
echo    • 9 categorias (3 principais + 6 subcategorias)
echo    • 9 posts (8 publicados, 1 rascunho)
echo    • 5 comentários, 11 likes, 5 bookmarks
echo.
echo 🌐 URLs úteis:
echo    • API: http://localhost:4000
echo    • Swagger: http://localhost:4000/docs
echo    • Health: http://localhost:4000/health
echo.
echo 💡 Comandos úteis:
echo    • npm run dev              - Iniciar servidor
echo    • npm run prisma:studio    - Interface visual do banco
echo    • npm run docker:logs      - Ver logs MongoDB
echo    • npm run docker:down      - Parar MongoDB
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

REM Iniciar servidor
npm run dev

