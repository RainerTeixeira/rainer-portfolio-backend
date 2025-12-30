# Configuração do Login Social no Cognito

Este guia explica como configurar o Cognito para confirmar automaticamente o email e preencher atributos quando usuários se registram via login social (Google/GitHub).

## 📋 Problema Resolvido

Quando usuários se registram via login social (Google/GitHub):
- ❌ Email não é marcado como verificado automaticamente
- ❌ Atributos como `nickname` não são preenchidos
- ❌ Usuários precisam confirmar email manualmente mesmo vindo de provedor confiável

**Solução**: Lambda Pre-Sign-Up Trigger que:
- ✅ Detecta login social automaticamente
- ✅ Marca email como verificado automaticamente
- ✅ Gera nickname baseado no nome do usuário
- ✅ Preenche atributos corretamente

## 🧪 Passo 0: Testar Localmente Primeiro

**IMPORTANTE**: Sempre teste localmente antes de fazer deploy!

```bash
# Executar testes locais do trigger
npm run test:cognito:trigger:local
```

Este comando irá:
- ✅ Simular eventos de login social (Google/GitHub)
- ✅ Simular eventos de registro normal
- ✅ Validar se os atributos são preenchidos corretamente
- ✅ Verificar se o email é marcado como verificado

### Exemplo de saída:

```
🚀 Testando Lambda Trigger do Cognito localmente

════════════════════════════════════════════════════════════
🧪 TESTE: Login Social com Google
════════════════════════════════════════════════════════════

📥 Evento de entrada:
{
  "email": "raineroliveira94@gmail.com",
  "email_verified": "false",
  "name": "Rainer Teixeira",
  ...
}

📤 Evento processado:
{
  "email": "raineroliveira94@gmail.com",
  "email_verified": "true",
  "nickname": "rainer_teixeira",
  "name": "Rainer Teixeira",
  ...
}

✅ Validações:
  ✅ Email verificado: true
  ✅ Nickname gerado: true
  ✅ Auto-verificação de email ativada

✅ Teste concluído com sucesso!
```

Se todos os testes passarem, você pode prosseguir com o deploy.

## 📦 Passo 1: Criar a Função Lambda

### 1.1. Compilar o código

```bash
# Compilar TypeScript (gera dist/lambda/cognito-pre-signup-trigger.js)
npm run build
```

### 1.2. Criar ZIP para deploy

O script PowerShell automatiza isso:

```powershell
# Executar script de deploy
.\scripts\deploy-cognito-trigger.ps1
```

Ou manualmente:

```bash
# Criar diretório temporário
mkdir -p dist/lambda-trigger
cp dist/lambda/cognito-pre-signup-trigger.js dist/lambda-trigger/
cd dist/lambda-trigger

# Criar ZIP
zip -r cognito-pre-signup-trigger.zip cognito-pre-signup-trigger.js
```

## 🔧 Passo 2: Criar Função Lambda no AWS

### 2.1. Via Console AWS

1. Acesse **AWS Lambda Console**
2. Clique em **Create function**
3. Configure:
   - **Function name**: `cognito-pre-signup-trigger`
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
   - **Permissions**: Criar role básica (será atualizada depois)

4. Após criar, faça upload do ZIP:
   - Vá em **Code** → **Upload from** → **.zip file**
   - Selecione `cognito-pre-signup-trigger.zip`

5. Configure o Handler:
   - **Handler**: `cognito-pre-signup-trigger.handler`

### 2.2. Via AWS CLI

```bash
# Criar função Lambda
aws lambda create-function \
  --function-name cognito-pre-signup-trigger \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler cognito-pre-signup-trigger.handler \
  --zip-file fileb://dist/lambda-trigger/cognito-pre-signup-trigger.zip \
  --timeout 30 \
  --memory-size 256

# Atualizar código (se já existir)
aws lambda update-function-code \
  --function-name cognito-pre-signup-trigger \
  --zip-file fileb://dist/lambda-trigger/cognito-pre-signup-trigger.zip
```

