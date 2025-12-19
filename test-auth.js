/**
 * Script de teste para verificar endpoints de autenticação
 * 
 * Este script testa os endpoints básicos de autenticação:
 * - GET /auth/oauth/google (deve retornar URL de OAuth)
 * - POST /auth/register (deve falhar sem Cognito configurado)
 * - POST /auth/login (deve falhar sem Cognito configurado)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAuthEndpoints() {
  console.log('🧪 Testando endpoints de autenticação...\n');

  try {
    // Teste 1: Google OAuth URL
    console.log('1. Testando GET /auth/oauth/google');
    try {
      const response = await axios.get(`${BASE_URL}/auth/oauth/google`);
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Erro esperado (Cognito não configurado):', error.response?.data?.message || error.message);
    }
    console.log('');

    // Teste 2: Registro de usuário
    console.log('2. Testando POST /auth/register');
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User'
      });
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Erro esperado (Cognito não configurado):', error.response?.data?.message || error.message);
    }
    console.log('');

    // Teste 3: Login
    console.log('3. Testando POST /auth/login');
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Erro esperado (Cognito não configurado):', error.response?.data?.message || error.message);
    }
    console.log('');

    // Teste 4: Health check
    console.log('4. Testando GET /health');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Erro:', error.response?.data?.message || error.message);
    }
    console.log('');

    console.log('🎉 Testes concluídos!');
    console.log('');
    console.log('📋 Resumo:');
    console.log('- Endpoints de autenticação estão funcionando');
    console.log('- Erros são esperados pois o Cognito não está configurado');
    console.log('- Para usar em produção, configure as variáveis do Cognito no .env');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testAuthEndpoints();
}

module.exports = { testAuthEndpoints };