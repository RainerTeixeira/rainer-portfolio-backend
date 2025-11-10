# 📘 Como Adicionar Novos Módulos ao Swagger

## 🎯 Guia Rápido

Este guia ensina como adicionar novos módulos mantendo o padrão de organização e visual da documentação Swagger.

## 📋 Checklist para Novo Módulo

### 1️⃣ Definir Tag no `main.ts`

Abra `src/main.ts` e adicione a nova tag:

```typescript
.addTag('🎯 Nome do Módulo', 'Descrição detalhada do que o módulo faz')
```

**Exemplo:**

```typescript
.addTag('📧 Emails', 'Sistema de envio e gerenciamento de emails transacionais')
```

### 2️⃣ Criar o Controller com a Tag

No seu novo controller, use `@ApiTags` com o mesmo nome:

```typescript
import { Controller } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('📧 Emails')  // ← Mesmo nome do main.ts!
@Controller('emails')
export class EmailsController {
  // ... seus métodos
}
```

### 3️⃣ Documentar Cada Endpoint

Use `@ApiOperation` com emoji e descrição clara:

```typescript
@Post()
@ApiOperation({ 
  summary: '📤 Enviar Email',
  description: 'Envia um email transacional via AWS SES'
})
async sendEmail(@Body() data: SendEmailDto) {
  // ...
}

@Get(':id')
@ApiOperation({ 
  summary: '🔍 Buscar Email',
  description: 'Busca um email enviado pelo ID'
})
async findById(@Param('id') id: string) {
  // ...
}
```

## 🎨 Emojis Recomendados por Tipo

### **Recursos Principais**

- 👤 Usuários / Perfis
- 📄 Posts / Artigos / Conteúdo
- 🏷️ Categorias / Tags
- 📧 Emails
- 📦 Produtos
- 🛒 Carrinho / Pedidos
- 💳 Pagamentos
- 📊 Relatórios / Analytics
- ⚙️ Configurações

### **Ações CRUD**

- ➕ Criar / Adicionar
- 📋 Listar / Ver Todos
- 🔍 Buscar / Procurar
- ✏️ Atualizar / Editar
- 🗑️ Deletar / Remover
- 📂 Agrupar / Filtrar

### **Ações Especiais**

- 🔐 Login / Autenticação
- 📝 Registrar / Inscrever
- ✅ Aprovar / Confirmar
- ❌ Rejeitar / Cancelar
- 🔄 Renovar / Atualizar
- 📤 Enviar / Publicar
- 📥 Receber / Importar
- 🔔 Notificar
- ❤️ Curtir / Favoritar
- 💔 Descurtir
- 🔖 Marcar / Salvar
- 🔢 Contar
- 📊 Estatísticas
- 🔒 Bloquear / Proteger
- 🔓 Desbloquear

### **Status e Estados**

- ✅ Sucesso / Ativo
- ❌ Erro / Inativo
- ⏳ Pendente / Aguardando
- 🚀 Lançado / Publicado
- 📝 Rascunho
- ⚠️ Alerta / Atenção
- 💡 Dica / Informação

## 📝 Exemplo Completo

### **Novo Módulo: Emails**

#### **1. Adicionar no `src/main.ts`:**

```typescript
// Adicione junto com as outras tags
.addTag('📧 Emails', 'Sistema de envio e gerenciamento de emails transacionais')
```

#### **2. Criar `src/modules/emails/emails.controller.ts`:**

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param,
  Query,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery,
  ApiResponse 
} from '@nestjs/swagger';
import { EmailsService } from './emails.service.js';
import type { SendEmailData } from './email.model.js';

/**
 * Controller de Emails
 * 
 * Gerencia envio e rastreamento de emails transacionais
 */
