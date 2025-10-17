#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script para Atualizar Credenciais AWS no .env
# ═══════════════════════════════════════════════════════════════════════════

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Atualizar Credenciais AWS no .env                     ║"
echo "╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Solicitar Access Key ID
echo -e "${YELLOW}Digite o AWS Access Key ID (AKIA...):${NC}"
read -r ACCESS_KEY_ID

# Solicitar Secret Access Key
echo -e "${YELLOW}Digite o AWS Secret Access Key:${NC}"
read -rs SECRET_ACCESS_KEY
echo ""

# Confirmar
echo -e "${YELLOW}⚠️  Confirme os dados:${NC}"
echo -e "${CYAN}Access Key ID: $ACCESS_KEY_ID${NC}"
echo -e "${CYAN}Secret Access Key: ${SECRET_ACCESS_KEY:0:10}**********${NC}"
echo ""

echo -e "${YELLOW}Atualizar o .env com esses valores? (S/N):${NC}"
read -r CONFIRM

if [[ "$CONFIRM" =~ ^[Ss]$ ]]; then
    ENV_FILE="../.env"
    
    # Criar .env se não existir
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}Arquivo .env não encontrado! Copiando de env.example...${NC}"
        cp "../env.example" "$ENV_FILE"
    fi
    
    # Criar backup
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    
    # Atualizar valores
    sed -i "s/AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID/" "$ENV_FILE"
    sed -i "s|AWS_SECRET_ACCESS_KEY=.*|AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY|" "$ENV_FILE"
    
    echo -e "${GREEN}✅ Credenciais AWS atualizadas com sucesso!${NC}"
    echo ""
    echo -e "${CYAN}📋 Resumo:${NC}"
    echo "  AWS_ACCESS_KEY_ID: $ACCESS_KEY_ID"
    echo "  AWS_SECRET_ACCESS_KEY: ********"
else
    echo -e "${RED}❌ Operação cancelada${NC}"
fi

echo ""

