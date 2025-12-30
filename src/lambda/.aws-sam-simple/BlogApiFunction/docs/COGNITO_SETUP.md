# Configuração do AWS Cognito para Autenticação

Este documento descreve como configurar o AWS Cognito para suportar os três métodos de autenticação:

1. **Autenticação por email com código de verificação** (Passwordless Login)
2. **OAuth com Google**
3. **OAuth com GitHub**

## Pré-requisitos

- Conta AWS com acesso ao Cognito
- User Pool criado no Cognito
- App Client configurado no User Pool
- Permissões IAM para Lambda (para passwordless login)
- Domínio do Cognito Hosted UI configurado (para OAuth)

## 1. Configuração do User Pool

### 1.1 Criar User Pool

1. Acesse o AWS Console > Cognito > User Pools
2. Clique em "Create user pool"
3. Configure:
   - **Sign-in options**: Email, Google, GitHub
   - **Password policy**: Configure conforme necessário
   - **MFA**: Opcional (recomendado desabilitar para passwordless login)
   - **User account recovery**: Habilitado

### 1.2 Configurar App Client

1. No User Pool, vá em "App integration" > "App clients"
2. Crie um novo App Client ou edite o existente
3. Configure:
   - **Authentication flows**: Habilitar `CUSTOM_AUTH`
   - **OAuth 2.0 grant types**: Authorization code grant, Implicit grant
   - **Allowed OAuth flows**: Authorization code, Implicit
   - **Allowed OAuth scopes**: openid, email, profile
   - **Callback URLs**: Adicione as URLs do seu frontend (ex: `http://localhost:3000/auth/callback`)
   - **Sign-out URLs**: Adicione as URLs de logout (ex: `http://localhost:3000`)

### 1.3 Configurar Hosted UI Domain

1. No User Pool, vá em "App integration" > "Domain"
2. Crie um domínio para o Hosted UI (ex: `seu-app-auth`)
3. Anote o domínio completo (ex: `seu-app-auth.auth.us-east-1.amazoncognito.com`)

## 2. Configuração de Lambda Triggers para Passwordless Login

Para suportar autenticação por email com código de verificação, você precisa configurar três Lambda triggers no Cognito:

### 2.1 Criar Lambda Functions

Crie três funções Lambda com o seguinte código:

#### DefineAuthChallenge

```javascript
exports.handler = async (event) => {
  // Se o usuário ainda não completou o desafio customizado, continuar
  if (event.request.session.length === 0) {
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
    event.response.challengeName = 'CUSTOM_CHALLENGE';
  }
  // Se o usuário completou um desafio customizado, emitir tokens
  else if (
    event.request.session.length === 1 &&
    event.request.session[0].challengeName === 'CUSTOM_CHALLENGE' &&
    event.request.session[0].challengeResult === true
  ) {
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  }
  // Caso contrário, falhar a autenticação
  else {
    event.response.issueTokens = false;
    event.response.failAuthentication = true;
  }

  return event;
};
```

#### CreateAuthChallenge

```javascript
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Armazenar código no privateChallengeParameters
    event.response.publicChallengeParameters = {};
    event.response.privateChallengeParameters = { answer: code };
    event.response.challengeMetadata = 'CUSTOM_CHALLENGE';

    // Enviar código por email usando SES
    const email = event.request.userAttributes.email;
    
    try {
      await sesClient.send(new SendEmailCommand({
        Source: process.env.FROM_EMAIL, // Email verificado no SES
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: 'Código de Verificação' },
          Body: {
            Html: {
              Data: `
                <h1>Código de Verificação</h1>
                <p>Seu código de verificação é: <strong>${code}</strong></p>
                <p>Este código expira em 10 minutos.</p>
                <p>Se você não solicitou este código, ignore este email.</p>
              `,
            },
            Text: {
              Data: `Seu código de verificação é: ${code}. Este código expira em 10 minutos.`,
            },
          },
        },
      }));
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      // Não falhar a autenticação se o email falhar
    }
  }

  return event;
};
```

#### VerifyAuthChallenge

```javascript
exports.handler = async (event) => {
  const expectedAnswer = event.request.privateChallengeParameters.answer;
  const providedAnswer = event.request.challengeAnswer;

  if (providedAnswer === expectedAnswer) {
    event.response.answerCorrect = true;
  } else {
    event.response.answerCorrect = false;
  }

  return event;
};
```

### 2.2 Configurar Permissões IAM

