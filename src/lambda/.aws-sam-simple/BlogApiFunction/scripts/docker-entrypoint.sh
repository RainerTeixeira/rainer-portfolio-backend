#!/bin/sh

# Docker Entrypoint Script
# Inicializa os bancos de dados e sobe a aplicação

set -e

echo "🚀 Inicializando containers..."

# Aguarda MongoDB estar disponível
echo "⏳ Aguardando MongoDB..."
while ! nc -z mongodb 27017; do
  sleep 0.5
done
echo "✅ MongoDB está pronto!"

# Gera Prisma Client em runtime
if [ "$PRISMA_GENERATE_ON_START" = "true" ]; then
  echo "🔧 Gerando Prisma Client..."
  npx prisma generate --schema=src/database/mongodb/prisma/schema.prisma
fi

# Aguarda DynamoDB estar disponível (se estiver usando)
if [ "$USE_DYNAMODB" = "true" ]; then
  echo "⏳ Aguardando DynamoDB..."
  while ! nc -z dynamodb-local 8000; do
    sleep 0.5
  done
  echo "✅ DynamoDB está pronto!"
fi

# Executa seed do MongoDB se solicitado
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Executando seed do MongoDB..."
  if [ -f "scripts/mongodb.seed.js" ]; then
    node scripts/mongodb.seed.js
  elif [ -f "src/database/mongodb/prisma/mongodb.seed.ts" ]; then
    npx tsx src/database/mongodb/prisma/mongodb.seed.ts
  else
    echo "⚠️  Script de seed não encontrado"
  fi
fi

# Inicia a aplicação
echo "🚀 Iniciando aplicação..."
exec "$@"
