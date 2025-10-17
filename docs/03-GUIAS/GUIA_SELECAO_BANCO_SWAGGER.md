# 🎯 Guia: Seleção Dinâmica de Banco no Swagger

Este guia mostra como usar a funcionalidade de seleção dinâmica entre MongoDB (Prisma) e DynamoDB diretamente no Swagger.

---

## 🚀 Início Rápido

### 1. Iniciar o servidor

```bash
npm run dev
```

### 2. Acessar o Swagger

```
http://localhost:4000/docs
```

### 3. Testar a seleção de banco

1. Abra qualquer endpoint (ex: `GET /health`)
2. Clique em **"Try it out"**
3. Você verá um campo **"X-Database-Provider"** com um dropdown:
   - **PRISMA** (MongoDB)
   - **DYNAMODB** (DynamoDB Local/AWS)
4. Selecione o banco desejado
5. Clique em **"Execute"**
6. Veja a resposta mostrando qual banco foi usado!

---

## 📋 Como Funciona

### 1. Header Customizado

Cada requisição pode incluir o header:

```
X-Database-Provider: PRISMA
```

ou

```
X-Database-Provider: DYNAMODB
```

### 2. Interceptor Global

Um interceptor captura o header e define qual banco usar **apenas para aquela requisição**.

### 3. Contexto por Requisição

Cada requisição tem seu próprio contexto, então você pode testar os dois bancos simultaneamente em abas diferentes!

---

## 🎨 Usando nos Controllers

### Adicionar o Decorator

```typescript
import { DatabaseProviderHeader } from '../../utils/database-provider.decorator.js';

@Controller('users')
export class UsersController {
  @Get()
  @DatabaseProviderHeader() // 👈 Adiciona o dropdown no Swagger
  @ApiOperation({ summary: 'Listar usuários' })
  async findAll() {
    // Seu código aqui
  }
}
```

### Verificar qual banco está sendo usado

```typescript
import { DatabaseContextService } from '../../utils/database-context.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseContext: DatabaseContextService,
  ) {}

  async findAll() {
    const provider = this.databaseContext.getProvider();
    console.log(`Usando: ${provider}`); // PRISMA ou DYNAMODB
    
    // Lógica condicional
    if (this.databaseContext.isPrisma()) {
      // Buscar do MongoDB via Prisma
      return this.prisma.user.findMany();
    } else {
      // Buscar do DynamoDB
      return this.dynamodb.send(new ScanCommand({
        TableName: 'blog-users',
      }));
    }
  }
}
```

---

## 🧪 Exemplos de Uso

### Exemplo 1: Health Check

**Pré-requisitos:**

```powershell
# Garantir que ambos os bancos estão rodando
.\scripts\docker-ambiente-completo.ps1 start

# Ou apenas o que você quer testar
docker-compose up -d mongodb        # Para PRISMA
docker-compose up -d dynamodb-local # Para DYNAMODB
```

**Teste:**

1. Acesse: `http://localhost:4000/docs`
2. Abra `GET /health`
3. Selecione **PRISMA** no dropdown
4. Execute
5. Resposta mostrará:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "Blog API NestJS",
    "database": {
      "provider": "PRISMA",
      "description": "MongoDB (Prisma)"
    }
  }
}
```

6. Agora selecione **DYNAMODB**
7. Execute novamente
8. Resposta mostrará:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "Blog API NestJS",
    "database": {
      "provider": "DYNAMODB",
      "description": "DynamoDB (AWS)"
    }
  }
}
```

### Exemplo 2: Listar Usuários

```bash
# Via cURL - MongoDB
curl -X GET "http://localhost:4000/users" \
  -H "X-Database-Provider: PRISMA"

# Via cURL - DynamoDB
curl -X GET "http://localhost:4000/users" \
  -H "X-Database-Provider: DYNAMODB"
```

### Exemplo 3: Testar Simultaneamente

Abra 2 abas do Swagger:

- **Aba 1**: Selecione PRISMA → Execute
- **Aba 2**: Selecione DYNAMODB → Execute

Ambos funcionam simultaneamente! 🎉

---

## 🔧 Implementação Técnica

### Arquitetura

