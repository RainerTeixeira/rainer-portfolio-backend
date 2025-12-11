# Configuração OAuth no AWS Cognito

## 📋 Visão Geral

Este documento descreve como configurar os provedores OAuth (Google e GitHub) no AWS Cognito User Pool para permitir autenticação social no aplicativo.

## 🔧 Configurações Atuais

### Cognito User Pool
- **User Pool ID**: `us-east-1_wryiyhbWC`
- **Client ID**: `3ueos5ofu499je6ebc5u98n35h`
- **Região**: `us-east-1`
- **Domínio Hosted UI**: `https://us-east-1wryiyhbwc.auth.us-east-1.amazoncognito.com`

### OAuth Redirect URIs
- **Desenvolvimento**: `http://localhost:3000/dashboard/login/callback`
- **Produção**: (Configurar quando deploy for feito)

### Provedores OAuth Configurados
1. **Google OAuth**
   - Client ID: `<SEU_GOOGLE_CLIENT_ID>`
   - Client Secret: `<SEU_GOOGLE_CLIENT_SECRET>`

2. **GitHub OAuth**
   - Client ID: `<SEU_GITHUB_CLIENT_ID>`
   - Client Secret: `<SEU_GITHUB_CLIENT_SECRET>`

## 🚀 Passo a Passo - Configuração no AWS Console

### 1. Acessar o Cognito User Pool

