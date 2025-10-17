#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente DynamoDB Local
# Descrição: Setup completo com DynamoDB Local e criação de tabelas
# ═══════════════════════════════════════════════════════════════════════════

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🚀 INICIANDO AMBIENTE LOCAL                          ║"
echo "║         DYNAMODB + EXPRESS                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar Docker
echo -e "${CYAN}🔍 Verificando Docker...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo -e "${YELLOW}💡 Inicie Docker Desktop e tente novamente${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"
echo ""

# Criar/configurar .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp env.example .env
fi

echo -e "${YELLOW}🔄 Configurando para DynamoDB...${NC}"
sed -i 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=DYNAMODB/' .env
echo -e "${GREEN}✅ Configurado para DynamoDB${NC}"
echo ""

# Iniciar DynamoDB
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              🗄️  INICIANDO DYNAMODB LOCAL                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔄 Iniciando container DynamoDB...${NC}"
docker-compose up -d dynamodb-local

echo -e "${GREEN}✅ DynamoDB iniciado${NC}"
echo -e "${YELLOW}⏳ Aguardando inicialização (5s)...${NC}"
sleep 5
echo ""

# Criar tabelas
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              📊 CRIANDO TABELAS NO DYNAMODB                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🏗️  Criando tabelas...${NC}"
npm run dynamodb:create-tables
echo -e "${GREEN}✅ Tabelas criadas${NC}"
echo ""

# Popular dados (opcional)
echo -e "${YELLOW}❓ Deseja popular o DynamoDB com dados de teste? [S/N]${NC}"
read -r resposta

if [[ "$resposta" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${YELLOW}🌱 Populando DynamoDB...${NC}"
    npm run dynamodb:seed
    echo -e "${GREEN}✅ Dados inseridos${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Pulando população de dados${NC}"
    echo ""
fi

# Resumo
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✨ AMBIENTE DYNAMODB CONFIGURADO COM SUCESSO!         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${MAGENTA}🌐 URLS DO SISTEMA:${NC}"
echo "   • DynamoDB Local: http://localhost:8000"
echo "   • API:            http://localhost:4000"
echo "   • Documentação:   http://localhost:4000/docs"
echo ""

echo -e "${YELLOW}⚡ COMANDOS RÁPIDOS:${NC}"
echo "   • npm run dev                      - Iniciar servidor"
echo "   • npm run dynamodb:list-tables     - Listar tabelas"
echo ""

# Iniciar servidor
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⏰ Iniciando em 3 segundos...${NC}"
sleep 3

npm run dev

