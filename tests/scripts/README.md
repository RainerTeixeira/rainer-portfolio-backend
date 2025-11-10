# Scripts de Teste

Este diretório contém scripts para execução e gerenciamento de testes.

## 🚀 Scripts de Execução Automatizada

> **Nota:** Para execução rápida, use `npm test` ou `npm run test:coverage`.  
> Use estes scripts apenas quando precisar de configuração avançada (Docker, segurança, etc).

### `test-all-production.ps1` (Recomendado)
Script PowerShell completo para execução de testes em ambiente de produção simulado.

**Quando usar:**
- Execução completa antes de deploy
- Testes com Docker
- Auditoria de segurança
- Geração de relatórios completos

**Uso:**
```powershell
.\tests\scripts\test-all-production.ps1
.\tests\scripts\test-all-production.ps1 -SkipDocker
.\tests\scripts\test-all-production.ps1 -SkipSecurity -SkipPerformance
```

**Parâmetros:**
- `-SkipDocker`: Pula a inicialização de containers Docker
- `-SkipSecurity`: Pula a auditoria de segurança
- `-SkipPerformance`: Pula testes de performance
- `-OutputDir`: Diretório para salvar relatórios (padrão: `test-reports`)

**Funcionalidades:**
- Inicia containers Docker (MongoDB, DynamoDB Local)
- Executa todos os testes com cobertura
- Executa auditoria de segurança (`npm audit`)
- Gera relatórios detalhados
- Monitora recursos durante execução

### `test-all-production.sh`
Versão Bash do script completo de testes.

**Uso:**
```bash
bash tests/scripts/test-all-production.sh
bash tests/scripts/test-all-production.sh --skip-docker
bash tests/scripts/test-all-production.sh --skip-security --skip-performance
```

**Parâmetros:**
- `--skip-docker`: Pula a inicialização de containers Docker
- `--skip-security`: Pula a auditoria de segurança
- `--skip-performance`: Pula testes de performance
- `--output-dir`: Diretório para salvar relatórios (padrão: `test-reports`)

## 🧪 Scripts de Teste Manual

Scripts Node.js para testes manuais ou debug durante desenvolvimento.

### Scripts Genéricos (Recomendados)

| Script | Propósito | Uso |
|--------|-----------|-----|
| `test-cloudinary-upload.js` | Testa upload de imagens | `node tests/scripts/test-cloudinary-upload.js` |
| `test-create-post.js` | Testa criação de posts | `node tests/scripts/test-create-post.js [email] [senha]` |
| `test-resend-code.js` | Testa reenvio de código | `node tests/scripts/test-resend-code.js` |
| `test-reset-password.js` | Testa reset de senha | `node tests/scripts/test-reset-password.js` |
| `test-verify-email-admin.js` | Testa verificação admin | `node tests/scripts/test-verify-email-admin.js` |

### Scripts Específicos (Debug)

⚠️ **Nota:** Estes scripts são específicos para debug de problemas particulares.

| Script | Propósito | Status |
|--------|-----------|--------|
| `test-login-poboge.js` | Teste de login específico | ⚠️ Manter para histórico |
| `test-register-poboge.js` | Teste de registro específico | ⚠️ Manter para histórico |
| `test-register-xiked.js` | Teste de registro específico | ⚠️ Manter para histórico |
| `test-register-investigate.ts` | Investigação de email | ✅ Útil para debug |

**Recomendação:** Para novos testes, criar scripts genéricos que aceitem parâmetros.

## Estrutura de Diretórios

```
tests/scripts/
├── README.md                    # Este arquivo
│
├── 🚀 Scripts de Execução (Produção/CI)
├── test-all-production.ps1      # Script completo (PowerShell) - RECOMENDADO
└── test-all-production.sh      # Script completo (Bash) - RECOMENDADO
│
├── 🧪 Scripts de Teste Manual (Genéricos)
├── test-cloudinary-upload.js   # Upload de imagens
├── test-create-post.js         # Criação de posts
├── test-register-investigate.ts # Investigação de email
├── test-resend-code.js         # Reenvio de código
├── test-reset-password.js      # Reset de senha
└── test-verify-email-admin.js  # Verificação admin
│
└── 🐛 Scripts de Debug (Histórico)
└── debug/
    ├── README.md
    ├── test-login-poboge.js
    ├── test-register-poboge.js
    └── test-register-xiked.js
```

## 📊 Comparação de Scripts

### Quando Usar Cada Um

| Comando | Quando Usar | Velocidade |
|---------|-------------|------------|
| `npm test` | Testes rápidos durante desenvolvimento | ⚡ Rápido |
| `npm run test:coverage` | Verificar cobertura | ⚡ Rápido |
| `test-all-production.ps1` | Antes de deploy, CI/CD | 🐢 Completo |

### Redundâncias Identificadas e Resolvidas

- ✅ **`run-tests.ps1`** - Removido (redundante com `npm test`)
- ✅ **`test-all-production.*`** - Mantidos (úteis para CI/CD e produção)
- ✅ **Scripts de debug** - Reorganizados em `tests/scripts/debug/`

## Notas

- Todos os scripts de execução mudam automaticamente para o diretório raiz do projeto
- Os relatórios são salvos em `test-reports/` na raiz do projeto
- Os scripts podem ser executados de qualquer diretório
- Para desenvolvimento diário, prefira `npm test` ao invés de scripts PowerShell

