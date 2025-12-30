#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Status dos Containers Docker
# Descrição: Visualiza status detalhado dos containers
# ═══════════════════════════════════════════════════════════════════════════

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            🐳 STATUS DOS CONTAINERS DOCKER                   ║"
echo "╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar Docker
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo -e "${YELLOW}💡 Inicie o Docker e tente novamente.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker está rodando${NC}"
echo ""

echo -e "${YELLOW}🔍 Containers do BlogAPI:${NC}"
echo ""

# Listar containers
docker ps -a --filter "fullName=blogapi" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Nenhum container BlogAPI encontrado${NC}"
fi

echo ""

# Resumo
TOTAL=$(docker ps -a --filter "fullName=blogapi" -q | wc -l)
RUNNING=$(docker ps --filter "fullName=blogapi" -q | wc -l)

echo -e "${YELLOW}📊 Resumo Geral:${NC}"
echo "   Total de containers BlogAPI: $TOTAL"
echo -e "${GREEN}   Containers rodando: $RUNNING${NC}"
echo ""

# URLs
echo -e "${YELLOW}🌐 URLs Disponíveis:${NC}"
echo ""

if docker ps --filter "fullName=blogapi-mongodb" --filter "status=running" -q &> /dev/null; then
    echo -e "${GREEN}   ✅ MongoDB:        mongodb://localhost:27017${NC}"
fi
if docker ps --filter "fullName=blogapi-dynamodb" --filter "status=running" -q &> /dev/null; then
    echo -e "${GREEN}   ✅ DynamoDB:       http://localhost:8000${NC}"
fi
if docker ps --filter "fullName=blogapi-prisma-studio" --filter "status=running" -q &> /dev/null; then
    echo -e "${GREEN}   ✅ Prisma Studio:  http://localhost:5555${NC}"
fi
if docker ps --filter "fullName=blogapi-dynamodb-admin" --filter "status=running" -q &> /dev/null; then
    echo -e "${GREEN}   ✅ DynamoDB Admin: http://localhost:8001${NC}"
fi

echo ""

