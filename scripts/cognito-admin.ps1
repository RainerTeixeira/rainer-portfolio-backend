# Script AWS CLI para gerenciar configurações do Cognito (PowerShell)
# Uso: .\scripts\cognito-admin.ps1 [comando]
# Comandos: check|verify|update|identity-providers|lambda-triggers|test

param(
    [Parameter(Position=0)]
    [string]$Command = "verify"
)

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Carregar variáveis do .env se existir
if (Test-Path .env) {
    Write-ColorOutput Cyan "📄 Carregando variáveis do .env..."
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Configurações (podem ser sobrescritas por variáveis de ambiente)
$USER_POOL_ID = if ($env:COGNITO_USER_POOL_ID) { $env:COGNITO_USER_POOL_ID } else { "us-east-1_wryiyhbWC" }
$CLIENT_ID = if ($env:COGNITO_CLIENT_ID) { $env:COGNITO_CLIENT_ID } else { "3ueos5ofu499je6ebc5u98n35h" }
$REGION = if ($env:COGNITO_REGION) { $env:COGNITO_REGION } else { "us-east-1" }
$CALLBACK_URL = "http://localhost:3000/dashboard/login/callback"
$SIGNOUT_URLS = @("http://localhost:3000/dashboard/login", "http://localhost:3000")

# Função para imprimir cabeçalho
function Print-Header {
    param([string]$Title)
    Write-Output ""
    Write-ColorOutput Cyan "════════════════════════════════════════════════════════════"
    Write-ColorOutput Cyan "  $Title"
    Write-ColorOutput Cyan "════════════════════════════════════════════════════════════"
    Write-Output ""
}

# Função para verificar se AWS CLI está configurado
function Check-AwsCli {
    $awsCmd = Get-Command aws -ErrorAction SilentlyContinue
    if (-not $awsCmd) {
        Write-ColorOutput Red "❌ AWS CLI não está instalado!"
        Write-Output "Instale em: https://aws.amazon.com/cli/"
        exit 1
    }
    
    try {
        $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
        if ($identity.Account) {
            Write-ColorOutput Green "✅ AWS CLI configurado corretamente"
            Write-Output "   Account: $($identity.Account)"
            Write-Output "   User: $($identity.Arn)"
            return $identity
        }
    } catch {
        Write-ColorOutput Red "❌ AWS CLI não está configurado ou credenciais inválidas!"
        Write-Output "Execute: aws configure"
        exit 1
    }
}

# Verificar configuração do User Pool
function Check-UserPool {
    Print-Header "📋 Verificando User Pool"
    
    Write-Output "User Pool ID: $USER_POOL_ID"
    Write-Output "Region: $REGION"
    Write-Output ""
    
    aws cognito-idp describe-user-pool `
        --user-pool-id $USER_POOL_ID `
        --region $REGION `
        --query 'UserPool.[Id,Name,MfaConfiguration,EmailVerificationMessage,EmailVerificationSubject,AutoVerifiedAttributes]' `
        --output table
    
    Write-Output ""
}

# Verificar configuração do App Client
function Check-AppClient {
    Print-Header "📱 Verificando App Client"
    
    Write-Output "Client ID: $CLIENT_ID"
    Write-Output ""
    
    Write-ColorOutput Yellow "📋 Configurações básicas:"
    aws cognito-idp describe-user-pool-client `
        --user-pool-id $USER_POOL_ID `
        --client-id $CLIENT_ID `
        --region $REGION `
        --query 'UserPoolClient.[ClientId,ClientName,GenerateSecret,ExplicitAuthFlows,SupportedIdentityProviders]' `
        --output table
    
    Write-Output ""
    Write-ColorOutput Yellow "🔗 Callback URLs:"
    aws cognito-idp describe-user-pool-client `
        --user-pool-id $USER_POOL_ID `
        --client-id $CLIENT_ID `
        --region $REGION `
        --query 'UserPoolClient.CallbackURLs' `
        --output table
    
    Write-Output ""
    Write-ColorOutput Yellow "🚪 Logout URLs:"
    aws cognito-idp describe-user-pool-client `
        --user-pool-id $USER_POOL_ID `
        --client-id $CLIENT_ID `
        --region $REGION `
        --query 'UserPoolClient.LogoutURLs' `
        --output table
    
    Write-Output ""
    Write-ColorOutput Yellow "🔑 OAuth Scopes:"
    aws cognito-idp describe-user-pool-client `
        --user-pool-id $USER_POOL_ID `
        --client-id $CLIENT_ID `
        --region $REGION `
        --query 'UserPoolClient.AllowedOAuthScopes' `
        --output table
    
    Write-Output ""
    Write-ColorOutput Yellow "🌊 OAuth Flows:"
    aws cognito-idp describe-user-pool-client `
        --user-pool-id $USER_POOL_ID `
        --client-id $CLIENT_ID `
        --region $REGION `
        --query 'UserPoolClient.AllowedOAuthFlows' `
        --output table
}

# Verificar Identity Providers
function Check-IdentityProviders {
    Print-Header "🔐 Verificando Identity Providers"
    
    Write-ColorOutput Yellow "📋 Identity Providers configurados:"
    aws cognito-idp list-identity-providers `
        --user-pool-id $USER_POOL_ID `
        --region $REGION `
        --query 'Providers[*].[ProviderName,ProviderType]' `
        --output table
    
    Write-Output ""
    
    # Verificar Google
    Write-ColorOutput Yellow "🔍 Detalhes do Google:"
    try {
        $google = aws cognito-idp describe-identity-provider `
            --user-pool-id $USER_POOL_ID `
            --provider-name "Google" `
            --region $REGION `
            --output json 2>&1 | ConvertFrom-Json
        
        if ($google.IdentityProvider) {
            Write-ColorOutput Green "✅ Google está configurado"
            Write-Output "   Attribute Mapping: $($google.IdentityProvider.AttributeMapping | ConvertTo-Json -Compress)"
        }
    } catch {
        Write-ColorOutput Red "❌ Google não está configurado"
    }
    Write-Output ""
    
    # Verificar GitHub
    Write-ColorOutput Yellow "🔍 Detalhes do GitHub:"
    try {
        $github = aws cognito-idp describe-identity-provider `
            --user-pool-id $USER_POOL_ID `
            --provider-name "GitHub" `
            --region $REGION `
            --output json 2>&1 | ConvertFrom-Json
        
        if ($github.IdentityProvider) {
            Write-ColorOutput Green "✅ GitHub está configurado"
            Write-Output "   Attribute Mapping: $($github.IdentityProvider.AttributeMapping | ConvertTo-Json -Compress)"
        }
    } catch {
        Write-ColorOutput Red "❌ GitHub não está configurado"
    }
    Write-Output ""
}

# Verificar Lambda Triggers
function Check-LambdaTriggers {
    Print-Header "⚡ Verificando Lambda Triggers"
    
    $lambdaConfig = aws cognito-idp describe-user-pool `
        --user-pool-id $USER_POOL_ID `
        --region $REGION `
        --query 'UserPool.LambdaConfig' `
        --output json | ConvertFrom-Json
    
    Write-Output ($lambdaConfig | ConvertTo-Json -Depth 10)
    Write-Output ""
    
    $preSignup = $lambdaConfig.PreSignUp
    if ($preSignup -and $preSignup -ne "None" -and $preSignup -ne "null") {
        Write-ColorOutput Green "✅ Pre-Sign-Up Trigger configurado: $preSignup"
        
        # Extrair nome da função e região
        if ($preSignup -match 'arn:aws:lambda:([^:]+):\d+:function:([^:]+)') {
            $functionRegion = $matches[1]
            $functionName = $matches[2]
            
            Write-Output "   Function Name: $functionName"
            Write-Output "   Region: $functionRegion"
            
            try {
                $function = aws lambda get-function `
                    --function-name $functionName `
                    --region $functionRegion `
                    --query 'Configuration.[FunctionName,Runtime,LastModified]' `
                    --output table 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Output $function
                    Write-ColorOutput Green "   ✅ Função Lambda existe e está ativa"
                } else {
                    Write-ColorOutput Red "   ❌ Função Lambda não encontrada ou sem permissão"
                }
            } catch {
                Write-ColorOutput Red "   ❌ Erro ao verificar função Lambda"
            }
        }
    } else {
        Write-ColorOutput Red "❌ Pre-Sign-Up Trigger não está configurado"
        Write-Output ""
        Write-ColorOutput Yellow "💡 Para configurar:"
        Write-Output "   1. Crie ou encontre sua função Lambda Pre-Sign-Up"
        Write-Output "   2. Execute: aws cognito-idp update-user-pool \"
        Write-Output "      --user-pool-id $USER_POOL_ID \"
        Write-Output "      --lambda-config PreSignUp=<ARN_DA_FUNCAO>"
    }
}

# Verificar tudo
function Verify-All {
    Print-Header "🔍 Verificação Completa"
    
    Check-AwsCli | Out-Null
    Check-UserPool
    Check-AppClient
    Check-IdentityProviders
    Check-LambdaTriggers
    
    Write-Output ""
    Print-Header "✅ Verificação Completa"
    Write-ColorOutput Green "Todas as verificações foram concluídas!"
    
    Write-Output ""
    Write-ColorOutput Yellow "📊 Resumo:"
    Write-Output "   User Pool: $USER_POOL_ID"
    Write-Output "   Client ID: $CLIENT_ID"
    Write-Output "   Region: $REGION"
    Write-Output "   Callback URL: $CALLBACK_URL"
}

# Testar URL do Cognito
function Test-CognitoUrl {
    Print-Header "🧪 Testando URLs do Cognito"
    
    $cognitoDomain = $USER_POOL_ID -replace "_", "" + ".auth.$REGION.amazoncognito.com"
    
    Write-Output "Cognito Domain: $cognitoDomain"
    Write-Output ""
    
    $encodedCallback = [System.Web.HttpUtility]::UrlEncode($CALLBACK_URL)
    
    $testUrlGoogle = "https://$cognitoDomain/oauth2/authorize?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=$encodedCallback&identity_provider=Google"
    $testUrlGitHub = "https://$cognitoDomain/oauth2/authorize?client_id=$CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=$encodedCallback&identity_provider=GitHub"
    
    Write-ColorOutput Yellow "🔗 URL de teste para Google:"
    Write-Output $testUrlGoogle
    Write-Output ""
    
    Write-ColorOutput Yellow "🔗 URL de teste para GitHub:"
    Write-Output $testUrlGitHub
    Write-Output ""
    
    Write-ColorOutput Yellow "📡 Testando conectividade..."
    try {
        $response = Invoke-WebRequest -Uri "https://$cognitoDomain/.well-known/openid-configuration" -Method Get -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput Green "✅ Cognito está acessível (HTTP $($response.StatusCode))"
            
            Write-Output ""
            Write-ColorOutput Yellow "📋 OpenID Configuration:"
            $config = $response.Content | ConvertFrom-Json
            Write-Output "   Issuer: $($config.issuer)"
            Write-Output "   Authorization Endpoint: $($config.authorization_endpoint)"
            Write-Output "   Token Endpoint: $($config.token_endpoint)"
        }
    } catch {
        Write-ColorOutput Red "❌ Não foi possível conectar ao Cognito"
        Write-Output "   Erro: $($_.Exception.Message)"
    }
}

# Main
switch ($Command.ToLower()) {
    "check" {
        Check-AwsCli | Out-Null
        Check-AppClient
    }
    "verify" {
        Verify-All
    }
    "update" {
        Write-ColorOutput Red "⚠️  Comando 'update' ainda não implementado no PowerShell"
        Write-Output "Use o script bash: bash scripts/cognito-admin.sh update"
    }
    "identity-providers" {
        Check-AwsCli | Out-Null
        Check-IdentityProviders
    }
    "lambda-triggers" {
        Check-AwsCli | Out-Null
        Check-LambdaTriggers
    }
    "test" {
        Check-AwsCli | Out-Null
        Test-CognitoUrl
    }
    "help" {
        Print-Header "Cognito Admin - Script de Gerenciamento AWS CLI"
        Write-Output "Uso: .\scripts\cognito-admin.ps1 [comando]"
        Write-Output ""
        Write-Output "Comandos disponíveis:"
        Write-Output "  check              - Verificar configuração do App Client"
        Write-Output "  verify             - Verificação completa (recomendado)"
        Write-Output "  identity-providers - Verificar Identity Providers (Google/GitHub)"
        Write-Output "  lambda-triggers    - Verificar Lambda Triggers"
        Write-Output "  test               - Testar URLs do Cognito"
        Write-Output "  help               - Mostrar esta ajuda"
    }
    default {
        Write-ColorOutput Red "❌ Comando inválido: $Command"
        Write-Output ""
        Print-Header "Cognito Admin - Script de Gerenciamento AWS CLI"
        Write-Output "Execute: .\scripts\cognito-admin.ps1 help"
    }
}


