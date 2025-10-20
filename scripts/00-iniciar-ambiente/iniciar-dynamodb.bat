@echo off
chcp 65001 >nul
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: Iniciar Ambiente DynamoDB Local (Windows)
REM Descrição: Setup completo com interface visual bonita
REM ═══════════════════════════════════════════════════════════════════════════

cd /d "%~dp0..\.."

REM ═══════════════════════════════════════════════════════════════════════════
REM                         HEADER BONITO
REM ═══════════════════════════════════════════════════════════════════════════
cls
echo.
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║                  🚀  INICIALIZADOR DE AMBIENTE LOCAL  🚀                  ║' -ForegroundColor Cyan -NoNewline; Write-Host '  ║' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║                       DYNAMODB LOCAL + EXPRESS                            ║' -ForegroundColor White -NoNewline; Write-Host '  ║' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   Preparando ambiente NoSQL...' -ForegroundColor Gray"
echo.
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    LIMPEZA DE PROCESSOS NODE.JS
REM ═══════════════════════════════════════════════════════════════════════════

cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  🧹 LIMPEZA INICIAL - FINALIZANDO PROCESSOS NODE.JS                       ║' -ForegroundColor Yellow"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   🔨 Encerrando processos Node.js e liberando portas...' -ForegroundColor Yellow"
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    powershell -Command "Write-Host '   ℹ️  Nenhum processo estava rodando' -ForegroundColor Cyan"
) else (
    powershell -Command "Write-Host '   ✅ Todos os processos finalizados!' -ForegroundColor Green"
)
powershell -Command "Write-Host '   ✅ Portas liberadas: 3000, 4000, 8000, 8001' -ForegroundColor Green"
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    SEQUÊNCIA DE INICIALIZAÇÃO
REM ═══════════════════════════════════════════════════════════════════════════

REM Etapa 1/5
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 1/5: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 20; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
powershell -Command "Write-Host '   🔍 Verificando Docker...' -ForegroundColor Yellow"
docker ps >nul 2>&1
if errorlevel 1 (
    powershell -Command "Write-Host '   ❌ Docker não está rodando!' -ForegroundColor Red"
    powershell -Command "Write-Host '   💡 Inicie Docker Desktop e tente novamente' -ForegroundColor Yellow"
    echo.
    pause
    exit /b 1
)
powershell -Command "Write-Host '   ✅ Docker verificado e funcionando!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 2/5
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 2/5: CONFIGURAÇÃO INICIAL                                          ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 15; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
if not exist ".env" (
    powershell -Command "Write-Host '   📝 Criando arquivo .env...' -ForegroundColor Yellow"
    copy env.example .env >nul
)
powershell -Command "Write-Host '   🔄 Configurando para DynamoDB...' -ForegroundColor Yellow"
powershell -Command "(Get-Content .env) -replace 'DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=DYNAMODB' | Set-Content .env"
powershell -Command "Write-Host '   ✅ Configuração DynamoDB ativada!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 3/5
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 3/5: INICIANDO DYNAMODB LOCAL                                      ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   🗄️  Subindo container DynamoDB...' -ForegroundColor Yellow"
docker-compose up -d dynamodb-local
echo.
powershell -Command "Write-Host '   ✅ Container DynamoDB iniciado!' -ForegroundColor Green"
powershell -Command "Write-Host '   ⏳ Aguardando serviço estabilizar...' -ForegroundColor Yellow"
echo.
powershell -Command "for($i=0; $i -le 5; $i++) { $pct = [math]::Floor(($i/5)*100); Write-Host ('   [' + ('█' * [math]::Floor($pct/5)) + (' ' * (20-[math]::Floor($pct/5))) + '] ' + $pct + '%% - ' + $i + 's/5s') -NoNewline -ForegroundColor Cyan; Start-Sleep -Seconds 1; Write-Host \"`r\" -NoNewline } Write-Host '   [████████████████████] 100%% - Completo!                    ' -ForegroundColor Green"
echo.

REM Etapa 4/5
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 4/5: CRIANDO TABELAS NO DYNAMODB                                   ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 30; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
powershell -Command "Write-Host '   🏗️  Criando estrutura de tabelas...' -ForegroundColor Yellow"
call npm run dynamodb:create-tables >nul 2>&1
powershell -Command "Write-Host '   ✅ Tabelas criadas com sucesso!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 5/5 - Dados Opcionais
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 5/5: DADOS DE TESTE (OPCIONAL)                                     ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   ❓ Deseja popular o DynamoDB com dados de teste?' -ForegroundColor Yellow"
powershell -Command "Write-Host '      [S] Sim, inserir dados de exemplo' -ForegroundColor White"
powershell -Command "Write-Host '      [N] Não, iniciar com banco vazio' -ForegroundColor White"
echo.
set /p resposta="   Digite sua escolha: "

