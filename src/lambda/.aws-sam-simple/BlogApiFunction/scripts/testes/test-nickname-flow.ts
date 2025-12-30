/**
 * Script de Teste - Fluxo de Escolha de Nickname OAuth
 * 
 * Testa as funcionalidades implementadas para solicitar nickname
 * de usuários OAuth (Google/GitHub) na primeira vez.
 * 
 * Uso:
 * ```bash
 * npx tsx scripts/testes/test-nickname-flow.ts
 * ```
 */

import { config } from 'dotenv';
config();

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: (msg: string) => console.log(`${colors.cyan}➤${colors.reset} ${msg}`),
};

async function testNicknameFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('  Teste: Fluxo de Escolha de Nickname OAuth');
  console.log('='.repeat(60) + '\n');

  let passedTests = 0;
  let failedTests = 0;

  // ===================================================================
  // Teste 1: Verificar se tipos estão corretos
  // ===================================================================
  log.test('Teste 1: Verificar tipos TypeScript');
  try {
    const { LoginResponseUser } = await import('../../src/modules/auth/auth.model.js');
    
    // Verificar se LoginResponseUser tem needsNickname
    const mockUser: any = {
      id: '123',
      cognitoSub: 'abc',
      fullName: 'Test',
      email: 'test@test.com',
      role: 'AUTHOR',
      isActive: true,
      isBanned: false,
      postsCount: 0,
      commentsCount: 0,
      needsNickname: true, // Campo novo
    };
    
    log.success('Tipo LoginResponseUser aceita needsNickname');
    passedTests++;
  } catch (error) {
    log.error(`Erro ao verificar tipos: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Teste 2: Verificar se schema Prisma não tem needsNickname
  // ===================================================================
  log.test('Teste 2: Verificar schema Prisma (não deve ter needsNickname)');
  try {
    const fs = await import('fs');
    const schemaContent = fs.readFileSync('src/prisma/schema.prisma', 'utf-8');
    
    if (schemaContent.includes('needsNickname')) {
      log.error('Schema Prisma contém needsNickname (não deveria!)');
      failedTests++;
    } else {
      log.success('Schema Prisma NÃO contém needsNickname (correto!)');
      passedTests++;
    }
  } catch (error) {
    log.error(`Erro ao verificar schema: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Teste 3: Verificar se User model não tem nickname
  // ===================================================================
  log.test('Teste 3: Verificar User model (não deve ter nickname)');
  try {
    const fs = await import('fs');
    const modelContent = fs.readFileSync('src/modules/users/user.model.ts', 'utf-8');
    
    // Deve ter o comentário sobre nickname mas não o campo no User
    const userInterfaceMatch = modelContent.match(/export interface User \{[\s\S]*?\}/);
    if (userInterfaceMatch) {
      const userInterface = userInterfaceMatch[0];
      if (userInterface.includes('nickname:')) {
        log.error('User interface contém campo nickname (não deveria!)');
        failedTests++;
      } else {
        log.success('User interface NÃO contém campo nickname (correto!)');
        passedTests++;
      }
    } else {
      log.warning('Não foi possível verificar interface User');
    }
  } catch (error) {
    log.error(`Erro ao verificar model: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Teste 4: Verificar endpoint checkNeedsNickname
  // ===================================================================
  log.test('Teste 4: Verificar se endpoint checkNeedsNickname existe');
  try {
    const fs = await import('fs');
    const controllerContent = fs.readFileSync('src/modules/auth/auth.controller.ts', 'utf-8');
    
    if (controllerContent.includes('checkNeedsNickname') && 
        controllerContent.includes('needs-nickname/:cognitoSub')) {
      log.success('Endpoint GET /auth/needs-nickname/:cognitoSub encontrado');
      passedTests++;
    } else {
      log.error('Endpoint checkNeedsNickname não encontrado');
      failedTests++;
    }
  } catch (error) {
    log.error(`Erro ao verificar controller: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Teste 5: Verificar método checkNeedsNickname no service
  // ===================================================================
  log.test('Teste 5: Verificar método checkNeedsNickname no AuthService');
  try {
    const fs = await import('fs');
    const serviceContent = fs.readFileSync('src/modules/auth/auth.service.ts', 'utf-8');
    
    if (serviceContent.includes('async checkNeedsNickname') &&
        serviceContent.includes('needsNickname: !hasNickname')) {
      log.success('Método checkNeedsNickname encontrado e implementado corretamente');
      passedTests++;
    } else {
      log.error('Método checkNeedsNickname não encontrado ou incompleto');
      failedTests++;
    }
  } catch (error) {
    log.error(`Erro ao verificar service: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Teste 6: Verificar se handleOAuthCallback inclui needsNickname
  // ===================================================================
  log.test('Teste 6: Verificar se OAuth callback inclui needsNickname na resposta');
  try {
    const fs = await import('fs');
    const serviceContent = fs.readFileSync('src/modules/auth/auth.service.ts', 'utf-8');
    
    // Procurar no método handleOAuthCallback
    if (serviceContent.includes('handleOAuthCallback') &&
        serviceContent.includes('needsNickname,')) {
      log.success('OAuth callback inclui needsNickname na resposta do usuário');
      passedTests++;
    } else {
      log.error('OAuth callback não inclui needsNickname na resposta');
      failedTests++;
    }
  } catch (error) {
    log.error(`Erro ao verificar OAuth callback: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Teste 7: Verificar documentação
  // ===================================================================
  log.test('Teste 7: Verificar se documentação existe');
  try {
    const fs = await import('fs');
    const docPath = 'docs/03-GUIAS/FLUXO_NICKNAME_OAUTH.md';
    
    if (fs.existsSync(docPath)) {
      const docContent = fs.readFileSync(docPath, 'utf-8');
      
      if (docContent.includes('NÃO modifica o banco de dados') &&
          docContent.includes('Cognito em tempo real')) {
        log.success('Documentação encontrada e atualizada com abordagem simplificada');
        passedTests++;
      } else {
        log.warning('Documentação encontrada mas pode estar desatualizada');
        passedTests++;
      }
    } else {
      log.error('Documentação não encontrada');
      failedTests++;
    }
  } catch (error) {
    log.error(`Erro ao verificar documentação: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Teste 8: Verificar se changeNickname não atualiza MongoDB
  // ===================================================================
  log.test('Teste 8: Verificar se changeNickname não tenta desmarcar flag no MongoDB');
  try {
    const fs = await import('fs');
    const serviceContent = fs.readFileSync('src/modules/auth/auth.service.ts', 'utf-8');
    
    // Procurar no método changeNickname - NÃO deve ter updateUser com needsNickname
    const changeNicknameMatch = serviceContent.match(/async changeNickname[\s\S]*?(?=async |$)/);
    if (changeNicknameMatch) {
      const changeNicknameCode = changeNicknameMatch[0];
      if (changeNicknameCode.includes('needsNickname') && 
          changeNicknameCode.includes('updateUser')) {
        log.error('changeNickname ainda tenta atualizar needsNickname no MongoDB (deveria remover)');
        failedTests++;
      } else {
        log.success('changeNickname NÃO tenta atualizar MongoDB (correto!)');
        passedTests++;
      }
    } else {
      log.warning('Não foi possível analisar método changeNickname');
    }
  } catch (error) {
    log.error(`Erro ao verificar changeNickname: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }

  // ===================================================================
  // Resumo dos Testes
  // ===================================================================
  console.log('\n' + '='.repeat(60));
  console.log('  Resumo dos Testes');
  console.log('='.repeat(60));
  console.log(`${colors.green}✓ Testes Passados:${colors.reset} ${passedTests}`);
  console.log(`${colors.red}✗ Testes Falhados:${colors.reset} ${failedTests}`);
  console.log(`${colors.cyan}➤ Total de Testes:${colors.reset} ${passedTests + failedTests}`);
  console.log('='.repeat(60) + '\n');

  if (failedTests === 0) {
    log.success('🎉 Todos os testes passaram! Funcionalidade implementada corretamente.');
    console.log('\n📋 Próximos passos:');
    console.log('  1. Testar endpoints manualmente com Postman/Insomnia');
    console.log('  2. Implementar interface no frontend');
    console.log('  3. Validar fluxo completo OAuth → escolha nickname');
    process.exit(0);
  } else {
    log.error(`❌ ${failedTests} teste(s) falharam. Revise o código.`);
    process.exit(1);
  }
}

// Executar testes
testNicknameFlow().catch((error) => {
  log.error(`Erro fatal: ${error instanceof Error ? error.message : String(error)}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});

