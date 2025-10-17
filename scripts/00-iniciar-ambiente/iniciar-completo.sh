#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente Completo
# Descrição: Setup completo com MongoDB + DynamoDB + Prisma
# ═══════════════════════════════════════════════════════════════════════════

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🚀 INICIANDO AMBIENTE COMPLETO                       ║"
echo "║         MONGODB + DYNAMODB + PRISMA + SERVIDOR               ║"
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

# Criar .env se não existir
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
    cp env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
    echo ""
fi

# MONGODB
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 🐳 INICIANDO MONGODB                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔄 Iniciando container MongoDB...${NC}"
docker-compose up -d mongodb
echo -e "${GREEN}✅ MongoDB iniciado${NC}"
echo -e "${YELLOW}⏳ Aguardando Replica Set (15s)...${NC}"
sleep 15
echo ""

# DYNAMODB
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

# PRISMA
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 🔧 CONFIGURANDO PRISMA                       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📦 Gerando Prisma Client...${NC}"
npm run prisma:generate
echo -e "${GREEN}✅ Prisma Client gerado${NC}"
echo ""

echo -e "${YELLOW}🔄 Sincronizando schema...${NC}"
npm run prisma:push
echo -e "${GREEN}✅ Schema sincronizado${NC}"
echo ""

# POPULAR DADOS
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 🌱 POPULANDO BANCO DE DADOS                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🌱 Populando MongoDB...${NC}"
npm run seed
echo -e "${GREEN}✅ MongoDB populado${NC}"
echo ""

# DYNAMODB TABELAS (background)
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 📊 CONFIGURANDO DYNAMODB                     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🏗️  Criando tabelas DynamoDB (em background)...${NC}"
echo "   Isso pode levar 30-60 segundos. Continuando..."
npm run dynamodb:create-tables &> /dev/null &
sleep 3
echo -e "${GREEN}✅ Processo iniciado em background${NC}"
echo ""

# RESUMO
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✨ AMBIENTE COMPLETO CONFIGURADO COM SUCESSO!         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}🗄️  BANCOS DE DADOS ATIVOS:${NC}"
echo -e "${GREEN}   • MongoDB:        mongodb://localhost:27017 (PRONTO)${NC}"
echo -e "${YELLOW}   • DynamoDB Local: http://localhost:8000 (DISPONÍVEL)${NC}"
echo ""

echo -e "${MAGENTA}🌐 URLS DO SISTEMA:${NC}"
echo "   • API:            http://localhost:4000"
echo "   • Documentação:   http://localhost:4000/docs"
echo "   • Prisma Studio:  http://localhost:5555"
echo "   • DynamoDB:       http://localhost:8000"
echo ""

echo -e "${YELLOW}⚡ COMANDOS RÁPIDOS:${NC}"
echo "   • npm run prisma:studio           - Abrir Prisma Studio"
echo "   • npm run dynamodb:list-tables    - Listar tabelas DynamoDB"
echo ""

echo -e "${CYAN}🔄 ALTERNAR BANCO:${NC}"
echo "   Use: scripts/01-alternar-banco-dados/alternar-banco.sh"
echo ""

# INICIAR SERVIDOR
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⏰ Iniciando em 3 segundos...${NC}"
sleep 3

npm run dev

