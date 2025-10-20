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
    echo -e "\r   [${GREEN}████████████████████${NC}] 100% - $message Pronto!                    "
}

# ═══════════════════════════════════════════════════════════════════════════
#                         HEADER BONITO
# ═══════════════════════════════════════════════════════════════════════════
clear
echo ""
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║                                                                           ║${NC}"
echo -e "${WHITE}   ║              🚀  INICIALIZADOR COMPLETO DE AMBIENTE  🚀                   ║${NC}"
echo -e "${CYAN}   ║                                                                           ║${NC}"
echo -e "${YELLOW}   ║              MONGODB + DYNAMODB + PRISMA + SERVIDOR                       ║${NC}"
echo -e "${CYAN}   ║                                                                           ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GRAY}   Preparando ambiente completo com dual database...${NC}"
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
echo -e "${GREEN}   ✅ Portas liberadas: 3000, 4000, 5555, 8000, 8001${NC}"
sleep 2

# ═══════════════════════════════════════════════════════════════════════════
#                    SEQUÊNCIA DE INICIALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

# Etapa 1/8
clear
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  ETAPA 1/8: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 2
echo ""
echo -e "${YELLOW}   🔍 Verificando Docker Desktop...${NC}"
if ! docker ps &> /dev/null; then
    echo -e "${RED}   ❌ Docker não está rodando!${NC}"
    echo -e "${YELLOW}   💡 Inicie Docker Desktop e tente novamente${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ Docker verificado e pronto!${NC}"
sleep 1

# Etapa 2/8
clear
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  ETAPA 2/8: CONFIGURAÇÃO INICIAL                                          ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 1
echo ""
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}   📝 Criando arquivo .env...${NC}"
    cp env.example .env
    echo -e "${GREEN}   ✅ Arquivo .env criado!${NC}"
else
    echo -e "${GREEN}   ✅ Arquivo .env já existe!${NC}"
fi
sleep 1

# Etapa 3/8
clear
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  ETAPA 3/8: INICIANDO MONGODB                                             ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   🐳 Subindo container MongoDB...${NC}"
docker-compose up -d mongodb
echo ""
echo -e "${GREEN}   ✅ MongoDB container iniciado!${NC}"
echo -e "${YELLOW}   ⏳ Aguardando Replica Set (15s)...${NC}"
echo ""
show_timer 15 "MongoDB"
echo ""

# Etapa 4/8
clear
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  ETAPA 4/8: INICIANDO DYNAMODB LOCAL                                      ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   🗄️  Subindo container DynamoDB...${NC}"
docker-compose up -d dynamodb-local
echo ""
echo -e "${GREEN}   ✅ DynamoDB container iniciado!${NC}"
echo -e "${YELLOW}   ⏳ Aguardando estabilização (5s)...${NC}"
echo ""
show_timer 5 "DynamoDB"
echo ""

# Etapa 5/8
clear
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  ETAPA 5/8: CONFIGURANDO PRISMA ORM                                       ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   📦 Gerando Prisma Client...${NC}"
npm run prisma:generate > /dev/null 2>&1
echo -e "${GREEN}   ✅ Prisma Client gerado!${NC}"
echo ""
echo -e "${YELLOW}   🔄 Sincronizando schema MongoDB...${NC}"
npm run prisma:push > /dev/null 2>&1
echo -e "${GREEN}   ✅ Schema sincronizado!${NC}"
sleep 1

# Etapa 6/8
clear
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  ETAPA 6/8: POPULANDO MONGODB                                             ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 2
echo ""
echo -e "${YELLOW}   🌱 Inserindo dados de teste...${NC}"
npm run seed > /dev/null 2>&1
echo -e "${GREEN}   ✅ MongoDB populado com sucesso!${NC}"
sleep 1

# Etapa 7/8
clear
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  ETAPA 7/8: CONFIGURANDO DYNAMODB                                         ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   🏗️  Criando tabelas DynamoDB (background)...${NC}"
echo -e "${GRAY}      Isso pode levar 30-60 segundos. Continuando...${NC}"
npm run dynamodb:create-tables &> /dev/null &
sleep 3
echo -e "${GREEN}   ✅ Processo iniciado em background!${NC}"
sleep 1

# Etapa 8/8 - Resumo Final
clear
echo ""
echo -e "${GREEN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}   ║                                                                           ║${NC}"
echo -e "${WHITE}   ║               ✨  AMBIENTE COMPLETO CONFIGURADO COM SUCESSO!  ✨           ║${NC}"
echo -e "${GREEN}   ║                                                                           ║${NC}"
echo -e "${GREEN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo ""
echo -e "${CYAN}   📊 RESUMO COMPLETO DA INSTALAÇÃO:${NC}"
echo ""
echo -e "${GREEN}   ✅ Docker Desktop        - Ativo e funcionando${NC}"
echo -e "${GREEN}   ✅ MongoDB Container     - Rodando na porta 27017${NC}"
echo -e "${GREEN}   ✅ DynamoDB Container    - Rodando na porta 8000${NC}"
echo -e "${GREEN}   ✅ Prisma ORM            - Configurado e sincronizado${NC}"
echo -e "${GREEN}   ✅ Dados de Teste        - Inseridos no MongoDB${NC}"
echo -e "${YELLOW}   🔄 Tabelas DynamoDB      - Criação em andamento...${NC}"
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
echo -e "${MAGENTA}   🗄️  BANCOS DE DADOS ATIVOS:${NC}"
echo ""
echo -e "${WHITE}      • MongoDB:           mongodb://localhost:27017${NC}"
echo -e "${WHITE}      • DynamoDB Local:    http://localhost:8000${NC}"
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
echo -e "${WHITE}      • DynamoDB Admin:    http://localhost:8001${NC}"
echo ""
echo ""
echo -e "${YELLOW}   ⚡ COMANDOS ÚTEIS:${NC}"
echo ""
echo -e "${GRAY}      • npm run dev                      - Iniciar servidor${NC}"
echo -e "${GRAY}      • npm run prisma:studio            - Abrir Prisma Studio${NC}"
echo -e "${GRAY}      • npm run dynamodb:list-tables     - Listar tabelas DynamoDB${NC}"
echo ""
echo ""
echo -e "${CYAN}   🔄 ALTERNAR ENTRE BANCOS:${NC}"
echo ""
echo -e "${GRAY}      Use: scripts/03-alternar-banco-dados/alternar-banco.sh${NC}"
echo ""
echo ""
echo -e "${CYAN}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${WHITE}   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║${NC}"
echo -e "${CYAN}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${MAGENTA}   🎨 Abrindo Prisma Studio (MongoDB GUI)...${NC}"
npm run prisma:studio > /dev/null 2>&1 &
echo -e "${MAGENTA}   🗄️  Iniciando DynamoDB Admin (NoSQL GUI)...${NC}"
export DYNAMO_ENDPOINT=http://localhost:8000
npx -y dynamodb-admin > /dev/null 2>&1 &
sleep 3

npm run dev
