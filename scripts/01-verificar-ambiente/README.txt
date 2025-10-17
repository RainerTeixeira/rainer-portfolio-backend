╔═══════════════════════════════════════════════════════════════════════════╗
║                🔍 VERIFICAR AMBIENTE - DIAGNÓSTICO COMPLETO               ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Script de diagnóstico que verifica se todo o ambiente de desenvolvimento
está configurado corretamente. Valida ferramentas, portas, arquivos e
containers Docker.

Perfeito para:
  • Diagnosticar problemas
  • Verificar configuração inicial
  • Confirmar que tudo está pronto
  • Troubleshooting rápido


🎯 O QUE É VERIFICADO
═══════════════════════════════════════════════════════════════════════════

[1/6] Docker
  ✅ Docker está instalado
  ✅ Docker Desktop está rodando
  ✅ Versão do Docker

[2/6] Node.js
  ✅ Node.js está instalado
  ✅ Versão do Node.js (recomendado: v18+)

[3/6] npm
  ✅ npm está instalado
  ✅ Versão do npm

[4/6] Portas
  ✅ 4000 - API (livre ou em uso)
  ✅ 27017 - MongoDB (livre ou em uso)
  ✅ 8000 - DynamoDB (livre ou em uso)
  ✅ 5555 - Prisma Studio (livre ou em uso)
  ✅ 8001 - DynamoDB Admin (livre ou em uso)

[5/6] Arquivos
  ✅ .env existe e configurado
  ✅ DATABASE_PROVIDER definido
  ✅ node_modules instalado
  ✅ package.json existe

[6/6] Containers Docker
  ✅ Containers BlogAPI rodando
  ✅ Status de cada container
  ✅ Portas expostas


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: verificar-ambiente.bat

WINDOWS - Opção 2 (PowerShell):
   .\verificar-ambiente.ps1

LINUX/MAC/WSL:
   chmod +x verificar-ambiente.sh
   ./verificar-ambiente.sh


📊 EXEMPLO DE SAÍDA
═══════════════════════════════════════════════════════════════════════════

╔══════════════════════════════════════════════════════════════╗
║                🔍 VERIFICAÇÃO DO AMBIENTE                    ║
╚══════════════════════════════════════════════════════════════╝

[1/6] Verificando Docker...
     ✅ Docker está funcionando

[2/6] Verificando Node.js...
     ✅ Node.js instalado - v20.10.0

[3/6] Verificando npm...
     ✅ npm instalado - v10.2.3

[4/6] Verificando portas...
     ✅ Porta 4000 (API) está livre
     ⚠️  Porta 27017 (MongoDB) está em uso
     ✅ Porta 8000 (DynamoDB) está livre
     ✅ Porta 5555 (Prisma Studio) está livre

[5/6] Verificando arquivos...
     ✅ Arquivo .env existe
     🗄️  Configurado para: MongoDB + Prisma
     ✅ node_modules existe
     ✅ package.json existe

[6/6] Verificando containers Docker...
     ✅ Containers BlogAPI encontrados:
     - blogapi-mongodb: Up 2 hours (healthy)
     - blogapi-prisma-studio: Up 2 hours

╔══════════════════════════════════════════════════════════════╗
║                📋 RESUMO DA VERIFICAÇÃO                      ║
╚══════════════════════════════════════════════════════════════╝

✨ Ambiente pronto para uso!
Execute: iniciar-ambiente-local.bat


🎯 CASOS DE USO
═══════════════════════════════════════════════════════════════════════════

✨ Primeira configuração:
   Após instalar o projeto pela primeira vez

✨ Problemas ao iniciar:
   Quando algo não funciona

✨ Após atualizar sistema:
   Verificar se tudo ainda funciona

✨ Antes de iniciar trabalho:
   Confirmar que ambiente está OK

✨ Troubleshooting:
   Diagnosticar problemas rapidamente


💡 INTERPRETANDO RESULTADOS
═══════════════════════════════════════════════════════════════════════════

✅ Verde: Tudo OK, funcionando perfeitamente

⚠️  Amarelo: Aviso, pode funcionar mas verifique
   • Porta em uso: Normal se servidor já está rodando
   • Container parado: Normal se ainda não iniciou

❌ Vermelho: Erro, precisa corrigir
   • Docker não rodando: Inicie Docker Desktop
   • Node.js não instalado: Instale Node.js
   • .env não existe: Execute script de inicialização


🔧 SOLUÇÕES RÁPIDAS
═══════════════════════════════════════════════════════════════════════════

❌ Docker não está rodando
   → Abra Docker Desktop
   → Aguarde inicializar
   → Execute verificação novamente

❌ Node.js não instalado
   → Baixe em: https://nodejs.org/
   → Instale versão LTS
   → Reinicie terminal

❌ .env não existe
   → Execute: ..\01-alternar-banco-dados\alternar-banco.bat
   → Ou copie env.example para .env

❌ node_modules não existe
   → Execute: npm install
   → Aguarde instalação

⚠️  Porta em uso
   → Se servidor rodando: Normal
   → Se não: Encontre processo e finalize
   → Windows: netstat -ano | findstr :4000
   → Linux: lsof -i :4000


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

🐳 Gerenciar Docker: ..\02-gerenciar-docker\
📊 Ver status containers: ..\08-status-containers\
🔄 Alternar banco: ..\01-alternar-banco-dados\


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para facilitar o diagnóstico! 🚀

