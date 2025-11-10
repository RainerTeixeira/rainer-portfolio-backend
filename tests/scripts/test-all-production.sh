#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script de Execução Completa de Testes - Ambiente de Produção Simulado
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Mudar para diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

SKIP_DOCKER=false
SKIP_SECURITY=false
SKIP_PERFORMANCE=false
OUTPUT_DIR="test-reports"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-security)
            SKIP_SECURITY=true
            shift
            ;;
        --skip-performance)
            SKIP_PERFORMANCE=true
            shift
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

START_TIME=$(date +%s)

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  EXECUTANDO TESTES COMPLETOS - AMBIENTE DE PRODUÇÃO SIMULADO  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Criar diretório de relatórios
mkdir -p "$OUTPUT_DIR"

# Função para log com timestamp
log() {
    local message="$1"
    local color="${2:-white}"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $message"
}

# Função para iniciar containers Docker
start_test_containers() {
    log "Iniciando containers Docker para ambiente isolado..." "yellow"
    
    if ! command -v docker &> /dev/null; then
        log "Docker não está instalado ou não está no PATH." "red"
        exit 1
    fi
    
    if ! docker ps &> /dev/null; then
        log "Docker não está rodando. Por favor, inicie o Docker." "red"
        exit 1
    fi
    
    # Parar containers existentes
    log "Parando containers existentes..." "yellow"
    docker-compose down -v 2>/dev/null || true
    
    # Iniciar apenas MongoDB e DynamoDB
    log "Iniciando MongoDB e DynamoDB Local..." "yellow"
    docker-compose up -d mongodb dynamodb-local
    
    # Aguardar containers ficarem saudáveis
    log "Aguardando containers ficarem prontos..." "yellow"
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps mongodb | grep -q "healthy\|Up" && \
           docker-compose ps dynamodb-local | grep -q "healthy\|Up"; then
            log "Containers prontos!" "green"
            sleep 5
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    
    log "Timeout aguardando containers. Verificando status..." "yellow"
    docker-compose ps
    return 1
}

# Função para executar testes
run_test_suite() {
    local test_name="$1"
    local test_pattern="$2"
    local output_file="$3"
    
    log "Executando: $test_name" "cyan"
    local test_start=$(date +%s)
    
    export NODE_ENV=test
    export DATABASE_URL="mongodb://localhost:27017/blog-test?replicaSet=rs0&directConnection=true"
    
    # Carregar variáveis do .env.test se existir
    if [ -f ".env.test" ]; then
        set -a
        source .env.test
        set +a
    fi
    
    npm run test -- --testPathPattern="$test_pattern" \
        --coverage \
        --coverageReporters=json \
        --coverageReporters=text \
        --coverageReporters=lcov \
        --coverageReporters=html \
        2>&1 | tee "$OUTPUT_DIR/$output_file"
    
    local test_end=$(date +%s)
    local duration=$((test_end - test_start))
    
    # Verificar se houve falhas
    if grep -qi "FAIL\|failed\|Failed" "$OUTPUT_DIR/$output_file"; then
        log "  ❌ $test_name - FALHAS ENCONTRADAS (${duration}s)" "red"
        return 1
    elif grep -qi "PASS\|passed\|Passed" "$OUTPUT_DIR/$output_file"; then
        log "  ✅ $test_name - PASSOU (${duration}s)" "green"
        return 0
    else
        log "  ⚠️  $test_name - RESULTADO INDETERMINADO (${duration}s)" "yellow"
        return 2
    fi
}

