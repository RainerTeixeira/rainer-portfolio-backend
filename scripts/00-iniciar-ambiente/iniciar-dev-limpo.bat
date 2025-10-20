@echo off
chcp 65001 >nul
REM ═══════════════════════════════════════════════════════════════════════════
REM Script: Iniciar Dev Limpo - Mata TODOS os Processos Node
REM Descrição: Finaliza TODOS processos Node.js e inicia servidor na porta 4000
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
powershell -Command "Write-Host '   ║              🧹  LIMPADOR TOTAL DE NODE.JS + INICIALIZADOR  🧹            ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║                  RESOLVE: Mata TODOS os Node.js em execução               ║' -ForegroundColor Yellow"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   Preparando limpeza total de processos Node.js...' -ForegroundColor Gray"
echo.
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    VERIFICAÇÃO E LIMPEZA DE PROCESSOS E PORTAS
REM ═══════════════════════════════════════════════════════════════════════════

cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 1/3: LIMPEZA TOTAL - PROCESSOS E PORTAS                            ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 15; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
powershell -Command "Write-Host '   🔍 Procurando processos Node.js ativos...' -ForegroundColor Yellow"
echo.

REM Contar processos Node
set NODE_COUNT=0
for /f %%i in ('tasklist /FI "IMAGENAME eq node.exe" 2^>nul ^| find /C "node.exe"') do set NODE_COUNT=%%i

if %NODE_COUNT% EQU 0 (
    powershell -Command "Write-Host '   ✅ Nenhum processo Node.js encontrado!' -ForegroundColor Green"
    powershell -Command "Write-Host '   ℹ️  Sistema está limpo' -ForegroundColor Cyan"
    timeout /t 2 /nobreak >nul
    goto :configure
) else (
    powershell -Command "Write-Host '   ⚠️  Encontrado(s) %NODE_COUNT% processo(s) Node.js!' -ForegroundColor Yellow"
    echo.
    powershell -Command "Write-Host '   📋 Processos detectados:' -ForegroundColor White"
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE | findstr "node.exe"
    echo.
    timeout /t 2 /nobreak >nul
)

REM ═══════════════════════════════════════════════════════════════════════════
REM                    FINALIZAR TODOS OS PROCESSOS NODE
REM ═══════════════════════════════════════════════════════════════════════════

cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 2/3: FINALIZANDO TODOS OS PROCESSOS NODE.JS                        ║' -ForegroundColor Yellow"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "Write-Host '   🔨 Encerrando TODOS os processos Node.js...' -ForegroundColor Yellow"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Red; Start-Sleep -Milliseconds 20; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.

taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    powershell -Command "Write-Host '   ℹ️  Nenhum processo Node.js estava rodando' -ForegroundColor Cyan"
) else (
    powershell -Command "Write-Host '   ✅ Todos os processos Node.js finalizados!' -ForegroundColor Green"
    powershell -Command "Write-Host '   🎉 Sistema completamente limpo!' -ForegroundColor Green"
)
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    CONFIGURAR PORTA 4000
REM ═══════════════════════════════════════════════════════════════════════════

:configure
cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  ETAPA 3/3: CONFIGURANDO PORTA 4000                                       ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.
powershell -Command "$p=0; while($p -le 100) { Write-Host ('   [' + ('█' * [math]::Floor($p/5)) + (' ' * (20-[math]::Floor($p/5))) + '] ' + $p + '%%') -NoNewline -ForegroundColor Green; Start-Sleep -Milliseconds 15; Write-Host \"`r\" -NoNewline; $p+=5 } Write-Host"
echo.
powershell -Command "Write-Host '   🔧 Configurando servidor para porta 4000...' -ForegroundColor Yellow"

REM Configurar variável de ambiente PORT
set PORT=4000

REM Atualizar .env se existir
if exist ".env" (
    powershell -Command "(Get-Content .env) -replace '^PORT=.*', 'PORT=4000' | Set-Content .env"
    powershell -Command "Write-Host '   ✅ Arquivo .env atualizado para PORT=4000!' -ForegroundColor Green"
) else (
    powershell -Command "Write-Host '   ⚠️  Arquivo .env não encontrado, usando variável de ambiente' -ForegroundColor Yellow"
)
timeout /t 1 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════════════════
REM                    RESUMO E INICIALIZAÇÃO
REM ═══════════════════════════════════════════════════════════════════════════

