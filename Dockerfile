# Multi-stage build para produção
FROM node:20-alpine AS builder

# Define working directory
WORKDIR /app

# Copia package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instala pnpm e dependências
RUN npm install -g pnpm
RUN npm install -g tsx
RUN pnpm install --ignore-scripts

# Copia o código fonte
COPY . .

# Build da aplicação (sem gerar Prisma Client)
RUN pnpm run build

# Stage de produção
FROM node:20-alpine AS production

# Instala dependências necessárias para produção
RUN apk add --no-cache \
    curl \
    wget \
    netcat-openbsd \
    && rm -rf /var/cache/apk/*

# Cria usuário non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Define working directory
WORKDIR /app

# Copia package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instala pnpm
RUN npm install -g pnpm
RUN npm install -g tsx

# Instala apenas dependências de produção
RUN pnpm install --ignore-scripts --prod

# Copia código buildado do stage builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nodejs:nodejs /app/src/database/mongodb/prisma ./src/database/mongodb/prisma

# Instala Prisma CLI e gera o Prisma Client
RUN npm install -g prisma@6.17.1
RUN npx prisma generate --schema=src/database/mongodb/prisma/schema.prisma

# Cria diretório de logs
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Muda para usuário non-root
USER nodejs

# Expõe porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Script de entrada que inicializa os bancos e sobe a aplicação
COPY --chown=nodejs:nodejs ./scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
