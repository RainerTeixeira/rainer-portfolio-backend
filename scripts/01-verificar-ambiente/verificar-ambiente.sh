#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Verificar Ambiente de Desenvolvimento
# Descrição: Diagnóstico completo do ambiente
# ═══════════════════════════════════════════════════════════════════════════

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                🔍 VERIFICAÇÃO DO AMBIENTE                    ║"
echo "╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

ALL_OK=true

# 1. Docker
echo -e "${CYAN}[1/6] Verificando Docker...${NC}"
if docker ps &> /dev/null; then
    echo -e "${GREEN}     ✅ Docker está funcionando${NC}"
else
    echo -e "${RED}     ❌ Docker não está rodando${NC}"
    ALL_OK=false
fi
echo ""

# 2. Node.js
echo -e "${CYAN}[2/6] Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}     ✅ Node.js instalado - $NODE_VERSION${NC}"
else
    echo -e "${RED}     ❌ Node.js não instalado${NC}"
    ALL_OK=false
fi
echo ""

# 3. npm
echo -e "${CYAN}[3/6] Verificando npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}     ✅ npm instalado - v$NPM_VERSION${NC}"
else
    echo -e "${RED}     ❌ npm não instalado${NC}"
    ALL_OK=false
fi
echo ""

# 4. Portas
echo -e "${CYAN}[4/6] Verificando portas...${NC}"
declare -A ports=([4000]="API" [27017]="MongoDB" [8000]="DynamoDB" [5555]="Prisma Studio" [8001]="DynamoDB Admin")

for port in "${!ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t &> /dev/null; then
        echo -e "${YELLOW}     ⚠️  Porta $port (${ports[$port]}) está em uso${NC}"
    else
        echo -e "${GREEN}     ✅ Porta $port (${ports[$port]}) está livre${NC}"
    fi
done
echo ""

# 5. Arquivos
echo -e "${CYAN}[5/6] Verificando arquivos...${NC}"
if [ -f "../.env" ]; then
    echo -e "${GREEN}     ✅ Arquivo .env existe${NC}"
    if grep -q "DATABASE_PROVIDER=PRISMA" ../.env; then
        echo -e "${CYAN}     🗄️  Configurado para: MongoDB + Prisma${NC}"
    elif grep -q "DATABASE_PROVIDER=DYNAMODB" ../.env; then
        echo -e "${CYAN}     📊 Configurado para: DynamoDB${NC}"
    fi
else
    echo -e "${YELLOW}     ⚠️  Arquivo .env não existe${NC}"
fi

if [ -d "../node_modules" ]; then
    echo -e "${GREEN}     ✅ node_modules existe${NC}"
else
    echo -e "${YELLOW}     ⚠️  node_modules não existe - execute 'npm install'${NC}"
fi

if [ -f "../package.json" ]; then
    echo -e "${GREEN}     ✅ package.json existe${NC}"
else
    echo -e "${RED}     ❌ package.json não encontrado!${NC}"
    ALL_OK=false
fi
echo ""

# 6. Containers
echo -e "${CYAN}[6/6] Verificando containers Docker...${NC}"
CONTAINERS=$(docker ps --filter "name=blogapi" --format "{{.Names}}: {{.Status}}" 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    echo -e "${GREEN}     ✅ Containers BlogAPI encontrados:${NC}"
    while IFS= read -r line; do
        echo "     - $line"
    done <<< "$CONTAINERS"
else
    echo -e "${YELLOW}     ⚠️  Nenhum container BlogAPI rodando${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                📋 RESUMO DA VERIFICAÇÃO                      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✨ Ambiente pronto para uso!${NC}"
    echo -e "${CYAN}Execute: iniciar-ambiente-local.bat${NC}"
else
    echo -e "${YELLOW}⚠️  Ambiente com problemas. Verifique os erros acima.${NC}"
fi
echo ""

