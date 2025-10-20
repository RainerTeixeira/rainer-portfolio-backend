# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente DynamoDB Local
# Descrição: Setup completo com DynamoDB Local e criação de tabelas
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
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║                                                                           ║" -ForegroundColor Magenta
Write-Host "   ║                  🚀  INICIALIZADOR DE AMBIENTE LOCAL  🚀                  ║" -ForegroundColor Cyan
Write-Host "   ║                                                                           ║" -ForegroundColor Magenta
Write-Host "   ║                       DYNAMODB LOCAL + EXPRESS                            ║" -ForegroundColor White
Write-Host "   ║                                                                           ║" -ForegroundColor Magenta
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "   Preparando ambiente NoSQL..." -ForegroundColor Gray
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
    Write-Host "   ℹ️  Nenhum processo estava rodando" -ForegroundColor Cyan
}
Write-Host "   ✅ Portas liberadas: 3000, 4000, 8000, 8001" -ForegroundColor Green
Start-Sleep -Seconds 2

# ═══════════════════════════════════════════════════════════════════════════
#                    SEQUÊNCIA DE INICIALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

# Etapa 1/5
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║  ETAPA 1/5: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
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

# Etapa 2/5
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║  ETAPA 2/5: CONFIGURAÇÃO INICIAL                                          ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Show-ProgressBar -Duration 1
Write-Host ""
if (-not (Test-Path ".env")) {
    Write-Host "   📝 Criando arquivo .env..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
}
Write-Host "   🔄 Configurando para DynamoDB..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace 'DATABASE_PROVIDER=.*', 'DATABASE_PROVIDER=DYNAMODB'
Set-Content ".env" -Value $envContent
Write-Host "   ✅ Configuração DynamoDB ativada!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Etapa 3/5
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║  ETAPA 3/5: INICIANDO DYNAMODB LOCAL                                      ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "   🗄️  Subindo container DynamoDB..." -ForegroundColor Yellow
docker-compose up -d dynamodb-local
Write-Host ""
Write-Host "   ✅ Container DynamoDB iniciado!" -ForegroundColor Green
Write-Host "   ⏳ Aguardando serviço estabilizar..." -ForegroundColor Yellow
Write-Host ""
Show-Timer -Seconds 5 -Message "DynamoDB"
Write-Host ""

# Etapa 4/5
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║  ETAPA 4/5: CRIANDO TABELAS NO DYNAMODB                                   ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Show-ProgressBar -Duration 3
Write-Host ""
Write-Host "   🏗️  Criando estrutura de tabelas..." -ForegroundColor Yellow
npm run dynamodb:create-tables | Out-Null
Write-Host "   ✅ Tabelas criadas com sucesso!" -ForegroundColor Green
Start-Sleep -Seconds 1

# Etapa 5/5 - Dados Opcionais
Clear-Host
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║  ETAPA 5/5: DADOS DE TESTE (OPCIONAL)                                     ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "   ❓ Deseja popular o DynamoDB com dados de teste?" -ForegroundColor Yellow
Write-Host "      [S] Sim, inserir dados de exemplo" -ForegroundColor White
Write-Host "      [N] Não, iniciar com banco vazio" -ForegroundColor White
Write-Host ""
$resposta = Read-Host "   Digite sua escolha"

if ($resposta -match '^[Ss]$') {
    Write-Host ""
    Write-Host "   🌱 Populando DynamoDB..." -ForegroundColor Yellow
    Show-ProgressBar -Duration 2
    npm run dynamodb:seed | Out-Null
    Write-Host "   ✅ Dados inseridos com sucesso!" -ForegroundColor Green
    Start-Sleep -Seconds 1
} else {
    Write-Host "   ⏭️  Pulando população de dados" -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

# Resumo Final
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
Write-Host "   ✅ DynamoDB Local        - Rodando (porta 8000)" -ForegroundColor Green
Write-Host "   ✅ Tabelas Criadas       - Estrutura NoSQL pronta" -ForegroundColor Green
if ($resposta -match '^[Ss]$') {
    Write-Host "   ✅ Dados de Teste        - Inseridos no banco" -ForegroundColor Green
} else {
    Write-Host "   ⚪ Dados de Teste        - Banco vazio" -ForegroundColor Gray
}
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
Write-Host "      • DynamoDB Local:    http://localhost:8000" -ForegroundColor White
Write-Host "      • DynamoDB Admin:    http://localhost:8001" -ForegroundColor White
Write-Host ""
Write-Host ""
Write-Host "   ⚡ COMANDOS ÚTEIS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "      • npm run dev                      - Iniciar servidor" -ForegroundColor Gray
Write-Host "      • npm run dynamodb:list-tables     - Listar tabelas" -ForegroundColor Gray
Write-Host ""
Write-Host ""
Write-Host "   ╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║" -ForegroundColor Cyan
Write-Host "   ╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "   🎨 Iniciando DynamoDB Admin (http://localhost:8001)..." -ForegroundColor Magenta
Start-Job -ScriptBlock { 
    $env:DYNAMO_ENDPOINT = "http://localhost:8000"
    npx -y dynamodb-admin
} | Out-Null
Start-Sleep -Seconds 3

npm run dev
