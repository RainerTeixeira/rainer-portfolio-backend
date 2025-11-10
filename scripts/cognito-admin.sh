#!/bin/bash

# Script AWS CLI para gerenciar configurações do Cognito
# Uso: ./scripts/cognito-admin.sh [comando]
# Comandos: check|verify|update|identity-providers|lambda-triggers|test

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Carregar variáveis do .env se existir
if [ -f .env ]; then
    echo -e "${BLUE}📄 Carregando variáveis do .env...${NC}"
    export $(grep -v '^#' .env | xargs)
fi

# Configurações (podem ser sobrescritas por variáveis de ambiente)
USER_POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_wryiyhbWC}"
CLIENT_ID="${COGNITO_CLIENT_ID:-3ueos5ofu499je6ebc5u98n35h}"
REGION="${COGNITO_REGION:-us-east-1}"
CALLBACK_URL="http://localhost:3000/dashboard/login/callback"
SIGNOUT_URLS="http://localhost:3000/dashboard/login http://localhost:3000"

# Função para imprimir cabeçalho
print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

# Função para verificar se AWS CLI está configurado
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI não está instalado!${NC}"
        echo "Instale em: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS CLI não está configurado ou credenciais inválidas!${NC}"
        echo "Execute: aws configure"
        exit 1
    fi
    
    AWS_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text)
    AWS_USER=$(aws sts get-caller-identity --query 'Arn' --output text)
    echo -e "${GREEN}✅ AWS CLI configurado corretamente${NC}"
    echo "   Account: $AWS_ACCOUNT"
    echo "   User: $AWS_USER"
}

# Verificar configuração do User Pool
check_user_pool() {
    print_header "📋 Verificando User Pool"
    
    echo "User Pool ID: $USER_POOL_ID"
    echo "Region: $REGION"
    echo ""
    
    aws cognito-idp describe-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --region "$REGION" \
        --query 'UserPool.[
            Id,
            Name,
            MfaConfiguration,
            EmailVerificationMessage,
            EmailVerificationSubject,
            AutoVerifiedAttributes
        ]' \
        --output table
    
    echo ""
}

# Verificar configuração do App Client
check_app_client() {
    print_header "📱 Verificando App Client"
    
    echo "Client ID: $CLIENT_ID"
    echo ""
    
    # Configurações básicas
    echo -e "${YELLOW}📋 Configurações básicas:${NC}"
    aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --region "$REGION" \
        --query 'UserPoolClient.[
            ClientId,
            ClientName,
            GenerateSecret,
            ExplicitAuthFlows,
            SupportedIdentityProviders
        ]' \
        --output table
    
    echo ""
    echo -e "${YELLOW}🔗 Callback URLs:${NC}"
    aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --region "$REGION" \
        --query 'UserPoolClient.CallbackURLs' \
        --output table
    
    echo ""
    echo -e "${YELLOW}🚪 Logout URLs:${NC}"
    aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --region "$REGION" \
        --query 'UserPoolClient.LogoutURLs' \
        --output table
    
    echo ""
    echo -e "${YELLOW}🔑 OAuth Scopes:${NC}"
    aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --region "$REGION" \
        --query 'UserPoolClient.AllowedOAuthScopes' \
        --output table
    
    echo ""
    echo -e "${YELLOW}🌊 OAuth Flows:${NC}"
    aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --region "$REGION" \
        --query 'UserPoolClient.AllowedOAuthFlows' \
        --output table
}

# Verificar Identity Providers
check_identity_providers() {
    print_header "🔐 Verificando Identity Providers"
    
    echo -e "${YELLOW}📋 Identity Providers configurados:${NC}"
    aws cognito-idp list-identity-providers \
        --user-pool-id "$USER_POOL_ID" \
        --region "$REGION" \
        --query 'Providers[*].[ProviderName, ProviderType]' \
        --output table
    
    echo ""
    
    # Verificar Google
    echo -e "${YELLOW}🔍 Detalhes do Google:${NC}"
    if aws cognito-idp describe-identity-provider \
        --user-pool-id "$USER_POOL_ID" \
        --provider-name "Google" \
        --region "$REGION" \
        --query 'IdentityProvider.[ProviderName,ProviderType,ProviderDetails]' \
        --output json 2>/dev/null; then
        echo -e "${GREEN}✅ Google está configurado${NC}"
        
        # Verificar scopes do Google
        GOOGLE_SCOPES=$(aws cognito-idp describe-identity-provider \
            --user-pool-id "$USER_POOL_ID" \
            --provider-name "Google" \
            --region "$REGION" \
            --query 'IdentityProvider.AttributeMapping' \
            --output json 2>/dev/null || echo "{}")
        
        echo "   Attribute Mapping: $GOOGLE_SCOPES"
        echo ""
    else
        echo -e "${RED}❌ Google não está configurado${NC}"
        echo ""
    fi
    
    # Verificar GitHub
    echo -e "${YELLOW}🔍 Detalhes do GitHub:${NC}"
    if aws cognito-idp describe-identity-provider \
        --user-pool-id "$USER_POOL_ID" \
        --provider-name "GitHub" \
        --region "$REGION" \
        --query 'IdentityProvider.[ProviderName,ProviderType,ProviderDetails]' \
        --output json 2>/dev/null; then
        echo -e "${GREEN}✅ GitHub está configurado${NC}"
        
        # Verificar scopes do GitHub
        GITHUB_SCOPES=$(aws cognito-idp describe-identity-provider \
            --user-pool-id "$USER_POOL_ID" \
            --provider-name "GitHub" \
            --region "$REGION" \
            --query 'IdentityProvider.AttributeMapping' \
            --output json 2>/dev/null || echo "{}")
        
        echo "   Attribute Mapping: $GITHUB_SCOPES"
        echo ""
    else
        echo -e "${RED}❌ GitHub não está configurado${NC}"
        echo ""
    fi
}