@ApiTags('📧 Emails')
@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  /**
   * Envia um email transacional
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: '📤 Enviar Email',
    description: 'Envia um email transacional via AWS SES com template personalizado'
  })
  @ApiResponse({ status: 201, description: 'Email enviado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro ao enviar email' })
  async send(@Body() data: SendEmailData) {
    const result = await this.emailsService.sendEmail(data);
    return { 
      success: true, 
      message: 'Email enviado com sucesso',
      data: result 
    };
  }

  /**
   * Lista emails enviados com paginação
   */
  @Get()
  @ApiOperation({ 
    summary: '📋 Listar Emails',
    description: 'Lista todos os emails enviados com filtros opcionais'
  })
  @ApiQuery({ fullName: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ fullName: 'limit', required: false, type: Number, description: 'Items por página' })
  @ApiQuery({ fullName: 'status', required: false, type: String, description: 'Filtrar por status' })
  async list(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.emailsService.listEmails({ page, limit, status });
    return { success: true, ...result };
  }

  /**
   * Busca email por ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: '🔍 Buscar Email',
    description: 'Busca um email específico pelo ID'
  })
  @ApiParam({ fullName: 'id', description: 'ID do email' })
  @ApiResponse({ status: 200, description: 'Email encontrado' })
  @ApiResponse({ status: 404, description: 'Email não encontrado' })
  async findById(@Param('id') id: string) {
    const email = await this.emailsService.getEmailById(id);
    return { success: true, data: email };
  }

  /**
   * Verifica status de entrega
   */
  @Get(':id/status')
  @ApiOperation({ 
    summary: '📊 Status de Entrega',
    description: 'Verifica o status de entrega do email (enviado, entregue, bounce, etc)'
  })
  @ApiParam({ fullName: 'id', description: 'ID do email' })
  async getStatus(@Param('id') id: string) {
    const status = await this.emailsService.getDeliveryStatus(id);
    return { success: true, data: status };
  }

  /**
   * Reenvia um email
   */
  @Post(':id/resend')
  @ApiOperation({ 
    summary: '🔄 Reenviar Email',
    description: 'Reenvia um email que falhou ou precisa ser enviado novamente'
  })
  @ApiParam({ fullName: 'id', description: 'ID do email original' })
  async resend(@Param('id') id: string) {
    const result = await this.emailsService.resendEmail(id);
    return { 
      success: true, 
      message: 'Email reenviado com sucesso',
      data: result 
    };
  }
}
```

## 🎨 Resultado no Swagger

Com esse código, você terá no Swagger:

```
📧 Emails ▼
📌 Sistema de envio e gerenciamento de emails transacionais

  ┌────────────────────────────────────────┐
  │ POST /emails              📤 Enviar Email           │
  │ GET  /emails              📋 Listar Emails          │
  │ GET  /emails/{id}         🔍 Buscar Email           │
  │ GET  /emails/{id}/status  📊 Status de Entrega     │
  │ POST /emails/{id}/resend  🔄 Reenviar Email        │
  └────────────────────────────────────────┘
```

## ✅ Boas Práticas

### **1. Ordem Alfabética das Tags**

As tags são ordenadas automaticamente, mas é bom manter uma ordem lógica no `main.ts`:

```typescript
// ✅ BOM - Ordem lógica e alfabética
.addTag('❤️ Health Check', '...')
.addTag('🔐 Autenticação', '...')
.addTag('👤 Usuários', '...')
.addTag('📧 Emails', '...')
.addTag('📄 Posts', '...')
```

### **2. Consistência nos Emojis**

Use o mesmo emoji para ações similares:

```typescript
// ✅ BOM - Consistente
@ApiOperation({ summary: '➕ Criar Email' })
@ApiOperation({ summary: '➕ Criar Post' })
@ApiOperation({ summary: '➕ Criar Usuário' })

// ❌ RUIM - Inconsistente
@ApiOperation({ summary: '➕ Criar Email' })
@ApiOperation({ summary: '🆕 Criar Post' })
@ApiOperation({ summary: '✨ Criar Usuário' })
```

### **3. Descrições Claras**

```typescript
// ✅ BOM - Descrição útil
@ApiOperation({ 
  summary: '📤 Enviar Email',
  description: 'Envia um email transacional via AWS SES com template personalizado'
})

// ❌ RUIM - Muito genérico
@ApiOperation({ 
  summary: 'Send Email',
  description: 'Sends an email'
})
```

### **4. Documentar Parâmetros**

```typescript
// ✅ BOM - Parâmetros bem documentados
@ApiParam({ 
  fullName: 'id', 
  description: 'ID único do email (UUID v4)',
  example: '550e8400-e29b-41d4-a716-446655440000'
})

@ApiQuery({ 
  fullName: 'status', 
  required: false, 
  type: String,
  description: 'Filtrar por status (sent, delivered, bounced, failed)',
  enum: ['sent', 'delivered', 'bounced', 'failed']
})
```

### **5. Respostas HTTP**

```typescript
// ✅ BOM - Todos os casos documentados
@ApiResponse({ status: 200, description: 'Email encontrado' })
@ApiResponse({ status: 404, description: 'Email não encontrado' })
@ApiResponse({ status: 500, description: 'Erro interno do servidor' })
```

## 🔧 Troubleshooting

### **Problema: Tag não aparece no Swagger**

**Solução:** Verifique se:

1. O nome da tag no `@ApiTags()` é EXATAMENTE igual ao `.addTag()` do `main.ts`
2. O controller está sendo importado no módulo correspondente
3. O módulo está sendo importado no `app.module.ts`

### **Problema: Emojis não aparecem corretamente**

**Solução:** Certifique-se de que os arquivos estão salvos em UTF-8

### **Problema: Ordem errada dos endpoints**

**Solução:** No `main.ts`, ajuste o `tagsSorter` e `operationsSorter`:

```typescript
swaggerOptions: {
  tagsSorter: 'alpha',        // ou 'order' para ordem manual
  operationsSorter: 'alpha',  // ou 'order' ou 'method'
}
```

## 📚 Referências

- [Documentação Swagger Melhorada](./DOCUMENTACAO_SWAGGER_MELHORADA.md)
- [Antes vs Depois](./SWAGGER_ANTES_DEPOIS.md)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

**💡 Dica Final:** Sempre teste localmente acessando `http://localhost:4000/docs` após adicionar um novo módulo!

**Data:** 16/10/2025  
**Versão:** 4.0.0  
**Status:** ✅ Pronto para Uso
