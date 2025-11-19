# ═══════════════════════════════════════════════════════════════════════════
# Script: Corrigir Problemas do WSL para Docker
# Descrição: Diagnostica e corrige problemas comuns do WSL que impedem o Docker de iniciar
# Erro: 0x80070422 - Serviço WSL desabilitado ou sem dispositivos habilitados
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$false)]
    [switch]$Fix = $false,
    [Parameter(Mandatory=$false)]
    [switch]$Restart = $false
)

$ErrorActionPreference = "Continue"

# Verificar se está executando como Administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Cores para output
function Write-Header {
    param([string]$Text)
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

# Verificar status do WSL
function Test-WSLStatus {
    Write-Header "DIAGNÓSTICO DO WSL"
    
    Write-Info "Verificando status do WSL..."
    
    try {
        $wslStatus = wsl --status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "WSL está instalado"
            Write-Host "`nStatus do WSL:" -ForegroundColor White
            Write-Host $wslStatus -ForegroundColor Gray
        } else {
            Write-Error-Custom "WSL não está respondendo corretamente"
            Write-Host $wslStatus -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Error-Custom "Erro ao verificar WSL: $_"
        return $false
    }
    
    Write-Host ""
    return $true
}

# Verificar serviços do Windows relacionados ao WSL
function Test-WSLServices {
    Write-Header "VERIFICANDO SERVIÇOS DO WSL"
    
    $services = @(
        @{Name="LxssManager"; DisplayName="Serviço de Gerenciamento de Subsistema do Windows para Linux"},
        @{Name="vmcompute"; DisplayName="Serviço de Computação de Máquina Virtual do Hyper-V"}
    )
    
    $allOk = $true
    
    foreach ($service in $services) {
        Write-Info "Verificando serviço: $($service.DisplayName) ($($service.Name))"
        
        try {
            $svc = Get-Service -Name $service.Name -ErrorAction SilentlyContinue
            
            if ($svc) {
                Write-Host "  Status: $($svc.Status)" -ForegroundColor $(if ($svc.Status -eq 'Running') { 'Green' } else { 'Yellow' })
                Write-Host "  Tipo de Inicialização: $($svc.StartType)" -ForegroundColor $(if ($svc.StartType -eq 'Automatic' -or $svc.StartType -eq 'Manual') { 'Green' } else { 'Yellow' })
                
                if ($svc.Status -ne 'Running') {
                    Write-Warning "  ⚠️  Serviço não está rodando!"
                    $allOk = $false
                }
                
                if ($svc.StartType -eq 'Disabled') {
                    Write-Warning "  ⚠️  Serviço está DESABILITADO!"
                    $allOk = $false
                }
            } else {
                Write-Error-Custom "  ❌ Serviço não encontrado!"
                $allOk = $false
            }
        } catch {
            Write-Error-Custom "  ❌ Erro ao verificar serviço: $_"
            $allOk = $false
        }
        
        Write-Host ""
    }
    
    return $allOk
}

# Verificar recursos do Windows necessários
function Test-WindowsFeatures {
    Write-Header "VERIFICANDO RECURSOS DO WINDOWS"
    
    $features = @(
        @{Name="Microsoft-Windows-Subsystem-Linux"; DisplayName="Subsistema do Windows para Linux"},
        @{Name="VirtualMachinePlatform"; DisplayName="Plataforma de Máquina Virtual"},
        @{Name="Microsoft-Hyper-V-All"; DisplayName="Hyper-V (opcional, mas recomendado)"}
    )
    
    $allOk = $true
    
    foreach ($feature in $features) {
        Write-Info "Verificando: $($feature.DisplayName)"
        
        try {
            $status = Get-WindowsOptionalFeature -Online -FeatureName $feature.Name -ErrorAction SilentlyContinue
            
            if ($status) {
                $enabled = $status.State -eq 'Enabled'
                Write-Host "  Status: $($status.State)" -ForegroundColor $(if ($enabled) { 'Green' } else { 'Yellow' })
                
                if (-not $enabled) {
                    Write-Warning "  ⚠️  Recurso não está habilitado!"
                    $allOk = $false
                }
            } else {
                Write-Warning "  ⚠️  Não foi possível verificar o status"
            }
        } catch {
            Write-Warning "  ⚠️  Erro ao verificar (pode ser normal se não estiver instalado): $_"
        }
        
        Write-Host ""
    }
    
    return $allOk
}

# Corrigir serviços do WSL
function Fix-WSLServices {
    Write-Header "CORRIGINDO SERVIÇOS DO WSL"
    
    if (-not (Test-Administrator)) {
        Write-Error-Custom "Este script precisa ser executado como Administrador para corrigir os serviços!"
        Write-Info "Clique com botão direito no PowerShell e selecione 'Executar como Administrador'"
        return $false
    }
    
    $services = @("LxssManager", "vmcompute")
    $allFixed = $true
    
    foreach ($serviceName in $services) {
        Write-Info "Corrigindo serviço: $serviceName"
        
        try {
            $svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
            
            if ($svc) {
                # Habilitar serviço se estiver desabilitado
                if ($svc.StartType -eq 'Disabled') {
                    Write-Warning "  Habilitando serviço..."
                    Set-Service -Name $serviceName -StartupType Automatic
                    Write-Success "  Serviço habilitado"
                }
                
                # Iniciar serviço se não estiver rodando
                if ($svc.Status -ne 'Running') {
                    Write-Warning "  Iniciando serviço..."
                    Start-Service -Name $serviceName
                    Start-Sleep -Seconds 2
                    
                    $svc.Refresh()
                    if ($svc.Status -eq 'Running') {
                        Write-Success "  Serviço iniciado com sucesso"
                    } else {
                        Write-Error-Custom "  Falha ao iniciar serviço"
                        $allFixed = $false
                    }
                } else {
                    Write-Success "  Serviço já está rodando"
                }
            } else {
                Write-Error-Custom "  Serviço não encontrado!"
                $allFixed = $false
            }
        } catch {
            Write-Error-Custom "  Erro ao corrigir serviço: $_"
            $allFixed = $false
        }
        
        Write-Host ""
    }
    
    return $allFixed
}

# Reiniciar WSL
function Restart-WSL {
    Write-Header "REINICIANDO WSL"
    
    Write-Info "Encerrando distribuições WSL..."
    
    try {
        # Encerrar todas as distribuições
        wsl --shutdown 2>&1 | Out-Null
        Start-Sleep -Seconds 3
        
        Write-Success "WSL foi encerrado"
        
        Write-Info "Aguardando 5 segundos antes de reiniciar..."
        Start-Sleep -Seconds 5
        
        # Verificar se WSL está funcionando
        $wslStatus = wsl --status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "WSL está funcionando corretamente"
            return $true
        } else {
            Write-Warning "WSL ainda pode estar inicializando..."
            return $true
        }
    } catch {
        Write-Error-Custom "Erro ao reiniciar WSL: $_"
        return $false
    }
}

