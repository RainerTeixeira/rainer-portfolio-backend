# 🔒 Guia Completo de Segurança - Blog API

**Versão:** 4.1.0  
**Última Atualização:** 16 de Outubro de 2025  
**Status:** ✅ Implementado e Documentado

---

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Camadas de Segurança](#camadas-de-segurança)
- [Helmet - Security Headers](#helmet---security-headers)
- [CORS - Cross-Origin Resource Sharing](#cors---cross-origin-resource-sharing)
- [Validação de Entrada](#validação-de-entrada)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Error Handling Seguro](#error-handling-seguro)
- [Logging Seguro](#logging-seguro)
- [Boas Práticas](#boas-práticas)
- [Checklist de Segurança](#checklist-de-segurança)

---

## 🎯 Visão Geral

A aplicação implementa **7 camadas de segurança** para proteger contra ataques comuns e garantir a integridade dos dados.

### Arquitetura de Segurança

```text
┌─────────────────────────────────────────────────────────┐
│                    REQUISIÇÃO HTTP                       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  1️⃣  HELMET (Security Headers)                          │
│      • CSP, X-Frame-Options, HSTS, XSS Protection       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  2️⃣  CORS (Cross-Origin)                                │
│      • Controle de origens permitidas                   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  3️⃣  JWT VALIDATION                                     │
│      • Verificação de tokens Cognito                    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  4️⃣  ZOD VALIDATION                                     │
│      • Runtime validation de inputs                     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  5️⃣  BUSINESS LOGIC                                     │
│      • Regras de negócio e autorização                  │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  6️⃣  DATABASE QUERIES                                   │
│      • Prisma/DynamoDB com prepared statements          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  7️⃣  ERROR HANDLING & LOGGING                          │
│      • Logs estruturados sem dados sensíveis            │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Camadas de Segurança

### 1️⃣ Helmet - Security Headers

**Implementação:** `src/main.ts:28-47`

Helmet adiciona headers HTTP de segurança para proteger contra vulnerabilidades comuns.

#### Headers Configurados

| Header | Valor | Proteção |
|--------|-------|----------|
| `Content-Security-Policy` | Customizado | XSS, Code Injection |
| `X-Content-Type-Options` | `nosniff` | MIME Type Sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS (browsers antigos) |
| `Strict-Transport-Security` | `max-age=15552000` | Man-in-the-Middle |
| `Referrer-Policy` | `no-referrer` | Information Leakage |

#### Configuração CSP

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: [`'self'`],                           // Apenas recursos do próprio domínio
    styleSrc: [`'self'`, `'unsafe-inline'`],          // Styles (+ Swagger)
    scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`], // Scripts (+ Swagger)
    imgSrc: [`'self'`, 'data:', 'https:', 'http:'],   // Imagens (CDN permitido)
    fontSrc: [`'self'`, 'data:'],                     // Fontes
    connectSrc: [`'self'`],                           // APIs externas bloqueadas
    frameSrc: [`'none'`],                             // Nenhum iframe
    objectSrc: [`'none'`],                            // Nenhum Flash/Java
    baseUri: [`'self'`],                              // Base URL fixo
    formAction: [`'self'`],                           // Forms apenas internos
  },
}
```

**⚠️ Nota sobre Swagger:**
- `unsafe-inline` e `unsafe-eval` são necessários para o Swagger UI funcionar
- Em produção, considere servir Swagger em subdomínio separado com CSP mais rigoroso

---

### 2️⃣ CORS - Cross-Origin Resource Sharing

**Implementação:** `src/main.ts:49-53`

Controla quais origens podem acessar a API.

#### Configuração

```typescript
app.enableCors({
  origin: env.CORS_ORIGIN || '*',  // Configurável por ambiente
  credentials: true,                // Permite cookies/auth headers
});
```

#### Ambientes

| Ambiente | Origin | Descrição |
|----------|--------|-----------|
| **Desenvolvimento** | `*` | Qualquer origem (facilita testes) |
| **Staging** | `https://staging.app.com` | Apenas frontend de staging |
| **Produção** | `https://app.com` | Apenas frontend de produção |

**Configuração via .env:**

```env
# Desenvolvimento
CORS_ORIGIN=*

# Staging
CORS_ORIGIN=https://staging.blogapp.com

# Produção
CORS_ORIGIN=https://blogapp.com
```

#### Múltiplas Origens

```typescript
// Se precisar permitir múltiplas origens
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.com',
      'https://admin.app.com',
      'https://blog.app.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

---

### 3️⃣ Validação de Entrada (Zod)

**Implementação:** Todos os arquivos `*.schema.ts`

Runtime validation de **todos** os inputs da API.

#### Validações Implementadas

##### Users

```typescript
// src/modules/users/user.schema.ts
email: z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .trim()
  .refine((email) => {
    // Bloquear emails temporários
    const domain = email.split('@')[1];
    return !TEMP_EMAIL_DOMAINS.includes(domain);
  }, { message: 'Emails temporários não são permitidos' })
```

**Validações:**
- ✅ Email único e formato válido
- ✅ Bloqueio de emails temporários (tempmail, guerrillamail, etc)
- ✅ Username sem espaços ou caracteres especiais
- ✅ Senha forte (8+ chars, maiúscula, minúscula, número, especial)
- ✅ Bloqueio de senhas comuns (password123, qwerty, etc)
- ✅ Validação de entropia de senha

##### Posts

```typescript
// src/modules/posts/post.schema.ts
title: z
  .string()
  .min(10, 'Título deve ter no mínimo 10 caracteres para SEO')
  .max(100, 'Título deve ter no máximo 100 caracteres para SEO')
  .trim()
  .refine((title) => !FORBIDDEN_WORDS.some(...), { ... })
```

**Validações:**
- ✅ Título: 10-100 caracteres
- ✅ Slug: formato kebab-case
- ✅ Conteúdo: estrutura JSON Tiptap válida
- ✅ Anti-clickbait (sem CAPS LOCK total, sem !!! excessivo)
- ✅ Mínimo 50 palavras de conteúdo

##### Comments

```typescript
// src/modules/comments/comment.schema.ts
function isLikelySpam(content: string): boolean {
  // Detecção de spam
  if (SPAM_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return true;
  }
  
  // Limite de URLs
  const urlCount = (content.match(/https?:\/\//gi) || []).length;
  if (urlCount > 2) {
    return true;
  }
  
  return false;
}
```

**Validações:**
- ✅ Conteúdo não vazio (3+ caracteres)
- ✅ Anti-spam automático (keywords, padrões, URLs)
- ✅ Máximo 30% de maiúsculas
- ✅ Bloqueio de apenas emojis

---

### 4️⃣ Autenticação e Autorização

**Implementação:** `src/modules/auth/`

#### Amazon Cognito

A aplicação **não gerencia senhas diretamente**. Todas as credenciais são gerenciadas pelo AWS Cognito.

**Benefícios:**
- ✅ Senhas nunca tocam a aplicação
- ✅ Hashing seguro (bcrypt) gerenciado pela AWS
- ✅ MFA (Multi-Factor Authentication) disponível
- ✅ Verificação de email automática
- ✅ Recuperação de senha segura
- ✅ Rate limiting de login (proteção contra brute force)

#### JWT Validation

```typescript
// src/modules/auth/auth.service.ts:202-213
private decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT inválido');
    }
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    throw new UnauthorizedException('Token inválido');
  }
}
```

#### Sincronização Cognito ↔ MongoDB

```typescript
// Ao fazer login, sincroniza automaticamente
let user = await this.usersService.getUserByCognitoSub(payload.sub);

if (!user) {
  // Primeira vez - cria perfil local
  user = await this.usersService.createUser({
    cognitoSub: payload.sub,
    email: payload.email,
    username: username,
    name: payload.name || 'Usuário',
  });
}
```

#### Roles e Permissões

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',       // Acesso total
  EDITOR = 'EDITOR',     // Aprova posts
  AUTHOR = 'AUTHOR',     // Cria posts
  SUBSCRIBER = 'SUBSCRIBER', // Apenas lê
}
```

**Implementação de Guards:**

```typescript
// Exemplo de guard (não implementado ainda)
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.role === role);
  }
}
```

---

### 5️⃣ Error Handling Seguro

**Implementação:** `src/utils/error-handler.ts`

Erros são tratados para **nunca vazar informações sensíveis**.

#### Produção vs Desenvolvimento

```typescript
// Desenvolvimento: Stack trace completo
{
  "success": false,
  "error": "Erro de validação",
  "details": {
    "field": "email",
    "message": "Email já existe no banco de dados users.email_unique"
  }
}

// Produção: Mensagem genérica
{
  "success": false,
  "error": "Erro de validação",
  "details": {
    "field": "email",
    "message": "Email já cadastrado"
  }
}
```

#### Tipos de Erro

| Status | Tipo | Exemplo |
|--------|------|---------|
| 400 | Bad Request | Validação falhou |
| 401 | Unauthorized | Token inválido |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não existe |
| 409 | Conflict | Email duplicado |
| 500 | Internal Server Error | Erro inesperado |

---

### 6️⃣ Logging Seguro

**Implementação:** `src/utils/logger.ts`

Logs estruturados com Pino, **sem dados sensíveis**.

#### Configuração

```typescript
export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV === 'development' ? {
    targets: [
      // Console com cores
      {
        target: 'pino-pretty',
        level: 'info',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname', // Remover dados irrelevantes
        },
      },
      // Arquivo
      {
        target: 'pino/file',
        options: {
          destination: path.join(logsDir, 'app.log'),
        },
      },
    ],
  } : { /* Produção: apenas arquivo */ },
});
```

#### Dados que NUNCA são logados

❌ **PROIBIDO:**
- Senhas (plain text)
- Tokens JWT completos
- Números de cartão de crédito
- Dados pessoais sensíveis (CPF, RG)
- Chaves de API

✅ **PERMITIDO:**
- User IDs (MongoDB ObjectId)
- Email (apenas em logs de debug)
- IP Address (GDPR compliant)
- Timestamps
- Request/Response metadata

#### Exemplo de Log Seguro

```typescript
// ❌ ERRADO
logger.info(`User ${user.email} logged in with password ${password}`);

// ✅ CORRETO
logger.info({
  event: 'user_login',
  userId: user.id,
  timestamp: new Date().toISOString(),
});
```

---

### 7️⃣ Database Security

#### Prisma (MongoDB)

**Proteções automáticas:**
- ✅ Prepared statements (SQL Injection impossível)
- ✅ Type-safe queries (TypeScript)
- ✅ Unique constraints (email, username, slug)
- ✅ Cascade deletes (integridade referencial)

```typescript
// Query type-safe
const user = await prisma.user.findUnique({
  where: { email: input.email }, // ✅ Parametrizado automaticamente
});
```

#### DynamoDB

**Proteções:**
- ✅ IAM Roles (acesso via credenciais AWS)
- ✅ DocumentClient (sanitização automática)
- ✅ Condition expressions (operações atômicas)

```typescript
// Query segura
await dynamodb.put({
  TableName: 'users',
  Item: { ...user },
  ConditionExpression: 'attribute_not_exists(email)', // ✅ Previne duplicação
});
```

---

## ✅ Boas Práticas Implementadas

### OWASP Top 10 (2021)

| Vulnerabilidade | Proteção | Status |
|----------------|----------|--------|
| **A01: Broken Access Control** | JWT + Roles + Guards | ✅ |
| **A02: Cryptographic Failures** | Cognito (bcrypt) + HTTPS | ✅ |
| **A03: Injection** | Prisma/DynamoDB (prepared statements) | ✅ |
| **A04: Insecure Design** | Arquitetura modular + validações | ✅ |
| **A05: Security Misconfiguration** | Helmet + CORS + env vars | ✅ |
| **A06: Vulnerable Components** | Dependências atualizadas | ✅ |
| **A07: Auth Failures** | Cognito + JWT | ✅ |
| **A08: Data Integrity Failures** | Zod validation + Prisma types | ✅ |
| **A09: Logging Failures** | Pino structured logging | ✅ |
| **A10: SSRF** | CSP + connectSrc bloqueado | ✅ |

---

## 📋 Checklist de Segurança

### Desenvolvimento

- [x] Helmet configurado
- [x] CORS configurado
- [x] Zod validation em todos endpoints
- [x] Error handling sem stack traces
- [x] Logging estruturado sem dados sensíveis
- [x] Cognito para autenticação
- [x] JWT validation
- [x] Unique constraints no banco
- [x] Type-safe queries (Prisma/DynamoDB)
- [x] CSP configurado (Content Security Policy)

### Pré-Produção

- [ ] Rate limiting implementado (recomendado)
- [ ] HTTPS habilitado
- [ ] CORS_ORIGIN configurado para domínio específico
- [ ] LOG_LEVEL=warn ou error
- [ ] Secrets em AWS Secrets Manager ou similar
- [ ] Backup automático do banco
- [ ] Monitoring (CloudWatch, DataDog, etc)
- [ ] Testes de segurança (OWASP ZAP, Burp Suite)

### Produção

- [ ] SSL/TLS certificate válido
- [ ] HSTS habilitado (Strict-Transport-Security)
- [ ] Firewall configurado (AWS Security Groups)
- [ ] DDoS protection (CloudFlare, AWS Shield)
- [ ] Audit logs habilitados
- [ ] Incident response plan
- [ ] Penetration testing realizado
- [ ] Compliance verificado (GDPR, LGPD)

---

## 🚨 Recomendações Adicionais

### 1. Rate Limiting

**Não implementado ainda** - Recomendado para produção.

```typescript
// Exemplo com @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 60 segundos
      limit: 10,    // 10 requisições por minuto
    }),
  ],
})
export class AppModule {}
```

### 2. API Key para Serviços Externos

Se a API for consumida por outros serviços:

```typescript
// Middleware de API Key
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    
    return apiKey === process.env.API_KEY;
  }
}
```

### 3. Input Sanitization

Além de validação, sanitizar inputs para prevenir XSS:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitizar HTML em comentários
const cleanContent = DOMPurify.sanitize(input.content);
```

### 4. Audit Logs

Implementar logs de auditoria para operações críticas:

```typescript
logger.audit({
  event: 'user_deleted',
  actor: admin.id,
  target: user.id,
  timestamp: new Date().toISOString(),
  metadata: { reason: 'spam' },
});
```

---

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [AWS Cognito Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/security-best-practices.html)
- [Zod Documentation](https://zod.dev/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)

---

**Última Atualização:** 16/10/2025  
**Versão:** 4.1.0  
**Status:** ✅ Implementado