```
Cliente (Swagger/cURL)
  ↓ (envia header X-Database-Provider)
DatabaseProviderInterceptor
  ↓ (captura header)
DatabaseContextService
  ↓ (armazena provider no contexto da requisição)
Service/Repository
  ↓ (consulta qual provider usar)
MongoDB ou DynamoDB
```

### Arquivos Criados

```
src/utils/
├── database-provider.decorator.ts      # Decorator para Swagger
├── database-provider.interceptor.ts    # Interceptor que captura o header
├── database-context.service.ts         # Serviço de contexto
└── database-provider.module.ts         # Módulo global
```

### Fluxo de Dados

1. **Requisição chega** com header `X-Database-Provider: DYNAMODB`
2. **Interceptor captura** o header
3. **Contexto armazena** o provider usando AsyncLocalStorage
4. **Service consulta** o provider via `databaseContext.getProvider()`
5. **Lógica decide** qual banco usar
6. **Resposta retorna** os dados do banco escolhido

---

## 💡 Casos de Uso

### Desenvolvimento

```typescript
// Testar rapidamente com MongoDB (mais rápido)
X-Database-Provider: PRISMA

// Validar comportamento com DynamoDB
X-Database-Provider: DYNAMODB
```

### Testes

```typescript
// Testar se ambas implementações funcionam
describe('UsersController', () => {
  it('deve buscar do MongoDB', async () => {
    const response = await request(app)
      .get('/users')
      .set('X-Database-Provider', 'PRISMA')
      .expect(200);
  });

  it('deve buscar do DynamoDB', async () => {
    const response = await request(app)
      .get('/users')
      .set('X-Database-Provider', 'DYNAMODB')
      .expect(200);
  });
});
```

### Comparação de Performance

```bash
# Testar performance do MongoDB
time curl -H "X-Database-Provider: PRISMA" http://localhost:4000/posts

# Testar performance do DynamoDB
time curl -H "X-Database-Provider: DYNAMODB" http://localhost:4000/posts
```

---

## ⚙️ Configuração Padrão

Se **não** enviar o header, usa o valor do `.env`:

```env
# .env
DATABASE_PROVIDER=PRISMA  # Padrão
```

Você pode mudar o padrão de três formas:

### 1. Usando Script (Recomendado)

```powershell
# Ver configuração atual
.\scripts\alternar-banco.ps1 status

# Mudar para MongoDB (Prisma)
.\scripts\alternar-banco.ps1 PRISMA

# Mudar para DynamoDB
.\scripts\alternar-banco.ps1 DYNAMODB
```

### 2. Editando .env Manualmente

```env
DATABASE_PROVIDER=DYNAMODB
```

### 3. Via Header (Temporário)

Cada requisição pode sobrescrever com o header `X-Database-Provider` sem alterar o `.env`.

---

## 🎯 Quando Usar Cada Banco

### Use PRISMA (MongoDB) quando

✅ Desenvolvimento rápido  
✅ Prototipagem  
✅ Testes locais  
✅ Queries complexas com relacionamentos  
✅ Não precisa de alta escalabilidade imediata  

### Use DYNAMODB quando

✅ Testes pré-produção  
✅ Validação de performance  
✅ Testar limites de throughput  
✅ Validar queries e índices GSI  
✅ Simular ambiente AWS  

---

## 🔍 Debugging

### Ver qual banco está sendo usado

Adicione logs no serviço:

```typescript
async findAll() {
  const provider = this.databaseContext.getProvider();
  console.log(`[DEBUG] Provider atual: ${provider}`);
  
  if (this.databaseContext.isPrisma()) {
    console.log('[DEBUG] Buscando do MongoDB via Prisma');
  } else {
    console.log('[DEBUG] Buscando do DynamoDB');
  }
  
  // ... resto do código
}
```

### Verificar header na requisição

No interceptor, adicione log:

```typescript
intercept(context: ExecutionContext, next: CallHandler) {
  const request = context.switchToHttp().getRequest();
  console.log('[DEBUG] Header:', request.headers['x-database-provider']);
  // ...
}
```

---