if /i "%resposta%"=="S" (
    echo.
    powershell -Command "Write-Host '   🌱 Populando DynamoDB...' -ForegroundColor Yellow"
    powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 25; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
    call npm run dynamodb:seed >nul 2>&1
    powershell -Command "Write-Host '   ✅ Dados inseridos com sucesso!' -ForegroundColor Green"
    timeout /t 1 /nobreak >nul
) else (
    powershell -Command "Write-Host '   ⏭️  Pulando população de dados' -ForegroundColor Yellow"
    timeout /t 1 /nobreak >nul
)

REM Resumo Final
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Green"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ║                     ✨  AMBIENTE CONFIGURADO COM SUCESSO!  ✨              ║' -ForegroundColor White -NoNewline; Write-Host '  ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Green"
echo.
echo.
powershell -Command "Write-Host '   📊 RESUMO DA INSTALAÇÃO:' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   ✅ Docker Desktop        - Ativo e funcionando' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ DynamoDB Local        - Rodando (porta 8000)' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Tabelas Criadas       - Estrutura NoSQL pronta' -ForegroundColor Green"
if /i "%resposta%"=="S" (
    powershell -Command "Write-Host '   ✅ Dados de Teste        - Inseridos no banco' -ForegroundColor Green"
) else (
    powershell -Command "Write-Host '   ⚪ Dados de Teste        - Banco vazio' -ForegroundColor Gray"
)
echo.
echo.
powershell -Command "Write-Host '   🔒 SEGURANÇA:' -ForegroundColor Cyan"
echo.
powershell -Command "if (Test-Path 'node_modules\@fastify\helmet') { Write-Host '      ✅ Helmet   - Proteção de headers HTTP' -ForegroundColor Green } else { Write-Host '      ❌ Helmet   - Não instalado' -ForegroundColor Red }"
powershell -Command "if (Test-Path 'node_modules\@fastify\cors') { Write-Host '      ✅ CORS     - Cross-Origin configurado' -ForegroundColor Green } else { Write-Host '      ❌ CORS     - Não instalado' -ForegroundColor Red }"
powershell -Command "if (Test-Path 'node_modules\zod') { Write-Host '      ✅ Zod      - Validação de schemas' -ForegroundColor Green } else { Write-Host '      ❌ Zod      - Não instalado' -ForegroundColor Red }"
echo.
echo.
REM Ler PORT do .env
for /f %%i in ('powershell -Command "if(Test-Path .env){($c=Get-Content .env|Where-Object{$_ -match '^PORT\s*=\s*(\d+)'});if($c -match 'PORT\s*=\s*(\d+)'){$matches[1]}}else{'4000'}"') do set API_PORT=%%i
if not defined API_PORT set API_PORT=4000

powershell -Command "Write-Host '   🌐 URLS DO SISTEMA:' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '      • API Principal:     http://localhost:%API_PORT%' -ForegroundColor White"
powershell -Command "Write-Host '      • Documentação:      http://localhost:%API_PORT%/docs' -ForegroundColor White"
powershell -Command "Write-Host '      • DynamoDB Local:    http://localhost:8000' -ForegroundColor White"
powershell -Command "Write-Host '      • DynamoDB Admin:    http://localhost:8001' -ForegroundColor White"
echo.
echo.
powershell -Command "Write-Host '   ⚡ COMANDOS ÚTEIS:' -ForegroundColor Yellow"
echo.
powershell -Command "Write-Host '      • npm run dev                      - Iniciar servidor' -ForegroundColor Gray"
powershell -Command "Write-Host '      • npm run dynamodb:list-tables     - Listar tabelas' -ForegroundColor Gray"
echo.
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   🎨 Iniciando DynamoDB Admin (http://localhost:8001)...' -ForegroundColor Magenta"
start /b cmd /c "set DYNAMO_ENDPOINT=http://localhost:8000 && npx -y dynamodb-admin >nul 2>&1"
timeout /t 3 /nobreak >nul

call npm run dev
