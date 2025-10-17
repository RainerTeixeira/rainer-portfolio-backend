╔═══════════════════════════════════════════════════════════════════════════╗
║              🔄 ALTERNAR BANCO DE DADOS - MongoDB ↔️ DynamoDB            ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Este script permite alternar facilmente entre dois bancos de dados:
  • MongoDB + Prisma ORM (desenvolvimento rápido)
  • DynamoDB Local (testes pré-produção/AWS)

O script detecta automaticamente a configuração atual no arquivo .env e 
permite trocar com segurança, criando backup automático.


🎯 FUNCIONALIDADES
═══════════════════════════════════════════════════════════════════════════

✅ Detecção automática do banco configurado atualmente
✅ Interface interativa para escolher o banco desejado
✅ Backup automático do arquivo .env
✅ Atualização da variável DATABASE_PROVIDER
✅ Instruções pós-configuração personalizadas
✅ Suporte para MongoDB (Prisma) e DynamoDB Local


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: alternar-banco.bat

WINDOWS - Opção 2 (PowerShell):
   .\alternar-banco.ps1
   .\alternar-banco.ps1 PRISMA       # Alterar direto para MongoDB
   .\alternar-banco.ps1 DYNAMODB     # Alterar direto para DynamoDB
   .\alternar-banco.ps1 status       # Ver configuração atual

LINUX/MAC/WSL:
   chmod +x alternar-banco.sh
   ./alternar-banco.sh


📊 EXEMPLO DE USO
═══════════════════════════════════════════════════════════════════════════

Cenário: Você está desenvolvendo com MongoDB e quer testar com DynamoDB

1. Execute o script: duplo clique em alternar-banco.bat
2. O script detecta: "Banco atual: MongoDB + Prisma"
3. Escolha opção [2] para DynamoDB Local
4. Script cria backup (.env.backup) e atualiza configuração
5. Siga as instruções exibidas para iniciar DynamoDB
6. Pronto! Agora está usando DynamoDB Local


🗄️ BANCOS DE DADOS DISPONÍVEIS
═══════════════════════════════════════════════════════════════════════════

[1] MongoDB + Prisma ORM
    ✓ Desenvolvimento rápido e produtivo
    ✓ Prisma Studio (GUI visual)
    ✓ Type-safe queries
    ✓ Porta: 27017
    ✓ GUI: http://localhost:5555 (Prisma Studio)
    
    Comandos pós-configuração:
      docker-compose up -d mongodb
      npm run prisma:generate
      npm run prisma:push
      npm run dev

[2] DynamoDB Local
    ✓ Testes pré-produção
    ✓ Compatível com AWS Lambda
    ✓ Serverless local
    ✓ Porta: 8000
    ✓ GUI: http://localhost:8001 (DynamoDB Admin)
    
    Comandos pós-configuração:
      docker-compose up -d dynamodb-local
      npm run dynamodb:create-tables
      npm run dynamodb:seed
      npm run dev


⚙️ CONFIGURAÇÕES MODIFICADAS
═══════════════════════════════════════════════════════════════════════════

O script modifica as seguintes variáveis no arquivo .env:

Para MongoDB + Prisma:
  DATABASE_PROVIDER=PRISMA
  DATABASE_URL=mongodb://localhost:27017/blog?replicaSet=rs0&directConnection=true

Para DynamoDB Local:
  DATABASE_PROVIDER=DYNAMODB
  DYNAMODB_ENDPOINT=http://localhost:8000
  DYNAMODB_TABLE_PREFIX=blog


🔒 SEGURANÇA
═══════════════════════════════════════════════════════════════════════════

• Backup automático criado antes de qualquer alteração
• Arquivo de backup salvo como: .env.backup
• Validação de configuração atual antes de alternar
• Não permite alternar para configuração já ativa


💡 DICAS
═══════════════════════════════════════════════════════════════════════════

✨ Use MongoDB + Prisma para:
   • Desenvolvimento rápido
   • Testes de funcionalidades
   • Visualização de dados com Prisma Studio

✨ Use DynamoDB Local para:
   • Testes pré-deploy AWS
   • Simular ambiente serverless
   • Validar performance com DynamoDB


⚠️ OBSERVAÇÕES IMPORTANTES
═══════════════════════════════════════════════════════════════════════════

• O servidor deve ser reiniciado após alternar banco
• Os dados não são migrados automaticamente entre bancos
• Certifique-se que o Docker está rodando
• Verifique se as portas necessárias estão livres


🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Erro: "Arquivo .env não encontrado"
   → Execute um dos scripts de inicialização primeiro

❌ Erro: "Já está configurado para X"
   → Você já está usando o banco selecionado

❌ Container não inicia
   → Verifique se Docker está rodando: docker ps
   → Verifique se porta está livre: netstat -ano | findstr :27017


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

📖 Ver status atual: .\alternar-banco.ps1 status
🐳 Gerenciar Docker: ..\02-gerenciar-docker\
🔍 Verificar ambiente: ..\07-verificar-ambiente\


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para facilitar o desenvolvimento! 🚀

