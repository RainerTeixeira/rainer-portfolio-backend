# Teste Completo do Fluxo Passwordless
# Email: tafapon482@gyknife.com

$BASE_URL = "http://localhost:4000"
$EMAIL = "tafapon482@gyknife.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Teste Completo - Fluxo Passwordless" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Email: $EMAIL" -ForegroundColor Yellow
Write-Host ""

# Passo 1: Iniciar autenticação
Write-Host "Passo 1: Solicitando código de verificação..." -ForegroundColor Yellow
Write-Host ""

try {
    $body = @{
        email = $EMAIL
    } | ConvertTo-Json

    $initResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/passwordless/init" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    if ($initResponse.success -and $initResponse.data.success) {
        Write-Host "✅ Código solicitado com sucesso!" -ForegroundColor Green
        Write-Host "   Mensagem: $($initResponse.data.message)" -ForegroundColor Gray
        Write-Host ""
        
        # Aguardar entrada do código
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Passo 2: Verificação de Código" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📧 Verifique o email: $EMAIL" -ForegroundColor Yellow
        Write-Host "   Procure pelo código de verificação enviado pelo Cognito" -ForegroundColor Gray
        Write-Host ""
        
        $code = Read-Host "Digite o código de verificação recebido"
        
        if ([string]::IsNullOrWhiteSpace($code)) {
            Write-Host "❌ Código não fornecido. Teste cancelado." -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "Verificando código: $code" -ForegroundColor Yellow
        Write-Host ""
        
        # Passo 2: Verificar código
        $verifyBody = @{
            email = $EMAIL
            code = $code
        } | ConvertTo-Json

        $verifyResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/passwordless/verify" `
            -Method Post `
            -ContentType "application/json" `
            -Body $verifyBody `
            -ErrorAction Stop

        if ($verifyResponse.success -and $verifyResponse.data.tokens) {
            Write-Host "✅ Autenticação bem-sucedida!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Tokens recebidos:" -ForegroundColor Cyan
            Write-Host "   - Access Token: $($verifyResponse.data.tokens.accessToken.Substring(0, 50))..." -ForegroundColor Gray
            Write-Host "   - Refresh Token: $($verifyResponse.data.tokens.refreshToken.Substring(0, 50))..." -ForegroundColor Gray
            Write-Host "   - Expires In: $($verifyResponse.data.tokens.expiresIn) segundos" -ForegroundColor Gray
            Write-Host ""
            
            if ($verifyResponse.data.user) {
                Write-Host "Dados do usuário:" -ForegroundColor Cyan
                Write-Host "   - ID: $($verifyResponse.data.user.id)" -ForegroundColor Gray
                Write-Host "   - Nome: $($verifyResponse.data.user.fullName)" -ForegroundColor Gray
                Write-Host "   - Email: $($verifyResponse.data.user.email)" -ForegroundColor Gray
                Write-Host "   - Role: $($verifyResponse.data.user.role)" -ForegroundColor Gray
            }
            
            Write-Host ""
            Write-Host "✅ Fluxo completo testado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Resposta inesperada do servidor" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Erro ao solicitar código" -ForegroundColor Red
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    
    Write-Host "❌ Erro:" -ForegroundColor Red
    Write-Host "   Status Code: $statusCode" -ForegroundColor Gray
    Write-Host "   Mensagem: $($errorBody.message)" -ForegroundColor Red
    
    if ($statusCode -eq 400 -and $errorBody.message -like "*código*") {
        Write-Host ""
        Write-Host "💡 O código pode estar incorreto ou expirado." -ForegroundColor Yellow
        Write-Host "   Solicite um novo código e tente novamente." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