## 🚀 Exemplo Completo de Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { dynamodb, TABLES } from '../../config/dynamo-client.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DatabaseContextService } from '../../utils/database-context.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly databaseContext: DatabaseContextService,
  ) {}

  async findAll() {
    // Verifica qual banco usar
    if (this.databaseContext.isPrisma()) {
      // MongoDB via Prisma
      return this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    } else {
      // DynamoDB
      const result = await dynamodb.send(new ScanCommand({
        TableName: TABLES.USERS,
        ProjectionExpression: 'id, #name, email, #role',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#role': 'role',
        },
      }));
      
      return result.Items || [];
    }
  }

  async findById(id: string) {
    if (this.databaseContext.isPrisma()) {
      // MongoDB
      return this.prisma.user.findUnique({
        where: { id },
      });
    } else {
      // DynamoDB
      const result = await dynamodb.send(new GetCommand({
        TableName: TABLES.USERS,
        Key: { id },
      }));
      
      return result.Item;
    }
  }
}
```

---

## ✅ Checklist de Implementação

Para adicionar em outros controllers:

- [ ] Importar `DatabaseProviderHeader` decorator
- [ ] Adicionar `@DatabaseProviderHeader()` nos endpoints
- [ ] Injetar `DatabaseContextService` no service
- [ ] Implementar lógica condicional com `isPrisma()` ou `isDynamoDB()`
- [ ] Testar no Swagger com ambos os providers
- [ ] Verificar logs para confirmar comportamento

---

## 📚 Recursos Adicionais

- [Código do Decorator](../../src/utils/database-provider.decorator.ts)
- [Código do Interceptor](../../src/utils/database-provider.interceptor.ts)
- [Código do Context Service](../../src/utils/database-context.service.ts)
- [Exemplo no Health Controller](../../src/modules/health/health.controller.ts)

---

## 💬 FAQ

### O header é obrigatório?

**Não!** Se não enviar, usa o padrão do `.env` (DATABASE_PROVIDER).

### Posso usar em produção?

**Sim**, mas geralmente em produção você define um único provider no `.env`. O header é mais útil para **desenvolvimento e testes**.

### Como desabilitar?

Remova o decorator `@DatabaseProviderHeader()` dos endpoints e o provider será sempre o do `.env`.

### Funciona com autenticação?

**Sim!** O header funciona junto com Bearer token e outros headers.

---

**Pronto!** 🎉 Agora você pode escolher dinamicamente entre MongoDB e DynamoDB diretamente no Swagger!

**Teste agora:** <http://localhost:4000/docs> → `GET /health` → Try it out → Selecione o provider → Execute

---

## 🆕 Recursos Adicionais

### Scripts de Gerenciamento

```powershell
# Gerenciar ambiente completo
.\scripts\docker-ambiente-completo.ps1 start
.\scripts\docker-ambiente-completo.ps1 status
.\scripts\docker-ambiente-completo.ps1 stop

# Alternar bancos facilmente
.\scripts\alternar-banco.ps1 PRISMA
.\scripts\alternar-banco.ps1 DYNAMODB
.\scripts\alternar-banco.ps1 status
```

### Documentação Relacionada

- **[COMECE_AQUI.txt](../../COMECE_AQUI.txt)** - Guia de início rápido
- **[INICIO_RAPIDO_OLD.md](../../INICIO_RAPIDO_OLD.md)** - Comandos essenciais
- **[GUIA_AMBIENTE_LOCAL_OLD.md](../../GUIA_AMBIENTE_LOCAL_OLD.md)** - Guia completo
- **[GUIA_SEED_BANCO_DADOS.md](GUIA_SEED_BANCO_DADOS.md)** - Popular dados
- **[GUIA_DYNAMODB_LOCAL.md](GUIA_DYNAMODB_LOCAL.md)** - DynamoDB detalhado

### Configuração Atual

O projeto está configurado com:

- ✅ **AWS Cognito** (RainerSoftCognito)
  - User Pool ID: `us-east-1_wryiyhbWC`
  - Client ID: `3ueos5ofu499je6ebc5u98n35h`
- ✅ **JWT Secret** gerado automaticamente
- ✅ **MongoDB** + **DynamoDB Local** prontos via Docker
- ✅ **Prisma Studio** (porta 5555)
- ✅ **DynamoDB Admin** (porta 8001)

---

**Última atualização:** 16/10/2025  
**Versão:** 2.0.0 (Atualizado com scripts e configurações)
