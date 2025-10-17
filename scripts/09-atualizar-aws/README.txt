╔═══════════════════════════════════════════════════════════════════════════╗
║          🔑 ATUALIZAR CREDENCIAIS AWS - CONFIGURAÇÃO SEGURA              ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Atualiza as credenciais AWS no arquivo .env de forma segura e interativa.
Solicita Access Key ID e Secret Access Key, valida e atualiza o arquivo
de configuração.

✅ Entrada interativa de credenciais
✅ Mascaramento de Secret Key
✅ Confirmação antes de salvar
✅ Backup automático do .env
✅ Validação de formato


🎯 CREDENCIAIS ATUALIZADAS
═══════════════════════════════════════════════════════════════════════════

AWS_ACCESS_KEY_ID
  • Formato: AKIA...
  • Exemplo: AKIAIOSFODNN7EXAMPLE
  • 20 caracteres alfanuméricos

AWS_SECRET_ACCESS_KEY
  • Formato: 40 caracteres alfanuméricos
  • Exemplo: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  • Mantido oculto durante entrada


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: atualizar-aws.bat

WINDOWS - Opção 2 (PowerShell):
   .\atualizar-aws.ps1

LINUX/MAC/WSL:
   chmod +x atualizar-aws.sh
   ./atualizar-aws.sh


📊 EXEMPLO DE EXECUÇÃO
═══════════════════════════════════════════════════════════════════════════

> .\atualizar-aws.bat

╔═══════════════════════════════════════════════════════════╗
║     Atualizar Credenciais AWS no .env                     ║
╚═══════════════════════════════════════════════════════════╝

Digite o AWS Access Key ID (AKIA...):
AKIAIOSFODNN7EXAMPLE

Digite o AWS Secret Access Key:
*********************** (mascarado)

⚠️  Confirme os dados:
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnF**********

Atualizar o .env com esses valores? (S/N):
S

✅ Credenciais AWS atualizadas com sucesso!

📋 Resumo:
  AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
  AWS_SECRET_ACCESS_KEY: ********


🔒 SEGURANÇA
═══════════════════════════════════════════════════════════════════════════

✅ Secret Key mascarada durante entrada
✅ Confirmação antes de salvar
✅ Backup automático do .env anterior
✅ Credenciais nunca exibidas em logs
✅ Arquivo .env no .gitignore


🔑 ONDE OBTER CREDENCIAIS
═══════════════════════════════════════════════════════════════════════════

1. Acesse AWS Console:
   https://console.aws.amazon.com/

2. Vá para IAM:
   Services → IAM → Users

3. Selecione seu usuário:
   Click no nome do usuário

4. Aba "Security credentials":
   Click em "Create access key"

5. Copie as credenciais:
   ⚠️  Última chance de ver Secret Key!
   Download .csv ou anote


⚙️ PERMISSÕES NECESSÁRIAS
═══════════════════════════════════════════════════════════════════════════

Para deploy completo, o usuário IAM precisa:
  • AmazonDynamoDBFullAccess
  • AWSLambdaFullAccess
  • IAMFullAccess (para criar roles)
  • AmazonAPIGatewayAdministrator
  • CloudFormationFullAccess

Ou crie policy custom com permissões específicas.


🎯 QUANDO USAR
═══════════════════════════════════════════════════════════════════════════

✨ Primeira configuração:
   Ao configurar o projeto pela primeira vez

✨ Credenciais expiraram:
   Quando Access Key é rotacionada

✨ Trocar de conta AWS:
   Ao mudar de ambiente (dev/prod)

✨ Novo desenvolvedor:
   Setup inicial do ambiente


🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Erro: "Arquivo .env não encontrado"
   → O script cria automaticamente de env.example

❌ Erro: "Invalid Access Key format"
   → Access Key deve começar com AKIA
   → Deve ter 20 caracteres

❌ Credenciais não funcionam
   → Verifique se usuário IAM existe
   → Verifique permissões do usuário
   → Teste com: aws sts get-caller-identity


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

🧪 Testar antes deploy: ..\06-testar-antes-deploy\
📖 Documentação AWS: docs/GUIA_DEPLOY_CLOUD.md


════════════════════════════════════════════════════════════════════════════

⚠️  NUNCA compartilhe suas credenciais AWS!

Criado com ❤️ para facilitar configuração! 🚀

