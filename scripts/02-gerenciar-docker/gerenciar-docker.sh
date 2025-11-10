#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script: Gerenciar Ambiente Completo de Desenvolvimento
# Descrição: Inicia MongoDB e DynamoDB Local simultaneamente com interfaces gráficas
# ═══════════════════════════════════════════════════════════════════════════

ACTION="${1:-start}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funções auxiliares
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  $1"
    echo "╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar Docker
check_docker() {
    if ! docker ps &> /dev/null; then
        print_error "Docker não está rodando!"
        print_info "Inicie o Docker Desktop e tente novamente."
        return 1
    fi
    return 0
}

# Iniciar ambiente
start_environment() {
    print_header "INICIANDO AMBIENTE COMPLETO DE DESENVOLVIMENTO"
    
    if ! check_docker; then
        return 1
    fi
    
    print_info "Iniciando MongoDB + DynamoDB Local + Interfaces Gráficas..."
    
    cd ..
    docker-compose up -d mongodb dynamodb-local prisma-studio dynamodb-admin
    
    echo ""
    sleep 3
    
    print_success "Ambiente iniciado com sucesso!"
    echo ""
    
    show_status
}

# Parar ambiente
stop_environment() {
    print_header "PARANDO AMBIENTE DE DESENVOLVIMENTO"
    
    print_info "Parando todos os serviços..."
    cd ..
    docker-compose down
    
    print_success "Ambiente parado com sucesso!"
}

# Reiniciar ambiente
restart_environment() {
    print_header "REINICIANDO AMBIENTE DE DESENVOLVIMENTO"
    
    stop_environment
    sleep 2
    start_environment
}

# Mostrar status
show_status() {
    print_header "STATUS DOS SERVIÇOS"
    
    services=("blogapi-mongodb:27017:MongoDB" "blogapi-dynamodb:8000:DynamoDB Local" "blogapi-prisma-studio:5555:Prisma Studio" "blogapi-dynamodb-admin:8001:DynamoDB Admin")
    
    for service_info in "${services[@]}"; do
        IFS=: read -r container port fullName <<< "$service_info"
        
        if docker ps --filter "fullName=$container" --format "{{.Status}}" 2>/dev/null | grep -q "Up"; then
            print_success "$fullName - Rodando (Porta: $port)"
        else
            print_warning "$fullName - Parado"
        fi
    done
    
    echo ""
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ACESSE AS INTERFACES                                     ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${CYAN}🗄️  MongoDB:${NC}"
    echo "   Connection: mongodb://localhost:27017/blog?replicaSet=rs0"
    echo "   GUI: http://localhost:5555 (Prisma Studio)"
    echo ""
    
    echo -e "${CYAN}📊 DynamoDB Local:${NC}"
    echo "   Endpoint: http://localhost:8000"
    echo "   GUI: http://localhost:8001 (DynamoDB Admin)"
    echo ""
    
    echo -e "${GREEN}🚀 Para iniciar a aplicação:${NC}"
    echo "   npm run start:dev"
    echo ""
}

# Ver logs
show_logs() {
    print_header "LOGS DO AMBIENTE"
    
    print_info "Pressione Ctrl+C para sair"
    cd ..
    docker-compose logs -f mongodb dynamodb-local
}

# Limpar volumes
clean_environment() {
    print_header "LIMPANDO AMBIENTE"
    
    print_warning "Isso irá apagar TODOS OS DADOS dos bancos locais!"
    read -p "Tem certeza? (S/N): " confirm
    
    if [[ "$confirm" =~ ^[Ss]$ ]]; then
        cd ..
        docker-compose down -v
        print_success "Volumes removidos com sucesso!"
    else
        print_info "Operação cancelada"
    fi
}

# Executar ação
case "$ACTION" in
    start)
        start_environment
        ;;
    stop)
        stop_environment
        ;;
    restart)
        restart_environment
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_environment
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs|clean}"
        exit 1
        ;;
esac

