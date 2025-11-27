/**
 * Script de Verificação de Configuração OAuth
 * 
 * Verifica se todas as variáveis de ambiente necessárias
 * para OAuth estão configuradas corretamente.
 */

import dotenv from 'dotenv';
import { env } from '../src/config/env.js';

dotenv.config();

console.log('\n🔍 Verificando Configuração OAuth...\n');

let hasErrors = false;

// Verificar Cognito
console.log('📦 AWS Cognito:');
const cognitoVars = {
  'COGNITO_USER_POOL_ID': env.COGNITO_USER_POOL_ID,
  'COGNITO_CLIENT_ID': env.COGNITO_CLIENT_ID,
  'COGNITO_CLIENT_SECRET': env.COGNITO_CLIENT_SECRET,
  'COGNITO_DOMAIN': env.COGNITO_DOMAIN,
  'OAUTH_REDIRECT_SIGN_IN': env.OAUTH_REDIRECT_SIGN_IN,
};

for (const [key, value] of Object.entries(cognitoVars)) {
  if (!value) {
    console.log(`  ❌ ${key}: NÃO CONFIGURADO`);
    hasErrors = true;
  } else {
    const displayValue = key.includes('SECRET') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`  ✅ ${key}: ${displayValue}`);
  }
}

// Verificar Google
console.log('\n🔵 Google OAuth:');
const googleVars = {
  'GOOGLE_CLIENT_ID': env.GOOGLE_CLIENT_ID,
  'GOOGLE_CLIENT_SECRET': env.GOOGLE_CLIENT_SECRET,
};

for (const [key, value] of Object.entries(googleVars)) {
  if (!value) {
    console.log(`  ⚠️  ${key}: NÃO CONFIGURADO (opcional se configurado no Cognito)`);
  } else {
    const displayValue = key.includes('SECRET') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`  ✅ ${key}: ${displayValue}`);
  }
}

// Verificar GitHub
console.log('\n⚫ GitHub OAuth:');
const githubVars = {
  'GITHUB_CLIENT_ID': env.GITHUB_CLIENT_ID,
  'GITHUB_CLIENT_SECRET': env.GITHUB_CLIENT_SECRET,
};

for (const [key, value] of Object.entries(githubVars)) {
  if (!value) {
    console.log(`  ⚠️  ${key}: NÃO CONFIGURADO (opcional se configurado no Cognito)`);
  } else {
    const displayValue = key.includes('SECRET') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`  ✅ ${key}: ${displayValue}`);
  }
}

// Resultado final
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ CONFIGURAÇÃO INCOMPLETA');
  console.log('\n⚠️  AÇÃO NECESSÁRIA:');
  console.log('1. Gere COGNITO_CLIENT_SECRET no AWS Console');
  console.log('2. Adicione ao arquivo .env do backend');
  console.log('3. Reinicie o servidor backend');
  console.log('\n📖 Veja o guia completo em:');
  console.log('   frontend/docs/OAUTH_SETUP_GUIDE.md');
  process.exit(1);
} else {
  console.log('✅ CONFIGURAÇÃO COMPLETA');
  console.log('\n🚀 OAuth está pronto para uso!');
  console.log('\n📝 Para testar:');
  console.log('1. Inicie o backend: pnpm dev');
  console.log('2. Inicie o frontend: pnpm dev');
  console.log('3. Acesse: http://localhost:3000/dashboard/login');
  console.log('4. Clique em "Continuar com Google" ou "Continuar com GitHub"');
  process.exit(0);
}
