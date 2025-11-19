╔═══════════════════════════════════════════════════════════════════════════╗
║                    CORRIGIR PROBLEMAS DO WSL PARA DOCKER                 ║
╚═══════════════════════════════════════════════════════════════════════════╝

📋 DESCRIÇÃO
─────────────────────────────────────────────────────────────────────────────
Este script diagnostica e corrige problemas comuns do WSL (Windows Subsystem 
for Linux) que impedem o Docker Desktop de iniciar corretamente.

O erro mais comum é:
  ❌ 0x80070422 - "The service cannot be started, either because it is 
     disabled or because it has no enabled devices associated with it"

Este erro geralmente ocorre quando:
  • O serviço LxssManager está desabilitado
  • O serviço vmcompute está desabilitado
  • Os recursos do Windows para WSL não estão habilitados
  • O WSL precisa ser reiniciado

─────────────────────────────────────────────────────────────────────────────

🚀 COMO USAR
─────────────────────────────────────────────────────────────────────────────

1. DIAGNÓSTICO SIMPLES (sem correção):
   .\corrigir-wsl.bat
   ou
   .\corrigir-wsl.ps1

2. DIAGNÓSTICO + CORREÇÃO AUTOMÁTICA:
   .\corrigir-wsl.ps1 -Fix
   
   ⚠️  NOTA: Requer execução como Administrador!

3. DIAGNÓSTICO + CORREÇÃO + REINICIAR WSL:
   .\corrigir-wsl.ps1 -Fix -Restart
   
   ⚠️  NOTA: Requer execução como Administrador!

─────────────────────────────────────────────────────────────────────────────

🔧 O QUE O SCRIPT FAZ
─────────────────────────────────────────────────────────────────────────────

DIAGNÓSTICO:
  ✅ Verifica status do WSL
  ✅ Verifica serviços do Windows (LxssManager, vmcompute)
  ✅ Verifica recursos do Windows habilitados
  ✅ Testa conexão com Docker

CORREÇÃO (requer Admin):
  ✅ Habilita serviços desabilitados
  ✅ Inicia serviços parados
  ✅ Configura serviços para iniciar automaticamente
  ✅ Reinicia WSL (se solicitado)

─────────────────────────────────────────────────────────────────────────────

⚠️  PERMISSÕES NECESSÁRIAS
─────────────────────────────────────────────────────────────────────────────

• DIAGNÓSTICO: Não requer permissões especiais
• CORREÇÃO: Requer execução como Administrador

Para executar como Administrador:
  1. Clique com botão direito no PowerShell
  2. Selecione "Executar como Administrador"
  3. Navegue até a pasta do script
  4. Execute: .\corrigir-wsl.ps1 -Fix

─────────────────────────────────────────────────────────────────────────────

📝 EXEMPLOS DE USO
─────────────────────────────────────────────────────────────────────────────

# 1. Apenas diagnosticar (sem correção)
.\corrigir-wsl.ps1

# 2. Diagnosticar e corrigir automaticamente
.\corrigir-wsl.ps1 -Fix

# 3. Diagnosticar, corrigir e reiniciar WSL
.\corrigir-wsl.ps1 -Fix -Restart

# 4. Executar como Administrador (PowerShell)
Start-Process powershell -Verb RunAs -ArgumentList '-File', '.\corrigir-wsl.ps1', '-Fix'

─────────────────────────────────────────────────────────────────────────────

🔍 PROBLEMAS COMUNS E SOLUÇÕES
─────────────────────────────────────────────────────────────────────────────

PROBLEMA: "Serviço não encontrado"
SOLUÇÃO:  Instale o WSL executando: wsl --install

PROBLEMA: "Acesso negado" ao corrigir serviços
SOLUÇÃO:  Execute o script como Administrador

PROBLEMA: "Docker ainda não funciona após correção"
SOLUÇÃO:  
  1. Reinicie o computador
  2. Atualize o WSL: wsl --update
  3. Configure WSL 2: wsl --set-default-version 2
  4. Reinicie o Docker Desktop

PROBLEMA: "Recursos do Windows não habilitados"
SOLUÇÃO:  Execute no PowerShell (como Admin):
          Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
          Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

─────────────────────────────────────────────────────────────────────────────

📚 RECURSOS ADICIONAIS
─────────────────────────────────────────────────────────────────────────────

Documentação oficial do WSL:
  https://learn.microsoft.com/pt-br/windows/wsl/

Documentação do Docker Desktop:
  https://docs.docker.com/desktop/windows/

Comandos úteis do WSL:
  wsl --status          # Ver status do WSL
  wsl --list --verbose  # Listar distribuições instaladas
  wsl --update          # Atualizar WSL
  wsl --shutdown        # Encerrar todas as distribuições
  wsl --set-default-version 2  # Configurar WSL 2 como padrão

─────────────────────────────────────────────────────────────────────────────

✅ APÓS A CORREÇÃO
─────────────────────────────────────────────────────────────────────────────

1. Aguarde alguns segundos para os serviços iniciarem
2. Tente iniciar o Docker Desktop
3. Se ainda não funcionar, reinicie o computador
4. Verifique se há atualizações do Windows pendentes

─────────────────────────────────────────────────────────────────────────────

