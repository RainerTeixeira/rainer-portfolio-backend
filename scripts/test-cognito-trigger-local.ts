/**
 * Script para testar o Lambda Trigger do Cognito localmente
 * 
 * Simula eventos do Cognito Pre-Sign-Up para validar o comportamento
 * antes de fazer deploy.
 * 
 * Uso: npm run test:cognito:trigger:local
 * ou: tsx scripts/test-cognito-trigger-local.ts
 */

import { processPreSignUpEvent, PreSignUpEvent } from '../src/lambda/cognito-pre-signup-trigger.js';

/**
 * Simula um evento de login social com Google
 */
function createGoogleSocialLoginEvent(): PreSignUpEvent {
  return {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_wryiyhbWC',
    userName: 'google_111520683066783668750',
    triggerSource: 'PreSignUp_ExternalProvider',
    request: {
      userAttributes: {
        sub: '34b844e8-c041-708c-3c95-b642138c691d',
        email: 'raineroliveira94@gmail.com',
        email_verified: 'false', // Não verificado inicialmente
        given_name: 'Rainer',
        family_name: 'Teixeira',
        name: 'Rainer Teixeira',
        // nickname não está presente - será gerado automaticamente
      },
    },
    response: {},
  };
}

/**
 * Simula um evento de login social com GitHub
 */
function createGithubSocialLoginEvent(): PreSignUpEvent {
  return {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_wryiyhbWC',
    userName: 'github_123456789',
    triggerSource: 'PreSignUp_ExternalProvider',
    request: {
      userAttributes: {
        sub: 'github-123-456-789',
        email: 'user@example.com',
        email_verified: 'false',
        preferred_username: 'github_123456789',
        // name não está presente, apenas username - nickname será gerado do username
      },
    },
    response: {},
  };
}

/**
 * Simula um evento de registro normal (não social)
 */
function createNormalSignUpEvent(): PreSignUpEvent {
  return {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_wryiyhbWC',
    userName: 'kacib60496@haotuwu.com',
    triggerSource: 'PreSignUp_SignUp',
    request: {
      userAttributes: {
        sub: '6488d4d8-9081-7058-108b-07aab2786b43',
        email: 'kacib60496@haotuwu.com',
        email_verified: 'false',
        nickname: 'Rainer_Teixeira',
      },
    },
    response: {},
  };
}

/**
 * Testa o processamento do evento
 */
function testEvent(event: PreSignUpEvent, testName: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`🧪 TESTE: ${testName}`);
  console.log('═'.repeat(60));
  console.log('\n📥 Evento de entrada:');
  console.log(JSON.stringify(event.request.userAttributes, null, 2));

  try {
    const result = processPreSignUpEvent(event);

    console.log('\n📤 Evento processado:');
    console.log(JSON.stringify(result.response.userAttributes, null, 2));

    // Validações
    console.log('\n✅ Validações:');
    
    if (event.triggerSource === 'PreSignUp_ExternalProvider') {
      const emailVerified = result.response.userAttributes?.email_verified === 'true';
      console.log(`  ${emailVerified ? '✅' : '❌'} Email verificado: ${emailVerified}`);
      
      const hasNickname = !!result.response.userAttributes?.nickname;
      console.log(`  ${hasNickname ? '✅' : '❌'} Nickname gerado: ${hasNickname}`);
      
      if (result.response.autoVerifyEmail) {
        console.log(`  ✅ Auto-verificação de email ativada`);
      }
    } else {
      console.log(`  ℹ️  Registro normal - sem modificações especiais`);
    }

    console.log('\n✅ Teste concluído com sucesso!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Erro ao processar evento:', error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Testando Lambda Trigger do Cognito localmente\n');

  const results: boolean[] = [];

  // Teste 1: Login social com Google
  const googleEvent = createGoogleSocialLoginEvent();
  results.push(testEvent(googleEvent, 'Login Social com Google'));

  // Teste 2: Login social com GitHub
  const githubEvent = createGithubSocialLoginEvent();
  results.push(testEvent(githubEvent, 'Login Social com GitHub'));

  // Teste 3: Registro normal
  const normalEvent = createNormalSignUpEvent();
  results.push(testEvent(normalEvent, 'Registro Normal (não social)'));

  // Resumo
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('═'.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\n✅ Passou: ${passed}/${total}`);
  console.log(`❌ Falhou: ${total - passed}/${total}\n`);

  if (passed === total) {
    console.log('🎉 Todos os testes passaram! O trigger está pronto para deploy.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns testes falharam. Revise o código antes de fazer deploy.\n');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}
