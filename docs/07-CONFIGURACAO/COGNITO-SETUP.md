# 🔐 AWS Cognito - Setup (Responsabilidade do Backend)

## 📋 Pré-requisitos

- Conta AWS ativa
- AWS CLI configurado (opcional)
- Node.js 18+

## 🎯 Objetivo

Este projeto usa o backend (NestJS) para mediar 100% do fluxo OAuth com o Cognito, incluindo Social Login (Google e GitHub). O frontend apenas inicia o fluxo via backend e consome os tokens e o perfil retornados pelo backend.

## 🚀 Passo 1: Criar User Pool no Cognito

Siga o assistente no Console da AWS Cognito:

1) Cognito Console → Create user pool
2) Configure conforme abaixo:

### Step 1: Configure sign-in experience
- Provider types: Cognito user pool
- Sign-in options: Email (e/ou Username, conforme necessidade)

### Step 2: Configure security requirements
- Password policy mínima recomendada
- MFA: Optional (produção recomendável)
- Account recovery: Email only

### Step 3: Configure sign-up experience
- Self-registration: Enabled
- Attribute verification: Email
- Required attributes: email, fullName, preferred_username (se usar)

### Step 4: Configure message delivery
- Development: Send email with Cognito
- Production: Amazon SES

### Step 5: Integrate your app
- User pool name: `rainer-portfolio-users`
- App client name: `rainer-portfolio-web`
- Client secret: Pode ser NO (público) ou YES (se desejar fluxo confidencial — o backend suporta ambos)
- Authentication flows: ALLOW_USER_PASSWORD_AUTH, ALLOW_REFRESH_TOKEN_AUTH (e/ou SRP se preferir)

### Step 6: Review and create
- Crie o User Pool

## 📝 Passo 2: Obter Credenciais (para o Backend)

Anote e configure no `.env` do backend:

```env
# AWS Cognito (Backend)
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
# Se o App Client tiver segredo habilitado, defina também:
# COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Domínio do Hosted UI (sem protocolo)
COGNITO_DOMAIN=seu-dominio.auth.us-east-1.amazoncognito.com

# URL de callback que o backend usará para finalizar o fluxo com o frontend
OAUTH_REDIRECT_SIGN_IN=http://localhost:3000/dashboard/login/callback
```

Observação: O frontend não deve possuir credenciais do Cognito. Ele apenas usa `NEXT_PUBLIC_API_URL` para chamar o backend.

## ⚙️ Passo 3: Backend → Endpoints de OAuth (Cognito Hosted UI)

- `GET /auth/oauth/:provider` → inicia o fluxo: redireciona para o Hosted UI com `identity_provider=Google|GitHub` e `state` seguro.
- `POST /auth/oauth/:provider/callback` → recebe `code` (e `state`), troca no Cognito por tokens, valida e retorna ao frontend `{ tokens, user }`.

O backend também valida o `id_token` e sincroniza/obtém o usuário no banco.

## 🧪 Teste Rápido

1. Inicie o backend (`npm run start:dev`) e o frontend (`npm run dev`).
2. Acesse `http://localhost:3000/dashboard/login`.
3. Clique em "Login com Google" ou "Login com GitHub".
4. Verifique o redirecionamento ao Hosted UI e o retorno autenticado ao frontend.

## 🛡️ Segurança

- Segredos do Cognito permanecem no backend.
- O frontend nunca chama `/oauth2/token` do Cognito diretamente.
- Valide `state` e tokens (expiração, issuer, audience) no backend.

## 🔗 Links Úteis

- Documentação Cognito: https://docs.aws.amazon.com/cognito/
- SDK JS v3: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- Boas práticas de segurança: https://docs.aws.amazon.com/cognito/latest/developerguide/security-best-practices.html

---

Versão: 2.0.0  
Última atualização: Novembro/2025  
Responsável: Backend (Auth Module)


