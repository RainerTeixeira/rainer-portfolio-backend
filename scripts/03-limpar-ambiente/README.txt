╔═══════════════════════════════════════════════════════════════════════════╗
║                  🧹 LIMPAR AMBIENTE - RESET COMPLETO                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Este script realiza uma limpeza COMPLETA do ambiente de desenvolvimento,
removendo TODOS os containers, volumes, dados, node_modules e configurações.

⚠️  ATENÇÃO: Esta é uma operação DESTRUTIVA e IRREVERSÍVEL!

Use quando quiser:
  • Recomeçar completamente do zero
  • Solucionar problemas persistentes
  • Limpar antes de demonstrar o projeto
  • Preparar para deploy
  • Resolver conflitos de dependências


🎯 O QUE É REMOVIDO
═══════════════════════════════════════════════════════════════════════════

🐳 DOCKER:
   ✅ Todos os containers (rodando e parados)
   ✅ Todas as imagens Docker
   ✅ Todos os volumes (DADOS SERÃO PERDIDOS)
   ✅ Todas as redes Docker
   ✅ Cache do Docker

📦 NODE.JS:
   ✅ Pasta node_modules completa
   ✅ Cache do npm
   ✅ Arquivos temporários (*.log, *.tmp)

⚙️ CONFIGURAÇÃO:
   ✅ Arquivo .env (backup criado antes)
   ✅ Logs antigos
   ✅ Processos Node.js rodando

🗄️ DADOS:
   ✅ Todos os dados do MongoDB
   ✅ Todos os dados do DynamoDB Local
   ✅ Histórico do Prisma


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: limpar-ambiente.bat

WINDOWS - Opção 2 (PowerShell):
   .\limpar-ambiente.ps1

LINUX/MAC/WSL:
   chmod +x limpar-ambiente.sh
   ./limpar-ambiente.sh

⚠️  O script SEMPRE pede confirmação antes de executar!


📊 PROCESSO DE LIMPEZA
═══════════════════════════════════════════════════════════════════════════

[1/7] 🛑 Parar Processos Node.js
      • Finaliza todos processos node.exe
      • Libera portas 4000, 5555, 27017, 8000

[2/7] 🐳 Parar e Remover Containers
      • Para todos containers Docker
      • Remove containers do projeto

[3/7] 📦 Remover Imagens Docker
      • Remove todas imagens Docker
      • Libera espaço em disco

[4/7] 💾 Remover Volumes Docker
      • Remove volumes de dados
      • ⚠️  APAGA TODOS OS DADOS

[5/7] 🧹 Limpeza Sistema Docker
      • docker system prune -a -f --volumes
      • docker network prune -f

[6/7] 📁 Limpar Arquivos do Projeto
      • Remove node_modules
      • Remove .env (cria backup)
      • Remove logs
      • Remove temporários

[7/7] 📦 Limpar Cache NPM
      • npm cache clean --force


📊 EXEMPLO DE EXECUÇÃO
═══════════════════════════════════════════════════════════════════════════

> .\limpar-ambiente.bat

╔══════════════════════════════════════════════════════════╗
║         🧹 RESET COMPLETO DO AMBIENTE                   ║
║      LIMPEZA TOTAL DOCKER + NODE + DADOS                ║
╚══════════════════════════════════════════════════════════╝

⚠️  ⚠️  ⚠️  ATENÇÃO: ESTA OPERAÇÃO É DESTRUTIVA! ⚠️  ⚠️  ⚠️

🔴 Esta operação irá remover:
   ┌─ Todos os containers Docker
   ├─ Todas as imagens Docker
   ├─ Todos os volumes Docker (DADOS SERÃO PERDIDOS)
   ├─ Todas as redes Docker
   ├─ Todos os processos Node.js
   ├─ node_modules
   ├─ Arquivo .env
   └─ Logs e arquivos temporários

CONFIRMAR RESET COMPLETO? [S]im ou [N]ão: S

🚀 INICIANDO RESET COMPLETO...

[1/7] 🛑 PARANDO PROCESSOS NODE.JS...
      ✅ Processos Node.js finalizados

[2/7] 🐳 PARANDO E REMOVENDO CONTAINERS DOCKER...
      ✅ Todos os containers removidos

