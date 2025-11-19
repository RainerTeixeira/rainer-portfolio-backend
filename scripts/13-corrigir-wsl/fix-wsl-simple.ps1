# ═══════════════════════════════════════════════════════════════════════════
# Script: Correção Rápida do WSL
# Descrição: Corrige o erro 0x80070422 (serviço WSL desabilitado)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CORREÇÃO RÁPIDA DO WSL - Erro 0x80070422" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar se está executando como Administrador
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "`nPara executar como Admin:" -ForegroundColor Yellow
    Write-Host "  1. Abra o PowerShell como Administrador (botão direito > Executar como Administrador)" -ForegroundColor Yellow
    Write-Host "  2. Navegue até esta pasta" -ForegroundColor Yellow
    Write-Host "  3. Execute: .\fix-wsl-simple.ps1" -ForegroundColor Yellow
    Write-Host "`nOu execute este comando:" -ForegroundColor Cyan
    Write-Host "  Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File ""$PSCommandPath""'" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Executando como Administrador`n" -ForegroundColor Green

# 1. Verificar e habilitar recursos do Windows
Write-Host "📋 Verificando recursos do Windows..." -ForegroundColor Cyan

try {
    $wslFeature = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
    if ($wslFeature.State -ne 'Enabled') {
        Write-Host "  Habilitando Subsistema do Windows para Linux..." -ForegroundColor Yellow
        Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart
        Write-Host "  ✅ WSL habilitado" -ForegroundColor Green
    } else {
        Write-Host "  ✅ WSL já está habilitado" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Aviso ao verificar WSL: $_" -ForegroundColor Yellow
}

try {
    $vmFeature = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
    if ($vmFeature.State -ne 'Enabled') {
        Write-Host "  Habilitando Plataforma de Máquina Virtual..." -ForegroundColor Yellow
        Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart
        Write-Host "  ✅ Plataforma VM habilitada" -ForegroundColor Green
    } else {
        Write-Host "  ✅ Plataforma VM já está habilitada" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Aviso ao verificar Plataforma VM: $_" -ForegroundColor Yellow
}

Write-Host ""

# 2. Corrigir serviços
Write-Host "🔧 Corrigindo serviços do Windows..." -ForegroundColor Cyan

$services = @("vmcompute", "LxssManager")

foreach ($serviceName in $services) {
    try {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        
        if ($service) {
            Write-Host "  Verificando serviço: $serviceName" -ForegroundColor White
            
            # Habilitar se estiver desabilitado
            if ($service.StartType -eq 'Disabled') {
                Write-Host "    Habilitando serviço..." -ForegroundColor Yellow
                Set-Service -Name $serviceName -StartupType Manual
                Write-Host "    ✅ Serviço habilitado" -ForegroundColor Green
            }
            
            # Iniciar se não estiver rodando
            if ($service.Status -ne 'Running') {
                Write-Host "    Iniciando serviço..." -ForegroundColor Yellow
                try {
                    Start-Service -Name $serviceName
                    Start-Sleep -Seconds 2
                    Write-Host "    ✅ Serviço iniciado" -ForegroundColor Green
                } catch {
                    Write-Host "    ⚠️ Não foi possível iniciar: $_" -ForegroundColor Yellow
                }
            } else {
                Write-Host "    ✅ Serviço já está rodando" -ForegroundColor Green
            }
        } else {
            Write-Host "  ⚠️ Serviço $serviceName não encontrado (pode ser normal)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️ Erro ao processar $serviceName : $_" -ForegroundColor Yellow
    }
}

Write-Host ""

# 3. Reiniciar WSL
Write-Host "🔄 Reiniciando WSL..." -ForegroundColor Cyan

try {
    wsl --shutdown 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    Write-Host "  ✅ WSL reiniciado" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Erro ao reiniciar WSL: $_" -ForegroundColor Yellow
}

Write-Host ""

# 4. Testar WSL
Write-Host "🧪 Testando WSL..." -ForegroundColor Cyan

Start-Sleep -Seconds 2

try {
    $wslStatus = wsl --status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ WSL está funcionando!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ WSL pode precisar de reinicialização do sistema" -ForegroundColor Yellow
        Write-Host "  Mensagem: $wslStatus" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️ WSL ainda não está respondendo: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Aguarde alguns segundos" -ForegroundColor Yellow
Write-Host "2. Tente iniciar o Docker Desktop" -ForegroundColor Yellow
Write-Host "3. Se não funcionar, execute:" -ForegroundColor Yellow
Write-Host "   - wsl --update" -ForegroundColor White
Write-Host "   - wsl --set-default-version 2" -ForegroundColor White
Write-Host "4. Se ainda houver problemas, reinicie o computador" -ForegroundColor Yellow
Write-Host ""

pause
