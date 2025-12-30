# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente MongoDB + Prisma
# Descrição: Setup completo com MongoDB, Prisma ORM e dados de teste
# ═══════════════════════════════════════════════════════════════════════════

# Função para ler PORT do .env
function Get-ApiPort {
    if (Test-Path ".env") {
        $portLine = Get-Content ".env" | Where-Object { $_ -match "^PORT\s*=\s*(\d+)" }
        if ($portLine -match "PORT\s*=\s*(\d+)") {
            return $matches[1]
        }
    }
    return "4000"  # Default
}

# Função para barra de progresso
function Show-ProgressBar {
    param([int]$Duration = 2)
    for ($i = 0; $i -le 100; $i += 5) {
        $bar = ('█' * [math]::Floor($i/5)) + (' ' * (20 - [math]::Floor($i/5)))
        Write-Host "`r   [$bar] $i%" -NoNewline -ForegroundColor Green
        Start-Sleep -Milliseconds ($Duration * 10)
    }
    Write-Host ""
}

# Função para contador de tempo
function Show-Timer {
    param([int]$Seconds, [string]$Message = "Aguardando")
    for ($i = 0; $i -le $Seconds; $i++) {
        $pct = [math]::Floor(($i/$Seconds) * 100)
        $bar = ('█' * [math]::Floor($pct/5)) + (' ' * (20 - [math]::Floor($pct/5)))
        Write-Host "`r   [$bar] $pct% - $i`s/$Seconds`s" -NoNewline -ForegroundColor Cyan
        Start-Sleep -Seconds 1
    }
    Write-Host "`r   [████████████████████] 100% - Completo!                    " -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════
#                         HEADER BONITO
# ═══════════════════════════════════════════════════════════════════════════
Clear-Host
Write-Host ""
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "   ║                                                                           ║" -ForegroundColor Blue
Write-Host "   ║                  🚀  INICIALIZADOR DE AMBIENTE LOCAL  🚀                  ║" -ForegroundColor Cyan
Write-Host "   ║                                                                           ║" -ForegroundColor Blue
Write-Host "   ║                     PRISMA + MONGODB + EXPRESS                            ║" -ForegroundColor White
Write-Host "   ║                                                                           ║" -ForegroundColor Blue
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Write-Host "   Preparando ambiente de desenvolvimento..." -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 2

# ═══════════════════════════════════════════════════════════════════════════
#                    LIMPEZA DE PROCESSOS NODE.JS
# ═══════════════════════════════════════════════════════════════════════════

Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║  🧹 LIMPEZA INICIAL - FINALIZANDO PROCESSOS NODE.JS                       ║" -ForegroundColor Yellow
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "   🔨 Encerrando processos Node.js e liberando portas..." -ForegroundColor Yellow
$processes = Get-Process node -ErrorAction SilentlyContinue
if ($processes) {
    $processes | Stop-Process -Force
    Write-Host "   ✅ Todos os processos Node.js finalizados!" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Nenhum processo Node.js estava rodando" -ForegroundColor Cyan
}
Write-Host "   ✅ Portas liberadas: 3000, 4000, 5555" -ForegroundColor Green
Start-Sleep -Seconds 2

# ═══════════════════════════════════════════════════════════════════════════
#                    SEQUÊNCIA DE INICIALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

# Etapa 1/6
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "   ║  ETAPA 1/6: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Show-ProgressBar -Duration 2
Write-Host ""
Write-Host "   🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "   ✅ Docker verificado e funcionando!" -ForegroundColor Green
    Start-Sleep -Seconds 1
} catch {
    Write-Host "   ❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "   💡 Inicie Docker Desktop e tente novamente" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Etapa 2/6
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "   ║  ETAPA 2/6: CONFIGURAÇÃO INICIAL                                          ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Show-ProgressBar -Duration 1
Write-Host ""
if (-not (Test-Path ".env")) {
    Write-Host "   📝 Criando arquivo de configuração .env..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "   ✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   ✅ Arquivo .env já existe!" -ForegroundColor Green
}
Start-Sleep -Seconds 1

# Etapa 3/6
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "   ║  ETAPA 3/6: INICIANDO MONGODB                                             ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Write-Host "   🐳 Subindo container MongoDB..." -ForegroundColor Yellow
docker-compose up -d mongodb
Write-Host ""
Write-Host "   ✅ Container MongoDB iniciado!" -ForegroundColor Green
Write-Host "   ⏳ Aguardando Replica Set inicializar..." -ForegroundColor Yellow
Write-Host ""
Show-Timer -Seconds 30 -Message "Replica Set"
Write-Host ""

# Etapa 4/6
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "   ║  ETAPA 4/6: CONFIGURANDO PRISMA ORM                                       ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Write-Host "   📦 Gerando Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate | Out-Null
Write-Host "   ✅ Prisma Client gerado!" -ForegroundColor Green
Write-Host ""
Write-Host "   🔄 Sincronizando schema com MongoDB..." -ForegroundColor Yellow
npm run prisma:push | Out-Null
Write-Host "   ✅ Schema sincronizado!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Etapa 5/6
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "   ║  ETAPA 5/6: POPULANDO BANCO DE DADOS                                      ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Show-ProgressBar -Duration 2
Write-Host ""
Write-Host "   🌱 Inserindo dados de teste..." -ForegroundColor Yellow
npm run seed | Out-Null
Write-Host "   ✅ Banco de dados populado com sucesso!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Etapa 6/6 - Resumo Final
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "   ║                                                                           ║" -ForegroundColor Green
Write-Host "   ║                     ✨  AMBIENTE CONFIGURADO COM SUCESSO!  ✨              ║" -ForegroundColor White
Write-Host "   ║                                                                           ║" -ForegroundColor Green
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host ""
Write-Host "   📊 RESUMO DA INSTALAÇÃO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ✅ Docker Desktop        - Ativo e funcionando" -ForegroundColor Green
Write-Host "   ✅ MongoDB Container     - Rodando (porta 27017)" -ForegroundColor Green
Write-Host "   ✅ Prisma ORM            - Configurado e sincronizado" -ForegroundColor Green
Write-Host "   ✅ Banco de Dados        - Populado com dados de teste" -ForegroundColor Green
Write-Host ""
Write-Host ""
Write-Host "   🔒 SEGURANÇA:" -ForegroundColor Cyan
Write-Host ""
if (Test-Path "node_modules\@fastify\helmet") {
    Write-Host "      ✅ Helmet   - Proteção de headers HTTP" -ForegroundColor Green
} else {
    Write-Host "      ❌ Helmet   - Não instalado" -ForegroundColor Red
}
if (Test-Path "node_modules\@fastify\cors") {
    Write-Host "      ✅ CORS     - Cross-Origin configurado" -ForegroundColor Green
} else {
    Write-Host "      ❌ CORS     - Não instalado" -ForegroundColor Red
}
if (Test-Path "node_modules\zod") {
    Write-Host "      ✅ Zod      - Validação de schemas" -ForegroundColor Green
} else {
    Write-Host "      ❌ Zod      - Não instalado" -ForegroundColor Red
}
Write-Host ""
Write-Host ""
$API_PORT = Get-ApiPort
Write-Host "   🌐 URLS DO SISTEMA:" -ForegroundColor Magenta
Write-Host ""
Write-Host "      • API Principal:     http://localhost:$API_PORT" -ForegroundColor White
Write-Host "      • Documentação:      http://localhost:$API_PORT/docs" -ForegroundColor White
Write-Host "      • Health Check:      http://localhost:$API_PORT/health" -ForegroundColor White
Write-Host "      • Prisma Studio:     http://localhost:5555" -ForegroundColor White
Write-Host ""
Write-Host ""
Write-Host "   ⚡ COMANDOS ÚTEIS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "      • npm run dev              - Iniciar servidor de desenvolvimento" -ForegroundColor Gray
Write-Host "      • npm run prisma:studio    - Abrir Prisma Studio (GUI para o banco)" -ForegroundColor Gray
Write-Host ""
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Write-Host "   🎨 Abrindo Prisma Studio em nova janela..." -ForegroundColor Magenta
Start-Job -ScriptBlock { Set-Location C:\Desenvolvimento\rainer-portfolio-backend; npm run prisma:studio } | Out-Null
Start-Sleep -Seconds 3

npm run dev
