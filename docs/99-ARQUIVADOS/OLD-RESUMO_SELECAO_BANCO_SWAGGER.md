# ✅ Seleção Dinâmica de Banco no Swagger - IMPLEMENTADO

## 🎯 O que foi implementado

Agora você pode **escolher entre MongoDB (Prisma) e DynamoDB diretamente no Swagger** através de um dropdown!

---

## 🚀 Como Usar

### 1. Inicie o servidor

```bash
npm run dev
```

### 2. Acesse o Swagger

```
http://localhost:4000/docs
```

### 3. Teste a funcionalidade

1. Abra qualquer endpoint (ex: **GET /health**)
2. Clique em **"Try it out"**
3. Você verá um campo **"X-Database-Provider"** com dropdown:
   - **PRISMA** → MongoDB (Prisma)
   - **DYNAMODB** → DynamoDB Local/AWS
4. Selecione o banco desejado
5. Clique em **"Execute"**
6. Veja a resposta mostrando qual banco foi usado!

---

## 📊 Exemplo Visual

```
┌────────────────────────────────────────┐
│  GET /health                           │
├────────────────────────────────────────┤
│  X-Database-Provider: [PRISMA ▼]      │  👈 Dropdown aparece aqui!
│                                        │
│  [ Execute ]                           │
└────────────────────────────────────────┘

Resposta:
{
  "data": {
    "status": "ok",
    "database": {
      "provider": "PRISMA",              👈 Mostra qual foi usado!
      "description": "MongoDB (Prisma)"
    }
  }
}
```

---

## 🗂️ Arquivos Criados

```
src/utils/
├── database-provider.decorator.ts      ✅ Decorator para Swagger
├── database-provider.interceptor.ts    ✅ Interceptor que captura header
├── database-context.service.ts         ✅ Serviço de contexto
└── database-provider.module.ts         ✅ Módulo global

Modificados:
├── src/main.ts                         ✅ Configuração Swagger
├── src/app.module.ts                   ✅ Imports e interceptor global
├── src/modules/health/                 ✅ Exemplo de uso
│   ├── health.controller.ts
│   ├── health.service.ts
│   └── health.model.ts

Documentação:
└── docs/guias/
    └── GUIA_SELECAO_BANCO_SWAGGER.md   ✅ Guia completo
```

---

## 🎨 Como Usar nos Seus Controllers

### 1. Adicione o Decorator no Controller

```typescript
import { DatabaseProviderHeader } from '../../utils/database-provider.decorator.js';

@Controller('users')
export class UsersController {
  @Get()
  @DatabaseProviderHeader()  // 👈 Adicione esta linha!
  @ApiOperation({ summary: 'Listar usuários' })
  async findAll() {
    return this.usersService.findAll();
  }
}
```

### 2. Use no Service para Decidir qual Banco

```typescript
import { DatabaseContextService } from '../../utils/database-context.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly databaseContext: DatabaseContextService, // 👈 Injete aqui
  ) {}

  async findAll() {
    // Verifica qual banco usar
    if (this.databaseContext.isPrisma()) {
      // Buscar do MongoDB via Prisma
      return this.prisma.user.findMany();
    } else {
      // Buscar do DynamoDB
      return this.dynamodb.send(new ScanCommand({
        TableName: TABLES.USERS,
      }));
    }
  }
}
```

---

## 🧪 Testando

### Via Swagger (Visual)

1. Acesse: <http://localhost:4000/docs>
2. Endpoint: **GET /health**
3. Try it out
4. Selecione **PRISMA** → Execute
5. Veja resultado com MongoDB
6. Selecione **DYNAMODB** → Execute  
7. Veja resultado com DynamoDB

### Via cURL

```bash
# Testar com MongoDB (Prisma)
curl -X GET "http://localhost:4000/health" \
  -H "X-Database-Provider: PRISMA"

# Testar com DynamoDB
curl -X GET "http://localhost:4000/health" \
  -H "X-Database-Provider: DYNAMODB"
```

### Via JavaScript/Fetch

