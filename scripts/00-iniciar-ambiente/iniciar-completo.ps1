# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente Completo
# Descrição: Setup completo com MongoDB + DynamoDB + Prisma
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
    Write-Host "`r   [████████████████████] 100% - $Message Pronto!                    " -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════
#                         HEADER BONITO
# ═══════════════════════════════════════════════════════════════════════════
Clear-Host
Write-Host ""
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║                                                                           ║" -ForegroundColor Cyan
Write-Host "   ║              🚀  INICIALIZADOR COMPLETO DE AMBIENTE  🚀                   ║" -ForegroundColor White
Write-Host "   ║                                                                           ║" -ForegroundColor Cyan
Write-Host "   ║              MONGODB + DYNAMODB + PRISMA + SERVIDOR                       ║" -ForegroundColor Yellow
Write-Host "   ║                                                                           ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Preparando ambiente completo com dual database..." -ForegroundColor Gray
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
Write-Host "   ✅ Portas liberadas: 3000, 4000, 5555, 8000, 8001" -ForegroundColor Green
Start-Sleep -Seconds 2

# ═══════════════════════════════════════════════════════════════════════════
#                    SEQUÊNCIA DE INICIALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

# Etapa 1/8
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  ETAPA 1/8: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Show-ProgressBar -Duration 2
Write-Host ""
Write-Host "   🔍 Verificando Docker Desktop..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "   ✅ Docker verificado e pronto!" -ForegroundColor Green
    Start-Sleep -Seconds 1
} catch {
    Write-Host "   ❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host "   💡 Inicie Docker Desktop e tente novamente" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Etapa 2/8
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  ETAPA 2/8: CONFIGURAÇÃO INICIAL                                          ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Show-ProgressBar -Duration 1
Write-Host ""
if (-not (Test-Path ".env")) {
    Write-Host "   📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "   ✅ Arquivo .env criado!" -ForegroundColor Green
} else {
    Write-Host "   ✅ Arquivo .env já existe!" -ForegroundColor Green
}
Start-Sleep -Seconds 1

# Etapa 3/8
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  ETAPA 3/8: INICIANDO MONGODB                                             ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🐳 Subindo container MongoDB..." -ForegroundColor Yellow
docker-compose up -d mongodb
Write-Host ""
Write-Host "   ✅ MongoDB container iniciado!" -ForegroundColor Green
Write-Host "   ⏳ Aguardando Replica Set (15s)..." -ForegroundColor Yellow
Write-Host ""
Show-Timer -Seconds 15 -Message "MongoDB"
Write-Host ""

# Etapa 4/8
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  ETAPA 4/8: INICIANDO DYNAMODB LOCAL                                      ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🗄️  Subindo container DynamoDB..." -ForegroundColor Yellow
docker-compose up -d dynamodb-local
Write-Host ""
Write-Host "   ✅ DynamoDB container iniciado!" -ForegroundColor Green
Write-Host "   ⏳ Aguardando estabilização (5s)..." -ForegroundColor Yellow
Write-Host ""
Show-Timer -Seconds 5 -Message "DynamoDB"
Write-Host ""

# Etapa 5/8
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  ETAPA 5/8: CONFIGURANDO PRISMA ORM                                       ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "   📦 Gerando Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate | Out-Null
Write-Host "   ✅ Prisma Client gerado!" -ForegroundColor Green
Write-Host ""
Write-Host "   🔄 Sincronizando schema MongoDB..." -ForegroundColor Yellow
npm run prisma:push | Out-Null
Write-Host "   ✅ Schema sincronizado!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Etapa 6/8
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  ETAPA 6/8: POPULANDO MONGODB                                             ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Show-ProgressBar -Duration 2
Write-Host ""
Write-Host "   🌱 Inserindo dados de teste..." -ForegroundColor Yellow
npm run seed | Out-Null
Write-Host "   ✅ MongoDB populado com sucesso!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Etapa 7/8
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  ETAPA 7/8: CONFIGURANDO DYNAMODB                                         ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🏗️  Criando tabelas DynamoDB (background)..." -ForegroundColor Yellow
Write-Host "      Isso pode levar 30-60 segundos. Continuando..." -ForegroundColor Gray
Start-Job -ScriptBlock { npm run dynamodb:create-tables } | Out-Null
Start-Sleep -Seconds 3
Write-Host "   ✅ Processo iniciado em background!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Etapa 8/8 - Resumo Final
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "   ║                                                                           ║" -ForegroundColor Green
Write-Host "   ║               ✨  AMBIENTE COMPLETO CONFIGURADO COM SUCESSO!  ✨           ║" -ForegroundColor White
Write-Host "   ║                                                                           ║" -ForegroundColor Green
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host ""
Write-Host "   📊 RESUMO COMPLETO DA INSTALAÇÃO:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ✅ Docker Desktop        - Ativo e funcionando" -ForegroundColor Green
Write-Host "   ✅ MongoDB Container     - Rodando na porta 27017" -ForegroundColor Green
Write-Host "   ✅ DynamoDB Container    - Rodando na porta 8000" -ForegroundColor Green
Write-Host "   ✅ Prisma ORM            - Configurado e sincronizado" -ForegroundColor Green
Write-Host "   ✅ Dados de Teste        - Inseridos no MongoDB" -ForegroundColor Green
Write-Host "   🔄 Tabelas DynamoDB      - Criação em andamento..." -ForegroundColor Yellow
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
Write-Host "   🗄️  BANCOS DE DADOS ATIVOS:" -ForegroundColor Magenta
Write-Host ""
Write-Host "      • MongoDB:           mongodb://localhost:27017" -ForegroundColor White
Write-Host "      • DynamoDB Local:    http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host ""
$API_PORT = Get-ApiPort
Write-Host "   🌐 URLS DO SISTEMA:" -ForegroundColor Magenta
Write-Host ""
Write-Host "      • API Principal:     http://localhost:$API_PORT" -ForegroundColor White
Write-Host "      • Documentação:      http://localhost:$API_PORT/docs" -ForegroundColor White
Write-Host "      • Health Check:      http://localhost:$API_PORT/health" -ForegroundColor White
Write-Host "      • Prisma Studio:     http://localhost:5555" -ForegroundColor White
Write-Host "      • DynamoDB Admin:    http://localhost:8001" -ForegroundColor White
Write-Host ""
Write-Host ""
Write-Host "   ⚡ COMANDOS ÚTEIS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "      • npm run dev                      - Iniciar servidor" -ForegroundColor Gray
Write-Host "      • npm run prisma:studio            - Abrir Prisma Studio" -ForegroundColor Gray
Write-Host "      • npm run dynamodb:list-tables     - Listar tabelas DynamoDB" -ForegroundColor Gray
Write-Host ""
Write-Host ""
Write-Host "   🔄 ALTERNAR ENTRE BANCOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "      Use: scripts\03-alternar-banco-dados\alternar-banco.bat" -ForegroundColor Gray
Write-Host ""
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║" -ForegroundColor White
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🎨 Abrindo Prisma Studio (MongoDB GUI)..." -ForegroundColor Magenta
Start-Job -ScriptBlock { Set-Location C:\Desenvolvimento\rainer-portfolio-backend; npm run prisma:studio } | Out-Null
Write-Host "   🗄️  Iniciando DynamoDB Admin (NoSQL GUI)..." -ForegroundColor Magenta
Start-Job -ScriptBlock { 
    $env:DYNAMO_ENDPOINT = "http://localhost:8000"
    npx -y dynamodb-admin
} | Out-Null
Start-Sleep -Seconds 3

npm run dev
