#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script de Testes - DynamoDB Local
# ═══════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "  🧪 Testes DynamoDB Local"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar Docker
if ! docker ps &> /dev/null; then
    echo "❌ Docker não está rodando!"
    exit 1
fi

# Verificar DynamoDB Local
if ! docker ps --filter "fullName=dynamodb" --filter "status=running" | grep -q dynamodb; then
    echo "⚠️  DynamoDB Local não está rodando. Iniciando..."
    cd ..
    docker-compose up -d dynamodb-local
    sleep 5
fi

# Verificar/Configurar DATABASE_PROVIDER
if [ -f "../.env" ]; then
    if ! grep -q "DATABASE_PROVIDER=DYNAMODB" ../.env; then
        echo "⚠️  Configurando DATABASE_PROVIDER=DYNAMODB..."
        sed -i 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=DYNAMODB/' ../.env
    fi
fi

# Criar tabelas
cd ..
echo "🔹 Criando/verificando tabelas DynamoDB..."
npm run dynamodb:create-tables

# Executar testes
echo ""
echo "🔹 Executando testes..."
npx jest tests/integration/dynamodb.integration.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ TODOS OS TESTES PASSARAM! 🎉"
    echo ""
    echo "📊 RESUMO:"
    echo "  • DynamoDB: Conectado ✅"
    echo "  • Tabelas: Criadas ✅"
    echo "  • CRUD: Validado ✅"
    echo "  • Queries: OK ✅"
    echo ""
    echo "🌐 Acesse o DynamoDB Admin:"
    echo "   http://localhost:8001"
    echo ""
    exit 0
else
    echo ""
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo ""
    echo "🔍 Verifique os erros acima"
    echo "💡 Verifique logs: docker logs blogapi-dynamodb"
    echo ""
    exit 1
fi

