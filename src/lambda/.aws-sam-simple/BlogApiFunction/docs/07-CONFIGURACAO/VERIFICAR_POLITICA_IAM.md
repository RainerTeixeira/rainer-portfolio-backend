# ✅ Verificar Política IAM Cognito

## 📋 Checklist de Verificação

Após criar a política `cognito-policy`, verifique se ela contém as seguintes permissões:

### 1. Ações Necessárias

A política deve incluir estas ações:

```json
{
  "Action": [
    "cognito-idp:AdminUpdateUserAttributes",  // ⭐ ESSENCIAL para atualizar nickname
    "cognito-idp:AdminGetUser",                // Buscar informações do usuário
    "cognito-idp:ListUsers"                    // Listar usuários (fallback)
  ]
}
```

### 2. Resource Correto

O Resource deve apontar para o seu User Pool:

```json
{
  "Resource": "arn:aws:cognito-idp:us-east-1:051826731699:userpool/us-east-1_wryiyhbWC"
}
```

### 3. Política Completa (Exemplo)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminGetUser",
        "cognito-idp:ListUsers"
      ],
      "Resource": "arn:aws:cognito-idp:us-east-1:051826731699:userpool/us-east-1_wryiyhbWC"
    }
  ]
}
```

## 🔍 Como Verificar no Console AWS

1. **Acesse IAM Console:**
   - https://console.aws.amazon.com/iam/home#/users/Rainer_Teixeira

2. **Veja a Política:**
   - Clique em **cognito-policy** (na seção "Permissões")
   - Verifique se contém `AdminUpdateUserAttributes`

3. **Edite se Necessário:**
   - Clique em **Editar** na política
   - Adicione as ações faltantes
   - Salve

## 🧪 Testar Permissões

### Via AWS CLI (Opcional)

```bash
# Testar se tem permissão para atualizar atributos
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_wryiyhbWC \
  --username <seu-username> \
  --user-attributes Name=nickname,Value=teste
```

Se funcionar, as permissões estão corretas!

### Via Frontend

1. Limpe localStorage: `F12 → Application → Clear All`
2. Faça login com Google
3. Tente criar nickname
4. Deve funcionar sem erro 500!

## ⏱️ Tempo de Propagação

- **IAM Policies**: 1-2 minutos
- **Se não funcionar imediatamente**: Aguarde até 5 minutos

## ❌ Se Ainda Não Funcionar

1. **Verifique os Logs do Backend:**
   - Procure por erros de permissão
   - Verifique se o erro mudou

2. **Verifique a Política:**
   - Certifique-se de que `AdminUpdateUserAttributes` está presente
   - Verifique se o Resource está correto

3. **Tente Adicionar Mais Permissões:**
   ```json
   {
     "Action": [
       "cognito-idp:*"  // Permissão total (apenas para teste)
     ],
     "Resource": "arn:aws:cognito-idp:us-east-1:051826731699:userpool/*"
   }
   ```
   ⚠️ **Atenção**: Use apenas para teste! Remova depois.

4. **Verifique Credenciais:**
   - Certifique-se de que o backend está usando as credenciais corretas
   - Verifique variáveis de ambiente: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

## ✅ Sucesso

Quando funcionar, você verá:
- ✅ Nickname criado com sucesso
- ✅ Sem erro 500
- ✅ Usuário redirecionado para login após criar nickname

