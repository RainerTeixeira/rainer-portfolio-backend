# Teste de Verificação de Código Passwordless

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Code
)

$BASE_URL = "http://localhost:4000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificação de Código Passwordless" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Yellow
Write-Host "Código: $Code" -ForegroundColor Yellow
Write-Host ""

try {
    $body = @{
        email = $Email
        code = $Code
    } | ConvertTo-Json

    Write-Host "Verificando código..." -ForegroundColor Yellow
    Write-Host ""

    $verifyResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/passwordless/verify" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Autenticação bem-sucedida!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta completa:" -ForegroundColor Cyan
    $verifyResponse | ConvertTo-Json -Depth 10
    Write-Host ""
    
    if ($verifyResponse.success -and $verifyResponse.data.tokens) {
        Write-Host "✅ Tokens recebidos:" -ForegroundColor Green
        Write-Host "   - Access Token: $($verifyResponse.data.tokens.accessToken.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host "   - Refresh Token: $($verifyResponse.data.tokens.refreshToken.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host "   - ID Token: $($verifyResponse.data.tokens.idToken.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host "   - Expires In: $($verifyResponse.data.tokens.expiresIn) segundos" -ForegroundColor Gray
        Write-Host ""
        
        if ($verifyResponse.data.user) {
            Write-Host "✅ Dados do usuário:" -ForegroundColor Green
            Write-Host "   - ID: $($verifyResponse.data.user.id)" -ForegroundColor Gray
            Write-Host "   - Cognito Sub: $($verifyResponse.data.user.cognitoSub)" -ForegroundColor Gray
            Write-Host "   - Nome: $($verifyResponse.data.user.fullName)" -ForegroundColor Gray
            Write-Host "   - Email: $($verifyResponse.data.user.email)" -ForegroundColor Gray
            Write-Host "   - Role: $($verifyResponse.data.user.role)" -ForegroundColor Gray
        }
    }

} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    
    Write-Host "❌ Erro ao verificar código" -ForegroundColor Red
    Write-Host "   Status Code: $statusCode" -ForegroundColor Gray
    Write-Host "   Mensagem: $($errorBody.message)" -ForegroundColor Red
    Write-Host ""
    
    if ($statusCode -eq 400) {
        Write-Host "💡 Possíveis causas:" -ForegroundColor Yellow
        Write-Host "   - Código incorreto" -ForegroundColor Gray
        Write-Host "   - Código expirado (geralmente expira em alguns minutos)" -ForegroundColor Gray
        Write-Host "   - Código já foi usado" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Solução: Solicite um novo código com:" -ForegroundColor Cyan
        Write-Host "   .\test-passwordless-specific.ps1" -ForegroundColor Gray
    } elseif ($statusCode -eq 401) {
        Write-Host "💡 Usuário não encontrado" -ForegroundColor Yellow
        Write-Host "   Verifique se o email está cadastrado no Cognito" -ForegroundColor Gray
    } else {
        Write-Host "💡 Erro inesperado. Verifique os logs do servidor." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

