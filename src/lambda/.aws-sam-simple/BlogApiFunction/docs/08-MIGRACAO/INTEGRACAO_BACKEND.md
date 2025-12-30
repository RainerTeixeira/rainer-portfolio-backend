# 🔗 Integração Frontend ↔ Backend (Fluxo OAuth Mediado pelo Backend)

## ✅ Visão Geral

- Backend (NestJS) medeia todo o OAuth com AWS Cognito (inclui Google e GitHub)
- Frontend (Next.js) apenas:
  - inicia o fluxo: `GET {API}/auth/oauth/:provider`
  - finaliza o callback: `POST {API}/auth/oauth/:provider/callback`

## ⚙️ Variáveis de Ambiente

### Backend (.env)

```env
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
# COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # se App Client tiver secret
COGNITO_DOMAIN=seu-dominio.auth.us-east-1.amazoncognito.com
OAUTH_REDIRECT_SIGN_IN=http://localhost:3000/dashboard/login/callback
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> O frontend não usa mais `NEXT_PUBLIC_COGNITO_*`.

## 🚀 Passos de Execução

1. Inicie o backend:
   ```bash
   npm run start:dev
   ```
2. Inicie o frontend:
   ```bash
   npm run dev
   ```
3. Acesse: `http://localhost:3000/dashboard/login` e use os botões Google/GitHub.

## 🔁 Fluxo de Autenticação (Resumo)

1) Frontend → `GET /auth/oauth/:provider` → Backend redireciona ao Hosted UI (Cognito)
2) Cognito autentica usuário (Google/GitHub)
3) Cognito redireciona com `code` para o frontend (`OAUTH_REDIRECT_SIGN_IN`)
4) Frontend → `POST /auth/oauth/:provider/callback` com `code` (+ opcional `state`)
5) Backend troca `code` por tokens no Cognito (`/oauth2/token`), valida `id_token`, sincroniza usuário e responde `{ tokens, user }`
6) Frontend salva tokens e segue autenticado

## 📡 Endpoints Envolvidos

| Endpoint | Método | Descrição |
|---------|--------|-----------|
| `/auth/oauth/:provider` | GET | Inicia login social (redirect Hosted UI) |
| `/auth/oauth/:provider/callback` | POST | Troca `code` por tokens, valida e retorna `{ tokens, user }` |

## 🔒 Segurança

- O backend valida `state`, `id_token` (issuer, audience, exp)
- Segredos ficam apenas no backend
- CORS configurado para origem do frontend

## 🧪 Testes

- E2E (Playwright):
  - Botões social → redirect ao Hosted UI
  - Callback → `POST /auth/oauth/:provider/callback` com mock do Cognito token endpoint

## 🧰 Troubleshooting

- 401 no callback: verifique `COGNITO_DOMAIN`, `CLIENT_ID`, `CLIENT_SECRET` (se aplicável) e `OAUTH_REDIRECT_SIGN_IN`
- CORS: defina `CORS_ORIGIN=http://localhost:3000` no backend, se necessário

---

Versão: 2.0.0  
Última atualização: Novembro/2025  
Responsável: Backend (Auth Module)


