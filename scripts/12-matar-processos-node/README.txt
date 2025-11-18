╔══════════════════════════════════════════════════════════════════════════╗
║              🛑 SCRIPTS PARA FINALIZAR PROCESSOS NODE.JS                 ║
╚══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO:
   Scripts para finalizar todos os processos Node.js, npm e pnpm que estejam
   rodando no sistema, incluindo processos em portas comuns.

🎯 USO:
   Execute o script apropriado para seu sistema operacional após rodar o
   frontend e backend para limpar todos os processos Node.js.

📁 ARQUIVOS:
   • matar-node.bat   - Windows (CMD)
   • matar-node.ps1   - Windows (PowerShell)
   • matar-node.sh    - Linux/Mac (Bash)

🚀 COMO USAR:

   Windows (CMD):
   --------------
   cd scripts\12-matar-processos-node
   matar-node.bat

   Windows (PowerShell):
   ---------------------
   cd scripts\12-matar-processos-node
   .\matar-node.ps1

   Linux/Mac:
   ----------
   cd scripts/12-matar-processos-node
   chmod +x matar-node.sh
   ./matar-node.sh

✨ FUNCIONALIDADES:

   ✅ Finaliza todos os processos node.exe/node
   ✅ Finaliza processos npm
   ✅ Finaliza processos pnpm
   ✅ Libera portas comuns (3000, 4000, 5555, 6007)
   ✅ Verificação final para confirmar limpeza
   ✅ Mensagens coloridas e informativas

⚠️  NOTAS:

   • Os scripts tentam finalizar processos de forma forçada
   • Se alguns processos persistirem, execute como Administrador (Windows)
     ou com sudo (Linux/Mac)
   • O script verifica e mata processos em portas específicas que podem
     estar ocupadas por servidores Node.js

📊 O QUE É FINALIZADO:

   • Todos os processos node.exe/node
   • Todos os processos npm
   • Todos os processos pnpm
   • Processos nas portas: 3000, 4000, 5555, 6007

💡 DICAS:

   • Execute após rodar frontend e backend para limpar completamente
   • Use antes de iniciar novos servidores para evitar conflitos de porta
   • Pode ser útil após fechar o terminal sem parar os processos

