/**
 * Script para testar login do usuário poboge8506@lovleo.com
 */
const http = require('http');

// Dados de login
const loginData = {
  email: 'poboge8506@lovleo.com',
  password: 'SenhaForte123!'
};

const data = JSON.stringify(loginData);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Database-Provider': 'PRISMA',
    'Content-Length': data.length
  }
};

console.log('🔐 Testando login...\n');
console.log('📧 Email:', loginData.email);
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
      
      if (res.statusCode === 200 && parsed.success) {
        console.log('✅ Login realizado com sucesso!');
        console.log('\n📋 Informações do usuário:');
        console.log('  User ID:', parsed.data?.userId || 'N/A');
        console.log('  Email:', parsed.data?.email || 'N/A');
        console.log('  Username:', parsed.data?.username || 'N/A');
        console.log('  Name:', parsed.data?.fullName || 'N/A');
        console.log('\n🎟️  Tokens recebidos:');
        console.log('  Access Token:', parsed.data?.accessToken ? '✓ Recebido' : '✗ Não recebido');
        console.log('  Refresh Token:', parsed.data?.refreshToken ? '✓ Recebido' : '✗ Não recebido');
        console.log('  ID Token:', parsed.data?.idToken ? '✓ Recebido' : '✗ Não recebido');
        console.log('  Expires In:', parsed.data?.expiresIn ? `${parsed.data.expiresIn}s` : 'N/A');
      } else {
        console.log(JSON.stringify(parsed, null, 2));
        if (parsed.message) {
          console.log('\n❌ Erro:', parsed.message);
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

