# 🔐 Corrigir Permissões IAM para Atualizar Nickname

## ❌ Erro Encontrado

```
User: arn:aws:iam::051826731699:user/Rainer_Teixeira is not authorized to perform: 
cognito-idp:AdminUpdateUserAttributes on resource: 
arn:aws:cognito-idp:us-east-1:051826731699:userpool/us-east-1_wryiyhbWC 
because no identity-based policy allows the cognito-idp:AdminUpdateUserAttributes action
```

## 🔍 Problema

O usuário IAM `Rainer_Teixeira` não tem permissão para executar `cognito-idp:AdminUpdateUserAttributes`, que é necessário para atualizar o atributo `nickname` dos usuários no Cognito.

## ✅ Solução

### Opção 1: Adicionar Permissão na Política IAM (Recomendado)

1. **Acesse o Console AWS IAM:**
   - Vá para: https://console.aws.amazon.com/iam/
   - Navegue até **Users** → **Rainer_Teixeira**

2. **Edite a Política:**
   - Clique em **Add permissions** ou **Edit policy**
   - Selecione a política existente ou crie uma nova

3. **Adicione a Permissão:**
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

4. **Salve a Política:**
   - Clique em **Save changes**
   - Aguarde alguns segundos para a política ser aplicada

### Opção 2: Usar Política Gerenciada (Mais Simples)

1. **Acesse o Console AWS IAM:**
   - Vá para: https://console.aws.amazon.com/iam/
   - Navegue até **Users** → **Rainer_Teixeira**

2. **Adicione Política Gerenciada:**
   - Clique em **Add permissions** → **Attach policies directly**
   - Procure por: `AmazonCognitoPowerUser` ou `AmazonCognitoReadOnly`
   - **OU** crie uma política customizada com as permissões mínimas:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cognito-idp:AdminUpdateUserAttributes",
           "cognito-idp:AdminGetUser",
           "cognito-idp:ListUsers",
           "cognito-idp:AdminListGroupsForUser",
           "cognito-idp:AdminCreateUser",
           "cognito-idp:AdminDeleteUser",
           "cognito-idp:AdminSetUserPassword",
           "cognito-idp:AdminResetUserPassword"
         ],
         "Resource": "arn:aws:cognito-idp:us-east-1:051826731699:userpool/*"
       }
     ]
   }
   ```

### Opção 3: Usar Role IAM (Melhor Prática para Produção)

Se você estiver rodando o backend em uma instância EC2, Lambda, ou ECS, use uma **IAM Role** em vez de credenciais de usuário:

1. **Crie uma IAM Role:**
   - Vá para **IAM** → **Roles** → **Create role**
   - Selecione o tipo de serviço (EC2, Lambda, ECS, etc.)
   - Adicione a política com as permissões acima

2. **Anexe a Role:**
   - Para EC2: Anexe a role à instância
   - Para Lambda: Configure a role na função Lambda
   - Para ECS: Configure a role no task definition

3. **Remova Credenciais de Usuário:**
   - O SDK AWS detectará automaticamente a role
   - Não precisa configurar `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`

## 📋 Permissões Mínimas Necessárias

Para o sistema de nickname funcionar, você precisa das seguintes permissões:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminUpdateUserAttributes",  // Atualizar nickname
        "cognito-idp:AdminGetUser",                // Buscar usuário
        "cognito-idp:ListUsers",                   // Listar usuários (fallback)
        "cognito-idp:AdminCreateUser",             // Criar usuário (OAuth)
        "cognito-idp:AdminSetUserPassword",        // Definir senha
        "cognito-idp:AdminResetUserPassword"       // Resetar senha
      ],
      "Resource": "arn:aws:cognito-idp:us-east-1:051826731699:userpool/us-east-1_wryiyhbWC"
    }
  ]
}
```

## 🔄 Após Adicionar Permissões

1. **Aguarde 1-2 minutos** para a política ser propagada
2. **Teste novamente** no frontend:
   - Faça login com Google
   - Tente criar o nickname
   - Deve funcionar agora!

## 🧪 Verificar Permissões

Você pode verificar se as permissões estão corretas usando o AWS CLI:

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_wryiyhbWC \
  --username <seu-username> \
  --user-attributes Name=nickname,Value=teste
```

Se funcionar, as permissões estão corretas!

## ⚠️ Segurança

- **Princípio do Menor Privilégio**: Dê apenas as permissões necessárias
- **Use Roles em Produção**: Não use credenciais de usuário IAM em produção
- **Limite o Resource**: Especifique o User Pool específico, não use `*`

## 📝 Notas

- O erro ocorre porque o backend está usando credenciais do usuário IAM `Rainer_Teixeira`
- Em produção, use IAM Roles em vez de usuários IAM
- As permissões são necessárias para:
  - Criar nickname automaticamente após login OAuth
  - Atualizar nickname quando usuário altera manualmente
  - Verificar disponibilidade de nickname

## 🔗 Referências

- [AWS Cognito IAM Permissions](https://docs.aws.amazon.com/cognito/latest/developerguide/iam-roles.html)
- [IAM Policy Editor](https://console.aws.amazon.com/iam/home#/policies)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

