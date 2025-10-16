# ═══════════════════════════════════════════════════════════════════════════
# AWS SAM - Quick Start Script (PowerShell)
# ═══════════════════════════════════════════════════════════════════════════
# 
# Este script automatiza o primeiro deploy do projeto usando AWS SAM
# 
# Uso: .\quick-start.ps1 [-Environment dev|staging|prod]
#

param(
    [Parameter()]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Step {
    param([string]$Message)
    Write-Host "▶ $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════"
Write-Host "  🚀 AWS SAM - Quick Start"
Write-Host "═══════════════════════════════════════════════════════════════════════════"
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# VALIDAÇÕES
# ═══════════════════════════════════════════════════════════════════════════

Write-Step "Verificando pré-requisitos..."

# Verificar AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "AWS CLI não encontrado"
    Write-Host "Instale com: choco install awscli"
    exit 1
}
Write-Success "AWS CLI instalado"

# Verificar SAM CLI
if (!(Get-Command sam -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "SAM CLI não encontrado"
    Write-Host "Instale com: choco install aws-sam-cli"
    exit 1
}
Write-Success "SAM CLI instalado"

# Verificar credenciais AWS
try {
    aws sts get-caller-identity | Out-Null
    Write-Success "Credenciais AWS configuradas"
} catch {
    Write-Error-Custom "Credenciais AWS não configuradas"
    Write-Host "Execute: aws configure"
    exit 1
}

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "Node.js não encontrado"
    exit 1
}
$nodeVersion = node --version
Write-Success "Node.js $nodeVersion"

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

$StackName = "blog-backend-api-$Environment"

Write-Step "Ambiente: $Environment"
Write-Step "Stack: $StackName"
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════════

Write-Step "1. Building aplicação..."
Set-Location ..\..\  # Volta para raiz do projeto
npm run build
Write-Success "Build concluído"
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# VALIDAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

Write-Step "2. Validando template SAM..."
Set-Location src\lambda
sam validate
Write-Success "Template válido"
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# DEPLOY
# ═══════════════════════════════════════════════════════════════════════════

Write-Step "3. Iniciando deploy..."
Write-Host ""

if (!(Test-Path samconfig.toml)) {
    Write-Warning-Custom "Primeira vez? Usando deploy guiado..."
    sam deploy --guided `
        --stack-name $StackName `
        --parameter-overrides "Environment=$Environment" `
        --capabilities CAPABILITY_IAM `
        --resolve-s3
} else {
    Write-Step "Usando configuração existente..."
    sam deploy --parameter-overrides "Environment=$Environment"
}

Write-Host ""
Write-Success "Deploy concluído!"
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════

Write-Step "4. Obtendo informações da stack..."
Write-Host ""

try {
    $FunctionUrl = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --query 'Stacks[0].Outputs[?OutputKey==`BlogApiFunctionUrl`].OutputValue' `
        --output text

    if ($FunctionUrl) {
        Write-Host "═══════════════════════════════════════════════════════════════════════════"
        Write-Host "  ✅ Deploy bem-sucedido!"
        Write-Host "═══════════════════════════════════════════════════════════════════════════"
        Write-Host ""
        Write-Host "🌐 Function URL: $FunctionUrl"
        Write-Host ""
        Write-Host "📝 Próximos passos:"
        Write-Host "   1. Testar API:"
        Write-Host "      curl ${FunctionUrl}api/health"
        Write-Host ""
        Write-Host "   2. Ver logs:"
        Write-Host "      npm run sam:logs"
        Write-Host ""
        Write-Host "   3. Acessar AWS Console:"
        Write-Host "      https://console.aws.amazon.com/cloudformation/"
        Write-Host ""
    }
} catch {
    Write-Warning-Custom "Não foi possível obter a Function URL"
    Write-Host "Verifique no console: https://console.aws.amazon.com/cloudformation/"
}

Write-Host "═══════════════════════════════════════════════════════════════════════════"

