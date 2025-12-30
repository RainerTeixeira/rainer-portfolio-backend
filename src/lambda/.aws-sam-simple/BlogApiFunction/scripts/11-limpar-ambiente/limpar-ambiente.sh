#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Limpeza Completa do Ambiente
# Descrição: Remove todos containers, volumes, node_modules e configurações
# ═══════════════════════════════════════════════════════════════════════════

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

clear

echo -e "${RED}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🧹 RESET COMPLETO DO AMBIENTE                       ║"
echo "║      LIMPEZA TOTAL DOCKER + NODE + DADOS                    ║"
echo "╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${RED}⚠️  ⚠️  ⚠️  ATENÇÃO: ESTA OPERAÇÃO É DESTRUTIVA! ⚠️  ⚠️  ⚠️${NC}"
echo ""
echo -e "${RED}🔴 Esta operação irá remover:${NC}"
echo "   • Todos os containers Docker"
echo "   • Todas as imagens Docker"
echo "   • Todos os volumes Docker (DADOS SERÃO PERDIDOS)"
echo "   • Todas as redes Docker"
echo "   • Todos os processos Node.js"
echo "   • node_modules"
echo "   • Arquivo .env"
echo "   • Logs e arquivos temporários"
echo ""

read -p "CONFIRMAR RESET COMPLETO? [S/N]: " confirm

if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${GREEN}✅ Operação cancelada pelo usuário.${NC}"
    echo ""
    exit 0
fi

echo ""
echo -e "${RED}🚀 INICIANDO RESET COMPLETO...${NC}"
echo ""

# 1. Parar processos Node.js
echo -e "${CYAN}[1/7] 🛑 PARANDO PROCESSOS NODE.JS...${NC}"
pkill -f node 2>/dev/null || true
echo -e "${GREEN}      ✅ Processos Node.js finalizados${NC}"
echo ""

# 2. Parar e remover containers
echo -e "${CYAN}[2/7] 🐳 PARANDO E REMOVENDO CONTAINERS DOCKER...${NC}"
docker ps -aq | xargs -r docker stop 2>/dev/null
docker ps -aq | xargs -r docker rm -f 2>/dev/null
echo -e "${GREEN}      ✅ Todos os containers removidos${NC}"
echo ""

# 3. Remover imagens
echo -e "${CYAN}[3/7] 📦 REMOVENDO IMAGENS DOCKER...${NC}"
docker images -q | xargs -r docker rmi -f 2>/dev/null
echo -e "${GREEN}      ✅ Todas as imagens removidas${NC}"
echo ""

# 4. Remover volumes
echo -e "${CYAN}[4/7] 💾 REMOVENDO VOLUMES DOCKER...${NC}"
docker volume ls -q | xargs -r docker volume rm -f 2>/dev/null
echo -e "${GREEN}      ✅ Todos os volumes removidos${NC}"
echo ""

# 5. Limpeza do sistema Docker
echo -e "${CYAN}[5/7] 🧹 LIMPEZA DO SISTEMA DOCKER...${NC}"
docker system prune -a -f --volumes 2>/dev/null
docker network prune -f 2>/dev/null
echo -e "${GREEN}      ✅ Sistema Docker limpo${NC}"
echo ""

# 6. Limpar arquivos do projeto
echo -e "${CYAN}[6/7] 📁 LIMPANDO ARQUIVOS DO PROJETO...${NC}"

cd ..

if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}      ✅ node_modules removido${NC}"
fi

if [ -f ".env" ]; then
    cp .env .env.backup
    rm .env
    echo -e "${GREEN}      ✅ Arquivo .env removido (backup criado)${NC}"
fi

if [ -d "logs" ]; then
    rm -rf logs
    echo -e "${GREEN}      ✅ Logs removidos${NC}"
fi

rm -f *.log *.tmp 2>/dev/null
echo -e "${GREEN}      ✅ Arquivos temporários removidos${NC}"
echo ""

# 7. Limpar cache npm
echo -e "${CYAN}[7/7] 📦 LIMPANDO CACHE NPM...${NC}"
npm cache clean --force 2>/dev/null
echo -e "${GREEN}      ✅ Cache do npm limpo${NC}"
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 RESET COMPLETO COM SUCESSO!                      ║${NC}"
echo -e "${GREEN}║      AMBIENTE 100% LIMPO - PRONTO PARA COMEÇAR              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}🚀 PARA COMEÇAR DO ZERO:${NC}"
echo "   1. npm install                       - Instalar dependências"
echo "   2. iniciar-servidor-completo.bat    - Iniciar ambiente"
echo ""

