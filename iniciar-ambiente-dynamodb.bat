@echo off
chcp 65001 > nul
cls

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   🚀 INICIANDO AMBIENTE LOCAL - DYNAMODB
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
    
    REM Atualizar para usar DynamoDB
    powershell -Command "(Get-Content .env) -replace 'DATABASE_PROVIDER=PRISMA', 'DATABASE_PROVIDER=DYNAMODB' | Set-Content .env"
    
    echo ✅ Arquivo .env criado e configurado para DynamoDB
    echo.
) else (
    echo 📝 Arquivo .env encontrado
    echo ⚠️  Certifique-se de que DATABASE_PROVIDER=DYNAMODB no arquivo .env
    echo.
)

echo ═══════════════════════════════════════════════════════════════════════════
echo   🗄️  INICIANDO DYNAMODB LOCAL
echo ═══════════════════════════════════════════════════════════════════════════
echo.

docker-compose up -d dynamodb-local

if errorlevel 1 (
    echo ❌ Erro ao iniciar DynamoDB Local
    pause
    exit /b 1
)

echo.
echo ✅ DynamoDB Local iniciado
echo.
echo ⏳ Aguardando inicialização (5 segundos)...
timeout /t 5 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   📊 CRIANDO TABELAS NO DYNAMODB
echo ═══════════════════════════════════════════════════════════════════════════
echo.

call npm run dynamodb:create-tables

if errorlevel 1 (
    echo ❌ Erro ao criar tabelas
    echo.
    echo 💡 Verifique se o DynamoDB Local está rodando:
    echo    docker ps
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   🌱 POPULANDO BANCO DE DADOS (OPCIONAL)
echo ═══════════════════════════════════════════════════════════════════════════
echo.

set /p POPULATE="Deseja popular o DynamoDB com dados de teste? (S/N): "
if /i "%POPULATE%"=="S" (
    echo.
    echo 🌱 Populando DynamoDB com dados de teste...
    call npm run dynamodb:seed
    
    if errorlevel 1 (
        echo ⚠️  Erro ao popular banco de dados
        echo    Você pode tentar novamente mais tarde com: npm run dynamodb:seed
        echo.
    ) else (
        echo ✅ Dados de teste inseridos com sucesso!
        echo.
    )
) else (
    echo ⏭️  Pulando população de dados
    echo    Execute mais tarde com: npm run dynamodb:seed
    echo.
)

echo ═══════════════════════════════════════════════════════════════════════════
echo   ✨ AMBIENTE DYNAMODB CONFIGURADO COM SUCESSO!
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo 🌐 URLs úteis:
echo    • DynamoDB Local: http://localhost:8000
echo    • API: http://localhost:4000
echo    • Swagger: http://localhost:4000/docs
echo    • Health: http://localhost:4000/health
echo.
echo 💡 Comandos úteis:
echo    • npm run dev                      - Iniciar servidor
echo    • npm run dynamodb:list-tables     - Listar tabelas
echo    • npm run dynamodb:create-tables   - Criar tabelas
echo    • npm run dynamodb:seed            - Popular dados
echo    • docker-compose logs blogapi-dynamodb - Ver logs
echo    • docker-compose down              - Parar containers
echo.
echo 🔧 Ferramentas para gerenciar DynamoDB:
echo    • DynamoDB Admin: npm install -g dynamodb-admin ^&^& dynamodb-admin
echo    • AWS CLI: aws dynamodb list-tables --endpoint-url http://localhost:8000
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

REM Iniciar servidor
npm run dev