[3/7] 📦 REMOVENDO IMAGENS DOCKER...
      ✅ Todas as imagens removidas

[4/7] 💾 REMOVENDO VOLUMES DOCKER...
      ✅ Todos os volumes removidos

[5/7] 🧹 LIMPEZA DO SISTEMA DOCKER...
      ✅ Sistema Docker limpo

[6/7] 📁 LIMPANDO ARQUIVOS DO PROJETO...
      ✅ node_modules removido
      ✅ Arquivo .env removido
      ✅ Logs removidos
      ✅ Arquivos temporários removidos

[7/7] 📦 LIMPANDO CACHE NPM...
      ✅ Cache do npm limpo

╔══════════════════════════════════════════════════════════╗
║         🎉 RESET COMPLETO COM SUCESSO!                  ║
║      AMBIENTE 100% LIMPO - PRONTO PARA COMEÇAR          ║
╚══════════════════════════════════════════════════════════╝

📊 RESUMO DA LIMPEZA:
   ┌─ Processos Node.js      Finalizados
   ├─ Containers Docker      Removidos
   ├─ Imagens Docker         Removidas
   ├─ Volumes Docker         Removidos
   ├─ node_modules           Removido
   ├─ Arquivo .env           Removido
   └─ Cache npm              Limpo

🚀 PARA COMEÇAR DO ZERO:
   1. npm install                       - Instalar dependências
   2. iniciar-servidor-completo.bat    - Iniciar ambiente


🔄 PRÓXIMOS PASSOS
═══════════════════════════════════════════════════════════════════════════

Após limpar o ambiente, você deve:

1. Reinstalar dependências:
   npm install

2. Configurar ambiente:
   • Copie env.example para .env
   • Configure DATABASE_PROVIDER
   • Configure credenciais AWS (se necessário)

3. Iniciar containers Docker:
   Execute script: ..\02-gerenciar-docker\gerenciar-docker.bat

4. Popular banco de dados:
   npm run seed

5. Iniciar servidor:
   npm run start:dev


⚙️ DUAS VERSÕES DISPONÍVEIS
═══════════════════════════════════════════════════════════════════════════

[1] LIMPEZA RÁPIDA (limpar-ambiente-rapida.*):
    • Remove apenas containers e volumes
    • Mantém node_modules e imagens
    • Mais rápido
    • Use para: Reset de dados

[2] LIMPEZA COMPLETA (limpar-ambiente.*):
    • Remove TUDO
    • Inclui node_modules, cache, imagens
    • Mais demorado
    • Use para: Reset total


⚠️ OBSERVAÇÕES IMPORTANTES
═══════════════════════════════════════════════════════════════════════════

• Sempre cria backup do .env antes de remover
• Requer permissões de administrador no Windows
• Pode demorar alguns minutos
• TODOS OS DADOS serão perdidos
• Não é possível desfazer a operação


💡 QUANDO USAR
═══════════════════════════════════════════════════════════════════════════

✅ Problemas persistentes que não consegue resolver
✅ Conflitos de versão do Node.js ou dependências
✅ Antes de demonstração para cliente
✅ Preparação para deploy em produção
✅ Docker com problemas (imagens corrompidas)
✅ Espaço em disco cheio
✅ Reset completo do projeto

❌ Apenas para trocar de banco (use alternar-banco)
❌ Apenas para limpar dados (use gerenciar-docker clean)
❌ Apenas para atualizar dependências (use npm install)


🆘 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

❌ Erro: "Acesso negado"
   → Execute como Administrador (botão direito → Executar como Admin)

❌ Alguns recursos não foram removidos
   → Reinicie Docker Desktop
   → Execute o script novamente

❌ "Docker is not running"
   → Abra Docker Desktop primeiro
   → Execute o script novamente

❌ Processo não fecha
   → Abra Task Manager (Ctrl+Shift+Esc)
   → Force close do processo


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

🐳 Gerenciar Docker: ..\02-gerenciar-docker\
🔄 Alternar banco: ..\01-alternar-banco-dados\
🔍 Verificar ambiente: ..\07-verificar-ambiente\


════════════════════════════════════════════════════════════════════════════

⚠️  USE COM CAUTELA! Esta operação é IRREVERSÍVEL!

Criado com ❤️ para facilitar o desenvolvimento! 🚀

