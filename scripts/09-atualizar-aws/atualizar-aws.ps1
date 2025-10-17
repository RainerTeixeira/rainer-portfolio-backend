# ═══════════════════════════════════════════════════════════════════════════
# Script para Atualizar Credenciais AWS no .env
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     Atualizar Credenciais AWS no .env                     ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Solicitar Access Key ID
Write-Host "Digite o AWS Access Key ID (AKIA...):" -ForegroundColor Yellow
$accessKeyId = Read-Host

# Solicitar Secret Access Key
Write-Host "`nDigite o AWS Secret Access Key:" -ForegroundColor Yellow
$secretAccessKey = Read-Host -AsSecureString
$secretAccessKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretAccessKey)
)

# Confirmar
Write-Host "`n⚠️  Confirme os dados:" -ForegroundColor Yellow
Write-Host "Access Key ID: $accessKeyId" -ForegroundColor Cyan
Write-Host "Secret Access Key: $($secretAccessKeyPlain.Substring(0, [Math]::Min(10, $secretAccessKeyPlain.Length)))..." -ForegroundColor Cyan

Write-Host "`nAtualizar o .env com esses valores? (S/N):" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -eq 'S' -or $confirm -eq 's') {
    # Ler arquivo .env
    $envPath = Join-Path $PSScriptRoot ".." ".env"
    
    if (!(Test-Path $envPath)) {
        Write-Host "`n❌ Arquivo .env não encontrado!" -ForegroundColor Red
        Write-Host "Copiando de env.example..." -ForegroundColor Yellow
        Copy-Item (Join-Path $PSScriptRoot ".." "env.example") $envPath
    }
    
    # Atualizar valores
    $content = Get-Content $envPath -Raw
    $content = $content -replace 'AWS_ACCESS_KEY_ID=.*', "AWS_ACCESS_KEY_ID=$accessKeyId"
    $content = $content -replace 'AWS_SECRET_ACCESS_KEY=.*', "AWS_SECRET_ACCESS_KEY=$secretAccessKeyPlain"
    
    Set-Content $envPath -Value $content -NoNewline
    
    Write-Host "`n✅ Credenciais AWS atualizadas com sucesso!" -ForegroundColor Green
    Write-Host "`n📋 Resumo:" -ForegroundColor Cyan
    Write-Host "  AWS_ACCESS_KEY_ID: $accessKeyId" -ForegroundColor White
    Write-Host "  AWS_SECRET_ACCESS_KEY: ********" -ForegroundColor White
} else {
    Write-Host "`n❌ Operação cancelada" -ForegroundColor Red
}

Write-Host "`n" -ForegroundColor White

