#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Iniciar Ambiente MongoDB + Prisma
# Descrição: Setup completo com MongoDB, Prisma ORM e dados de teste
# ═══════════════════════════════════════════════════════════════════════════

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🚀 INICIANDO AMBIENTE LOCAL                          ║"
echo "║         PRISMA + MONGODB + EXPRESS                           ║"
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

# Iniciar MongoDB
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 🐳 INICIANDO MONGODB                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}🔄 Iniciando container MongoDB...${NC}"
docker-compose up -d mongodb

echo -e "${GREEN}✅ MongoDB iniciado${NC}"
echo -e "${YELLOW}⏳ Aguardando Replica Set (30s)...${NC}"
sleep 30
echo ""

# Configurar Prisma
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

echo -e "${YELLOW}🌱 Populando banco de dados...${NC}"
npm run seed
echo -e "${GREEN}✅ Dados populados${NC}"
echo ""

# Resumo
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✨ AMBIENTE CONFIGURADO COM SUCESSO!               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}🌐 URLS DO SISTEMA:${NC}"
echo "   • API:            http://localhost:4000"
echo "   • Documentação:   http://localhost:4000/docs"
echo "   • Prisma Studio:  http://localhost:5555"
echo ""

echo -e "${YELLOW}⚡ COMANDOS RÁPIDOS:${NC}"
echo "   • npm run dev              - Iniciar servidor"
echo "   • npm run prisma:studio    - Abrir Prisma Studio"
echo ""

# Iniciar servidor
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⏰ Iniciando em 3 segundos...${NC}"
sleep 3

npm run dev