1. Acesse o [AWS Console](https://console.aws.amazon.com/)
2. Navegue para **Amazon Cognito**
3. Selecione **User Pools**
4. Clique no User Pool: `us-east-1_wryiyhbWC`

### 2. Configurar App Client

1. No menu lateral, clique em **App integration** > **App clients**
2. Selecione o App Client: `3ueos5ofu499je6ebc5u98n35h`
3. Clique em **Edit**

#### Configurações Importantes:

**Authentication flows**:
- ✅ `ALLOW_USER_PASSWORD_AUTH`
- ✅ `ALLOW_REFRESH_TOKEN_AUTH`
- ✅ `ALLOW_USER_SRP_AUTH`
- ✅ `ALLOW_CUSTOM_AUTH` (para passwordless)

**OAuth 2.0 grant types**:
- ✅ `Authorization code grant`
- ✅ `Implicit grant` (opcional)

**OpenID Connect scopes**:
- ✅ `email`
- ✅ `openid`
- ✅ `profile`

**Allowed callback URLs**:
```
http://localhost:3000/dashboard/login/callback
```

**Allowed sign-out URLs**:
```
http://localhost:3000
```

**Identity providers**:
- ✅ `Google`
- ✅ `GitHub`
- ✅ `Cognito User Pool` (para email/senha)

### 3. Configurar Google OAuth

1. No menu lateral, clique em **Sign-in experience** > **Federated identity provider sign-in**
2. Clique em **Add identity provider**
3. Selecione **Google**

**Configurações**:
- **Client ID**: `<SEU_GOOGLE_CLIENT_ID>`
- **Client secret**: `<SEU_GOOGLE_CLIENT_SECRET>`
- **Authorized scopes**: `profile email openid`

**Mapeamento de Atributos**:
| Atributo Cognito | Atributo Google |
|------------------|-----------------|
| email            | email           |
| name             | name            |
| picture          | picture         |
| email_verified   | email_verified  |

### 4. Configurar GitHub OAuth

1. No menu lateral, clique em **Sign-in experience** > **Federated identity provider sign-in**
2. Clique em **Add identity provider**
3. Selecione **GitHub** (ou configure como OIDC/SAML se GitHub não estiver disponível)

**Configurações**:
- **Client ID**: `<SEU_GITHUB_CLIENT_ID>`
- **Client secret**: `<SEU_GITHUB_CLIENT_SECRET>`
- **Authorized scopes**: `user:email read:user`

**Mapeamento de Atributos**:
| Atributo Cognito | Atributo GitHub |
|------------------|-----------------|
| email            | email           |
| name             | name            |
| picture          | avatar_url      |
| preferred_username | login         |

### 5. Configurar Hosted UI Domain

1. No menu lateral, clique em **App integration** > **Domain**
2. Verifique se o domínio está configurado: `us-east-1wryiyhbwc.auth.us-east-1.amazoncognito.com`
3. Se não estiver configurado, clique em **Create Cognito domain** e escolha um prefixo único

### 6. Configurar Client Secret (Importante!)

⚠️ **ATENÇÃO**: Para o fluxo OAuth funcionar corretamente, é necessário configurar um **Client Secret** no App Client.

1. Acesse **App integration** > **App clients**
2. Selecione o App Client
3. Clique em **Edit**
4. Em **App client secret**, clique em **Generate a client secret**
5. **Copie o secret gerado** e adicione ao arquivo `.env`:

```bash
COGNITO_CLIENT_SECRET=<secret_gerado>
```

⚠️ **IMPORTANTE**: O secret só é exibido uma vez! Guarde-o em local seguro.

## 🔐 Configuração nos Provedores OAuth

### Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Navegue para **APIs & Services** > **Credentials**
3. Selecione o OAuth 2.0 Client ID criado
4. Adicione as seguintes **Authorized redirect URIs**:

```
https://us-east-1wryiyhbwc.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
http://localhost:3000/dashboard/login/callback
```

5. Adicione as seguintes **Authorized JavaScript origins**:

```
http://localhost:3000
https://us-east-1wryiyhbwc.auth.us-east-1.amazoncognito.com
```

### GitHub Developer Settings

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Selecione o OAuth App criado
3. Configure:

**Homepage URL**:
```
http://localhost:3000
```

**Authorization callback URL**:
```
https://us-east-1wryiyhbwc.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

## 🧪 Testar Configuração

### 1. Testar Google OAuth

**URL de Login**:
```
https://us-east-1wryiyhbwc.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=3ueos5ofu499je6ebc5u98n35h&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:3000/dashboard/login/callback&identity_provider=Google
```

**Via Backend**:
```bash
curl http://localhost:4000/auth/oauth/google
```

### 2. Testar GitHub OAuth

**URL de Login**:
```
https://us-east-1wryiyhbwc.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=3ueos5ofu499je6ebc5u98n35h&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:3000/dashboard/login/callback&identity_provider=GitHub
```

**Via Backend**:
```bash
curl http://localhost:4000/auth/oauth/github
```

## 🔍 Verificar Configuração

### Checklist de Verificação

- [ ] User Pool criado e ativo
- [ ] App Client configurado com Client Secret
- [ ] Domínio Hosted UI configurado
- [ ] Google OAuth configurado no Cognito
- [ ] GitHub OAuth configurado no Cognito
- [ ] Callback URLs configuradas no Cognito
- [ ] Redirect URIs configuradas no Google Cloud Console
- [ ] Callback URL configurada no GitHub OAuth App
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Backend rodando e endpoints OAuth funcionando

### Comandos de Verificação

**Verificar se backend está rodando**:
```bash
curl http://localhost:4000/health
```

**Verificar endpoints OAuth**:
```bash
# Google
curl http://localhost:4000/auth/oauth/google

# GitHub
curl http://localhost:4000/auth/oauth/github
```

## ⚠️ Problemas Comuns

### 1. "Invalid redirect_uri"
**Causa**: URL de callback não está configurada no Cognito ou no provedor OAuth
**Solução**: Adicionar URL exata em ambos os lugares

### 2. "Client authentication failed"
**Causa**: Client Secret não configurado ou incorreto
**Solução**: Gerar novo Client Secret no Cognito e atualizar `.env`

### 3. "Invalid client_id"
**Causa**: Client ID incorreto no `.env`
**Solução**: Verificar Client ID no Cognito e atualizar `.env`

### 4. "Scope not allowed"
**Causa**: Scopes solicitados não estão configurados no App Client
**Solução**: Adicionar scopes necessários nas configurações do App Client

### 5. "Identity provider not found"
**Causa**: Provedor OAuth não está configurado no Cognito
**Solução**: Adicionar provedor OAuth nas configurações do User Pool

## 📚 Referências

- [AWS Cognito - Federated Identity Providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-identity-federation.html)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [AWS Cognito Hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)

