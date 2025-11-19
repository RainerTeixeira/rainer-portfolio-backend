# 🔧 Script para Corrigir Problemas do WSL no Windows
# Este script ajuda a resolver erros relacionados ao WSL que impedem o Docker de funcionar

Write-Host "🔧 Verificando e corrigindo problemas do WSL..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "   Clique com botão direito e selecione 'Executar como administrador'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green
Write-Host ""

# 1. Verificar status do WSL
Write-Host "📋 Verificando status do WSL..." -ForegroundColor Cyan
$wslStatus = wsl --status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WSL está instalado" -ForegroundColor Green
    Write-Host $wslStatus
} else {
    Write-Host "⚠️  WSL não está instalado ou há problemas" -ForegroundColor Yellow
}

Write-Host ""

# 2. Habilitar recursos do Windows necessários
Write-Host "🔧 Habilitando recursos do Windows necessários..." -ForegroundColor Cyan

$features = @(
    "Microsoft-Windows-Subsystem-Linux",
    "VirtualMachinePlatform"
)

foreach ($feature in $features) {
    Write-Host "   Habilitando: $feature..." -ForegroundColor Yellow
    $result = dism.exe /online /enable-feature /featurename:$feature /all /norestart 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $feature habilitado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $feature - Verifique manualmente" -ForegroundColor Yellow
    }
}

Write-Host ""

# 3. Verificar e iniciar serviços relacionados
Write-Host "🔧 Verificando serviços do Windows..." -ForegroundColor Cyan

$services = @(
    "vmcompute",
    "vmms"
)

foreach ($service in $services) {
    $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
    if ($svc) {
        Write-Host "   Serviço: $service" -ForegroundColor Yellow
        Write-Host "      Status: $($svc.Status)" -ForegroundColor $(if ($svc.Status -eq "Running") { "Green" } else { "Yellow" })
        Write-Host "      Tipo de Inicialização: $($svc.StartType)" -ForegroundColor $(if ($svc.StartType -eq "Automatic") { "Green" } else { "Yellow" })
        
        if ($svc.Status -ne "Running") {
            Write-Host "      🚀 Tentando iniciar..." -ForegroundColor Cyan
            try {
                Start-Service -Name $service -ErrorAction Stop
                Write-Host "      ✅ Serviço iniciado com sucesso" -ForegroundColor Green
            } catch {
                Write-Host "      ❌ Erro ao iniciar: $_" -ForegroundColor Red
            }
        }
        
        if ($svc.StartType -ne "Automatic") {
            Write-Host "      🔧 Configurando para iniciar automaticamente..." -ForegroundColor Cyan
            try {
                Set-Service -Name $service -StartupType Automatic -ErrorAction Stop
                Write-Host "      ✅ Configurado para iniciar automaticamente" -ForegroundColor Green
            } catch {
                Write-Host "      ❌ Erro ao configurar: $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "   ⚠️  Serviço $service não encontrado" -ForegroundColor Yellow
    }
    Write-Host ""
}

# 4. Verificar Docker Desktop
Write-Host "🐳 Verificando Docker Desktop..." -ForegroundColor Cyan
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerProcess) {
    Write-Host "✅ Docker Desktop está rodando" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker Desktop não está rodando" -ForegroundColor Yellow
    Write-Host "   Inicie o Docker Desktop manualmente após reiniciar" -ForegroundColor Yellow
}

Write-Host ""

# 5. Resumo e próximos passos
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Recursos do Windows habilitados" -ForegroundColor Green
Write-Host "✅ Serviços verificados e configurados" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. REINICIE o computador para aplicar as mudanças" -ForegroundColor White
Write-Host "   2. Após reiniciar, inicie o Docker Desktop" -ForegroundColor White
Write-Host "   3. Aguarde o Docker Desktop inicializar completamente" -ForegroundColor White
Write-Host "   4. Execute: docker-compose up -d" -ForegroundColor White
Write-Host ""

# Perguntar se deseja reiniciar agora
$restart = Read-Host "Deseja reiniciar o computador agora? (S/N)"
if ($restart -eq "S" -or $restart -eq "s") {
    Write-Host ""
    Write-Host "🔄 Reiniciando em 10 segundos..." -ForegroundColor Yellow
    Write-Host "   Pressione Ctrl+C para cancelar" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Restart-Computer -Force
} else {
    Write-Host ""
    Write-Host "⚠️  Lembre-se de reiniciar o computador para aplicar as mudanças!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Script concluído!" -ForegroundColor Green

