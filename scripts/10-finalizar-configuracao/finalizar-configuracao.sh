#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Finalizar Configuração do Ambiente Local
# Descrição: Prepara tudo para produção/cloud
# ═══════════════════════════════════════════════════════════════════════════

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  FINALIZANDO AMBIENTE LOCAL                               ║"
echo "╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# FASE 1: AWS CLI
echo -e "${YELLOW}📊 FASE 1: Verificando AWS CLI...${NC}"
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✅ AWS CLI já instalado!${NC}"
    aws --version
else
    echo -e "${YELLOW}⚠️  AWS CLI não encontrado. Instale manualmente:${NC}"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
fi
echo ""

# FASE 2: DynamoDB
echo -e "${YELLOW}📊 FASE 2: Criando tabelas DynamoDB...${NC}"
cd ../..
npm run dynamodb:create-tables
echo -e "${GREEN}✅ Tabelas criadas!${NC}"
echo ""

# FASE 3: MongoDB
echo -e "${YELLOW}📊 FASE 3: Populando MongoDB...${NC}"
tsx src/prisma/mongodb.seed.ts
echo -e "${GREEN}✅ MongoDB populado!${NC}"
echo ""

# FASE 4: Containers
echo -e "${YELLOW}📊 FASE 4: Status dos containers...${NC}"
docker ps --filter "name=blogapi" --format "{{.Names}}\t{{.Status}}"
echo ""

# FASE 5: API
echo -e "${YELLOW}📊 FASE 5: Testando API...${NC}"
if curl -s http://localhost:4000/health &> /dev/null; then
    echo -e "${GREEN}✅ API funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  API não está rodando. Execute: npm run start:dev${NC}"
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RESUMO FINAL                                             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}✅ Configuração finalizada!${NC}"
echo ""
echo -e "${CYAN}📚 PRÓXIMOS PASSOS:${NC}"
echo "   1. npm run start:dev"
echo "   2. http://localhost:4000/api"
echo ""

