# 🔧 Criar Novo Cognito User Pool (Backend-First)

Este guia cria um User Pool compatível com o fluxo mediado pelo backend.

## ✅ Requisitos

- Login apenas por Email (recomendado)
- Registro self-service habilitado
- Política de senha mínima

## 🪜 Passo a Passo

1. Acesse: https://console.aws.amazon.com/cognito → Create user pool
2. Sign-in options: marque apenas Email
3. Security: política mínima, MFA opcional (produção)
4. Sign-up: habilite self-registration; verificação por Email
5. Required attributes: `email` e (opcional) `fullName`
6. Message Delivery: Cognito (dev) / SES (prod)
7. App Client:
   - Nome: `rainer-portfolio-web`
   - Client secret: opcional (se habilitar, o backend usará `COGNITO_CLIENT_SECRET`)
   - Flows: ALLOW_USER_PASSWORD_AUTH, ALLOW_REFRESH_TOKEN_AUTH (e/ou SRP)

Crie o pool.

## 🧩 Variáveis de Ambiente (Backend)

Defina no `.env` do backend:

```env
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
# Se gerou secret no App Client:
# COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

COGNITO_DOMAIN=seu-dominio.auth.us-east-1.amazoncognito.com
OAUTH_REDIRECT_SIGN_IN=http://localhost:3000/dashboard/login/callback
```

Observações:
- O frontend não usa credenciais do Cognito; apenas `NEXT_PUBLIC_API_URL`.
- O backend expõe `GET /auth/oauth/:provider` e `POST /auth/oauth/:provider/callback`.

## 🔄 Reiniciar Serviços

```bash
# Backend
npm run start:dev

# Frontend
npm run dev
```

## 🧪 Teste

1. Acesse `http://localhost:3000/dashboard/login`
2. Clique em "Login com Google" / "Login com GitHub"
3. Complete o fluxo e verifique o retorno autenticado

## ⚠️ Notas

- Se migrar de um pool antigo, usuários precisarão se registrar novamente
- Em produção, configure domínio customizado e SES

---

Versão: 2.0.0  
Última atualização: Novembro/2025  
Responsável: Backend (Auth Module)


