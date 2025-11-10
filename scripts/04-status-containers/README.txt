╔═══════════════════════════════════════════════════════════════════════════╗
║              🐳 STATUS DOS CONTAINERS DOCKER - VISUALIZAÇÃO               ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
═══════════════════════════════════════════════════════════════════════════

Visualiza o status detalhado de todos os containers Docker do projeto,
incluindo portas, status de saúde e URLs de acesso. Interface colorida
e organizada para fácil visualização.

✅ Status de cada container
✅ Portas expostas
✅ Health check status
✅ URLs de acesso
✅ Comandos úteis


🎯 INFORMAÇÕES EXIBIDAS
═══════════════════════════════════════════════════════════════════════════

Para cada container:
  • Nome do container
  • Status (Up/Down)
  • Tempo rodando
  • Health status (healthy/unhealthy)
  • Portas expostas
  • URLs de acesso


🚀 COMO USAR
═══════════════════════════════════════════════════════════════════════════

WINDOWS - Opção 1 (Mais Fácil):
   Duplo clique em: status-containers.bat

WINDOWS - Opção 2 (PowerShell):
   .\status-containers.ps1

LINUX/MAC/WSL:
   chmod +x status-containers.sh
   ./status-containers.sh


📊 EXEMPLO DE SAÍDA
═══════════════════════════════════════════════════════════════════════════

╔══════════════════════════════════════════════════════════════╗
║            🐳 STATUS DOS CONTAINERS DOCKER                   ║
╚══════════════════════════════════════════════════════════════╝

✅ Docker está rodando

🔍 Containers do BlogAPI:

┌─────────────────────────┬──────────────────────────┬─────────────┐
│ CONTAINER               │ STATUS                   │ PORTAS      │
├─────────────────────────┼──────────────────────────┼─────────────┤
│ blogapi-mongodb         │ Up 2 hours (healthy)     │ 27017       │
│ blogapi-dynamodb        │ Up 2 hours               │ 8000        │
│ blogapi-prisma-studio   │ Up 2 hours               │ 5555        │
│ blogapi-dynamodb-admin  │ Up 30 minutes            │ 8001        │
└─────────────────────────┴──────────────────────────┴─────────────┘

📊 Resumo Geral:
   Total de containers BlogAPI: 4
   Containers rodando: 4

🌐 URLs Disponíveis:
   ✅ MongoDB:        mongodb://localhost:27017
   ✅ DynamoDB:       http://localhost:8000
   ✅ Prisma Studio:  http://localhost:5555
   ✅ DynamoDB Admin: http://localhost:8001

⚡ Comandos Úteis:
   Ver logs de um container:
   docker-compose logs -f [container-fullName]

   Parar todos os containers:
   docker-compose down

   Reiniciar um container:
   docker-compose restart [service-fullName]


🎯 CASOS DE USO
═══════════════════════════════════════════════════════════════════════════

✨ Verificação rápida:
   Ver o que está rodando

✨ Troubleshooting:
   Identificar containers parados ou com problemas

✨ Antes de iniciar servidor:
   Confirmar que bancos estão rodando

✨ Durante desenvolvimento:
   Monitorar status dos serviços


💡 ENTENDENDO OS STATUS
═══════════════════════════════════════════════════════════════════════════

✅ Up X hours (healthy)
   Container rodando perfeitamente

✅ Up X minutes
   Container rodando (sem health check configurado)

⚠️  Up X hours (unhealthy)
   Container rodando mas com problemas
   → Verifique logs: docker logs [container]

❌ Exited (0) X hours ago
   Container parado normalmente
   → Inicie: docker-compose up -d [service]

❌ Exited (1) X minutes ago
   Container parou com erro
   → Verifique logs: docker logs [container]


🔧 COMANDOS ÚTEIS MOSTRADOS
═══════════════════════════════════════════════════════════════════════════

Ver logs em tempo real:
  docker-compose logs -f [service-fullName]
  
Parar todos containers:
  docker-compose down
  
Reiniciar container específico:
  docker-compose restart [service-fullName]
  
Ver logs de todos:
  docker-compose logs -f


📚 MAIS INFORMAÇÕES
═══════════════════════════════════════════════════════════════════════════

🐳 Gerenciar Docker: ..\02-gerenciar-docker\
🔍 Verificar ambiente: ..\07-verificar-ambiente\


════════════════════════════════════════════════════════════════════════════

Criado com ❤️ para facilitar o monitoramento! 🚀

