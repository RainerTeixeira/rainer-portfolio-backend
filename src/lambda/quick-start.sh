#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# AWS SAM - Quick Start Script
# ═══════════════════════════════════════════════════════════════════════════
# 
# Este script automatiza o primeiro deploy do projeto usando AWS SAM
# 
# Uso: ./quick-start.sh [dev|staging|prod]
#

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar com cor
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ═══════════════════════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  🚀 AWS SAM - Quick Start"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# VALIDAÇÕES
# ═══════════════════════════════════════════════════════════════════════════

print_step "Verificando pré-requisitos..."

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI não encontrado"
    echo "Instale com: choco install awscli"
    exit 1
fi
print_success "AWS CLI instalado"

# Verificar SAM CLI
if ! command -v sam &> /dev/null; then
    print_error "SAM CLI não encontrado"
    echo "Instale com: choco install aws-sam-cli"
    exit 1
fi
print_success "SAM CLI instalado"

# Verificar credenciais AWS
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "Credenciais AWS não configuradas"
    echo "Execute: aws configure"
    exit 1
fi
print_success "Credenciais AWS configuradas"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado"
    exit 1
fi
print_success "Node.js $(node --version)"

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

ENVIRONMENT=${1:-dev}
STACK_NAME="blog-backend-api-${ENVIRONMENT}"

print_step "Ambiente: ${ENVIRONMENT}"
print_step "Stack: ${STACK_NAME}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════════

print_step "1. Building aplicação..."
cd ../.. # Volta para raiz do projeto
npm run build
print_success "Build concluído"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# VALIDAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

print_step "2. Validando template SAM..."
cd src/lambda
sam validate
print_success "Template válido"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# DEPLOY
# ═══════════════════════════════════════════════════════════════════════════

print_step "3. Iniciando deploy..."
echo ""

if [ ! -f samconfig.toml ]; then
    print_warning "Primeira vez? Usando deploy guiado..."
    sam deploy --guided \
        --stack-fullName "${STACK_NAME}" \
        --parameter-overrides Environment="${ENVIRONMENT}" \
        --capabilities CAPABILITY_IAM \
        --resolve-s3
else
    print_step "Usando configuração existente..."
    sam deploy --parameter-overrides Environment="${ENVIRONMENT}"
fi

echo ""
print_success "Deploy concluído!"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUTS
# ═══════════════════════════════════════════════════════════════════════════

print_step "4. Obtendo informações da stack..."
echo ""

FUNCTION_URL=$(aws cloudformation describe-stacks \
    --stack-fullName "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`BlogApiFunctionUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$FUNCTION_URL" ]; then
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "  ✅ Deploy bem-sucedido!"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 Function URL: ${FUNCTION_URL}"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Testar API:"
    echo "      curl ${FUNCTION_URL}api/health"
    echo ""
    echo "   2. Ver logs:"
    echo "      npm run sam:logs"
    echo ""
    echo "   3. Acessar AWS Console:"
    echo "      https://console.aws.amazon.com/cloudformation/"
    echo ""
else
    print_warning "Não foi possível obter a Function URL"
    echo "Verifique no console: https://console.aws.amazon.com/cloudformation/"
fi

echo "═══════════════════════════════════════════════════════════════════════════"

