# Guia de Uso - Sistema de Memória

Este guia explica como usar o sistema de memória configurado para alimentar e ler automaticamente as informações do projeto.

## 📋 Visão Geral

O sistema de memória foi configurado para:
- ✅ Carregar automaticamente todas as memórias do projeto
- ✅ Consolidar informações de múltiplas fontes
- ✅ Fornecer contexto completo para Cursor AI e MCP
- ✅ Atualizar memórias automaticamente

## 🚀 Uso Rápido

### Carregar Memórias

```bash
# Gerar memória consolidada (JSON)
npm run memory:load

# Ver memória em formato texto
npm run memory:load:text
```

### Arquivos de Memória

Os arquivos de memória estão em `docs/.memories/`:

1. **initial-memory.json** - Memória inicial do projeto
2. **technical-details.json** - Detalhes técnicos completos
3. **code-analysis.json** - Análise de código e arquitetura
4. **consolidated-memory.json** - Memória consolidada (gerada)

## 🔧 Configuração

### Cursor AI

O Cursor AI usa automaticamente o arquivo `.cursorrules` na raiz do projeto, que referencia os arquivos de memória.

### MCP (Model Context Protocol)

Para usar com MCP, configure o servidor MCP no seu `mcp.json`:

```json
{
  "mcpServers": {
    "rainer-portfolio-memory": {
      "command": "node",
      "args": [".cursor/memory-loader.mjs"],
      "env": {
        "MEMORY_DIR": "docs/.memories"
      }
    }
  }
}
```

### Scripts NPM

Dois scripts foram adicionados ao `package.json`:

- `npm run memory:load` - Carrega e consolida memórias (JSON)
- `npm run memory:load:text` - Carrega e exibe em formato texto

## 📊 Estrutura da Memória Consolidada

A memória consolidada contém:

```json
{
  "project": {
    "name": "rainer-portfolio-backend",
    "version": "4.1.0",
    "type": "backend",
    "framework": "NestJS 11 + Fastify 4",
    "status": "Production Ready"
  },
  "entities": [
    // 18 entidades do projeto
  ],
  "relations": [
    // 26 relações entre entidades
  ],
  "technicalDetails": {
    // Detalhes técnicos completos
  },
  "context": {
    // Contexto do projeto
  },
  "summary": "Resumo executivo"
}
```

## 🔄 Atualização Automática

### Opção 1: Manual

Execute quando necessário:

```bash
npm run memory:load
```

### Opção 2: Hook Git

Crie um hook Git para atualizar automaticamente após commits:

```bash
# .git/hooks/post-commit
#!/bin/sh
npm run memory:load
```

### Opção 3: Script de Build

Adicione ao pipeline de build:

```json
{
  "scripts": {
    "prebuild": "npm run memory:load && nest build"
  }
}
```

## 📝 Informações Incluídas

A memória consolidada inclui:

- ✅ Arquitetura completa do projeto
- ✅ 65 endpoints REST documentados
- ✅ Módulos organizados por domínio
- ✅ Configurações e features enterprise
- ✅ Padrões e convenções
- ✅ Detalhes técnicos completos

## 🎯 Como o Cursor Usa

1. **Inicialização**: Cursor lê `.cursorrules` na raiz
2. **Contexto**: Referencia arquivos em `docs/.memories/`
3. **Memória Consolidada**: Usa `consolidated-memory.json` para contexto completo
4. **Atualização**: Executa `memory-loader.mjs` quando necessário

## 💡 Dicas

- Execute `npm run memory:load` após mudanças significativas
- Mantenha os arquivos de memória atualizados
- Use `memory:load:text` para revisar o conteúdo
- A memória consolidada é recriada a cada execução

## 🔍 Verificação

Para verificar se tudo está funcionando:

```bash
# Verificar se arquivos existem
ls docs/.memories/

# Gerar memória consolidada
npm run memory:load

# Verificar conteúdo
cat docs/.memories/consolidated-memory.json | head -20
```

## 📚 Referências

- `.cursor/README.md` - Documentação completa do sistema
- `.cursor/memory-config.json` - Configuração detalhada
- `.cursorrules` - Regras do Cursor AI
- `docs/03-GUIAS/GUIA_MEMORIAS.md` - Guia completo de memórias

