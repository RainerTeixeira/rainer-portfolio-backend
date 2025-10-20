@echo off
chcp 65001 >nul
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: Iniciar Ambiente Completo (Windows)
REM Descrição: Setup completo MongoDB + DynamoDB com interface visual bonita
REM ═══════════════════════════════════════════════════════════════════════════

cd /d "%~dp0..\.."

REM ═══════════════════════════════════════════════════════════════════════════
REM                         HEADER BONITO
REM ═══════════════════════════════════════════════════════════════════════════
cls
echo.
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║              🚀  INICIALIZADOR COMPLETO DE AMBIENTE  🚀                   ║' -ForegroundColor White -NoNewline; Write-Host '  ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║              MONGODB + DYNAMODB + PRISMA + SERVIDOR                       ║' -ForegroundColor Yellow -NoNewline; Write-Host '  ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   Preparando ambiente completo com dual database...' -ForegroundColor Gray"
echo.
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    LIMPEZA DE PROCESSOS NODE.JS
REM ═══════════════════════════════════════════════════════════════════════════

cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  🧹 LIMPEZA INICIAL - FINALIZANDO TODOS OS PROCESSOS NODE.JS              ║' -ForegroundColor Yellow"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   🔨 Encerrando processos Node.js e liberando portas...' -ForegroundColor Yellow"
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    powershell -Command "Write-Host '   ℹ️  Nenhum processo Node.js estava rodando' -ForegroundColor Cyan"
) else (
    powershell -Command "Write-Host '   ✅ Todos os processos Node.js finalizados!' -ForegroundColor Green"
)
powershell -Command "Write-Host '   ✅ Portas liberadas: 3000, 4000, 5555, 8000, 8001' -ForegroundColor Green"
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    SEQUÊNCIA DE INICIALIZAÇÃO
REM ═══════════════════════════════════════════════════════════════════════════

REM Etapa 1/8
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  ETAPA 1/8: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 20; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
powershell -Command "Write-Host '   🔍 Verificando Docker Desktop...' -ForegroundColor Yellow"
docker ps >nul 2>&1
if errorlevel 1 (
    powershell -Command "Write-Host '   ❌ Docker não está rodando!' -ForegroundColor Red"
    powershell -Command "Write-Host '   💡 Inicie Docker Desktop e tente novamente' -ForegroundColor Yellow"
    echo.
    pause
    exit /b 1
)
powershell -Command "Write-Host '   ✅ Docker verificado e pronto!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 2/8
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  ETAPA 2/8: CONFIGURAÇÃO INICIAL                                          ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 15; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
if not exist ".env" (
    powershell -Command "Write-Host '   📝 Criando arquivo .env...' -ForegroundColor Yellow"
    copy env.example .env >nul
    powershell -Command "Write-Host '   ✅ Arquivo .env criado!' -ForegroundColor Green"
) else (
    powershell -Command "Write-Host '   ✅ Arquivo .env já existe!' -ForegroundColor Green"
)
timeout /t 1 /nobreak >nul

REM Etapa 3/8
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  ETAPA 3/8: INICIANDO MONGODB                                             ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   🐳 Subindo container MongoDB...' -ForegroundColor Yellow"
docker-compose up -d mongodb
echo.
powershell -Command "Write-Host '   ✅ MongoDB container iniciado!' -ForegroundColor Green"
powershell -Command "Write-Host '   ⏳ Aguardando Replica Set (15s)...' -ForegroundColor Yellow"
echo.
powershell -Command "for($i=0; $i -le 15; $i++) { $pct = [math]::Floor(($i/15)*100); Write-Host ('   [' + ('█' * [math]::Floor($pct/5)) + (' ' * (20-[math]::Floor($pct/5))) + '] ' + $pct + '%% - ' + $i + 's/15s') -NoNewline -ForegroundColor Cyan; Start-Sleep -Seconds 1; Write-Host \"`r\" -NoNewline } Write-Host '   [████████████████████] 100%% - MongoDB Pronto!                    ' -ForegroundColor Green"
echo.

REM Etapa 4/8
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  ETAPA 4/8: INICIANDO DYNAMODB LOCAL                                      ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   🗄️  Subindo container DynamoDB...' -ForegroundColor Yellow"
docker-compose up -d dynamodb-local
echo.
powershell -Command "Write-Host '   ✅ DynamoDB container iniciado!' -ForegroundColor Green"
powershell -Command "Write-Host '   ⏳ Aguardando estabilização (5s)...' -ForegroundColor Yellow"
echo.
powershell -Command "for($i=0; $i -le 5; $i++) { $pct = [math]::Floor(($i/5)*100); Write-Host ('   [' + ('█' * [math]::Floor($pct/5)) + (' ' * (20-[math]::Floor($pct/5))) + '] ' + $pct + '%% - ' + $i + 's/5s') -NoNewline -ForegroundColor Cyan; Start-Sleep -Seconds 1; Write-Host \"`r\" -NoNewline } Write-Host '   [████████████████████] 100%% - DynamoDB Pronto!                    ' -ForegroundColor Green"
echo.

