# 🧠 Memórias do Projeto

Este diretório contém as memórias do projeto, informações estruturadas sobre arquitetura, decisões técnicas e contexto para ferramentas de IA e desenvolvimento.

## 📁 Arquivos

### `initial-memory.json`
Conhecimento geral do projeto, incluindo:
- Descrição do projeto
- Arquitetura e tecnologias
- Módulos principais
- Estratégia de banco de dados
- Integração AWS
- Qualidade de testes
- Documentação

### `technical-details.json`
Detalhes técnicos específicos:
- Endpoints da API (65 endpoints)
- Módulos e suas funcionalidades
- Scripts disponíveis
- Configurações de ambiente
- Métricas de qualidade
- Estrutura de organização

### `code-analysis.json`
Análise de código e arquitetura:
- Entidades e relacionamentos
- Padrões arquiteturais
- Estrutura de módulos
- Sistemas de segurança
- Workflow de desenvolvimento

## 🔄 Atualização Automática

### Comandos NPM

```bash
# Atualizar todas as memórias
npm run memory:update

# Ler todas as memórias
npm run memory:read

# Ler memória específica
npm run memory:read:initial
npm run memory:read:technical
npm run memory:read:code
```

### Scripts Diretos

```bash
# Atualizar memórias
tsx scripts/update-memory.ts

# Ler memórias
tsx scripts/read-memory.ts [all|initial|technical|code]
```

## 📝 Quando Atualizar

Atualize as memórias quando:

1. **Versão do projeto muda** - `package.json` version
2. **Estrutura de pastas muda** - Nova organização
3. **Novos módulos são adicionados** - Novos recursos
4. **Dependências principais mudam** - Framework, ORM, etc.
5. **Métricas de qualidade mudam** - Cobertura de testes, etc.
6. **Scripts são reorganizados** - Estrutura de scripts

## 🤖 Integração com Ferramentas

### Cursor IDE

O arquivo `.cursorrules` na raiz do projeto instrui o Cursor a:
- Sempre ler memórias antes de tarefas
- Atualizar memórias após mudanças significativas
- Usar informações das memórias para contexto

### MCP (Model Context Protocol)

Para usar com MCP, configure o sistema para:
1. Ler `docs/.memories/*.json` no início de cada sessão
2. Atualizar memórias após mudanças significativas
3. Usar informações das memórias como contexto

### Uso Programático

```typescript
import { getMemories, getMemory } from './scripts/read-memory';

// Ler todas as memórias
const memories = getMemories();

// Ler memória específica
const initial = getMemory('initial');
const technical = getMemory('technical');
const code = getMemory('code');
```

## 📊 Estrutura dos Arquivos

Todos os arquivos seguem estrutura JSON consistente:

- `id` - Identificador único
- `type` - Tipo de memória
- `content` - Descrição
- `createdAt` - Data de criação
- `lastModified` - Última atualização
- `tags` - Tags para categorização
- `entities` - Entidades do projeto
- `relations` - Relacionamentos entre entidades

## 🔍 Exemplo de Uso

```bash
# 1. Atualizar memórias após mudança na estrutura
npm run memory:update

# 2. Verificar o que foi atualizado
npm run memory:read

# 3. Ler apenas detalhes técnicos
npm run memory:read:technical
```

## 📌 Localização

```
docs/.memories/
├── initial-memory.json
├── technical-details.json
├── code-analysis.json
└── README.md (este arquivo)
```

---

**Última atualização:** 04 de Novembro de 2025  
**Mantido por:** Sistema de atualização automática (`scripts/update-memory.ts`)