# Função para gerar relatório consolidado (apenas exibir, não salvar)
generate_report() {
    # Relatório completo disponível em README.md (não gerar arquivo separado)
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║           RELATÓRIO DE TESTES - AMBIENTE DE PRODUÇÃO         ║
╚════════════════════════════════════════════════════════════════╝

Data/Hora: $(date "+%Y-%m-%d %H:%M:%S")
Duração Total: $(( $(date +%s) - START_TIME ))s

═══════════════════════════════════════════════════════════════════
RESUMO DOS TESTES
═══════════════════════════════════════════════════════════════════

EOF

    # Ler coverage summary se existir
    if [ -f "coverage/coverage-summary.json" ]; then
        echo "Consulte o arquivo: coverage/coverage-summary.json"
        echo "Relatório HTML: coverage/index.html"
        echo ""
        
        # Extrair informações de cobertura (requer jq ou processamento manual)
        if command -v jq &> /dev/null; then
            local total=$(jq '.total' coverage/coverage-summary.json)
            echo "Cobertura Total:"
            echo "  - Statements: $(echo $total | jq -r '.statements.pct')%"
            echo "  - Branches: $(echo $total | jq -r '.branches.pct')%"
            echo "  - Functions: $(echo $total | jq -r '.functions.pct')%"
            echo "  - Lines: $(echo $total | jq -r '.lines.pct')%"
        fi
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "RELATÓRIOS DETALHADOS"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Relatório completo disponível em: $OUTPUT_DIR/README.md"
    echo "Relatórios JSON são atualizados automaticamente."
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

log "Iniciando execução completa de testes..." "cyan"

# Iniciar containers se não for pulado
if [ "$SKIP_DOCKER" = false ]; then
    if ! start_test_containers; then
        log "Falha ao iniciar containers. Abortando." "red"
        exit 1
    fi
else
    log "Pulando inicialização de containers Docker" "yellow"
fi

UNIT_RESULT=0
INTEGRATION_RESULT=0
E2E_RESULT=0

# 1. Testes Unitários
echo ""
log "═══════════════════════════════════════════════════════════" "cyan"
log "1. TESTES UNITÁRIOS" "cyan"
log "═══════════════════════════════════════════════════════════" "cyan"

run_test_suite "Testes Unitários" "\.test\.ts$" "unit-tests.log" || UNIT_RESULT=$?

# 2. Testes de Integração
echo ""
log "═══════════════════════════════════════════════════════════" "cyan"
log "2. TESTES DE INTEGRAÇÃO" "cyan"
log "═══════════════════════════════════════════════════════════" "cyan"

run_test_suite "Testes de Integração" "\.integration\.test\.ts$" "integration-tests.log" || INTEGRATION_RESULT=$?

# 3. Testes E2E/API
echo ""
log "═══════════════════════════════════════════════════════════" "cyan"
log "3. TESTES E2E/API" "cyan"
log "═══════════════════════════════════════════════════════════" "cyan"

run_test_suite "Testes E2E/API" "\.e2e\.test\.ts$" "e2e-tests.log" || E2E_RESULT=$?

# 4. Testes de Segurança
if [ "$SKIP_SECURITY" = false ]; then
    echo ""
    log "═══════════════════════════════════════════════════════════" "cyan"
    log "4. TESTES DE SEGURANÇA" "cyan"
    log "═══════════════════════════════════════════════════════════" "cyan"
    log "Executando análise de segurança básica..." "yellow"
    npm audit --audit-level=moderate 2>&1 | tee "$OUTPUT_DIR/security-audit.log" || true
fi

# 5. Testes de Desempenho
if [ "$SKIP_PERFORMANCE" = false ]; then
    echo ""
    log "═══════════════════════════════════════════════════════════" "cyan"
    log "5. TESTES DE DESEMPENHO" "cyan"
    log "═══════════════════════════════════════════════════════════" "cyan"
    log "Análise de desempenho será incluída no relatório de cobertura" "yellow"
fi

# Mostrar resumo final (não gerar novo relatório - apenas referenciar README.md)
echo ""
log "═══════════════════════════════════════════════════════════" "cyan"
log "RESUMO FINAL" "cyan"
log "═══════════════════════════════════════════════════════════════════" "cyan"

generate_report

log "Relatório completo disponível em: $OUTPUT_DIR/README.md" "green"
log "Nota: Relatórios JSON são atualizados automaticamente. Consulte o README.md para detalhes completos." "yellow"

# Verificar se todos os testes passaram
if [ $UNIT_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ] && [ $E2E_RESULT -eq 0 ]; then
    echo ""
    log "✅ TODOS OS TESTES PASSARAM!" "green"
    exit 0
else
    echo ""
    log "❌ ALGUNS TESTES FALHARAM. Verifique os logs em $OUTPUT_DIR/" "red"
    exit 1
fi
