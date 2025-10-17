╔═══════════════════════════════════════════════════════════════════════════╗
║              🚀 INICIAR AMBIENTE - SETUP COMPLETO DO PROJETO             ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Scripts para inicializar o ambiente de desenvolvimento completo do projeto.
Inclui opções para MongoDB, DynamoDB ou ambos simultaneamente.

✅ Setup automático de containers Docker
✅ Configuração automática de banco de dados
✅ População de dados de teste
✅ Inicialização do servidor
✅ Interface visual colorida


🎯 TRÊS OPÇÕES DISPONÍVEIS
═══════════════════════════════════════════════════════════════════════════

1️⃣ INICIAR COM MONGODB + PRISMA
   📂 Scripts: iniciar-mongodb.*
   
   ✅ MongoDB + Replica Set
   ✅ Prisma ORM configurado
   ✅ Prisma Studio (GUI)
   ✅ Dados de teste populados
   
   Ideal para: Desenvolvimento rápido e produtivo

2️⃣ INICIAR COM DYNAMODB LOCAL
   📂 Scripts: iniciar-dynamodb.*
   
   ✅ DynamoDB Local
   ✅ Tabelas criadas automaticamente
   ✅ Opção de popular dados
   ✅ DynamoDB Admin (GUI)
   
   Ideal para: Testes pré-deploy AWS

3️⃣ INICIAR AMBIENTE COMPLETO
   📂 Scripts: iniciar-completo.*
   
   ✅ MongoDB + DynamoDB juntos
   ✅ Ambos configurados e prontos
   ✅ Flexibilidade total
   
   Ideal para: Desenvolvimento e testes simultâneos


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

OPÇÃO 1: MONGODB + PRISMA
─────────────────────────────────────────────────────────────────────────

Windows - Duplo clique:
   iniciar-mongodb.bat

PowerShell:
   .\iniciar-mongodb.ps1

Linux/Mac:
   chmod +x iniciar-mongodb.sh
   ./iniciar-mongodb.sh


OPÇÃO 2: DYNAMODB LOCAL
─────────────────────────────────────────────────────────────────────────

Windows - Duplo clique:
   iniciar-dynamodb.bat

PowerShell:
   .\iniciar-dynamodb.ps1

Linux/Mac:
   chmod +x iniciar-dynamodb.sh
   ./iniciar-dynamodb.sh


OPÇÃO 3: AMBIENTE COMPLETO
─────────────────────────────────────────────────────────────────────────

Windows - Duplo clique:
   iniciar-completo.bat

PowerShell:
   .\iniciar-completo.ps1

Linux/Mac:
   chmod +x iniciar-completo.sh
   ./iniciar-completo.sh


📊 O QUE CADA SCRIPT FAZ
═══════════════════════════════════════════════════════════════════════════

INICIAR-MONGODB:
  1. ✅ Verifica Docker
  2. ✅ Cria .env (se não existir)
  3. ✅ Inicia MongoDB container
  4. ✅ Aguarda Replica Set (30s com barra de progresso)
  5. ✅ Gera Prisma Client
  6. ✅ Sincroniza schema
  7. ✅ Popula dados de teste
  8. ✅ Inicia servidor
  
  Dados criados:
    • 5 usuários (diferentes roles)
    • 9 categorias + subcategorias
    • 9 posts
    • Comentários, likes, bookmarks
  
  URLs disponíveis:
    • API: http://localhost:4000
    • Swagger: http://localhost:4000/docs
    • Prisma Studio: http://localhost:5555

INICIAR-DYNAMODB:
  1. ✅ Verifica Docker
  2. ✅ Cria/configura .env para DynamoDB
  3. ✅ Inicia DynamoDB Local container
  4. ✅ Aguarda inicialização (5s)
  5. ✅ Cria tabelas DynamoDB
  6. ✅ Pergunta se quer popular dados (opcional)
  7. ✅ Inicia servidor
  
  URLs disponíveis:
    • API: http://localhost:4000
    • Swagger: http://localhost:4000/docs
    • DynamoDB: http://localhost:8000
    • DynamoDB Admin: http://localhost:8001

INICIAR-COMPLETO:
  Executa TUDO dos dois ambientes acima:
  • MongoDB + Prisma
  • DynamoDB Local
  • Ambos populados
  • Servidor pronto
  
  Use quando precisar testar ambos os bancos ou alternar
  facilmente entre eles durante o desenvolvimento.


⚙️ PRÉ-REQUISITOS
═══════════════════════════════════════════════════════════════════════════

✅ Docker Desktop instalado e rodando
✅ Node.js v18+ instalado
✅ npm instalado
✅ Dependências instaladas (npm install)

