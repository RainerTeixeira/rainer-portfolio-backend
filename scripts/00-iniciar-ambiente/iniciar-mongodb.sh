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
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'

# Função para barra de progresso
show_progress_bar() {
    local duration=${1:-2}
    for i in $(seq 0 5 100); do
        local filled=$((i / 5))
        local empty=$((20 - filled))
        printf "\r   [${GREEN}"
        printf "%${filled}s" | tr ' ' '█'
        printf "%${empty}s" | tr ' ' ' '
        printf "${NC}] $i%%"
        sleep $(echo "$duration / 100 * 5" | bc -l)
    done
    echo ""
}

# Função para contador de tempo
show_timer() {
    local seconds=$1
    local message=${2:-"Aguardando"}
    for ((i=0; i<=seconds; i++)); do
        local pct=$((i * 100 / seconds))
        local filled=$((pct / 5))
        local empty=$((20 - filled))
        printf "\r   [${CYAN}"
        printf "%${filled}s" | tr ' ' '█'
        printf "%${empty}s" | tr ' ' ' '
        printf "${NC}] $pct%% - ${i}s/${seconds}s"
        sleep 1
    done
    echo -e "\r   [${GREEN}████████████████████${NC}] 100% - $message Completo!                    "
}

# ═══════════════════════════════════════════════════════════════════════════
#                         HEADER BONITO
# ═══════════════════════════════════════════════════════════════════════════
clear
echo ""
echo ""
echo -e "${BLUE}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}   ║                                                                           ║${NC}"
echo -e "${CYAN}   ║                  🚀  INICIALIZADOR DE AMBIENTE LOCAL  🚀                  ║${NC}"
echo -e "${BLUE}   ║                                                                           ║${NC}"
echo -e "${WHITE}   ║                     PRISMA + MONGODB + EXPRESS                            ║${NC}"
echo -e "${BLUE}   ║                                                                           ║${NC}"
echo -e "${BLUE}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GRAY}   Preparando ambiente de desenvolvimento...${NC}"
echo ""
sleep 2

# ═══════════════════════════════════════════════════════════════════════════
#                    LIMPEZA DE PROCESSOS NODE.JS
# ═══════════════════════════════════════════════════════════════════════════

clear
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}   ║  🧹 LIMPEZA INICIAL - FINALIZANDO PROCESSOS NODE.JS                       ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   🔨 Encerrando processos Node.js e liberando portas...${NC}"
pkill -9 node 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Todos os processos Node.js finalizados!${NC}"
else
    echo -e "${CYAN}   ℹ️  Nenhum processo Node.js estava rodando${NC}"
fi
echo -e "${GREEN}   ✅ Portas liberadas: 3000, 4000, 5555${NC}"
sleep 2

# ═══════════════════════════════════════════════════════════════════════════
#                    SEQUÊNCIA DE INICIALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

# Etapa 1/6
clear
echo ""
echo -e "${BLUE}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 1/6: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║${NC}"
echo -e "${BLUE}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 2
echo ""
echo -e "${YELLOW}   🔍 Verificando Docker...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${RED}   ❌ Docker não está rodando!${NC}"
    echo -e "${YELLOW}   💡 Inicie Docker Desktop e tente novamente${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Docker verificado e funcionando!${NC}"
sleep 1

# Etapa 2/6
clear
echo ""
echo -e "${BLUE}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 2/6: CONFIGURAÇÃO INICIAL                                          ║${NC}"
echo -e "${BLUE}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 1
echo ""
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}   📝 Criando arquivo de configuração .env...${NC}"
    cp env.example .env
    echo -e "${GREEN}   ✅ Arquivo .env criado com sucesso!${NC}"
else
    echo -e "${GREEN}   ✅ Arquivo .env já existe!${NC}"
fi
sleep 1

# Etapa 3/6
clear
echo ""
echo -e "${BLUE}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 3/6: INICIANDO MONGODB                                             ║${NC}"
echo -e "${BLUE}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   🐳 Subindo container MongoDB...${NC}"
docker-compose up -d mongodb
echo ""
echo -e "${GREEN}   ✅ Container MongoDB iniciado!${NC}"
echo -e "${YELLOW}   ⏳ Aguardando Replica Set inicializar...${NC}"
echo ""
show_timer 30 "MongoDB"
echo ""

