# 🔍 Guia de Verificação de Disponibilidade de Username

## 📋 Visão Geral

Sistema de verificação em tempo real da disponibilidade de username durante o cadastro de novos usuários, integrado com AWS Cognito.

## 🎯 Objetivo

Permitir que usuários verifiquem se o username desejado está disponível **antes** de submeter o formulário de cadastro, melhorando a experiência do usuário.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│              (Username Availability Component)              │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário digita username                                 │
│  2. Debounce 500ms                                          │
│  3. POST /auth/check-username                               │
│  4. Exibe feedback visual                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP POST
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                │
│              (Auth Controller + Service)                    │
├─────────────────────────────────────────────────────────────┤
│  1. Recebe { username: "joaosilva" }                        │
│  2. AuthService.checkUsernameAvailability()                 │
│  3. Consulta AWS Cognito                                    │
│  4. Retorna { available: true/false }                       │
└─────────────────────────────────────────────────────────────┘
                          ↓ AWS SDK
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    AWS COGNITO                              │
│              (User Pool)                                    │
├─────────────────────────────────────────────────────────────┤
│  AdminGetUserCommand(username)                              │
│  → UserNotFoundException = Disponível                       │
│  → User encontrado = Indisponível                           │
└─────────────────────────────────────────────────────────────┘
```

## 📡 Endpoint

### POST `/auth/check-username`

Verifica se um username está disponível no Cognito.

#### Request

```json
{
  "username": "joaosilva"
}
```

#### Response - Disponível

```json
{
  "success": true,
  "data": {
    "available": true,
    "username": "joaosilva"
  }
}
```

#### Response - Indisponível

```json
{
  "success": true,
  "data": {
    "available": false,
    "username": "joaosilva"
  }
}
```

#### Response - Erro

```json
{
  "success": false,
  "message": "Erro ao verificar username",
  "statusCode": 500
}
```

## 💻 Implementação Backend

### Controller (`auth.controller.ts`)

```typescript
@Post('check-username')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: '🔍 Verificar Disponibilidade de Username' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      username: { type: 'string', example: 'joaosilva' },
    },
    required: ['username'],
  },
})
async checkUsername(@Body() data: { username: string }) {
  const available = await this.authService.checkUsernameAvailability(data.username);
  return { success: true, data: { available, username: data.username } };
}
```

### Service (`auth.service.ts`)

```typescript
async checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const { CognitoIdentityProviderClient, AdminGetUserCommand } = 
      await import('@aws-sdk/client-cognito-identity-provider');
    
    const client = new CognitoIdentityProviderClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    
    const command = new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
    });
    
    await client.send(command);
    return false; // Username existe
  } catch (error: any) {
    if (error.fullName === 'UserNotFoundException') {
      return true; // Username disponível
    }
    throw new InternalServerErrorException('Erro ao verificar username');
  }
}
```

## 🎨 Implementação Frontend

### Componente (`username-availability.tsx`)

```typescript
export function UsernameAvailability({ username }: { username: string }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')

  useEffect(() => {
    if (!username || username.length < 3) {
      setStatus('idle')
      return
    }

    const timer = setTimeout(async () => {
      setStatus('checking')
      
      try {
        const response = await fetch('/auth/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        
        const result = await response.json()
        setStatus(result.data.available ? 'available' : 'unavailable')
      } catch {
        setStatus('idle')
      }
    }, 500) // Debounce 500ms

    return () => clearTimeout(timer)
  }, [username])

  // Renderização com feedback visual
}
```

## ⚡ Performance

### Debounce

- **Tempo**: 500ms após última digitação
- **Benefício**: Reduz requisições desnecessárias
- **Exemplo**: Usuário digita "joao" → aguarda 500ms → verifica

### Cache (Futuro)

Possível implementação de cache para usernames já verificados:

```typescript
const cache = new Map<string, boolean>()

if (cache.has(username)) {
  return cache.get(username)!
}

const available = await checkInCognito(username)
cache.set(username, available)
return available
```

## 🔒 Segurança

### Rate Limiting

Recomendado implementar rate limiting para evitar abuso:

```typescript
// Exemplo com @nestjs/throttler
@Throttle(10, 60) // 10 requisições por minuto
@Post('check-username')
async checkUsername(@Body() data: { username: string }) {
  // ...
}
```

### Validação de Input

O username é validado antes de consultar o Cognito:

```typescript
// Frontend (Zod)
username: z.string()
  .min(3, "Mínimo 3 caracteres")
  .max(30, "Máximo 30 caracteres")
  .regex(/^[a-zA-Z0-9_]+$/, "Apenas letras, números e underscore")
```

## 📊 Estados do Componente

| Estado | Ícone | Cor | Mensagem | Quando |
|--------|-------|-----|----------|--------|
| `idle` | - | - | (nada) | Username vazio ou < 3 chars |
| `checking` | Loader | Cinza | "Verificando..." | Durante requisição |
| `available` | CheckCircle | Verde | "Username disponível" | Username livre |
| `unavailable` | XCircle | Vermelho | "Username já está em uso" | Username ocupado |

## 🧪 Testes

### Teste Manual

```bash
# 1. Iniciar backend
npm run dev

# 2. Testar endpoint
curl -X POST http://localhost:4000/auth/check-username \
  -H "Content-Type: application/json" \
  -d '{"username":"joaosilva"}'

# Resposta esperada:
# {"success":true,"data":{"available":true,"username":"joaosilva"}}
```

### Teste Automatizado

```typescript
describe('AuthController - checkUsername', () => {
  it('deve retornar available=true para username não existente', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/check-username')
      .send({ username: 'usuarionaoexiste123' })
      .expect(200)

    expect(response.body.data.available).toBe(true)
  })

  it('deve retornar available=false para username existente', async () => {
    // Criar usuário primeiro
    await createTestUser('usuarioexiste')

    const response = await request(app.getHttpServer())
      .post('/auth/check-username')
      .send({ username: 'usuarioexiste' })
      .expect(200)

    expect(response.body.data.available).toBe(false)
  })
})
```

## 🚀 Melhorias Futuras

### 1. Sugestões Alternativas

Se username estiver ocupado, sugerir alternativas:

```typescript
async getSuggestions(username: string): Promise<string[]> {
  const suggestions = [
    `${username}1`,
    `${username}123`,
    `${username}_${new Date().getFullYear()}`,
  ]
  
  const available = await Promise.all(
    suggestions.map(s => this.checkUsernameAvailability(s))
  )
  
  return suggestions.filter((_, i) => available[i])
}
```

### 2. Histórico de Tentativas

Salvar usernames já tentados para análise:

```typescript
interface UsernameAttempt {
  username: string
  available: boolean
  timestamp: Date
  ip: string
}
```

### 3. Validação Avançada

Bloquear usernames ofensivos ou reservados:

```typescript
const RESERVED_USERNAMES = ['admin', 'root', 'system']
const OFFENSIVE_WORDS = ['...']