```javascript
// MongoDB
fetch('http://localhost:4000/health', {
  headers: {
    'X-Database-Provider': 'PRISMA'
  }
});

// DynamoDB
fetch('http://localhost:4000/health', {
  headers: {
    'X-Database-Provider': 'DYNAMODB'
  }
});
```

---

## 💡 Benefícios

✅ **Sem alterar código existente** - Funcionalidade adicional, não substitui nada  
✅ **Teste os dois bancos rapidamente** - Alternar em 1 clique no Swagger  
✅ **Validação pré-deploy** - Testar DynamoDB antes de subir pra AWS  
✅ **Desenvolvimento ágil** - MongoDB rápido, DynamoDB para validação  
✅ **Debugging facilitado** - Ver exatamente qual banco está usando  
✅ **Testes A/B** - Comparar performance e resultados  

---

## 🔄 Fluxo de Funcionamento

```
┌─────────────────┐
│  Cliente        │
│  (Swagger/cURL) │
└────────┬────────┘
         │ Envia: X-Database-Provider: DYNAMODB
         ↓
┌─────────────────────────┐
│  Interceptor            │
│  (Captura o header)     │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  DatabaseContext        │
│  (Armazena no contexto) │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Service                │
│  (Consulta qual usar)   │
└────────┬────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐  ┌──────────┐
│ Prisma │  │ DynamoDB │
│(MongoDB│  │   (AWS)  │
└────────┘  └──────────┘
```

---

## ⚙️ Configuração Padrão

Se **não enviar** o header, usa o valor do `.env`:

```env
# .env
DATABASE_PROVIDER=PRISMA  # Padrão se não enviar header
```

Cada requisição pode **sobrescrever** com o header!

---

## 🎯 Quando Usar

| Cenário | Provider Recomendado |
|---------|---------------------|
| Desenvolvimento rápido | PRISMA |
| Protótipos | PRISMA |
| Testes locais | PRISMA |
| Validação pré-deploy | DYNAMODB |
| Testes de performance | DYNAMODB |
| Simular produção | DYNAMODB |

---

## 📚 Documentação Completa

- **[Guia Completo](guias/GUIA_SELECAO_BANCO_SWAGGER.md)** - Documentação detalhada
- **[Guia DynamoDB Local](guias/GUIA_DYNAMODB_LOCAL.md)** - Setup do DynamoDB
- **[README DynamoDB](README_DYNAMODB.md)** - Guia rápido

---

## 🔍 Debug

### Ver qual banco está sendo usado

No terminal onde o servidor está rodando, você verá:

```bash
Database:       PRISMA
```

Ou no response da API:

```json
{
  "database": {
    "provider": "PRISMA",
    "description": "MongoDB (Prisma)"
  }
}
```

### Adicionar logs customizados

```typescript
async findAll() {
  const provider = this.databaseContext.getProvider();
  console.log(`[INFO] Usando provider: ${provider}`);
  // ...
}
```

---

## ✅ Checklist de Uso

Para usar em outros endpoints:

- [ ] Importar `DatabaseProviderHeader` decorator
- [ ] Adicionar `@DatabaseProviderHeader()` no controller
- [ ] Injetar `DatabaseContextService` no service
- [ ] Implementar lógica com `isPrisma()` ou `isDynamoDB()`
- [ ] Testar no Swagger com ambos providers
- [ ] Verificar se funciona corretamente

---

## 🎉 Pronto para Usar

### Teste Agora

1. Execute: `npm run dev`
2. Acesse: <http://localhost:4000/docs>
3. Endpoint: **GET /health**
4. Selecione o provider no dropdown
5. Execute e veja o resultado!

---

## 🆘 Problemas?

### Dropdown não aparece?

- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique se o decorator está no controller
- Reinicie o servidor

### Header não funciona?

- Verifique se DatabaseProviderModule está importado no app.module
- Verifique se o interceptor está registrado
- Veja os logs do servidor

### Ambos bancos retornam erro?

- MongoDB: Verifique se está rodando (`docker ps`)
- DynamoDB: Verifique se está rodando e tabelas criadas
- Execute: `npm run dynamodb:create-tables`

---

**Funcionalidade 100% implementada e testada!** 🚀

**Próximo passo:** Abra o Swagger e teste! 👉 <http://localhost:4000/docs>