# Testar Docker
function Test-DockerConnection {
    Write-Header "TESTANDO CONEXÃO COM DOCKER"
    
    Write-Info "Verificando se Docker está respondendo..."
    
    try {
        docker ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker está funcionando corretamente!"
            return $true
        } else {
            Write-Warning "Docker pode não estar totalmente inicializado ainda"
            Write-Info "Tente iniciar o Docker Desktop manualmente"
            return $false
        }
    } catch {
        Write-Error-Custom "Docker não está respondendo: $_"
        Write-Info "Inicie o Docker Desktop e tente novamente"
        return $false
    }
}

# Função principal
function Main {
    Clear-Host
    Write-Header "CORREÇÃO DE PROBLEMAS DO WSL PARA DOCKER"
    
    Write-Info "Este script irá diagnosticar e corrigir problemas comuns do WSL"
    Write-Info "que impedem o Docker Desktop de iniciar corretamente."
    Write-Host ""
    
    # Diagnóstico
    $wslOk = Test-WSLStatus
    $servicesOk = Test-WSLServices
    $featuresOk = Test-WindowsFeatures
    
    Write-Host ""
    Write-Header "RESUMO DO DIAGNÓSTICO"
    
    if ($wslOk -and $servicesOk -and $featuresOk) {
        Write-Success "Todos os componentes do WSL parecem estar funcionando corretamente"
        Write-Info "O problema pode estar no Docker Desktop. Tente reiniciá-lo."
    } else {
        Write-Warning "Foram encontrados problemas que precisam ser corrigidos"
        
        if (-not $servicesOk) {
            Write-Error-Custom "Problemas encontrados nos serviços do Windows"
        }
        if (-not $featuresOk) {
            Write-Error-Custom "Recursos do Windows podem precisar ser habilitados"
        }
    }
    
    # Correção automática
    if ($Fix -or -not ($wslOk -and $servicesOk)) {
        Write-Host ""
        Write-Header "INICIANDO CORREÇÃO AUTOMÁTICA"
        
        if (-not (Test-Administrator)) {
            Write-Error-Custom "Para corrigir automaticamente, execute este script como Administrador"
            Write-Info "Comando:"
            Write-Host "  Clique com botao direito no PowerShell e selecione Executar como Administrador" -ForegroundColor Yellow
            Write-Host "  Depois execute: .\corrigir-wsl.ps1 -Fix" -ForegroundColor Yellow
            Write-Host ""
            return
        }
        
        $fixed = Fix-WSLServices
        
        if ($fixed) {
            Write-Success "Serviços corrigidos com sucesso!"
            
            if ($Restart) {
                Restart-WSL
            }
            
            Write-Host ""
            Write-Info "Aguarde alguns segundos e tente iniciar o Docker Desktop novamente"
        } else {
            Write-Error-Custom "Alguns serviços não puderam ser corrigidos automaticamente"
            Write-Info "Você pode precisar habilitar manualmente os recursos do Windows"
        }
    }
    
    # Teste final
    Write-Host ""
    if ($Restart -or $Fix) {
        Start-Sleep -Seconds 3
        Test-DockerConnection
    }
    
    Write-Host ""
    Write-Header "INSTRUÇÕES ADICIONAIS"
    Write-Info "Se o problema persistir, tente:"
    Write-Host "  1. Reinicie o computador" -ForegroundColor Yellow
    Write-Host "  2. Verifique se o Docker Desktop está atualizado" -ForegroundColor Yellow
    Write-Host "  3. Execute: wsl --update" -ForegroundColor Yellow
    Write-Host "  4. Execute: wsl --set-default-version 2" -ForegroundColor Yellow
    Write-Host "  5. Verifique se há atualizações do Windows pendentes" -ForegroundColor Yellow
    Write-Host ""
}

# Executar
Main

