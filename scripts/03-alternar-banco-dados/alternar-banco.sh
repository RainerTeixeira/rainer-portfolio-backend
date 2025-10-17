#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Alternar Entre MongoDB (Prisma) e DynamoDB Local
# Descrição: Facilita a troca do DATABASE_PROVIDER no .env
# ═══════════════════════════════════════════════════════════════════════════

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ENV_FILE="../.env"

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔄 ALTERNAR BANCO DE DADOS                                ║"
echo "╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}💡 Execute um dos scripts de inicialização primeiro${NC}"
    exit 1
fi

# Função para detectar provider atual
get_current_provider() {
    if grep -q "DATABASE_PROVIDER=PRISMA" "$ENV_FILE"; then
        echo "PRISMA"
    elif grep -q "DATABASE_PROVIDER=DYNAMODB" "$ENV_FILE"; then
        echo "DYNAMODB"
    else
        echo "DESCONHECIDO"
    fi
}

# Detectar banco atual
CURRENT=$(get_current_provider)

echo -e "${CYAN}🔍 Detectando configuração atual...${NC}"
echo ""

if [ "$CURRENT" == "PRISMA" ]; then
    echo -e "${CYAN}🗄️  Banco de dados atual: MongoDB + Prisma${NC}"
elif [ "$CURRENT" == "DYNAMODB" ]; then
    echo -e "${YELLOW}📊 Banco de dados atual: DynamoDB Local${NC}"
else
    echo -e "${RED}⚠️  Banco de dados atual: DESCONHECIDO${NC}"
fi

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Escolha o banco de dados:${NC}"
echo ""
echo -e "${GREEN}[1]${NC} MongoDB + Prisma ORM"
echo -e "    ✓ Desenvolvimento rápido e produtivo"
echo -e "    ✓ Prisma Studio (GUI visual)"
echo -e "    ✓ Type-safe queries"
echo -e "    ✓ Porta: 27017"
echo ""
echo -e "${GREEN}[2]${NC} DynamoDB Local"
echo -e "    ✓ Testes pré-produção"
echo -e "    ✓ Compatível com AWS Lambda"
echo -e "    ✓ Serverless local"
echo -e "    ✓ Porta: 8000"
echo ""
echo -e "${GREEN}[0]${NC} Cancelar"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

read -p "Digite sua escolha (1, 2 ou 0): " CHOICE

if [ "$CHOICE" == "0" ]; then
    echo ""
    echo -e "${YELLOW}⏭️  Operação cancelada${NC}"
    exit 0
fi

# Definir escolha
if [ "$CHOICE" == "1" ]; then
    NEW_PROVIDER="PRISMA"
    PROVIDER_NAME="MongoDB + Prisma"
elif [ "$CHOICE" == "2" ]; then
    NEW_PROVIDER="DYNAMODB"
    PROVIDER_NAME="DynamoDB Local"
else
    echo -e "${RED}❌ Escolha inválida!${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}⚙️  Configurando para $PROVIDER_NAME...${NC}"
echo ""

# Verificar se já está configurado
if [ "$CURRENT" == "$NEW_PROVIDER" ]; then
    echo -e "${YELLOW}⚠️  Já está configurado para $PROVIDER_NAME!${NC}"
    exit 0
fi

# Fazer backup
echo -e "${YELLOW}📦 Criando backup do .env...${NC}"
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo -e "${GREEN}✅ Backup criado: .env.backup${NC}"
echo ""

# Configurar para escolha
if [ "$NEW_PROVIDER" == "PRISMA" ]; then
    echo -e "${YELLOW}🔄 Alterando DATABASE_PROVIDER para PRISMA...${NC}"
    sed -i 's/DATABASE_PROVIDER=DYNAMODB/DATABASE_PROVIDER=PRISMA/g' "$ENV_FILE"
    
    echo -e "${YELLOW}🔄 Configurando DATABASE_URL...${NC}"
    if ! grep -q "DATABASE_URL=" "$ENV_FILE"; then
        echo "DATABASE_URL=mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ Configurado para MongoDB + Prisma${NC}"
    echo ""
    echo -e "${CYAN}📋 Próximos passos:${NC}"
    echo -e "   1. Certifique-se que MongoDB está rodando:"
    echo -e "      ${NC}docker-compose up -d mongodb${NC}"
    echo -e "   2. Gere o Prisma Client:"
    echo -e "      ${NC}npm run prisma:generate${NC}"
    echo -e "   3. Sincronize o schema:"
    echo -e "      ${NC}npm run prisma:push${NC}"
    echo -e "   4. Inicie o servidor:"
    echo -e "      ${NC}npm run dev${NC}"
else
    echo -e "${YELLOW}🔄 Alterando DATABASE_PROVIDER para DYNAMODB...${NC}"
    sed -i 's/DATABASE_PROVIDER=PRISMA/DATABASE_PROVIDER=DYNAMODB/g' "$ENV_FILE"
    
    echo -e "${YELLOW}🔄 Verificando configurações DynamoDB...${NC}"
    if ! grep -q "DYNAMODB_ENDPOINT=" "$ENV_FILE"; then
        echo "DYNAMODB_ENDPOINT=http://localhost:8000" >> "$ENV_FILE"
    fi
    if ! grep -q "DYNAMODB_TABLE_PREFIX=" "$ENV_FILE"; then
        echo "DYNAMODB_TABLE_PREFIX=blog" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ Configurado para DynamoDB Local${NC}"
    echo ""
    echo -e "${CYAN}📋 Próximos passos:${NC}"
    echo -e "   1. Certifique-se que DynamoDB está rodando:"
    echo -e "      ${NC}docker-compose up -d dynamodb-local${NC}"
    echo -e "   2. Crie as tabelas:"
    echo -e "      ${NC}npm run dynamodb:create-tables${NC}"
    echo -e "   3. Popule os dados (opcional):"
    echo -e "      ${NC}npm run dynamodb:seed${NC}"
    echo -e "   4. Inicie o servidor:"
    echo -e "      ${NC}npm run dev${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✨ CONFIGURAÇÃO ALTERADA COM SUCESSO!          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}💾 Backup anterior salvo em: .env.backup${NC}"
echo -e "${CYAN}🔧 Nova configuração: $PROVIDER_NAME${NC}"
echo ""

