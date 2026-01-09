# Build multi-estágio para otimização de produção
FROM node:20-alpine AS base

# Instala dependências apenas quando necessário
FROM base AS deps
# Adiciona bibliotecas de compatibilidade e curl para health checks
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copia arquivos de dependências e instala com pnpm
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Reconstrói o código fonte apenas quando necessário
FROM base AS builder
WORKDIR /app
# Copia node_modules do estágio de dependências
COPY --from=deps /app/node_modules ./node_modules
# Copia todo o código fonte
COPY . .

# Habilita pnpm para os passos de build
RUN corepack enable pnpm

# Gera o cliente Prisma (caminho explícito do schema)
RUN pnpm prisma generate --schema ./src/database/mongodb/prisma/schema.prisma

# Compila a aplicação
ENV NODE_ENV production
RUN pnpm build

# Imagem de produção - estágio final otimizado
FROM base AS runner
WORKDIR /app

# Define ambiente de produção
ENV NODE_ENV production

# Instala curl para health check
RUN apk add --no-cache curl

# Cria grupo e usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copia aplicação compilada do estágio builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Define permissões corretas para o usuário nodejs
RUN chown -R nodejs:nodejs /app

# Executa como usuário não-root
USER nodejs

# Expõe a porta da API
EXPOSE 4000

# Variáveis de ambiente para o servidor
ENV PORT=4000
ENV HOST=0.0.0.0

# Verificação de saúde do container
# Intervalo: 30s | Timeout: 3s | Início: 5s | Tentativas: 3
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:4000/api/v1/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"]
