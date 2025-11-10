/**
 * Script para testar registro de novo usuário
 */
const http = require('http');

// Dados do novo usuário
const userData = {
  email: 'poboge8506@lovleo.com',
  password: 'SenhaForte123!',
  fullName: 'Teste Poboge',
  nickname: 'poboge_test'
};

const data = JSON.stringify(userData);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Database-Provider': 'PRISMA',
    'Content-Length': data.length
  }
};

console.log('📝 Registrando novo usuário...\n');
console.log('📧 Email:', userData.email);
console.log('👤 Nome:', userData.fullName);
console.log('🏷️  Nickname:', userData.nickname);
console.log('');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📧 Resposta:');
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 201) {
        console.log('\n✅ Usuário criado com sucesso!');
        if (parsed.data && parsed.data.emailVerificationRequired) {
          console.log('📧 Verificação de e-mail necessária!');
          console.log('💡 Use o endpoint /auth/resend-confirmation-code para reenviar o código');
          console.log('💡 Ou use /auth/verify-email-admin para verificar administrativamente');
        }
      }
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error.message);
  console.error('\n💡 Certifique-se de que o backend está rodando em http://localhost:4000');
});

req.write(data);
req.end();

