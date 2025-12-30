╔═══════════════════════════════════════════════════════════════════════════╗
║              🗄️  TESTAR MONGODB + PRISMA - VALIDAÇÃO COMPLETA            ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Executa validação completa do backend com MongoDB/Prisma através de testes
automatizados. Garante que a integração entre MongoDB, Prisma ORM e a 
aplicação está funcionando corretamente.

Testa:
  • Conexão com MongoDB
  • Prisma Client
  • Operações CRUD
  • Relacionamentos entre entidades
  • Performance e queries


🎯 FUNCIONALIDADES
═══════════════════════════════════════════════════════════════════════════

✅ Verificação de pré-requisitos
✅ Inicialização automática do MongoDB
✅ Geração do Prisma Client
✅ Testes de integração
✅ Testes E2E
✅ Cobertura de código
✅ Relatório detalhado


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: testar-mongodb.bat

WINDOWS - Opção 2 (PowerShell):
   .\testar-mongodb.ps1                # Todos os testes
   .\testar-mongodb.ps1 -Quick         # Apenas testes rápidos
   .\testar-mongodb.ps1 -E2E           # Apenas testes E2E
   .\testar-mongodb.ps1 -Integration   # Apenas integração
   .\testar-mongodb.ps1 -Setup         # Apenas setup
   .\testar-mongodb.ps1 -Coverage      # Com cobertura

LINUX/MAC/WSL:
   chmod +x testar-mongodb.sh
   ./testar-mongodb.sh


📊 TIPOS DE TESTE
═══════════════════════════════════════════════════════════════════════════

[1] TESTE RÁPIDO (-Quick):
    • Testes de integração MongoDB/Prisma
    • Mais rápido (~2min)
    • Ideal para desenvolvimento

[2] TESTE E2E (-E2E):
    • Testes end-to-end do backend
    • Simula uso real
    • Mais completo (~5min)

[3] TESTE DE INTEGRAÇÃO (-Integration):
    • Todos testes de integração
    • Valida camadas da aplicação
    
[4] TESTE COMPLETO (padrão):
    • Todos os testes
    • Mais demorado (~10min)
    • Recomendado antes de commits

[5] APENAS SETUP (-Setup):
    • Apenas prepara o ambiente
    • Não executa testes
    • Útil para debug


📊 EXEMPLO DE EXECUÇÃO
═══════════════════════════════════════════════════════════════════════════

> .\testar-mongodb.ps1

═══════════════════════════════════════════════════════════════
  🧪 Testes MongoDB + Prisma
═══════════════════════════════════════════════════════════════

🔹 Verificando pré-requisitos...
✅ Docker está rodando
✅ MongoDB está rodando (blogapi-mongodb)
✅ Prisma Client está instalado

🔹 Executando TODOS os testes...

 PASS  tests/integration/mongodb-prisma.integration.test.ts
 PASS  tests/e2e/mongodb-backend.e2e.test.ts
 ...

═══════════════════════════════════════════════════════════════

✅ TODOS OS TESTES PASSARAM! 🎉

📊 RESUMO:
  • MongoDB: Conectado ✅
  • Prisma: Funcionando ✅
  • CRUD: Validado ✅
  • Relacionamentos: OK ✅

✅ Backend MongoDB/Prisma está 100% funcional!


⚙️ PRÉ-REQUISITOS
═══════════════════════════════════════════════════════════════════════════

1. Docker rodando:
   docker ps

2. MongoDB iniciado:
   docker-compose up -d mongodb
   Ou: ..\02-gerenciar-docker\gerenciar-docker.bat start

3. Prisma Client gerado:
   npm run prisma:generate

4. DATABASE_PROVIDER=PRISMA no .env


💡 PARÂMETROS (PowerShell)
═══════════════════════════════════════════════════════════════════════════

-Quick
  Executa apenas testes rápidos de integração
  .\testar-mongodb.ps1 -Quick

-E2E
  Executa apenas testes end-to-end
  .\testar-mongodb.ps1 -E2E

-Integration
  Executa apenas testes de integração
  .\testar-mongodb.ps1 -Integration

-Setup
  Apenas prepara o ambiente (não roda testes)
  .\testar-mongodb.ps1 -Setup

-Coverage
  Gera relatório de cobertura de código
  .\testar-mongodb.ps1 -Coverage

-Verbose
  Saída detalhada dos testes
  .\testar-mongodb.ps1 -Verbose


🎯 CASOS DE USO
═══════════════════════════════════════════════════════════════════════════

✨ Durante desenvolvimento:
   .\testar-mongodb.ps1 -Quick

✨ Antes de commit:
   .\testar-mongodb.ps1

✨ Validar cobertura:
   .\testar-mongodb.ps1 -Coverage

✨ Debug de problemas:
   .\testar-mongodb.ps1 -Setup
   npm run test:debug

✨ CI/CD:
   .\testar-mongodb.ps1 -Coverage -Verbose


🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Erro: "Docker não está rodando"
   → Inicie Docker Desktop
   → Execute: docker ps

❌ Erro: "MongoDB não está rodando"
   → Execute: docker-compose up -d mongodb
   → Aguarde 10 segundos
   → Tente novamente

❌ Erro: "Prisma Client não encontrado"
   → Execute: npm run prisma:generate

❌ Testes falhando
   → Verifique .env: DATABASE_PROVIDER=PRISMA
   → Verifique MongoDB: docker logs blogapi-mongodb
   → Reset banco: npm run prisma:push --force-reset


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

🐳 Gerenciar Docker: ..\02-gerenciar-docker\
🔄 Alternar banco: ..\01-alternar-banco-dados\
🧪 Testar API: ..\04-testar-api-completo\


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para garantir qualidade do código! 🚀