# Verificar Lambda Triggers
check_lambda_triggers() {
    print_header "⚡ Verificando Lambda Triggers"
    
    LAMBDA_CONFIG=$(aws cognito-idp describe-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --region "$REGION" \
        --query 'UserPool.LambdaConfig' \
        --output json)
    
    echo "$LAMBDA_CONFIG" | jq '.' 2>/dev/null || echo "$LAMBDA_CONFIG"
    
    echo ""
    
    # Verificar Pre-Sign-Up trigger
    PRE_SIGNUP=$(aws cognito-idp describe-user-pool \
        --user-pool-id "$USER_POOL_ID" \
        --region "$REGION" \
        --query 'UserPool.LambdaConfig.PreSignUp' \
        --output text)
    
    if [ "$PRE_SIGNUP" != "None" ] && [ -n "$PRE_SIGNUP" ] && [ "$PRE_SIGNUP" != "null" ]; then
        echo -e "${GREEN}✅ Pre-Sign-Up Trigger configurado: $PRE_SIGNUP${NC}"
        
        # Obter informações da função Lambda
        FUNCTION_NAME=$(echo "$PRE_SIGNUP" | awk -F: '{print $7}')
        FUNCTION_REGION=$(echo "$PRE_SIGNUP" | awk -F: '{print $4}')
        
        if [ -n "$FUNCTION_NAME" ] && [ -n "$FUNCTION_REGION" ]; then
            echo "   Function Name: $FUNCTION_NAME"
            echo "   Region: $FUNCTION_REGION"
            
            # Verificar se a função existe
            if aws lambda get-function \
                --function-name "$FUNCTION_NAME" \
                --region "$FUNCTION_REGION" \
                --query 'Configuration.[FunctionName,Runtime,LastModified]' \
                --output table 2>/dev/null; then
                echo -e "${GREEN}   ✅ Função Lambda existe e está ativa${NC}"
            else
                echo -e "${RED}   ❌ Função Lambda não encontrada ou sem permissão${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Pre-Sign-Up Trigger não está configurado${NC}"
        echo ""
        echo -e "${YELLOW}💡 Para configurar:${NC}"
        echo "   1. Crie ou encontre sua função Lambda Pre-Sign-Up"
        echo "   2. Execute: aws cognito-idp update-user-pool \\"
        echo "      --user-pool-id $USER_POOL_ID \\"
        echo "      --lambda-config PreSignUp=<ARN_DA_FUNCAO>"
    fi
}

# Atualizar Callback URLs
update_callback_urls() {
    print_header "⚙️ Atualizando Callback URLs"
    
    echo "Atualizando App Client: $CLIENT_ID"
    echo "Callback URL: $CALLBACK_URL"
    echo "Logout URLs: $SIGNOUT_URLS"
    echo ""
    
    # Obter configuração atual para preservar outras configurações
    CURRENT_CONFIG=$(aws cognito-idp describe-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --region "$REGION")
    
    # Extrair configurações existentes
    CURRENT_SCOPES=$(echo "$CURRENT_CONFIG" | jq -r '.UserPoolClient.AllowedOAuthScopes[]' 2>/dev/null | tr '\n' ' ')
    CURRENT_FLOWS=$(echo "$CURRENT_CONFIG" | jq -r '.UserPoolClient.AllowedOAuthFlows[]' 2>/dev/null | tr '\n' ' ')
    CURRENT_PROVIDERS=$(echo "$CURRENT_CONFIG" | jq -r '.UserPoolClient.SupportedIdentityProviders[]' 2>/dev/null | tr '\n' ' ')
    CURRENT_AUTH_FLOWS=$(echo "$CURRENT_CONFIG" | jq -r '.UserPoolClient.ExplicitAuthFlows[]' 2>/dev/null | tr '\n' ' ')
    
    # Definir valores padrão se vazios
    SCOPES="${CURRENT_SCOPES:-email openid profile}"
    FLOWS="${CURRENT_FLOWS:-code}"
    PROVIDERS="${CURRENT_PROVIDERS:-Google GitHub COGNITO}"
    AUTH_FLOWS="${CURRENT_AUTH_FLOWS:-ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH}"
    
    # Atualizar
    echo -e "${YELLOW}⏳ Atualizando configuração...${NC}"
    aws cognito-idp update-user-pool-client \
        --user-pool-id "$USER_POOL_ID" \
        --client-id "$CLIENT_ID" \
        --region "$REGION" \
        --callback-urls "$CALLBACK_URL" \
        --logout-urls $SIGNOUT_URLS \
        --allowed-o-auth-flows $FLOWS \
        --allowed-o-auth-scopes $SCOPES \
        --allowed-o-auth-flows-user-pool-client \
        --supported-identity-providers $PROVIDERS \
        --explicit-auth-flows $AUTH_FLOWS \
        > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ URLs atualizadas com sucesso!${NC}"
        echo ""
        echo "📋 Verificando nova configuração..."
        check_app_client
    else
        echo -e "${RED}❌ Erro ao atualizar URLs${NC}"
        exit 1
    fi
}

