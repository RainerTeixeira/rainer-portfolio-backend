# Implementação de Autenticação com AWS Cognito

Este documento descreve a implementação completa dos três métodos de autenticação usando AWS Cognito.

## Métodos de Autenticação Implementados

### 1. Autenticação por Email com Código de Verificação (Passwordless Login)

**Endpoint**: `POST /auth/passwordless/init` e `POST /auth/passwordless/verify`

**Fluxo**:
1. Usuário informa o email
2. Backend inicia autenticação usando `CUSTOM_AUTH` flow do Cognito
3. Lambda trigger `CreateAuthChallenge` gera e envia código por email
4. Usuário informa o código recebido
5. Backend verifica o código usando `RespondToAuthChallenge`
6. Cognito retorna tokens de autenticação
7. Usuário é autenticado

**Requisitos**:
- Lambda triggers configurados no Cognito:
  - `DefineAuthChallenge`: Define os desafios de autenticação
  - `CreateAuthChallenge`: Gera e envia código por email
  - `VerifyAuthChallenge`: Verifica o código
- AWS SES configurado para envio de emails
- `CUSTOM_AUTH` habilitado no App Client

**Fallback**:
- Se Lambda triggers não estiverem configurados, o sistema usa método manual
- Código é gerado e armazenado em cache (10 minutos de TTL)
- Email deve ser enviado manualmente (requer serviço de email externo)

**Tratamento de Erros**:
- Email não cadastrado: Retorna sucesso (por segurança)
- Código expirado: Retorna erro específico
- Código incorreto: Retorna erro com tentativas restantes (máximo 3)
- Sessão inválida: Retorna erro específico

### 2. Autenticação OAuth com Google

**Endpoint**: `GET /auth/oauth/google?redirect_uri=...` e `POST /auth/oauth/google/callback`

**Fluxo**:
1. Usuário clica em "Continuar com Google"
2. Frontend redireciona para backend: `/auth/oauth/google?redirect_uri=...`
3. Backend gera URL de autorização do Cognito Hosted UI
4. Backend redireciona para Cognito Hosted UI
5. Cognito redireciona para Google para autorização
6. Usuário autoriza no Google
7. Google redireciona de volta para Cognito
8. Cognito redireciona para frontend: `/auth/callback?code=...&state=...`
9. Frontend extrai código e state
10. Frontend chama backend: `POST /auth/oauth/google/callback` com código
11. Backend troca código por tokens no Cognito
12. Backend retorna tokens e dados do usuário
13. Frontend autentica usuário e redireciona para dashboard

**Requisitos**:
- Identity Provider Google configurado no Cognito
- Google OAuth App configurado com callback URL do Cognito
- Hosted UI Domain configurado no Cognito
- Callback URL configurada no App Client

**Tratamento de Erros**:
- Código inválido: Retorna erro específico
- Código expirado: Retorna erro específico
- Provider não configurado: Retorna erro de configuração
- Erro de autorização: Retorna erro do OAuth provider

### 3. Autenticação OAuth com GitHub

**Endpoint**: `GET /auth/oauth/github?redirect_uri=...` e `POST /auth/oauth/github/callback`

**Fluxo**:
1. Usuário clica em "Continuar com GitHub"
2. Frontend redireciona para backend: `/auth/oauth/github?redirect_uri=...`
3. Backend gera URL de autorização do Cognito Hosted UI
4. Backend redireciona para Cognito Hosted UI
5. Cognito redireciona para GitHub para autorização
6. Usuário autoriza no GitHub
7. GitHub redireciona de volta para Cognito
8. Cognito redireciona para frontend: `/auth/callback?code=...&state=...`
9. Frontend extrai código e state
10. Frontend chama backend: `POST /auth/oauth/github/callback` com código
11. Backend troca código por tokens no Cognito
12. Backend retorna tokens e dados do usuário
13. Frontend autentica usuário e redireciona para dashboard

**Requisitos**:
- Identity Provider GitHub configurado no Cognito
- GitHub OAuth App configurado com callback URL do Cognito
- Hosted UI Domain configurado no Cognito
- Callback URL configurada no App Client

**Tratamento de Erros**:
- Código inválido: Retorna erro específico
- Código expirado: Retorna erro específico
- Provider não configurado: Retorna erro de configuração
- Erro de autorização: Retorna erro do OAuth provider

## Estrutura de Arquivos

### Backend

```
src/modules/auth/
├── auth.controller.ts      # Endpoints de autenticação
├── auth.service.ts         # Lógica de negócio de autenticação
├── auth.repository.ts      # Integração com AWS Cognito
├── auth.model.ts           # Interfaces e tipos
└── auth.module.ts          # Módulo NestJS
```

### Frontend

```
components/dashboard/login/
├── forms/
│   └── passwordless-login-form.tsx  # Formulário passwordless
├── page.tsx                          # Página de login
└── ...

app/auth/
└── callback/
    └── page.tsx                      # Página de callback OAuth

hooks/
└── useAuth.ts                        # Hook de autenticação

lib/api/services/
└── auth.service.ts                   # Serviço de autenticação
```

## Configuração

### Variáveis de Ambiente (Backend)

```env
# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
COGNITO_DOMAIN=seu-app-auth.auth.us-east-1.amazoncognito.com
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX

# OAuth Redirect URLs
OAUTH_REDIRECT_SIGN_IN=http://localhost:3000/auth/callback

# AWS SES (para passwordless login)
AWS_REGION=us-east-1
FROM_EMAIL=noreply@seudominio.com
```