## 🔐 Passo 3: Configurar Permissões IAM

A Lambda precisa de permissão para ser invocada pelo Cognito:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cognito-idp.amazonaws.com"
      },
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT_ID:function:cognito-pre-signup-trigger",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID"
        }
      }
    }
  ]
}
```

**Adicionar via AWS CLI:**

```bash
aws lambda add-permission \
  --function-name cognito-pre-signup-trigger \
  --statement-id cognito-invoke \
  --action lambda:InvokeFunction \
  --principal cognito-idp.amazonaws.com \
  --source-arn arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/USER_POOL_ID
```

## 🔗 Passo 4: Configurar Trigger no Cognito

### 4.1. Via Console AWS

1. Acesse **Amazon Cognito Console**
2. Selecione seu **User Pool** (ex: `RainerSoftCognito`)
3. Vá em **User pool properties** → **Lambda triggers**
4. Role até **Pre sign-up**
5. Selecione a função `cognito-pre-signup-trigger`
6. Clique em **Save changes**

### 4.2. Via AWS CLI

```bash
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_wryiyhbWC \
  --lambda-config "PreSignUp=arn:aws:lambda:REGION:ACCOUNT_ID:function:cognito-pre-signup-trigger"
```

## ✅ Passo 5: Testar

### 5.1. Testar Login Social

1. Acesse seu frontend ou Cognito Hosted UI
2. Faça login com Google ou GitHub
3. Verifique no Console Cognito:
   - ✅ Email deve estar marcado como **Verificado**
   - ✅ Atributo `nickname` deve estar preenchido
   - ✅ Atributo `preferred_username` deve estar definido

### 5.2. Verificar Logs

```bash
# Ver logs da Lambda
aws logs tail /aws/lambda/cognito-pre-signup-trigger --follow

# Ou no Console:
# AWS Lambda → cognito-pre-signup-trigger → Monitor → View CloudWatch logs
```

## 📊 Estrutura dos Atributos

Após a configuração, usuários de login social terão:

| Atributo | Valor | Origem |
|----------|-------|--------|
| `email` | `user@example.com` | Provedor social |
| `email_verified` | `true` | ✅ Lambda trigger |
| `nickname` | `john_doe` | ✅ Gerado pelo Lambda |
| `preferred_username` | `john_doe` | ✅ Lambda ou Cognito |
| `name` | `John Doe` | Provedor social |
| `given_name` | `John` | Google/GitHub |
| `family_name` | `Doe` | Google/GitHub |
| `sub` | `34b844e8-...` | Cognito |

## 🔍 Troubleshooting

### Erro: "Unsupported configuration for OIDC Identity Provider"

Este erro indica que a configuração do Identity Provider (Google/GitHub) no Cognito está incorreta ou incompleta.

#### Como resolver:

1. **Verificar configuração do Identity Provider no Cognito:**
   - Acesse: AWS Cognito Console → User Pools → Seu User Pool
   - Vá em: **Sign-in experience** → **Federated identity provider sign-in**
   - Clique no Identity Provider (Google ou GitHub)

2. **Para Google:**
   - **Client ID**: Deve ser o Client ID do Google OAuth (obtido em [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
   - **Client secret**: Deve ser o Client Secret do Google OAuth
   - **Authorized scopes**: `email profile openid`
   - **Attribute mapping**:
     - `email` → `email`
     - `name` → `name`
     - `given_name` → `given_name`
     - `family_name` → `family_name`

3. **Para GitHub:**
   - **Client ID**: Deve ser o Client ID do GitHub OAuth (obtido em [GitHub Developer Settings](https://github.com/settings/developers))
   - **Client secret**: Deve ser o Client Secret do GitHub OAuth
   - **Authorized scopes**: `user:email read:user`
   - **Attribute mapping**:
     - `email` → `email` (ou `email:primary_email` se disponível)
     - `name` → `name`
     - `login` → `preferred_username`

4. **Verificar scopes do App Client:**
   - Vá em: **App integration** → **App clients** → Seu App Client
   - Em **Hosted UI settings**, verifique **Allowed OAuth scopes**:
     - ✅ `openid`
     - ✅ `email`
     - ✅ `profile`

5. **Salvar e testar novamente**

### Google bloqueia login: "Este navegador ou app pode não ser seguro"

O Google pode bloquear login de `localhost` por questões de segurança. Para resolver:

#### Solução 1: Configurar Google OAuth Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services** → **Credentials**
3. Encontre o **OAuth 2.0 Client ID** usado pelo Cognito
4. Adicione os **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - Seu domínio de produção (ex: `https://seusite.com`)
5. Adicione os **Authorized redirect URIs**:
   - `http://localhost:3000/dashboard/login/callback`
   - URL do Cognito Hosted UI callback

