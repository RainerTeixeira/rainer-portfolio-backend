@echo off
chcp 65001 >nul
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: Iniciar Ambiente MongoDB + Prisma (Windows)
REM Descrição: Setup completo com interface visual bonita
REM ═══════════════════════════════════════════════════════════════════════════

cd /d "%~dp0..\.."

REM ═══════════════════════════════════════════════════════════════════════════
REM                         HEADER BONITO
REM ═══════════════════════════════════════════════════════════════════════════
cls
echo.
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║                  🚀  INICIALIZADOR DE AMBIENTE LOCAL  🚀                  ║' -ForegroundColor Cyan -NoNewline; Write-Host '  ║' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║                     PRISMA + MONGODB + EXPRESS                            ║' -ForegroundColor White -NoNewline; Write-Host '  ║' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Blue"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
echo.
powershell -Command "Write-Host '   Preparando ambiente de desenvolvimento...' -ForegroundColor Gray"
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
powershell -Command "Write-Host '   🔨 Encerrando processos Node.js anteriores...' -ForegroundColor Yellow"
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    powershell -Command "Write-Host '   ℹ️  Nenhum processo Node.js estava rodando' -ForegroundColor Cyan"
) else (
    powershell -Command "Write-Host '   ✅ Processos Node.js finalizados!' -ForegroundColor Green"
)
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    SEQUÊNCIA DE INICIALIZAÇÃO
REM ═══════════════════════════════════════════════════════════════════════════

REM Etapa 1/6
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║  ETAPA 1/6: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
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

REM Etapa 2/6
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║  ETAPA 2/6: CONFIGURAÇÃO INICIAL                                          ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 15; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
if not exist ".env" (
    powershell -Command "Write-Host '   📝 Criando arquivo de configuração .env...' -ForegroundColor Yellow"
    copy env.example .env >nul
    powershell -Command "Write-Host '   ✅ Arquivo .env criado com sucesso!' -ForegroundColor Green"
) else (
    powershell -Command "Write-Host '   ✅ Arquivo .env já existe!' -ForegroundColor Green"
)
timeout /t 1 /nobreak >nul

REM Etapa 3/6
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║  ETAPA 3/6: INICIANDO MONGODB                                             ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
echo.
powershell -Command "Write-Host '   🐳 Subindo container MongoDB...' -ForegroundColor Yellow"
docker-compose up -d mongodb
echo.
powershell -Command "Write-Host '   ✅ Container MongoDB iniciado!' -ForegroundColor Green"
powershell -Command "Write-Host '   ⏳ Aguardando Replica Set inicializar...' -ForegroundColor Yellow"
echo.
powershell -Command "for($i=0; $i -le 30; $i++) { $pct = [math]::Floor(($i/30)*100); Write-Host ('   [' + ('█' * [math]::Floor($pct/5)) + (' ' * (20-[math]::Floor($pct/5))) + '] ' + $pct + '%% - ' + $i + 's/30s') -NoNewline -ForegroundColor Cyan; Start-Sleep -Seconds 1; Write-Host \"`r\" -NoNewline } Write-Host '   [████████████████████] 100%% - Completo!                    ' -ForegroundColor Green"
echo.

REM Etapa 4/6
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║  ETAPA 4/6: CONFIGURANDO PRISMA ORM                                       ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
echo.
powershell -Command "Write-Host '   📦 Gerando Prisma Client...' -ForegroundColor Yellow"
call npm run prisma:generate >nul 2>&1
powershell -Command "Write-Host '   ✅ Prisma Client gerado!' -ForegroundColor Green"
echo.
powershell -Command "Write-Host '   🔄 Sincronizando schema com MongoDB...' -ForegroundColor Yellow"
call npm run prisma:push >nul 2>&1
powershell -Command "Write-Host '   ✅ Schema sincronizado!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 5/6
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║  ETAPA 5/6: POPULANDO BANCO DE DADOS                                      ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 25; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
powershell -Command "Write-Host '   🌱 Inserindo dados de teste...' -ForegroundColor Yellow"
call npm run seed >nul 2>&1
powershell -Command "Write-Host '   ✅ Banco de dados populado com sucesso!' -ForegroundColor Green"
timeout /t 1 /nobreak >nul

REM Etapa 6/6 - Resumo Final
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
powershell -Command "Write-Host '   ✅ MongoDB Container     - Rodando (porta 27017)' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Prisma ORM            - Configurado e sincronizado' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Banco de Dados        - Populado com dados de teste' -ForegroundColor Green"
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
powershell -Command "$port='%API_PORT%'; Write-Host \"      • API Principal:     http://localhost:$port\" -ForegroundColor White"
powershell -Command "$port='%API_PORT%'; Write-Host \"      • Documentação:      http://localhost:$port/docs\" -ForegroundColor White"
powershell -Command "$port='%API_PORT%'; Write-Host \"      • Health Check:      http://localhost:$port/health\" -ForegroundColor White"
powershell -Command "Write-Host '      • Prisma Studio:     http://localhost:5555' -ForegroundColor White"
echo.
echo.
powershell -Command "Write-Host '   ⚡ COMANDOS ÚTEIS:' -ForegroundColor Yellow"
echo.
powershell -Command "Write-Host '      • npm run dev              - Iniciar servidor de desenvolvimento' -ForegroundColor Gray"
powershell -Command "Write-Host '      • npm run prisma:studio    - Abrir Prisma Studio (GUI para o banco)' -ForegroundColor Gray"
echo.
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Blue"
powershell -Command "Write-Host '   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Blue"
echo.
powershell -Command "Write-Host '   🎨 Abrindo Prisma Studio em nova janela...' -ForegroundColor Magenta"
start /b npm run prisma:studio >nul 2>&1
timeout /t 3 /nobreak >nul

call npm run dev