Portas necessárias livres:
  • 4000 - API
  • 27017 - MongoDB
  • 8000 - DynamoDB
  • 5555 - Prisma Studio
  • 8001 - DynamoDB Admin


💡 QUANDO USAR CADA UM
═══════════════════════════════════════════════════════════════════════════

✨ MONGODB (iniciar-mongodb):
   • Desenvolvimento do dia-a-dia
   • Quando precisa de Prisma Studio
   • Features que usam relacionamentos
   • Desenvolvimento rápido

✨ DYNAMODB (iniciar-dynamodb):
   • Testes antes de deploy AWS
   • Validar queries NoSQL
   • Simular ambiente serverless
   • Performance testing

✨ COMPLETO (iniciar-completo):
   • Primeira vez configurando projeto
   • Quer ter ambos disponíveis
   • Desenvolvimento cross-database
   • Testes de migração


🔧 CARACTERÍSTICAS ESPECIAIS
═══════════════════════════════════════════════════════════════════════════

✨ Interface Visual Colorida:
   • Barras de progresso animadas
   • Cores para cada etapa
   • Emojis para facilitar leitura
   • Resumo final detalhado

✨ Tratamento de Erros:
   • Valida cada etapa
   • Mensagens claras de erro
   • Dicas de solução
   • Exit codes apropriados

✨ Feedback em Tempo Real:
   • Mostra o que está acontecendo
   • Progresso visual
   • Tempo estimado
   • URLs prontas para copiar


📊 EXEMPLO DE EXECUÇÃO
═══════════════════════════════════════════════════════════════════════════

> iniciar-mongodb.bat

╔══════════════════════════════════════════════════════════════╗
║            🚀 INICIANDO AMBIENTE LOCAL                       ║
║            PRISMA + MONGODB + EXPRESS                        ║
╚══════════════════════════════════════════════════════════════╝

🔍 VERIFICANDO DEPENDÊNCIAS...
✅ Docker detectado e funcionando

╔══════════════════════════════════════════════════════════════╗
║                 🐳 INICIANDO MONGODB                         ║
╚══════════════════════════════════════════════════════════════╝

🔄 Iniciando container MongoDB...
✅ MongoDB iniciado com sucesso

⏳ Aguardando inicialização do Replica Set...
   [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■] 100%
✅ MongoDB Replica Set pronto!

╔══════════════════════════════════════════════════════════════╗
║                 🔧 CONFIGURANDO PRISMA                       ║
╚══════════════════════════════════════════════════════════════╝

📦 Gerando Prisma Client...
✅ Prisma Client gerado com sucesso

🔄 Sincronizando schema com MongoDB...
✅ Schema sincronizado com sucesso

🌱 Populando banco de dados...
✅ Banco de dados populado com sucesso

╔══════════════════════════════════════════════════════════════╗
║          ✨ AMBIENTE CONFIGURADO COM SUCESSO!               ║
╚══════════════════════════════════════════════════════════════╝

🌐 URLS DO SISTEMA:
   ┌─ API Principal    http://localhost:4000
   ├─ Documentação     http://localhost:4000/docs
   ├─ Health Check     http://localhost:4000/health
   └─ Prisma Studio    http://localhost:5555


🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Erro: "Docker não está rodando"
   → Inicie Docker Desktop
   → Aguarde até estar pronto
   → Execute o script novamente

❌ Erro: "Porta já está em uso"
   → Verifique: netstat -ano | findstr :4000
   → Finalize processo conflitante
   → Ou mude PORT no .env

❌ Erro ao criar tabelas DynamoDB
   → Verifique logs: docker logs blogapi-dynamodb
   → Reset: docker-compose down -v
   → Execute novamente

❌ MongoDB Replica Set não inicia
   → Aguarde mais tempo (até 60s)
   → Verifique logs: docker logs blogapi-mongodb
   → Reset: docker-compose down -v
   → Execute novamente


💡 DICAS ÚTEIS
═══════════════════════════════════════════════════════════════════════════

✨ Primeira vez usando:
   Use iniciar-completo.bat para ter tudo configurado

✨ Desenvolvimento diário:
   Use iniciar-mongodb.bat (mais rápido)

✨ Antes de deploy:
   Use iniciar-dynamodb.bat para testar

✨ Para parar tudo:
   Ctrl+C no terminal + docker-compose down

✨ Para resetar completamente:
   docker-compose down -v (remove volumes)


📚 SCRIPTS RELACIONADOS
═══════════════════════════════════════════════════════════════════════════

🔄 Alternar banco: scripts/01-alternar-banco-dados/
🐳 Gerenciar Docker: scripts/02-gerenciar-docker/
🧹 Limpar ambiente: scripts/03-limpar-ambiente/
🔍 Verificar setup: scripts/08-verificar-ambiente/


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para facilitar o desenvolvimento! 🚀