# Verificar tudo
verify_all() {
    print_header "🔍 Verificação Completa"
    
    check_aws_cli
    check_user_pool
    check_app_client
    check_identity_providers
    check_lambda_triggers
    
    echo ""
    print_header "✅ Verificação Completa"
    echo -e "${GREEN}Todas as verificações foram concluídas!${NC}"
    
    # Resumo rápido
    echo ""
    echo -e "${YELLOW}📊 Resumo:${NC}"
    echo "   User Pool: $USER_POOL_ID"
    echo "   Client ID: $CLIENT_ID"
    echo "   Region: $REGION"
    echo "   Callback URL: $CALLBACK_URL"
}

# Testar URL do Cognito
test_cognito_url() {
    print_header "🧪 Testando URLs do Cognito"
    
    COGNITO_DOMAIN="${USER_POOL_ID//_/}.auth.${REGION}.amazoncognito.com"
    
    echo "Cognito Domain: $COGNITO_DOMAIN"
    echo ""
    
    # Construir URL de teste para Google
    TEST_URL_GOOGLE="https://${COGNITO_DOMAIN}/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=$(echo $CALLBACK_URL | sed 's/:/%3A/g' | sed 's/\//%2F/g')&identity_provider=Google"
    
    # Construir URL de teste para GitHub
    TEST_URL_GITHUB="https://${COGNITO_DOMAIN}/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=$(echo $CALLBACK_URL | sed 's/:/%3A/g' | sed 's/\//%2F/g')&identity_provider=GitHub"
    
    echo -e "${YELLOW}🔗 URL de teste para Google:${NC}"
    echo "$TEST_URL_GOOGLE"
    echo ""
    
    echo -e "${YELLOW}🔗 URL de teste para GitHub:${NC}"
    echo "$TEST_URL_GITHUB"
    echo ""
    
    # Testar conectividade
    echo -e "${YELLOW}📡 Testando conectividade...${NC}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${COGNITO_DOMAIN}/.well-known/openid-configuration" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Cognito está acessível (HTTP $HTTP_CODE)${NC}"
        
        # Obter informações do OpenID
        echo ""
        echo -e "${YELLOW}📋 OpenID Configuration:${NC}"
        curl -s "https://${COGNITO_DOMAIN}/.well-known/openid-configuration" | jq -r '.issuer, .authorization_endpoint, .token_endpoint' 2>/dev/null || echo "Não foi possível obter configuração OpenID"
    else
        echo -e "${RED}❌ Não foi possível conectar ao Cognito (HTTP $HTTP_CODE)${NC}"
    fi
}

# Mostrar ajuda
show_help() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Cognito Admin - Script de Gerenciamento AWS CLI${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  check              - Verificar configuração do App Client"
    echo "  verify             - Verificação completa (recomendado)"
    echo "  update             - Atualizar Callback URLs"
    echo "  identity-providers - Verificar Identity Providers (Google/GitHub)"
    echo "  lambda-triggers    - Verificar Lambda Triggers"
    echo "  test               - Testar URLs do Cognito"
    echo "  help               - Mostrar esta ajuda"
    echo ""
    echo "Variáveis de ambiente (carregadas do .env):"
    echo "  COGNITO_USER_POOL_ID - ID do User Pool (padrão: $USER_POOL_ID)"
    echo "  COGNITO_CLIENT_ID    - ID do App Client (padrão: $CLIENT_ID)"
    echo "  COGNITO_REGION       - Região AWS (padrão: $REGION)"
    echo ""
    echo "Exemplos:"
    echo "  $0 verify              # Verificação completa"
    echo "  $0 check               # Verificar App Client"
    echo "  $0 update              # Atualizar Callback URLs"
    echo "  $0 identity-providers  # Ver Identity Providers"
    echo "  $0 lambda-triggers     # Ver Lambda Triggers"
    echo "  $0 test                # Testar URLs"
    echo ""
}

# Main
COMMAND="${1:-verify}"

case "$COMMAND" in
    check)
        check_aws_cli
        check_app_client
        ;;
    verify)
        verify_all
        ;;
    update)
        check_aws_cli
        update_callback_urls
        ;;
    identity-providers)
        check_aws_cli
        check_identity_providers
        ;;
    lambda-triggers)
        check_aws_cli
        check_lambda_triggers
        ;;
    test)
        check_aws_cli
        test_cognito_url
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando inválido: $COMMAND${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

