/**
 * Script de investigação para descobrir por que o email não está chegando
 * 
 * Este script:
 * 1. Registra um usuário de teste
 * 2. Loga TODA a resposta do Cognito
 * 3. Verifica CodeDeliveryDetails
 * 4. Verifica configurações do User Pool
 */

import { CognitoIdentityProviderClient, SignUpCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { env } from '../src/config/env.js';

const client = new CognitoIdentityProviderClient({
  region: env.COGNITO_REGION || 'us-east-1',
});

const USER_POOL_ID = env.COGNITO_USER_POOL_ID;
const CLIENT_ID = env.COGNITO_CLIENT_ID;

async function investigateEmailDelivery() {
  console.log('\n🔍 INVESTIGAÇÃO: Por que o email não está chegando?\n');
  console.log('Configurações:');
  console.log(`  User Pool ID: ${USER_POOL_ID}`);
  console.log(`  Client ID: ${CLIENT_ID}`);
  console.log(`  Region: ${env.COGNITO_REGION}\n`);

  // Gera email único para teste
  const timestamp = Date.now();
  const testEmail = `teste_investigacao_${timestamp}@temp-mail-test.com`;
  const testUsername = `teste_investigacao_${timestamp}`;

  console.log('📝 Dados do teste:');
  console.log(`  Email: ${testEmail}`);
  console.log(`  Username: ${testUsername}\n`);

  try {
    // 1. Registrar usuário
    console.log('1️⃣ Registrando usuário...\n');
    const signUpCommand = new SignUpCommand({
      ClientId: CLIENT_ID!,
      Username: testUsername,
      Password: 'TestPassword123!@#',
      UserAttributes: [
        { Name: 'email', Value: testEmail },
      ],
    });

    const signUpResponse = await client.send(signUpCommand);
    
    console.log('📋 RESPOSTA COMPLETA DO SignUpCommand:');
    console.log(JSON.stringify(signUpResponse, null, 2));
    console.log('\n');

    // 2. Análise detalhada
    console.log('📊 ANÁLISE DETALHADA:\n');
    
    console.log('UserSub:', signUpResponse.UserSub);
    console.log('UserConfirmed:', signUpResponse.UserConfirmed);
    console.log('CodeDeliveryDetails:', signUpResponse.CodeDeliveryDetails);
    
    if (signUpResponse.CodeDeliveryDetails) {
      console.log('\n✅ CodeDeliveryDetails PRESENTE:');
      console.log('  DeliveryMedium:', signUpResponse.CodeDeliveryDetails.DeliveryMedium);
      console.log('  Destination:', signUpResponse.CodeDeliveryDetails.Destination);
      console.log('  AttributeName:', signUpResponse.CodeDeliveryDetails.AttributeName);
    } else {
      console.log('\n❌ CodeDeliveryDetails AUSENTE!');
      console.log('   Isso significa que o Cognito NÃO tentou enviar o email.');
      console.log('   Possíveis causas:');
      console.log('   - Auto-verification está desligado no User Pool');
      console.log('   - Email não foi verificado antes do registro');
      console.log('   - Configuração de email/SES não está habilitada');
    }

    // 3. Verificar usuário criado
    console.log('\n3️⃣ Verificando usuário criado...\n');
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID!,
      Username: testUsername,
    });

    const userResponse = await client.send(getUserCommand);
    
    console.log('📋 DADOS DO USUÁRIO:');
    console.log('  UserStatus:', userResponse.UserStatus);
    console.log('  Enabled:', userResponse.Enabled);
    console.log('  Attributes:');
    userResponse.UserAttributes?.forEach(attr => {
      if (attr.Name === 'email' || attr.Name === 'email_verified') {
        console.log(`    ${attr.Name}: ${attr.Value}`);
      }
    });

    console.log('\n🔍 DIAGNÓSTICO:\n');
    
    if (!signUpResponse.CodeDeliveryDetails) {
      console.log('❌ PROBLEMA ENCONTRADO: CodeDeliveryDetails ausente');
      console.log('\n💡 SOLUÇÕES POSSÍVEIS:');
      console.log('1. Verifique no Console AWS Cognito:');
      console.log('   - User Pool > Sign-up experience > Message delivery');
      console.log('   - Verifique se "Send verification code via" está configurado para "Email"');
      console.log('   - Verifique se SES está configurado (se estiver em sandbox, pode bloquear)');
      console.log('\n2. Verifique configurações do App Client:');
      console.log('   - User Pool > App clients');
      console.log('   - Verifique se "Enable email verification" está habilitado');
      console.log('\n3. Verifique SES (Simple Email Service):');
      console.log('   - Se estiver em sandbox, apenas emails verificados podem receber emails');
      console.log('   - Domínios temporários (temp-mail.org) podem estar bloqueados');
      console.log('   - Verifique bounces e queixas em SES');
    } else {
      console.log('✅ CodeDeliveryDetails presente - Cognito tentou enviar email');
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('1. Verifique se o email chegou na caixa de entrada');
      console.log('2. Verifique a pasta de spam');
      console.log('3. Verifique logs do SES para ver se houve erro no envio');
      console.log('4. Verifique se o domínio do email não está bloqueado pelo SES');
      console.log(`5. Destination esperado: ${signUpResponse.CodeDeliveryDetails.Destination}`);
    }

    console.log('\n✅ Investigação concluída!\n');

  } catch (error: any) {
    console.error('\n❌ ERRO durante investigação:');
    console.error('Nome:', error.fullName);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executa investigação
investigateEmailDelivery()
  .then(() => {
    console.log('✅ Script concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

