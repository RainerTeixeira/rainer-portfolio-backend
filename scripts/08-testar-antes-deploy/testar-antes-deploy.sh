#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 🧪 SCRIPT DE TESTE LOCAL ANTES DE DEPLOY AWS
# ═══════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "  🧪 TESTE LOCAL COMPLETO - SIMULANDO AMBIENTE AWS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Ler PORT do .env (fallback para 4000)
API_PORT=$(grep -oP '^PORT\s*=\s*\K\d+' .env 2>/dev/null || echo "4000")
BASE_URL="http://localhost:${API_PORT}"
echo "🔧 Usando porta do .env: $API_PORT"

# Verificar Docker
if ! docker ps &> /dev/null; then
    echo "❌ Docker não está rodando!"
    exit 1
fi

# Configurar .env
cp ../../.env ../../.env.backup 2>/dev/null
sed -i 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=DYNAMODB/' ../../.env
echo "✅ .env configurado para DynamoDB Local"

# Iniciar DynamoDB
cd ../..
docker-compose up -d dynamodb-local
sleep 5

# Criar tabelas
npm run dynamodb:create-tables

# Popular dados
npm run dynamodb:seed

# Testar endpoints
echo ""
echo "🧪 Testando endpoints..."

# Health Check
if curl -s "$BASE_URL/health" | grep -q "ok"; then
    echo "   1. Health Check... ✅"
else
    echo "   1. Health Check... ❌"
fi

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📝 Próximos passos para deploy AWS:"
echo "   1. aws configure"
echo "   2. cd src/lambda && sam build"
echo "   3. sam deploy --guided"
echo ""