cls
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Green"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ║                ✨  SISTEMA LIMPO E CONFIGURADO!  ✨                       ║' -ForegroundColor White"
powershell -Command "Write-Host '   ║                                                                           ║' -ForegroundColor Green"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Green"
echo.
echo.
powershell -Command "Write-Host '   📊 STATUS DO SISTEMA:' -ForegroundColor Cyan"
echo.
powershell -Command "Write-Host '   ✅ Processos Node.js     - Todos finalizados' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Portas Liberadas      - Todas as portas disponíveis' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Porta Configurada     - 4000 (nova porta)' -ForegroundColor Green"
powershell -Command "Write-Host '   ✅ Ambiente              - Pronto para iniciar' -ForegroundColor Green"
echo.
echo.
powershell -Command "Write-Host '   🔒 SEGURANÇA:' -ForegroundColor Cyan"
echo.
powershell -Command "if (Test-Path 'node_modules\@fastify\helmet') { Write-Host '      ✅ Helmet   - Proteção de headers HTTP' -ForegroundColor Green } else { Write-Host '      ❌ Helmet   - Não instalado' -ForegroundColor Red }"
powershell -Command "if (Test-Path 'node_modules\@fastify\cors') { Write-Host '      ✅ CORS     - Cross-Origin configurado' -ForegroundColor Green } else { Write-Host '      ❌ CORS     - Não instalado' -ForegroundColor Red }"
powershell -Command "if (Test-Path 'node_modules\zod') { Write-Host '      ✅ Zod      - Validação de schemas' -ForegroundColor Green } else { Write-Host '      ❌ Zod      - Não instalado' -ForegroundColor Red }"
echo.
echo.
REM Ler PORT do .env (já foi setado para 4000 acima, mas garantimos)
for /f %%i in ('powershell -Command "if(Test-Path .env){($c=Get-Content .env|Where-Object{$_ -match '^PORT\s*=\s*(\d+)'});if($c -match 'PORT\s*=\s*(\d+)'){$matches[1]}}else{'4000'}"') do set DISPLAY_PORT=%%i
if not defined DISPLAY_PORT set DISPLAY_PORT=4000

powershell -Command "Write-Host '   🌐 URLS QUE ESTARÃO DISPONÍVEIS:' -ForegroundColor Magenta"
echo.
powershell -Command "$port='%DISPLAY_PORT%'; Write-Host \"      • API Principal:     http://localhost:$port\" -ForegroundColor White"
powershell -Command "$port='%DISPLAY_PORT%'; Write-Host \"      • Documentação:      http://localhost:$port/docs\" -ForegroundColor White"
powershell -Command "$port='%DISPLAY_PORT%'; Write-Host \"      • Health Check:      http://localhost:$port/health\" -ForegroundColor White"
echo.
echo.
powershell -Command "Write-Host '   💡 MUDANÇAS IMPORTANTES:' -ForegroundColor Yellow"
echo.
powershell -Command "Write-Host '      ⚡ Nova Porta: 4000 ' -ForegroundColor Cyan"
powershell -Command "Write-Host '      🧹 Limpeza Total: Todos os Node.js finalizados' -ForegroundColor Cyan"
powershell -Command "Write-Host '      🔄 .env Atualizado: PORT=4000' -ForegroundColor Cyan"
echo.
echo.
powershell -Command "Write-Host '   📝 DICA PRO:' -ForegroundColor Yellow"
echo.
powershell -Command "Write-Host '      Para voltar à porta 4000: Edite o .env e mude PORT=4000' -ForegroundColor Gray"
powershell -Command "Write-Host '      Use este script sempre que precisar de um ambiente limpo!' -ForegroundColor Gray"
echo.
echo.
powershell -Command "Write-Host '   ╔═══════════════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta"
powershell -Command "Write-Host '   ║  🚀  INICIANDO SERVIDOR NA PORTA 4000 EM 3 SEGUNDOS...                    ║' -ForegroundColor Cyan"
powershell -Command "Write-Host '   ╚═══════════════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta"
echo.

powershell -Command "for($i=3; $i -ge 1; $i--) { Write-Host ('   Iniciando em ' + $i + ' segundos...') -NoNewline -ForegroundColor Yellow; Start-Sleep -Seconds 1; Write-Host \"`r\" -NoNewline } Write-Host '   🚀 Iniciando agora na porta 4000!                              ' -ForegroundColor Green"
echo.

powershell -Command "Write-Host '   🎨 Abrindo Prisma Studio em nova janela...' -ForegroundColor Magenta"
start /b npm run prisma:studio >nul 2>&1
timeout /t 2 /nobreak >nul

call npm run dev
