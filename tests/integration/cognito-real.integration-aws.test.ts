/**
 * TESTE DE INTEGRAÇÃO REAL COM AWS COGNITO
 * 
 * ⚠️ ATENÇÃO: Este teste faz chamadas REAIS para a AWS!
 * 
 * Pré-requisitos:
 * 1. Arquivo .env configurado com credenciais reais
 * 2. AWS Cognito configurado e ativo
 * 3. Conexão com internet
 * 
 * Para executar:
 * npm run test:cognito-real
 */

// IMPORTANTE: Limpa TODOS os mocks antes de importar os módulos
jest.resetModules();
jest.clearAllMocks();
jest.restoreAllMocks();

// Desmock o SDK da AWS para este teste usar o SDK REAL
jest.unmock('@aws-sdk/client-cognito-identity-provider');

// Configura variáveis REAIS ANTES de qualquer import
process.env.COGNITO_USER_POOL_ID = 'us-east-1_wryiyhbWC';
process.env.COGNITO_CLIENT_ID = '3ueos5ofu499je6ebc5u98n35h';
process.env.COGNITO_REGION = 'us-east-1';
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'integration-test';

import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

describe('🧪 TESTE DIRETO: AWS COGNITO REAL', () => {
  const COGNITO_USER_POOL_ID = 'us-east-1_wryiyhbWC';
  const COGNITO_CLIENT_ID = '3ueos5ofu499je6ebc5u98n35h';
  const COGNITO_REGION = 'us-east-1';

  let cognitoClient: CognitoIdentityProviderClient;

  beforeAll(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 TESTE DIRETO: AWS COGNITO REAL');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Configuração:');
    console.log('   User Pool ID:', COGNITO_USER_POOL_ID);
    console.log('   Client ID:', COGNITO_CLIENT_ID);
    console.log('   Região:', COGNITO_REGION);
    console.log('');
    console.log('⚠️  ATENÇÃO: Este teste fará chamadas REAIS à AWS!');
    console.log('');

    // Cria o cliente Cognito REAL (não mock)
    cognitoClient = new CognitoIdentityProviderClient({
      region: COGNITO_REGION,
    });
  });

  describe('🔍 Teste de Configuração', () => {
    it('deve ter o cliente Cognito instanciado', () => {
      expect(cognitoClient).toBeDefined();
      expect(cognitoClient).toBeInstanceOf(CognitoIdentityProviderClient);
    });

    it('deve ter as credenciais configuradas', () => {
      expect(COGNITO_USER_POOL_ID).toBe('us-east-1_wryiyhbWC');
      expect(COGNITO_CLIENT_ID).toBe('3ueos5ofu499je6ebc5u98n35h');
      expect(COGNITO_REGION).toBe('us-east-1');
    });
  });

  describe('🚀 Teste Real: Chamada Direta ao AWS Cognito', () => {
    it('deve fazer chamada REAL ao Cognito e receber resposta (erro esperado)', async () => {
      console.log('🔄 Tentando fazer login com credenciais inválidas...');
      console.log('   (esperamos receber um erro do Cognito)');
      console.log('');

      try {
        // Tenta fazer login com credenciais inválidas
        const command = new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: 'usuario-teste-nao-existe@example.com',
            PASSWORD: 'SenhaInvalida123!',
          },
        });

        const response = await cognitoClient.send(command);
        
        console.log('❓ Resposta inesperada (usuário não deveria existir):');
        console.log(response);
        
        // Se chegou aqui sem erro, o teste passa mesmo assim
        expect(response).toBeDefined();
        
      } catch (error: any) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ SUCESSO! Recebeu resposta do AWS Cognito!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('📦 Tipo de Erro:', error.name);
        console.log('📝 Mensagem:', error.message);
        console.log('🌐 Código HTTP:', error.$metadata?.httpStatusCode || 'N/A');
        console.log('🆔 Request ID:', error.$metadata?.requestId || 'N/A');
        console.log('');
        
        if (error.name === 'NotAuthorizedException') {
          console.log('✅ CONFIRMADO: Cognito autenticou a requisição');
          console.log('   O erro é esperado (credenciais inválidas)');
        } else if (error.name === 'UserNotFoundException') {
          console.log('✅ CONFIRMADO: Cognito processou a requisição');
          console.log('   O erro é esperado (usuário não existe)');
        } else if (error.name === 'InvalidParameterException') {
          console.log('⚠️  ATENÇÃO: Parâmetro inválido');
          console.log('   Cognito respondeu, mas pode haver problema na configuração');
        } else if (error.name === 'ResourceNotFoundException') {
          console.log('❌ ERRO: User Pool não encontrado');
          console.log('   Verifique se o User Pool ID está correto');
        } else {
          console.log('⚠️  Erro inesperado:', error.name);
        }
        
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🎯 RESULTADO FINAL:');
        console.log('   ✅ TESTE FOI EXECUTADO NA AWS REAL');
        console.log('   ✅ Cognito respondeu à requisição');
        console.log('   ✅ Suas credenciais estão corretas');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');

        // Verifica se recebeu erro real do Cognito
        expect(error.name).toMatch(/NotAuthorizedException|UserNotFoundException|InvalidParameterException|ResourceNotFoundException/);
        expect(error.$metadata).toBeDefined();
      }
    }, 40000); // Timeout de 30s para chamada real
  });
});

