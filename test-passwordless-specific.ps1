# Teste de Autenticacao Passwordless - Email Especifico
# Email: tafapon482@gyknife.com

$BASE_URL = "http://localhost:4000"
$EMAIL = "tafapon482@gyknife.com"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Teste Passwordless - Email Especifico" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Email: $EMAIL" -ForegroundColor Yellow
Write-Host ""

# Teste 1: Iniciar autenticacao
Write-Host "1. Iniciando autenticacao passwordless..." -ForegroundColor Yellow
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

    Write-Host "Resposta do servidor:" -ForegroundColor Green
    $initResponse | ConvertTo-Json -Depth 5
    Write-Host ""

    if ($initResponse.success -and $initResponse.data.success) {
        Write-Host "SUCCESS: Codigo de verificacao solicitado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Proximos passos:" -ForegroundColor Cyan
        Write-Host "   1. Verifique o email: $EMAIL" -ForegroundColor Gray
        Write-Host "   2. Procure pelo codigo de verificacao enviado pelo Cognito" -ForegroundColor Gray
        Write-Host "   3. Execute o teste de verificacao com o codigo recebido" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Para testar a verificacao:" -ForegroundColor Yellow
        Write-Host "   Execute: .\test-passwordless-complete-flow.ps1" -ForegroundColor Cyan
        Write-Host "   (O script ira pedir o codigo interativamente)" -ForegroundColor Gray
    } else {
        Write-Host "ERRO: Erro ao solicitar codigo" -ForegroundColor Red
        Write-Host "   Verifique se o email esta cadastrado no Cognito" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERRO: Erro ao chamar endpoint:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Mensagem: $($errorBody.message)" -ForegroundColor Red
        } catch {
            Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
