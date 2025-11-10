# 🎓 Guia Completo para Novos Desenvolvedores - Sistema de Testes

**Versão:** 2.0.0  
**Data:** 2025-01-27  
**Status:** ✅ Produção-Ready

---

## 📋 Índice

1. [Início Rápido](#início-rápido)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Executando Testes](#executando-testes)
4. [Adicionando Novos Testes](#adicionando-novos-testes)
5. [Scripts Disponíveis](#scripts-disponíveis)
6. [Troubleshooting](#troubleshooting)
7. [Referências](#referências)

---

## 🚀 Início Rápido

### 1. Configuração Inicial

```bash
# 1. Instalar dependências
npm install

# 2. Verificar se Docker está rodando (para testes de integração)
docker ps

# 3. Iniciar containers de teste (se necessário)
docker-compose up -d mongodb dynamodb-local

# 4. Executar testes pela primeira vez
npm test
```

### 2. Primeiro Teste

```bash
# Executar apenas um módulo específico
npm test -- tests/modules/auth

# Com cobertura
npm test -- tests/modules/auth --coverage
```

### 3. Verificar Cobertura

```bash
# Gerar relatório de cobertura
npm run test:coverage

# Abrir relatório HTML (após gerar)
start tests/coverage/index.html  # Windows
open tests/coverage/index.html    # Mac/Linux
```

---

## 📁 Estrutura de Testes

### Organização Principal

```
tests/
├── 📄 README.md                    # Documentação geral
├── 📄 ESTRUTURA_PRODUCAO.md        # Estrutura completa
├── 📄 GUIA_NOVOS_DESENVOLVEDORES.md # Este arquivo
├── ⚙️ setup.ts                     # Configuração global
│
├── 📁 config/                      # Testes de configuração
├── 📁 e2e/                         # Testes end-to-end
├── 📁 fixtures/                    # Dados de teste
├── 📁 helpers/                     # Utilitários e mocks
├── 📁 integration/                 # Testes de integração
├── 📁 lambda/                      # Testes de Lambda
├── 📁 modules/                     # Testes por módulo ⭐
├── 📁 prisma/                      # Testes de banco
├── 📁 scripts/                     # Scripts de execução
├── 📁 test-reports/                # Relatórios
└── 📁 utils/                       # Testes de utilitários
```

### ⭐ Estrutura de Módulos (Espelha `src/modules/`)

```
tests/modules/
├── auth/
│   ├── auth.controller.test.ts
│   ├── auth.repository.test.ts
│   └── auth.service.test.ts
├── posts/
│   ├── post.schema.test.ts
│   ├── posts.controller.test.ts
│   ├── posts.repository.test.ts
│   └── posts.service.test.ts
└── ... (todos os módulos seguem este padrão)
```

**Regra de Ouro:** A estrutura de `tests/modules/` deve **espelhar exatamente** `src/modules/`.

---

## 🧪 Executando Testes

### Comandos NPM (Recomendado)

```bash
# Todos os testes
npm test

# Testes com cobertura (gera relatório)
npm run test:coverage

# Testes em modo watch (desenvolvimento)
npm run test:watch

# Testes específicos
npm test -- tests/modules/auth
npm test -- tests/integration
npm test -- tests/e2e

# Testes de integração específicos
npm run test:cognito    # Testes Cognito
npm run test:mongodb    # Testes MongoDB

# Limpar cache do Jest
npm run test:clear-cache
```

### Scripts de Execução (Produção/CI)

#### Windows (PowerShell)

```powershell
# Script completo (recomendado para CI/CD)
.\tests\scripts\test-all-production.ps1

# Com opções
.\tests\scripts\test-all-production.ps1 -SkipDocker
.\tests\scripts\test-all-production.ps1 -SkipSecurity
```

#### Linux/Mac (Bash)

```bash
# Script completo
bash tests/scripts/test-all-production.sh

# Com opções
bash tests/scripts/test-all-production.sh --skip-docker
bash tests/scripts/test-all-production.sh --skip-security
```

### Execução por Tipo

```bash
# Apenas testes unitários
npm test -- --testPathPattern="\.test\.ts$"

# Apenas testes de integração
npm test -- --testPathPattern="\.integration\.test\.ts$"

# Apenas testes E2E
npm test -- --testPathPattern="\.e2e\.test\.ts$"
```

---

## ➕ Adicionando Novos Testes

### 1. Criar Novo Módulo com Testes

#### Passo 1: Criar estrutura no código fonte

```
src/modules/novo-modulo/
├── novo-modulo.controller.ts
├── novo-modulo.service.ts
├── novo-modulo.repository.ts
└── novo-modulo.module.ts
```

#### Passo 2: Criar testes correspondentes

```
tests/modules/novo-modulo/
├── novo-modulo.controller.test.ts
├── novo-modulo.service.test.ts
└── novo-modulo.repository.test.ts
```

### 2. Template de Teste (Service)

```typescript
/**
 * Testes Unitários: Novo Modulo Service
 * 
 * Testa a lógica de negócio do serviço.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NovoModuloService } from '../../../src/modules/novo-modulo/novo-modulo.service';
import { NovoModuloRepository } from '../../../src/modules/novo-modulo/novo-modulo.repository';

describe('NovoModuloService', () => {
  let service: NovoModuloService;
  let repository: jest.Mocked<NovoModuloRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NovoModuloService,
        {
          provide: NovoModuloRepository,
          useValue: {
            // Mock dos métodos do repository
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NovoModuloService>(NovoModuloService);
    repository = module.get(NovoModuloRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar novo item com sucesso', async () => {
      const data = { name: 'Test Item' };
      const expected = { id: '1', ...data };

      repository.create.mockResolvedValue(expected);

      const result = await service.create(data);

      expect(result).toEqual(expected);
      expect(repository.create).toHaveBeenCalledWith(data);
    });

    it('deve lançar erro quando dados inválidos', async () => {
      repository.create.mockRejectedValue(new Error('Invalid data'));

      await expect(service.create({} as any)).rejects.toThrow('Invalid data');
    });
  });

  // Mais testes...
});
```

### 3. Template de Teste (Controller)

```typescript
/**
 * Testes Unitários: Novo Modulo Controller
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NovoModuloController } from '../../../src/modules/novo-modulo/novo-modulo.controller';
import { NovoModuloService } from '../../../src/modules/novo-modulo/novo-modulo.service';

describe('NovoModuloController', () => {
  let controller: NovoModuloController;
  let service: jest.Mocked<NovoModuloService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NovoModuloController],
      providers: [
        {
          provide: NovoModuloService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NovoModuloController>(NovoModuloController);
    service = module.get(NovoModuloService);
  });

  describe('POST /novo-modulo', () => {
    it('deve criar novo item', async () => {
      const data = { name: 'Test' };
      const expected = { id: '1', ...data };

      service.create.mockResolvedValue(expected);

      const result = await controller.create(data);

      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(data);
    });
  });

  // Mais testes...
});
```

### 4. Checklist para Novos Testes

- [ ] **Controller:** Todos os endpoints testados
- [ ] **Service:** Toda a lógica de negócio testada
- [ ] **Repository:** Todas as operações de banco testadas
- [ ] **Mocks:** Dependências mockadas corretamente
- [ ] **Erros:** Testes de tratamento de erro incluídos
- [ ] **Edge Cases:** Casos limite testados
- [ ] **Cobertura:** Mínimo 80% de cobertura
- [ ] **Nomenclatura:** Arquivos seguem padrão `*.test.ts`

### 5. Exemplo de Referência

Consulte `tests/modules/posts/` como referência completa:
- ✅ Estrutura bem organizada
- ✅ Mocks consistentes
- ✅ Cobertura completa
- ✅ Testes de erro incluídos

---

## 📜 Scripts Disponíveis

### Scripts NPM (package.json)

| Script | Descrição | Quando Usar |
|--------|-----------|-------------|
| `npm test` | Executa todos os testes | Desenvolvimento diário |
| `npm run test:coverage` | Testes com cobertura | Antes de commit |
| `npm run test:watch` | Modo watch | Durante desenvolvimento |
| `npm run test:cognito` | Testes Cognito | Debug de autenticação |
| `npm run test:mongodb` | Testes MongoDB | Debug de banco |
| `npm run test:clear-cache` | Limpa cache Jest | Quando testes ficam estranhos |

### Scripts de Execução (tests/scripts/)

#### 🚀 Produção/CI/CD

| Script | Plataforma | Descrição |
|--------|-----------|-----------|
| `test-all-production.ps1` | Windows | Script completo (Docker, segurança, etc) |
| `test-all-production.sh` | Linux/Mac | Versão Bash do script completo |

**Uso:**
```powershell
# Windows
.\tests\scripts\test-all-production.ps1

# Linux/Mac
bash tests/scripts/test-all-production.sh
```

**Opções:**
- `-SkipDocker` / `--skip-docker`: Pula inicialização Docker
- `-SkipSecurity` / `--skip-security`: Pula auditoria de segurança
- `-SkipPerformance` / `--skip-performance`: Pula testes de performance

#### 🧪 Testes Manuais (Desenvolvimento)

Scripts Node.js para testes manuais durante desenvolvimento:

| Script | Propósito |
|--------|-----------|
| `test-cloudinary-upload.js` | Testa upload de imagens |
| `test-create-post.js` | Testa criação de posts |
| `test-register-investigate.ts` | Investiga problemas de email |

**Uso:**
```bash
node tests/scripts/test-cloudinary-upload.js
```

**Nota:** Scripts específicos (`test-login-poboge.js`, etc.) são para debug histórico e podem ser ignorados.

---

## 🔧 Troubleshooting

### Problema: Testes não encontram módulos

**Solução:**
```bash
# Limpar cache
npm run test:clear-cache

# Verificar se arquivo existe
npm test -- --listTests | grep seu-modulo
```

### Problema: Testes falhando por dependências

**Solução:**
1. Verificar se todos os mocks estão configurados
2. Verificar se `CloudinaryService` está mockado (se necessário)
3. Consultar `tests/helpers/mocks.ts` para mocks padrão

### Problema: Docker não está rodando

**Solução:**
```bash
# Verificar Docker
docker ps

# Iniciar containers
docker-compose up -d mongodb dynamodb-local

# Verificar logs
docker-compose logs mongodb
```

### Problema: Cobertura baixa

**Solução:**
```bash
# Gerar relatório detalhado
npm run test:coverage

# Abrir relatório HTML
open tests/coverage/index.html

# Verificar arquivos não cobertos no relatório
```

### Problema: Scripts não funcionam

**Solução:**
1. Verificar se está no diretório raiz do projeto
2. Verificar permissões de execução (Linux/Mac)
3. Verificar se Docker está rodando (para scripts completos)

---

## 📊 Cobertura de Código

### Métricas Atuais

| Métrica | Cobertura | Meta | Status |
|---------|-----------|------|--------|
| **Lines** | 99.57% | 90% | ✅ Excelente |
| **Statements** | 98.86% | 90% | ✅ Excelente |
| **Functions** | 100% | 90% | ✅ Perfeito |
| **Branches** | 90.54% | 90% | ✅ Bom |

### Verificando Cobertura

```bash
# Gerar relatório
npm run test:coverage

# Ver relatório HTML
open tests/coverage/index.html

# Ver resumo no terminal
npm run test:coverage | grep -A 10 "Coverage summary"
```

### Meta de Cobertura

- **Mínimo:** 80% em todas as métricas
- **Ideal:** 90% em todas as métricas
- **Atual:** 99.57% (Lines) ✅

---

## 📚 Referências

### Documentação Interna

1. **README Principal:** `tests/README.md`
   - Estrutura geral
   - Tipos de testes
   - Convenções

2. **Estrutura de Produção:** `tests/ESTRUTURA_PRODUCAO.md`
   - Estrutura completa
   - Status dos testes
   - Checklist de produção

3. **Scripts:** `tests/scripts/README.md`
   - Documentação dos scripts
   - Como usar cada script

4. **Relatórios:** `tests/test-reports/README.md`
   - Como interpretar relatórios
   - Análise de falhas

### Exemplos de Testes

- **Módulo Completo:** `tests/modules/posts/`
- **Testes de Integração:** `tests/integration/mongodb-prisma.integration.test.ts`
- **Testes E2E:** `tests/e2e/api.e2e.test.ts`
- **Mocks:** `tests/helpers/mocks.ts`

### Configuração

- **Jest:** `jest.config.ts`
- **Setup Global:** `tests/setup.ts`
- **Helpers:** `tests/helpers/`

---

## ✅ Checklist Rápido

### Antes de Fazer Commit

- [ ] Todos os testes passando (`npm test`)
- [ ] Cobertura acima de 80% (`npm run test:coverage`)
- [ ] Testes do módulo modificado executados
- [ ] Nenhum teste ignorado sem motivo

### Antes de Deploy

- [ ] Todos os testes passando
- [ ] Cobertura acima de 90%
- [ ] Testes E2E executados
- [ ] Testes de integração executados
- [ ] Auditoria de segurança (`npm audit`)

---

## 🎯 Próximos Passos

1. ✅ **Leu este guia?** Ótimo!
2. ✅ **Explorou um módulo de teste?** Consulte `tests/modules/posts/`
3. ✅ **Executou testes pela primeira vez?** `npm test`
4. ✅ **Pronto para adicionar testes?** Veja seção [Adicionando Novos Testes](#adicionando-novos-testes)

---

## 📞 Dúvidas?

1. Consulte a documentação em `tests/README.md`
2. Verifique exemplos em `tests/modules/posts/`
3. Revise os relatórios em `tests/test-reports/README.md`

---

**Boa sorte nos testes! 🚀**
