╔═══════════════════════════════════════════════════════════════════════════╗
║            🧪 TESTE COMPLETO DE TODAS AS ROTAS DA API                    ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Script UNIFICADO que testa TODAS as rotas da API com operações CRUD completas.
Inclui testes de criação, leitura, atualização e deleção em todos os módulos.

✅ 87+ requisições testadas
✅ Criação automática de dados de teste
✅ Extração automática de IDs para testes dependentes
✅ Relatório detalhado com estatísticas
✅ Limpeza opcional de dados de teste


🎯 MÓDULOS TESTADOS
═══════════════════════════════════════════════════════════════════════════

 1. ❤️  Health Check (crítico - aborta se falhar)
 2. 🔐 Autenticação (registro, login, refresh token)
 3. 👤 Usuários (criar, listar, buscar, atualizar, deletar)
 4. 🏷️  Categorias e Subcategorias (CRUD completo)
 5. 📄 Posts (CRUD, publicar/despublicar, buscar por autor/slug)
 6. 💬 Comentários (CRUD, aprovar/reprovar)
 7. ❤️  Likes (curtir, descurtir, contar)
 8. 🔖 Bookmarks (salvar, organizar em coleções)
 9. 🔔 Notificações (criar, listar, marcar como lida)
10. 🗑️  Limpeza (opcional - deleta dados de teste)


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: testar-api.bat

WINDOWS - Opção 2 (PowerShell):
   .\testar-api.ps1
   .\testar-api.ps1 -DatabaseProvider DYNAMODB
   .\testar-api.ps1 -BaseUrl "http://localhost:3000" (customizado)
   .\testar-api.ps1 -SkipDelete (usa porta do .env)

LINUX/MAC/WSL:
   chmod +x testar-api.sh
   ./testar-api.sh


⚙️ PRÉ-REQUISITOS
═══════════════════════════════════════════════════════════════════════════

1. ✅ Servidor rodando:
      npm run start:dev

2. ✅ DATABASE_PROVIDER configurado no .env:
      DATABASE_PROVIDER=PRISMA

3. ⚠️  (Opcional) Banco populado:
      npm run seed
      
   Nota: O script cria seus próprios dados de teste!


📊 EXEMPLO DE SAÍDA
═══════════════════════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════════╗
║  🧪 TESTE COMPLETO DE TODAS AS ROTAS - BLOG API              ║
╚═══════════════════════════════════════════════════════════════╝

📌 Configurações:
   Base URL:  http://localhost:{PORT do .env}
   Database:  PRISMA (ou lê do .env)
   Ambiente:  LOCAL

════════════════════════════════════════════════════════════════
❤️ 1. HEALTH CHECK (OBRIGATÓRIO)
════════════════════════════════════════════════════════════════

[1] 📍 GET /health
    Health Check Básico
    ✅ OK (Status: 200)
    📄 {"status":"ok","timestamp":"2024-..."}

✅ API ESTÁ SAUDÁVEL! Continuando...

... (87+ requisições) ...

╔═══════════════════════════════════════════════════════════════╗
║  📊 RELATÓRIO FINAL                                           ║
╚═══════════════════════════════════════════════════════════════╝

✅ TESTES CONCLUÍDOS COM SUCESSO!

📈 Estatísticas:
   Total de requisições:  87
   Requisições bem-sucedidas:  85
   Requisições com falha:  2
   Taxa de sucesso:  97.7%

🎯 IDs Gerados:
   UserID:         64f8a9b2c3d4e5f6a7b8c9d0
   CategoryID:     64f8a9b2c3d4e5f6a7b8c9d1
   SubcategoryID:  64f8a9b2c3d4e5f6a7b8c9d2
   PostID:         64f8a9b2c3d4e5f6a7b8c9d3
   ...


💡 PARÂMETROS (PowerShell)
═══════════════════════════════════════════════════════════════════════════

-DatabaseProvider
  Especifica qual banco usar (PRISMA ou DYNAMODB)
  Exemplo: .\testar-api.ps1 -DatabaseProvider DYNAMODB
  Se não informado, lê do arquivo .env

-BaseUrl
  URL base da API (padrão: lê PORT do .env, fallback 4000)
  Exemplo: .\testar-api.ps1 -BaseUrl "https://api.production.com"
  Se não informado, lê automaticamente do .env

-SkipDelete
  Pula a etapa de limpeza de dados
  Exemplo: .\testar-api.ps1 -SkipDelete


🎯 CASOS DE USO
═══════════════════════════════════════════════════════════════════════════

✨ Teste Rápido:
   .\testar-api.bat

✨ Teste em Produção:
   .\testar-api.ps1 -BaseUrl "https://api.production.com"

✨ Teste com DynamoDB:
   .\testar-api.ps1 -DatabaseProvider DYNAMODB

✨ CI/CD Pipeline:
   .\testar-api.ps1 -SkipDelete
   if ($LASTEXITCODE -ne 0) { Write-Error "Testes falharam!" }

✨ Debugging:
   .\testar-api.ps1 -SkipDelete
   # Depois inspecionar via Swagger: http://localhost:{PORT}/docs


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

📖 Ver documentação completa: TESTE_ROTAS_README.md
🌐 Swagger: http://localhost:{PORT}/docs (porta do .env)
❤️  Health Check: http://localhost:{PORT}/health


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para garantir que sua API está funcionando perfeitamente! 🚀