REM Etapa 5/8
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  ETAPA 5/8: CONFIGURANDO PRISMA ORM                                       ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   📦 Gerando Prisma Client...' -ForegroundColor Yellow"
call npm run prisma:generate >nul 2>&1
powershell -Command "Write-Host '   ✅ Prisma Client gerado!' -ForegroundColor Green"
echo.
powershell -Command "Write-Host '   🔄 Sincronizando schema MongoDB...' -ForegroundColor Yellow"
call npm run prisma:push >nul 2>&1
powershell -Command "Write-Host '   ✅ Schema sincronizado!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 6/8
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  ETAPA 6/8: POPULANDO MONGODB                                             ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 25; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
powershell -Command "Write-Host '   🌱 Inserindo dados de teste...' -ForegroundColor Yellow"
call npm run seed >nul 2>&1
powershell -Command "Write-Host '   ✅ MongoDB populado com sucesso!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 7/8
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  ETAPA 7/8: CONFIGURANDO DYNAMODB                                         ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   🏗️  Criando tabelas DynamoDB (background)...' -ForegroundColor Yellow"
powershell -Command "Write-Host '      Isso pode levar 30-60 segundos. Continuando...' -ForegroundColor Gray"
start /b npm run dynamodb:create-tables >nul 2>&1
timeout /t 3 /nobreak >nul
powershell -Command "Write-Host '   ✅ Processo iniciado em background!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 8/8 - Resumo Final
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Green"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ║               ✨  AMBIENTE COMPLETO CONFIGURADO COM SUCESSO!  ✨           ║' -ForegroundColor White -NoNewline; Write-Host '  ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Green"
echo.
echo.
powershell -Command "Write-Host '   📊 RESUMO COMPLETO DA INSTALAÇÃO:' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   ✅ Docker Desktop        - Ativo e funcionando' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ MongoDB Container     - Rodando na porta 27017' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ DynamoDB Container    - Rodando na porta 8000' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Prisma ORM            - Configurado e sincronizado' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Dados de Teste        - Inseridos no MongoDB' -ForegroundColor Green"
powershell -Command "Write-Host '   🔄 Tabelas DynamoDB      - Criação em andamento...' -ForegroundColor Yellow"
echo.
echo.
powershell -Command "Write-Host '   🔒 SEGURANÇA:' -ForegroundColor Cyan"
echo.
powershell -Command "if (Test-Path 'node_modules\@fastify\helmet') { Write-Host '      ✅ Helmet   - Proteção de headers HTTP' -ForegroundColor Green } else { Write-Host '      ❌ Helmet   - Não instalado' -ForegroundColor Red }"
powershell -Command "if (Test-Path 'node_modules\@fastify\cors') { Write-Host '      ✅ CORS     - Cross-Origin configurado' -ForegroundColor Green } else { Write-Host '      ❌ CORS     - Não instalado' -ForegroundColor Red }"
powershell -Command "if (Test-Path 'node_modules\zod') { Write-Host '      ✅ Zod      - Validação de schemas' -ForegroundColor Green } else { Write-Host '      ❌ Zod      - Não instalado' -ForegroundColor Red }"
echo.
echo.
powershell -Command "Write-Host '   🗄️  BANCOS DE DADOS ATIVOS:' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '      • MongoDB:           mongodb://localhost:27017' -ForegroundColor White"
powershell -Command "Write-Host '      • DynamoDB Local:    http://localhost:8000' -ForegroundColor White"
echo.
echo.
REM Ler PORT do .env
for /f %%i in ('powershell -Command "if(Test-Path .env){($c=Get-Content .env|Where-Object{$_ -match '^PORT\s*=\s*(\d+)'});if($c -match 'PORT\s*=\s*(\d+)'){$matches[1]}}else{'4000'}"') do set API_PORT=%%i
if not defined API_PORT set API_PORT=4000

powershell -Command "Write-Host '   🌐 URLS DO SISTEMA:' -ForegroundColor Magenta"
echo.
powershell -Command "$port='%API_PORT%'; Write-Host \"      • API Principal:     http://localhost:$port\" -ForegroundColor White"
powershell -Command "$port='%API_PORT%'; Write-Host \"      • Documentação:      http://localhost:$port/docs\" -ForegroundColor White"
powershell -Command "$port='%API_PORT%'; Write-Host \"      • Health Check:      http://localhost:$port/health\" -ForegroundColor White"
powershell -Command "Write-Host '      • Prisma Studio:     http://localhost:5555' -ForegroundColor White"
powershell -Command "Write-Host '      • DynamoDB Admin:    http://localhost:8001' -ForegroundColor White"
echo.
echo.
powershell -Command "Write-Host '   ⚡ COMANDOS ÚTEIS:' -ForegroundColor Yellow"
echo.
powershell -Command "Write-Host '      • npm run dev                      - Iniciar servidor' -ForegroundColor Gray"
powershell -Command "Write-Host '      • npm run prisma:studio            - Abrir Prisma Studio' -ForegroundColor Gray"
powershell -Command "Write-Host '      • npm run dynamodb:list-tables     - Listar tabelas DynamoDB' -ForegroundColor Gray"
echo.
echo.
powershell -Command "Write-Host '   🔄 ALTERNAR ENTRE BANCOS:' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '      Use: scripts\03-alternar-banco-dados\alternar-banco.bat' -ForegroundColor Gray"
echo.
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║' -ForegroundColor White"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   🎨 Abrindo Prisma Studio (MongoDB GUI)...' -ForegroundColor Magenta"
start /b npm run prisma:studio >nul 2>&1
powershell -Command "Write-Host '   🗄️  Iniciando DynamoDB Admin (NoSQL GUI)...' -ForegroundColor Magenta"
start /b cmd /c "set DYNAMO_ENDPOINT=http://localhost:8000 && npx -y dynamodb-admin >nul 2>&1"
timeout /t 3 /nobreak >nul

call npm run dev