#### Solução 2: Usar domínio local real

Em vez de `localhost`, use um domínio local real:

1. Edite o arquivo `hosts` do seu sistema:
   ```bash
   # Windows: C:\Windows\System32\drivers\etc\hosts
   # Linux/Mac: /etc/hosts
   
   127.0.0.1  local.app
   ```

2. Acesse via `http://local.app:3000` em vez de `localhost`
3. Configure esse domínio no Google OAuth Console

#### Solução 3: Testar manualmente no navegador

Se o Playwright estiver sendo detectado:

1. Use o script apenas para gerar a URL de login
2. Copie a URL e cole manualmente no seu navegador Chrome
3. Faça o login manualmente

O script já foi configurado para reduzir detecção de automação, mas em alguns casos o Google ainda pode bloquear.

### Testes locais falham

- ✅ Verifique se o código compilou corretamente: `npm run build`
- ✅ Verifique se os tipos TypeScript estão corretos
- ✅ Execute os testes novamente: `npm run test:cognito:trigger:local`

### Lambda não é invocada

- ✅ Verifique se o trigger está configurado no User Pool
- ✅ Verifique permissões IAM da Lambda
- ✅ Verifique logs do CloudWatch

### Email não está sendo verificado

- ✅ Verifique se o trigger está detectando login social corretamente
- ✅ Verifique logs da Lambda para ver o `triggerSource`
- ✅ Confirme que `identities` está presente nos atributos

### Nickname não está sendo gerado

- ✅ Verifique se o usuário tem `name` ou `given_name` + `family_name`
- ✅ Verifique logs da Lambda para debug
- ✅ Confirme que o atributo `nickname` está habilitado no User Pool

## 📝 Notas Importantes

1. **Teste Local Primeiro**: Sempre execute `npm run test:cognito:trigger:local` antes de fazer deploy
2. **Segurança**: Email é verificado automaticamente apenas para login social, não para registros normais
3. **Nickname**: Gerado automaticamente, mas pode ser alterado pelo usuário depois
4. **Performance**: Lambda tem timeout de 30s (suficiente para a operação)
5. **Custos**: Lambda tem 1M invocações gratuitas/mês no Free Tier

## 🔄 Atualizar Função Lambda

Quando fizer alterações no código:

```bash
# 1. Testar localmente primeiro
npm run test:cognito:trigger:local

# 2. Se os testes passarem, fazer deploy
.\scripts\deploy-cognito-trigger.ps1

# Ou manualmente:
# 2. Recompilar
npm run build

# 3. Recriar ZIP e atualizar Lambda
.\scripts\deploy-cognito-trigger.ps1
```

## 📚 Referências

- [AWS Cognito Lambda Triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html)
- [Pre-Sign-Up Trigger Event](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html#aws-lambda-triggers-pre-sign-up-examples)

## 🎯 Fluxo Completo Recomendado

```bash
# 1. Fazer alterações no código
#    (editar src/lambda/cognito-pre-signup-trigger.ts)

# 2. Testar localmente
npm run test:cognito:trigger:local

# 3. Se passar, fazer deploy
.\scripts\deploy-cognito-trigger.ps1

# 4. Testar no Cognito real
#    (fazer login social no seu app)
```
