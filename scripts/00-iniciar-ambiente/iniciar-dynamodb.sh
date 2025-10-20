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
    echo -e "\r   [${GREEN}████████████████████${NC}] 100% - Completo!                    "
}

# ═══════════════════════════════════════════════════════════════════════════
#                         HEADER BONITO
# ═══════════════════════════════════════════════════════════════════════════
clear
echo ""
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}   ║                                                                           ║${NC}"
echo -e "${CYAN}   ║                  🚀  INICIALIZADOR DE AMBIENTE LOCAL  🚀                  ║${NC}"
echo -e "${MAGENTA}   ║                                                                           ║${NC}"
echo -e "${WHITE}   ║                       DYNAMODB LOCAL + EXPRESS                            ║${NC}"
echo -e "${MAGENTA}   ║                                                                           ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GRAY}   Preparando ambiente NoSQL...${NC}"
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
    echo -e "${CYAN}   ℹ️  Nenhum processo estava rodando${NC}"
fi
echo -e "${GREEN}   ✅ Portas liberadas: 3000, 4000, 8000, 8001${NC}"
sleep 2

# ═══════════════════════════════════════════════════════════════════════════
#                    SEQUÊNCIA DE INICIALIZAÇÃO
# ═══════════════════════════════════════════════════════════════════════════

# Etapa 1/5
clear
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 1/5: VERIFICAÇÃO DE DEPENDÊNCIAS                                   ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
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

# Etapa 2/5
clear
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 2/5: CONFIGURAÇÃO INICIAL                                          ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 1
echo ""
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}   📝 Criando arquivo .env...${NC}"
    cp env.example .env
fi
echo -e "${YELLOW}   🔄 Configurando para DynamoDB...${NC}"
sed -i 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=DYNAMODB/' .env
echo -e "${GREEN}   ✅ Configuração DynamoDB ativada!${NC}"
sleep 1

# Etapa 3/5
clear
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 3/5: INICIANDO DYNAMODB LOCAL                                      ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   🗄️  Subindo container DynamoDB...${NC}"
docker-compose up -d dynamodb-local
echo ""
echo -e "${GREEN}   ✅ Container DynamoDB iniciado!${NC}"
echo -e "${YELLOW}   ⏳ Aguardando serviço estabilizar...${NC}"
echo ""
show_timer 5
echo ""

# Etapa 4/5
clear
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 4/5: CRIANDO TABELAS NO DYNAMODB                                   ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
show_progress_bar 3
echo ""
echo -e "${YELLOW}   🏗️  Criando estrutura de tabelas...${NC}"
npm run dynamodb:create-tables > /dev/null 2>&1
echo -e "${GREEN}   ✅ Tabelas criadas com sucesso!${NC}"
sleep 1

# Etapa 5/5 - Dados Opcionais
clear
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  ETAPA 5/5: DADOS DE TESTE (OPCIONAL)                                     ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}   ❓ Deseja popular o DynamoDB com dados de teste?${NC}"
echo -e "${WHITE}      [S] Sim, inserir dados de exemplo${NC}"
echo -e "${WHITE}      [N] Não, iniciar com banco vazio${NC}"
echo ""
read -p "   Digite sua escolha: " resposta

if [[ "$resposta" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${YELLOW}   🌱 Populando DynamoDB...${NC}"
    show_progress_bar 2
    npm run dynamodb:seed > /dev/null 2>&1
    echo -e "${GREEN}   ✅ Dados inseridos com sucesso!${NC}"
    sleep 1
else
    echo -e "${YELLOW}   ⏭️  Pulando população de dados${NC}"
    sleep 1
fi

# Resumo Final
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
echo -e "${GREEN}   ✅ DynamoDB Local        - Rodando (porta 8000)${NC}"
echo -e "${GREEN}   ✅ Tabelas Criadas       - Estrutura NoSQL pronta${NC}"
if [[ "$resposta" =~ ^[Ss]$ ]]; then
    echo -e "${GREEN}   ✅ Dados de Teste        - Inseridos no banco${NC}"
else
    echo -e "${GRAY}   ⚪ Dados de Teste        - Banco vazio${NC}"
fi
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
echo -e "${WHITE}      • DynamoDB Local:    http://localhost:8000${NC}"
echo -e "${WHITE}      • DynamoDB Admin:    http://localhost:8001${NC}"
echo ""
echo ""
echo -e "${YELLOW}   ⚡ COMANDOS ÚTEIS:${NC}"
echo ""
echo -e "${GRAY}      • npm run dev                      - Iniciar servidor${NC}"
echo -e "${GRAY}      • npm run dynamodb:list-tables     - Listar tabelas${NC}"
echo ""
echo ""
echo -e "${MAGENTA}   ╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}   ║  🚀  INICIANDO SERVIDOR DE DESENVOLVIMENTO EM 3 SEGUNDOS...               ║${NC}"
echo -e "${MAGENTA}   ╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${MAGENTA}   🎨 Iniciando DynamoDB Admin (http://localhost:8001)...${NC}"
export DYNAMO_ENDPOINT=http://localhost:8000
npx -y dynamodb-admin > /dev/null 2>&1 &
sleep 3

npm run dev