### Variáveis de Ambiente (Frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN=http://localhost:3000/auth/callback
```

## Fluxo de Autenticação

### Passwordless Login

```
1. Frontend: POST /auth/passwordless/init { email }
2. Backend: InitiateAuth (CUSTOM_AUTH) → Cognito
3. Cognito: Lambda CreateAuthChallenge → Gera código → Envia email
4. Cognito: Retorna Session ID
5. Backend: Retorna { success: true, session: "..." }
6. Frontend: Armazena session ID
7. Frontend: POST /auth/passwordless/verify { email, code, session }
8. Backend: RespondToAuthChallenge (CUSTOM_CHALLENGE) → Cognito
9. Cognito: Lambda VerifyAuthChallenge → Verifica código
10. Cognito: Retorna tokens
11. Backend: Retorna { tokens, user }
12. Frontend: Autentica usuário
```

### OAuth Login (Google/GitHub)

```
1. Frontend: GET /auth/oauth/{provider}?redirect_uri=...
2. Backend: Gera URL Cognito Hosted UI → Redireciona
3. Cognito: Redireciona para provider (Google/GitHub)
4. Provider: Usuário autoriza → Redireciona para Cognito
5. Cognito: Redireciona para frontend: /auth/callback?code=...&state=...
6. Frontend: Extrai code e state
7. Frontend: POST /auth/oauth/{provider}/callback { code, state }
8. Backend: Troca code por tokens no Cognito
9. Cognito: Retorna tokens
10. Backend: Retorna { tokens, user }
11. Frontend: Autentica usuário
```

## Tratamento de Erros

### Passwordless Login

- **Email não cadastrado**: Retorna sucesso (por segurança)
- **Código expirado**: `BadRequestException('Código expirado. Solicite um novo código.')`
- **Código incorreto**: `BadRequestException('Código incorreto. Tentativas restantes: X')`
- **Sessão inválida**: `BadRequestException('Sessão inválida. Solicite um novo código.')`
- **Lambda triggers não configurados**: Retorna erro informativo com instruções

### OAuth Login

- **Código inválido**: `BadRequestException('Código de autorização inválido ou expirado')`
- **Código expirado**: `BadRequestException('Código de autorização inválido ou expirado')`
- **Provider não configurado**: `InternalServerErrorException('COGNITO_DOMAIN/COGNITO_CLIENT_ID não configurados')`
- **Erro de autorização**: Retorna erro do OAuth provider
- **Código já usado**: `BadRequestException('Código de autorização já foi usado')`

## Segurança

### Proteções Implementadas

1. **Rate Limiting**: Códigos passwordless têm limite de 3 tentativas
2. **TTL**: Códigos e sessões expiram em 10 minutos
3. **CSRF Protection**: State parameter no OAuth
4. **Código único**: Códigos OAuth são marcados como processados
5. **Session validation**: Sessões passwordless são validadas
6. **Secret Hash**: Client secret usado quando disponível

### Boas Práticas

1. **Não revelar se email existe**: Retorna sucesso mesmo se email não cadastrado
2. **Logs detalhados**: Logs para debugging sem expor informações sensíveis
3. **Validação de entrada**: Validação rigorosa de emails e códigos
4. **Timeout**: Timeout de 30 segundos para requisições OAuth
5. **Error handling**: Tratamento de erros específico para cada caso

## Testes

### Testar Passwordless Login

```bash
# 1. Iniciar autenticação
curl -X POST http://localhost:4000/auth/passwordless/init \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com"}'

# 2. Verificar código (substituir SESSION_ID e CODE)
curl -X POST http://localhost:4000/auth/passwordless/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com", "code": "123456", "session": "SESSION_ID"}'
```

### Testar OAuth Google

```bash
# 1. Iniciar OAuth (abrir no browser)
http://localhost:4000/auth/oauth/google?redirect_uri=http://localhost:3000/auth/callback

# 2. Após autorização, callback será processado automaticamente
```

### Testar OAuth GitHub

```bash
# 1. Iniciar OAuth (abrir no browser)
http://localhost:4000/auth/oauth/github?redirect_uri=http://localhost:3000/auth/callback

# 2. Após autorização, callback será processado automaticamente
```

## Troubleshooting

### Problema: Passwordless login não funciona

**Solução**:
1. Verificar se Lambda triggers estão configurados
2. Verificar se `CUSTOM_AUTH` está habilitado no App Client
3. Verificar logs do CloudWatch para funções Lambda
4. Verificar se AWS SES está configurado
5. Verificar se email está verificado no SES

### Problema: OAuth não funciona

**Solução**:
1. Verificar se Identity Providers estão configurados no Cognito
2. Verificar se callback URLs estão corretas
3. Verificar se Hosted UI Domain está configurado
4. Verificar se Client IDs e Secrets estão corretos
5. Verificar logs do backend para erros

### Problema: Código não é enviado por email

**Solução**:
1. Verificar se AWS SES está configurado
2. Verificar se email está verificado no SES
3. Verificar se Lambda CreateAuthChallenge está configurado
4. Verificar logs do CloudWatch para função Lambda
5. Verificar se FROM_EMAIL está configurado

## Próximos Passos

1. **Configurar Lambda triggers** no Cognito (consulte `COGNITO_SETUP.md`)
2. **Configurar AWS SES** para envio de emails
3. **Configurar OAuth providers** (Google e GitHub) no Cognito
4. **Testar fluxos** de autenticação
5. **Configurar variáveis de ambiente** em produção
6. **Monitorar logs** do CloudWatch
7. **Configurar alertas** para erros de autenticação

## Referências

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Lambda Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-challenge.html)
- [OAuth 2.0](https://oauth.net/2/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [COGNITO_SETUP.md](./COGNITO_SETUP.md) - Guia de configuração do Cognito