if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
  return { available: false, reason: 'Username reservado' }
}
```

## 📋 Checklist de Implementação

- [x] Criar endpoint POST `/auth/check-username`
- [x] Implementar `checkUsernameAvailability()` no service
- [x] Integrar com AWS Cognito via `AdminGetUserCommand`
- [x] Criar componente `UsernameAvailability` no frontend
- [x] Implementar debounce de 500ms
- [x] Adicionar feedback visual (ícones + cores)
- [x] Documentar endpoint no Swagger
- [x] Documentar guia completo
- [ ] Implementar rate limiting (opcional)
- [ ] Adicionar cache (opcional)
- [ ] Implementar sugestões alternativas (opcional)
- [ ] Adicionar testes automatizados (opcional)

## 🐛 Troubleshooting

### Problema: Sempre retorna "disponível"

**Causa**: Credenciais AWS incorretas ou User Pool ID errado.

**Solução**: Verificar `.env`:

```env
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
AWS_REGION=us-east-1
```

### Problema: Erro 500 ao verificar

**Causa**: Permissões IAM insuficientes.

**Solução**: Garantir que a role IAM tem permissão `cognito-idp:AdminGetUser`.

### Problema: Verificação muito lenta

**Causa**: Sem debounce ou debounce muito curto.

**Solução**: Aumentar debounce para 500-1000ms.

## 📚 Referências

- [AWS Cognito - AdminGetUser](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminGetUser.html)
- [NestJS - Controllers](https://docs.nestjs.com/controllers)
- [React - useEffect Hook](https://react.dev/reference/react/useEffect)

---

**Autor:** Rainer Teixeira  
**Data:** 2025-01-XX  
**Versão:** 1.0.0