As funções Lambda precisam das seguintes permissões:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### 2.3 Configurar Triggers no Cognito

1. No User Pool, vá em "User pool properties" > "Lambda triggers"
2. Configure os três triggers:
   - **DefineAuthChallenge**: Selecione a função Lambda `DefineAuthChallenge`
   - **CreateAuthChallenge**: Selecione a função Lambda `CreateAuthChallenge`
   - **VerifyAuthChallenge**: Selecione a função Lambda `VerifyAuthChallenge`

### 2.4 Configurar AWS SES

1. Acesse o AWS Console > SES > Verified identities
2. Verifique o email que será usado para enviar códigos (FROM_EMAIL)
3. Se estiver no sandbox, adicione os emails de teste
4. Para produção, solicite a remoção do sandbox

## 3. Configuração de OAuth Providers

### 3.1 Configurar Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs & Services" > "Credentials"
4. Crie um novo "OAuth 2.0 Client ID"
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     - `https://seu-app-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
6. Anote o Client ID e Client Secret

### 3.2 Configurar GitHub OAuth

1. Acesse o [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Configure:
   - **Application name**: Nome da sua aplicação
   - **Homepage URL**: URL do seu site
   - **Authorization callback URL**: 
     - `https://seu-app-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
4. Anote o Client ID e Client Secret

### 3.3 Configurar Identity Providers no Cognito

1. No User Pool, vá em "Sign-in experience" > "Federated identity provider sign-in"
2. Adicione Google:
   - **Provider name**: Google
   - **Client ID**: Client ID do Google
   - **Client secret**: Client Secret do Google
   - **Authorized scopes**: openid email profile
3. Adicione GitHub:
   - **Provider name**: GitHub
   - **Client ID**: Client ID do GitHub
   - **Client secret**: Client Secret do GitHub
   - **Authorized scopes**: openid email profile

## 4. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no seu backend:

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

## 5. Testando a Configuração

### 5.1 Testar Passwordless Login

1. Faça uma requisição POST para `/auth/passwordless/init` com o email
2. Verifique se o código foi enviado por email
3. Faça uma requisição POST para `/auth/passwordless/verify` com email, código e session
4. Verifique se os tokens foram retornados

### 5.2 Testar OAuth Google

1. Faça uma requisição GET para `/auth/oauth/google?redirect_uri=http://localhost:3000/auth/callback`
2. Você será redirecionado para o Google para autorização
3. Após autorizar, você será redirecionado de volta com um código
4. Faça uma requisição POST para `/auth/oauth/google/callback` com o código
5. Verifique se os tokens foram retornados

### 5.3 Testar OAuth GitHub

1. Faça uma requisição GET para `/auth/oauth/github?redirect_uri=http://localhost:3000/auth/callback`
2. Você será redirecionado para o GitHub para autorização
3. Após autorizar, você será redirecionado de volta com um código
4. Faça uma requisição POST para `/auth/oauth/github/callback` com o código
5. Verifique se os tokens foram retornados

## 6. Troubleshooting

### Problema: CUSTOM_AUTH não está funcionando

**Solução**: 
- Verifique se o CUSTOM_AUTH está habilitado no App Client
- Verifique se os Lambda triggers estão configurados corretamente
- Verifique os logs do CloudWatch para as funções Lambda

### Problema: Email não está sendo enviado

**Solução**:
- Verifique se o SES está configurado corretamente
- Verifique se o email está verificado no SES
- Verifique os logs do CloudWatch para a função CreateAuthChallenge
- Verifique se o FROM_EMAIL está configurado nas variáveis de ambiente

### Problema: OAuth não está funcionando

**Solução**:
- Verifique se os Identity Providers estão configurados no Cognito
- Verifique se as URLs de callback estão corretas
- Verifique se os Client IDs e Secrets estão corretos
- Verifique se o Hosted UI Domain está configurado

## 7. Segurança

### Recomendações

1. **Nunca exponha o Client Secret no frontend**
2. **Use HTTPS em produção**
3. **Configure CORS adequadamente**
4. **Use rate limiting para prevenir brute force**
5. **Monitore logs do CloudWatch**
6. **Configure alertas para atividades suspeitas**
7. **Use MFA para usuários administrativos**
8. **Mantenha as funções Lambda atualizadas**

## 8. Recursos Adicionais

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Lambda Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-challenge.html)
- [OAuth 2.0](https://oauth.net/2/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)

