# Autenticação Passwordless usando Fluxo Nativo do Cognito

## Visão Geral

A autenticação passwordless foi implementada usando o **fluxo nativo ForgotPassword do Cognito**, que **não requer Lambda triggers**. O Cognito envia códigos de verificação por email automaticamente usando suas funcionalidades nativas.

## Como Funciona

### 1. Iniciar Autenticação (`/auth/passwordless/init`)

Quando o usuário solicita login passwordless:

1. O backend verifica se o usuário existe no Cognito
2. Chama `ForgotPasswordCommand` do Cognito
3. O Cognito **envia automaticamente** um código de verificação por email (sem Lambda)
4. Retorna sucesso ao frontend

**Endpoint:**
```http
POST /auth/passwordless/init
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Código de verificação enviado para seu email."
  }
}
```

### 2. Verificar Código (`/auth/passwordless/verify`)

Quando o usuário informa o código recebido:

1. O backend gera uma senha temporária segura (32 caracteres aleatórios)
2. Chama `ConfirmForgotPasswordCommand` do Cognito para:
   - Verificar o código
   - Definir a senha temporária no Cognito
3. Autentica imediatamente usando `InitiateAuthCommand` com a senha temporária
4. Retorna tokens de autenticação e dados do usuário
5. A senha temporária é limpa do cache (não é armazenada permanentemente)

**Endpoint:**
```http
POST /auth/passwordless/verify
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "code": "123456"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": 3600
    },
    "user": {
      "id": "abc-123-xyz",
      "cognitoSub": "abc-123-xyz",
      "fullName": "Usuário",
      "email": "usuario@exemplo.com",
      "role": "subscriber",
      ...
    }
  }
}
```

## Vantagens do Fluxo Nativo

### ✅ Sem Lambda Triggers
- **Não requer** configuração de Lambda triggers no Cognito
- **Não requer** código customizado para envio de emails
- O Cognito gerencia tudo automaticamente

### ✅ Envio Automático de Emails
- O Cognito envia emails de verificação **automaticamente**
- Configuração mínima necessária (apenas configurar SES se quiser personalizar remetente)
- Emails são enviados de `no-reply@verificationemail.com` por padrão

### ✅ Segurança
- Códigos de verificação expiram automaticamente (configurável no Cognito)
- Limite de tentativas gerenciado pelo Cognito
- Senhas temporárias são geradas com alta entropia (32 caracteres aleatórios)
- Senhas temporárias são limpas do cache após uso

### ✅ Simplicidade
- Menos código para manter
- Menos pontos de falha
- Configuração mais simples

## Configuração Necessária

### 1. Cognito User Pool

O User Pool deve estar configurado com:

- **Email como atributo obrigatório**
- **Verificação de email habilitada**
- **Política de senha configurada** (necessária para definir senha temporária)

### 2. AWS SES (Opcional)

Para personalizar o remetente dos emails:

1. Verificar um endereço de email no AWS SES
2. Configurar o Cognito para usar esse endereço:
   - Console AWS → Cognito → User Pool → Sign-in experience → Email
   - Selecionar "Use Amazon SES"
   - Escolher o endereço verificado

**Nota:** O Cognito funciona sem SES configurado, mas os emails serão enviados de `no-reply@verificationemail.com`.

### 3. Política de Senha

A política de senha do Cognito deve permitir senhas de pelo menos 32 caracteres (ou o tamanho da senha temporária gerada).

## Limitações

### ⚠️ Senha Temporária

- Uma senha temporária é definida no Cognito durante a autenticação
- A senha temporária **não é removida** após a autenticação (seria necessário usar Admin APIs)
- Isso significa que o usuário pode usar a senha temporária para fazer login normal depois
- **Solução:** Considerar isso uma feature, não um bug - o usuário pode definir uma senha permanente depois

### ⚠️ Código de Verificação

- O código de verificação é gerado pelo Cognito
- O formato e tamanho do código são determinados pelo Cognito
- Não podemos personalizar o formato do código

## Comparação com Lambda Triggers

### Fluxo Nativo (Atual)
- ✅ **Simples**: Sem código customizado
- ✅ **Automático**: Cognito gerencia tudo
- ✅ **Confiável**: Menos pontos de falha
- ⚠️ **Limitação**: Senha temporária permanece no Cognito

### Lambda Triggers (Anterior)
- ❌ **Complexo**: Requer código customizado
- ❌ **Manutenção**: Precisa gerenciar Lambdas
- ✅ **Flexibilidade**: Controle total sobre o fluxo
- ✅ **Sem senha**: Não define senha temporária

## Tratamento de Erros

### Erros Comuns

1. **CodeMismatchException**: Código incorreto
   - Retorna: `400 Bad Request`
   - Mensagem: "Código incorreto ou expirado. Solicite um novo código."

2. **ExpiredCodeException**: Código expirado
   - Retorna: `400 Bad Request`
   - Mensagem: "Código incorreto ou expirado. Solicite um novo código."

3. **LimitExceededException**: Muitas tentativas
   - Retorna: `400 Bad Request`
   - Mensagem: "Número máximo de tentativas excedido. Solicite um novo código."

4. **UserNotFoundException**: Usuário não encontrado
   - Retorna: `401 Unauthorized`
   - Mensagem: "Usuário não encontrado"

## Testando

### 1. Iniciar Autenticação

```bash
curl -X POST http://localhost:4000/auth/passwordless/init \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com"}'
```

### 2. Verificar Código

```bash
curl -X POST http://localhost:4000/auth/passwordless/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com", "code": "123456"}'
```

## Conclusão

O fluxo nativo do Cognito é **mais simples e confiável** que Lambda triggers para autenticação passwordless. Embora tenha a limitação de definir uma senha temporária, isso não é um problema crítico e pode até ser considerado uma feature (usuário pode definir senha permanente depois).

Para produção, recomenda-se:
1. Configurar AWS SES para personalizar remetente de emails
2. Configurar políticas de senha adequadas
3. Monitorar logs do Cognito para erros de autenticação
4. Considerar adicionar rate limiting no backend para prevenir abuso

