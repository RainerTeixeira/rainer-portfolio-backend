#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script de Testes - MongoDB + Prisma
# ═══════════════════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "  🧪 Testes MongoDB + Prisma"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar Docker
if ! docker ps &> /dev/null; then
    echo "❌ Docker não está rodando!"
    exit 1
fi

# Verificar MongoDB
if ! docker ps --filter "name=mongodb" --filter "status=running" | grep -q mongodb; then
    echo "⚠️  MongoDB não está rodando. Iniciando..."
    cd ..
    docker-compose up -d mongodb
    sleep 5
fi

# Verificar Prisma Client
if [ ! -d "../node_modules/@prisma/client" ]; then
    echo "⚠️  Prisma Client não encontrado. Gerando..."
    cd ..
    npm run prisma:generate
fi

# Executar testes
cd ..
echo "🧪 Executando testes..."
npx jest tests/integration/mongodb-prisma.integration.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ TODOS OS TESTES PASSARAM! 🎉"
    echo ""
    exit 0
else
    echo ""
    echo "❌ ALGUNS TESTES FALHARAM!"
    echo ""
    exit 1
fi