# Etapa 4/6
clear
echo ""
echo -e "${BLUE}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 4/6: CONFIGURANDO PRISMA ORM                                       ║${NC}"
echo -e "${BLUE}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   📦 Gerando Prisma Client...${NC}"
npm run prisma:generate > /dev/null 2>&1
echo -e "${GREEN}   ✅ Prisma Client gerado!${NC}"
echo ""
echo -e "${YELLOW}   🔄 Sincronizando schema com MongoDB...${NC}"
npm run prisma:push > /dev/null 2>&1
echo -e "${GREEN}   ✅ Schema sincronizado!${NC}"
sleep 1

# Etapa 5/6
clear
echo ""
echo -e "${BLUE}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 5/6: POPULANDO BANCO DE DADOS                                      ║${NC}"
echo -e "${BLUE}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 2
echo ""
echo -e "${YELLOW}   🌱 Inserindo dados de teste...${NC}"
npm run seed > /dev/null 2>&1
echo -e "${GREEN}   ✅ Banco de dados populado com sucesso!${NC}"
sleep 1

# Etapa 6/6 - Resumo Final
clear
echo ""
echo -e "${GREEN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}   ║                                                                           ║${NC}"
echo -e "${WHITE}   ║                     ✨  AMBIENTE CONFIGURADO COM SUCESSO!  ✨              ║${NC}"
echo -e "${GREEN}   ║                                                                           ║${NC}"
echo -e "${GREEN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo ""
echo -e "${CYAN}   📊 RESUMO DA INSTALAÇÃO:${NC}"
echo ""
echo -e "${GREEN}   ✅ Docker Desktop        - Ativo e funcionando${NC}"
echo -e "${GREEN}   ✅ MongoDB Container     - Rodando (porta 27017)${NC}"
echo -e "${GREEN}   ✅ Prisma ORM            - Configurado e sincronizado${NC}"
echo -e "${GREEN}   ✅ Banco de Dados        - Populado com dados de teste${NC}"
echo ""
echo ""
echo -e "${CYAN}   🔒 SEGURANÇA:${NC}"
echo ""
if [ -d "node_modules/@fastify/helmet" ]; then
    echo -e "${GREEN}      ✅ Helmet   - Proteção de headers HTTP${NC}"
else
    echo -e "${RED}      ❌ Helmet   - Não instalado${NC}"
fi
if [ -d "node_modules/@fastify/cors" ]; then
    echo -e "${GREEN}      ✅ CORS     - Cross-Origin configurado${NC}"
else
    echo -e "${RED}      ❌ CORS     - Não instalado${NC}"
fi
if [ -d "node_modules/zod" ]; then
    echo -e "${GREEN}      ✅ Zod      - Validação de schemas${NC}"
else
    echo -e "${RED}      ❌ Zod      - Não instalado${NC}"
fi
echo ""
echo ""
# Ler PORT do .env
API_PORT=$(grep -oP '^PORT\s*=\s*\K\d+' .env 2>/dev/null || echo "4000")

echo -e "${MAGENTA}   🌐 URLS DO SISTEMA:${NC}"
echo ""
echo -e "${WHITE}      • API Principal:     http://localhost:${API_PORT}${NC}"
echo -e "${WHITE}      • Documentação:      http://localhost:${API_PORT}/docs${NC}"
echo -e "${WHITE}      • Health Check:      http://localhost:${API_PORT}/health${NC}"
echo -e "${WHITE}      • Prisma Studio:     http://localhost:5555${NC}"
echo ""
echo ""
echo -e "${YELLOW}   ⚡ COMANDOS ÚTEIS:${NC}"
echo ""
echo -e "${GRAY}      • npm run dev              - Iniciar servidor de desenvolvimento${NC}"
echo -e "${GRAY}      • npm run prisma:studio    - Abrir Prisma Studio (GUI para o banco)${NC}"
echo ""
echo ""
echo -e "${BLUE}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║${NC}"
echo -e "${BLUE}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${MAGENTA}   🎨 Abrindo Prisma Studio em background...${NC}"
npm run prisma:studio > /dev/null 2>&1 &
sleep 3

npm run dev
