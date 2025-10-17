╔═══════════════════════════════════════════════════════════════════════════╗
║           🐳 GERENCIAR AMBIENTE DOCKER COMPLETO                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Gerencia o ambiente completo de desenvolvimento com Docker, incluindo:
  • MongoDB + Replica Set
  • DynamoDB Local
  • Prisma Studio (GUI para MongoDB)
  • DynamoDB Admin (GUI para DynamoDB)

Script all-in-one para iniciar, parar, reiniciar e verificar status de 
todos os serviços necessários para desenvolvimento.


🎯 FUNCIONALIDADES
═══════════════════════════════════════════════════════════════════════════

✅ Iniciar todos os serviços Docker simultaneamente
✅ Parar todos os serviços de forma segura
✅ Reiniciar serviços rapidamente
✅ Ver status detalhado de cada container
✅ Visualizar logs em tempo real
✅ Limpar volumes (resetar dados)
✅ Verificação automática de Docker


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: gerenciar-docker.bat

WINDOWS - Opção 2 (PowerShell):
   .\gerenciar-docker.ps1              # Iniciar ambiente
   .\gerenciar-docker.ps1 start        # Iniciar ambiente
   .\gerenciar-docker.ps1 stop         # Parar ambiente
   .\gerenciar-docker.ps1 restart      # Reiniciar ambiente
   .\gerenciar-docker.ps1 status       # Ver status
   .\gerenciar-docker.ps1 logs         # Ver logs
   .\gerenciar-docker.ps1 clean        # Limpar volumes

LINUX/MAC/WSL:
   chmod +x gerenciar-docker.sh
   ./gerenciar-docker.sh start
   ./gerenciar-docker.sh status


📊 SERVIÇOS GERENCIADOS
═══════════════════════════════════════════════════════════════════════════

[1] MongoDB (blogapi-mongodb)
    • Porta: 27017
    • Replica Set: rs0
    • Uso: Banco de dados principal (modo Prisma)
    
[2] DynamoDB Local (blogapi-dynamodb)
    • Porta: 8000
    • Uso: Banco de dados (modo DynamoDB)
    
[3] Prisma Studio (blogapi-prisma-studio)
    • Porta: 5555
    • URL: http://localhost:5555
    • Uso: GUI visual para MongoDB
    
[4] DynamoDB Admin (blogapi-dynamodb-admin)
    • Porta: 8001
    • URL: http://localhost:8001
    • Uso: GUI visual para DynamoDB


🎬 COMANDOS DISPONÍVEIS
═══════════════════════════════════════════════════════════════════════════

start
  Inicia todos os serviços Docker
  • Verifica se Docker está rodando
  • Inicia MongoDB, DynamoDB e interfaces gráficas
  • Aguarda inicialização (3 segundos)
  • Exibe status e URLs de acesso

stop
  Para todos os serviços de forma segura
  • Executa docker-compose down
  • Mantém volumes preservados

restart
  Reinicia todo o ambiente
  • Executa stop + start sequencialmente

status
  Exibe status detalhado de cada serviço
  • Nome do container
  • Status (rodando/parado)
  • Portas expostas
  • URLs de acesso
  • Comando para iniciar aplicação

logs
  Visualiza logs em tempo real
  • Logs de MongoDB e DynamoDB
  • Pressione Ctrl+C para sair

clean
  Remove volumes e limpa dados
  • ATENÇÃO: Apaga TODOS os dados
  • Solicita confirmação antes de executar
  • Útil para reset completo


📊 EXEMPLO DE USO - START
═══════════════════════════════════════════════════════════════════════════

> .\gerenciar-docker.ps1 start

╔════════════════════════════════════════════════════════════╗
║  INICIANDO AMBIENTE COMPLETO DE DESENVOLVIMENTO           ║
╚════════════════════════════════════════════════════════════╝

ℹ️  Iniciando MongoDB + DynamoDB Local + Interfaces Gráficas...
✅ Ambiente iniciado com sucesso!

╔════════════════════════════════════════════════════════════╗
║  STATUS DOS SERVIÇOS                                       ║
╚════════════════════════════════════════════════════════════╝

✅ MongoDB - Rodando (Porta: 27017)
✅ DynamoDB Local - Rodando (Porta: 8000)
✅ Prisma Studio - Rodando (Porta: 5555)
✅ DynamoDB Admin - Rodando (Porta: 8001)

╔════════════════════════════════════════════════════════════╗
║  ACESSE AS INTERFACES                                      ║
╚════════════════════════════════════════════════════════════╝

🗄️  MongoDB:
   Connection: mongodb://localhost:27017/blog?replicaSet=rs0
   GUI: http://localhost:5555 (Prisma Studio)

📊 DynamoDB Local:
   Endpoint: http://localhost:8000
   GUI: http://localhost:8001 (DynamoDB Admin)

🚀 Para iniciar a aplicação:
   npm run start:dev


📊 EXEMPLO DE USO - STATUS
═══════════════════════════════════════════════════════════════════════════

> .\gerenciar-docker.ps1 status

╔════════════════════════════════════════════════════════════╗
║  STATUS DOS SERVIÇOS                                       ║
╚════════════════════════════════════════════════════════════╝

✅ MongoDB - Rodando (Porta: 27017)
⚠️  DynamoDB Local - Parado
✅ Prisma Studio - Rodando (Porta: 5555)
⚠️  DynamoDB Admin - Parado


⚙️ CONFIGURAÇÃO
═══════════════════════════════════════════════════════════════════════════

O script usa o arquivo docker-compose.yml na raiz do projeto.

Portas utilizadas:
  • 27017 - MongoDB
  • 8000 - DynamoDB Local
  • 5555 - Prisma Studio
  • 8001 - DynamoDB Admin

Volumes criados:
  • mongodb-data: Dados do MongoDB
  • dynamodb-data: Dados do DynamoDB Local


💡 DICAS
═══════════════════════════════════════════════════════════════════════════

✨ Para desenvolvimento rápido:
   1. .\gerenciar-docker.ps1 start
   2. npm run start:dev
   3. Acesse http://localhost:4000/docs

✨ Para resetar dados:
   .\gerenciar-docker.ps1 clean
   
✨ Ver o que está acontecendo:
   .\gerenciar-docker.ps1 logs

✨ Verificar se tudo está OK:
   .\gerenciar-docker.ps1 status


⚠️ OBSERVAÇÕES IMPORTANTES
═══════════════════════════════════════════════════════════════════════════

• Docker Desktop deve estar instalado e rodando
• Portas 27017, 8000, 5555, 8001 devem estar livres
• Windows: Compartilhamento de drives deve estar habilitado
• O comando 'clean' apaga TODOS os dados dos bancos


🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Erro: "Docker não está rodando"
   → Abra o Docker Desktop e aguarde inicializar

❌ Erro: "Porta já está em uso"
   → Verifique processos: netstat -ano | findstr :8000
   → Pare processo: taskkill /PID <pid> /F

❌ Container não inicia
   → Verifique logs: docker-compose logs <service>
   → Tente clean: .\gerenciar-docker.ps1 clean

❌ "Error response from daemon"
   → Reinicie Docker Desktop
   → Execute: .\gerenciar-docker.ps1 restart


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

🔄 Alternar banco: ..\01-alternar-banco-dados\
📊 Ver status containers: ..\08-status-containers\
🔍 Verificar ambiente: ..\07-verificar-ambiente\


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para facilitar o desenvolvimento! 🚀

