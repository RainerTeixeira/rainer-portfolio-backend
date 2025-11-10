╔═══════════════════════════════════════════════════════════════════════════╗
║              📊 TESTAR DYNAMODB - VALIDAÇÃO COMPLETA                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Executa validação completa do backend com DynamoDB Local através de testes
automatizados. Garante que a integração entre DynamoDB, AWS SDK e a 
aplicação está funcionando corretamente.

Testa:
  • Conexão com DynamoDB Local
  • Operações CRUD
  • Queries e Scans
  • Índices secundários
  • Performance


🎯 FUNCIONALIDADES
═══════════════════════════════════════════════════════════════════════════

✅ Verificação de pré-requisitos
✅ Inicialização automática do DynamoDB Local
✅ Criação automática de tabelas
✅ Testes de integração
✅ Testes E2E
✅ Cobertura de código
✅ Relatório detalhado


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: testar-dynamodb.bat

WINDOWS - Opção 2 (PowerShell):
   .\testar-dynamodb.ps1                # Todos os testes
   .\testar-dynamodb.ps1 -Quick         # Apenas testes rápidos
   .\testar-dynamodb.ps1 -E2E           # Apenas testes E2E
   .\testar-dynamodb.ps1 -Integration   # Apenas integração
   .\testar-dynamodb.ps1 -Setup         # Apenas setup
   .\testar-dynamodb.ps1 -Coverage      # Com cobertura

LINUX/MAC/WSL:
   chmod +x testar-dynamodb.sh
   ./testar-dynamodb.sh


📊 TIPOS DE TESTE
═══════════════════════════════════════════════════════════════════════════

[1] TESTE RÁPIDO (-Quick):
    • Testes de integração DynamoDB
    • Mais rápido (~2min)
    • Ideal para desenvolvimento

[2] TESTE E2E (-E2E):
    • Testes end-to-end do backend
    • Simula uso real com DynamoDB
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
    • Cria tabelas DynamoDB
    • Não executa testes
    • Útil para debug


📊 EXEMPLO DE EXECUÇÃO
═══════════════════════════════════════════════════════════════════════════

> .\testar-dynamodb.ps1

═══════════════════════════════════════════════════════════════
  🧪 Testes DynamoDB Local
═══════════════════════════════════════════════════════════════

🔹 Verificando pré-requisitos...
✅ Docker está rodando
✅ DynamoDB Local está rodando (blogapi-dynamodb)
✅ Tabelas DynamoDB criadas

🔹 Executando TODOS os testes...

 PASS  tests/integration/dynamodb.integration.test.ts
 PASS  tests/e2e/dynamodb-backend.e2e.test.ts
 ...

═══════════════════════════════════════════════════════════════

✅ TODOS OS TESTES PASSARAM! 🎉

📊 RESUMO:
  • DynamoDB: Conectado ✅
  • Tabelas: Criadas ✅
  • CRUD: Validado ✅
  • Queries: OK ✅

✅ Backend DynamoDB está 100% funcional!


⚙️ PRÉ-REQUISITOS
═══════════════════════════════════════════════════════════════════════════

1. Docker rodando:
   docker ps

2. DynamoDB Local iniciado:
   docker-compose up -d dynamodb-local
   Ou: ..\02-gerenciar-docker\gerenciar-docker.bat start

3. Tabelas criadas:
   npm run dynamodb:create-tables

4. DATABASE_PROVIDER=DYNAMODB no .env


💡 PARÂMETROS (PowerShell)
═══════════════════════════════════════════════════════════════════════════

-Quick
  Executa apenas testes rápidos de integração
  .\testar-dynamodb.ps1 -Quick

-E2E
  Executa apenas testes end-to-end
  .\testar-dynamodb.ps1 -E2E

-Integration
  Executa apenas testes de integração
  .\testar-dynamodb.ps1 -Integration

-Setup
  Apenas prepara o ambiente (não roda testes)
  .\testar-dynamodb.ps1 -Setup

-Coverage
  Gera relatório de cobertura de código
  .\testar-dynamodb.ps1 -Coverage

-Verbose
  Saída detalhada dos testes
  .\testar-dynamodb.ps1 -Verbose


🎯 CASOS DE USO
═══════════════════════════════════════════════════════════════════════════

✨ Durante desenvolvimento:
   .\testar-dynamodb.ps1 -Quick

✨ Antes de commit:
   .\testar-dynamodb.ps1

✨ Validar cobertura:
   .\testar-dynamodb.ps1 -Coverage

✨ Debug de problemas:
   .\testar-dynamodb.ps1 -Setup
   npm run test:debug

✨ CI/CD:
   .\testar-dynamodb.ps1 -Coverage -Verbose


🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Erro: "Docker não está rodando"
   → Inicie Docker Desktop
   → Execute: docker ps

❌ Erro: "DynamoDB Local não está rodando"
   → Execute: docker-compose up -d dynamodb-local
   → Aguarde 10 segundos
   → Tente novamente

❌ Erro: "Tabelas não encontradas"
   → Execute: npm run dynamodb:create-tables
   → Aguarde conclusão
   → Tente novamente

❌ Testes falhando
   → Verifique .env: DATABASE_PROVIDER=DYNAMODB
   → Verifique DYNAMODB_ENDPOINT=http://localhost:8000
   → Verifique logs: docker logs blogapi-dynamodb
   → Reset tabelas: npm run dynamodb:create-tables


📚 COMPARAÇÃO COM MONGODB
═══════════════════════════════════════════════════════════════════════════

| Recurso            | MongoDB + Prisma      | DynamoDB Local        |
|--------------------|----------------------|----------------------|
| Setup              | prisma:generate      | dynamodb:create-tables|
| Porta              | 27017                | 8000                 |
| GUI                | Prisma Studio (5555) | DynamoDB Admin (8001)|
| Schema             | schema.prisma        | Código TypeScript    |
| Queries            | Type-safe (Prisma)   | AWS SDK              |
| Relacionamentos    | Nativo               | Manual (Design NoSQL)|


💡 DIFERENÇAS NOS TESTES
═══════════════════════════════════════════════════════════════════════════

MongoDB/Prisma:
  • Testa ORM (Prisma Client)
  • Validação de schema automática
  • Relacionamentos gerenciados

DynamoDB:
  • Testa AWS SDK direto
  • Schema validado em runtime
  • Queries NoSQL otimizadas
  • Partition Keys e Sort Keys
  • Índices secundários (GSI/LSI)


🔧 ESTRUTURA DOS TESTES
═══════════════════════════════════════════════════════════════════════════

tests/integration/dynamodb.integration.test.ts
  • Testa conexão com DynamoDB
  • CRUD básico em cada tabela
  • Queries e Scans
  • Índices secundários

tests/e2e/dynamodb-backend.e2e.test.ts
  • Testa API completa com DynamoDB
  • Fluxos reais de usuário
  • Performance e latência


📊 TABELAS TESTADAS
═══════════════════════════════════════════════════════════════════════════

✅ blog-users - Usuários
✅ blog-posts - Posts
✅ blog-categories - Categorias
✅ blog-comments - Comentários
✅ blog-likes - Curtidas
✅ blog-bookmarks - Favoritos
✅ blog-notifications - Notificações


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

🐳 Gerenciar Docker: ..\02-gerenciar-docker\
🔄 Alternar banco: ..\01-alternar-banco-dados\
🧪 Testar API: ..\04-testar-api-completo\
🗄️  Testar MongoDB: ..\05-testar-mongodb\


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para garantir qualidade do código! 🚀

