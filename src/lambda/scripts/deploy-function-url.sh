#!/bin/bash

# Deploy script para Lambda Function URLs (Free Tier)
# Uso: ./deploy-function-url.sh [environment]

set -e

# Configurações
ENVIRONMENT=${1:-development}
REGION=${AWS_REGION:-us-east-1}
FUNCTION_NAME="${ENVIRONMENT}-blog-api-function"
STACK_NAME="${ENVIRONMENT}-blog-api-function-url"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verifica AWS CLI
check_dependencies() {
    log "Verificando dependências..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI não encontrada. Instale com: pip install awscli"
    fi
    
    if ! command -v zip &> /dev/null; then
        error "zip não encontrado. Instale com seu gerenciador de pacotes"
    fi
    
    # Verifica credenciais AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        error "Credenciais AWS não configuradas. Execute: aws configure"
    fi
    
    success "Dependências verificadas"
}

# Build do projeto
build_project() {
    log "Build do projeto..."
    
    # Verifica se está na pasta correta
    if [ ! -f "package.json" ]; then
        error "package.json não encontrado. Execute a partir da raiz do projeto"
    fi
    
    # Install dependencies
    npm ci --production
    
    # Build TypeScript
    npm run build
    
    success "Build concluído"
}

# Empacota Lambda
package_lambda() {
    log "Empacotando Lambda..."
    
    # Cria pasta temporária
    TEMP_DIR=$(mktemp -d)
    
    # Copia arquivos necessários
    cp -r dist/* $TEMP_DIR/
    cp package.json $TEMP_DIR/
    cp -r node_modules $TEMP_DIR/
    
    # Cria zip
    cd $TEMP_DIR
    zip -r ../lambda-function.zip .
    cd - > /dev/null
    
    # Limpa
    rm -rf $TEMP_DIR
    
    success "Lambda empacotada: lambda-function.zip"
}

# Deploy CloudFormation
deploy_stack() {
    log "Deploy CloudFormation stack: $STACK_NAME"
    
    # Verifica se stack existe
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
        log "Stack existe, atualizando..."
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://src/lambda/infrastructure/cloudformation/function-url-template.yaml \
            --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        # Aguarda atualização
        aws cloudformation wait stack-update-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    else
        log "Criando nova stack..."
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://src/lambda/infrastructure/cloudformation/function-url-template.yaml \
            --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        # Aguarda criação
        aws cloudformation wait stack-create-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    fi
    
    success "Stack deployado"
}

# Upload do código
upload_code() {
    log "Upload do código Lambda..."
    
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://lambda-function.zip \
        --region $REGION
    
    success "Código uploadado"
}

# Obtém informações do deploy
get_info() {
    log "Obtendo informações do deploy..."
    
    # Function URL
    FUNCTION_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`FunctionUrl`].OutputValue' \
        --output text)
    
    # Function ARN
    FUNCTION_ARN=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`FunctionArn`].OutputValue' \
        --output text)
    
    echo ""
    echo "==================================="
    echo "🚀 DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "==================================="
    echo ""
    echo "📍 Function URL: $FUNCTION_URL"
    echo "🔗 Function ARN: $FUNCTION_ARN"
    echo "🌍 Region: $REGION"
    echo "🏷️  Environment: $ENVIRONMENT"
    echo ""
    echo "📋 Endpoints disponíveis:"
    echo "  Health: $FUNCTION_URL/health"
    echo "  API: $FUNCTION_URL/api/v1/*"
    echo ""
    echo "💰 Free Tier Info:"
    echo "  ✓ 1M requests/mês (sempre grátis)"
    echo "  ✓ Sem custos de API Gateway"
    echo "  ✓ 400K GB-segundos Lambda/mês grátis"
    echo ""
    echo "🧪 Teste:"
    echo "  curl $FUNCTION_URL/health"
    echo ""
}

# Cleanup
cleanup() {
    log "Limpando arquivos temporários..."
    rm -f lambda-function.zip
    success "Cleanup concluído"
}

# Main
main() {
    echo "🚀 Deploy Lambda Function URL - Blog API"
    echo "Environment: $ENVIRONMENT"
    echo "Region: $REGION"
    echo ""
    
    check_dependencies
    build_project
    package_lambda
    deploy_stack
    upload_code
    get_info
    cleanup
    
    success "Deploy concluído com sucesso!"
}

# Trap para cleanup em caso de erro
trap cleanup EXIT

# Executa main
main "$@"
