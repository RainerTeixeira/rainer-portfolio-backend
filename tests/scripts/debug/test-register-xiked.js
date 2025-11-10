/**
 * Script para testar registro de novo usuário e verificar email
 */
const http = require('http');

// Dados do novo usuário
const userData = {
  email: 'xiked41826@keevle.com',
  password: 'SenhaForte123!',
  fullName: 'Teste Xiked',
  nickname: 'xiked_test'
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
        console.log('📧 Email de confirmação deve ter sido enviado!');
        console.log('\n💡 Verifique o email em: https://temp-mail.org/pt/');
        console.log('💡 Use o email:', userData.email);
        console.log('\n📋 Informações do usuário:');
        console.log('  User ID:', parsed.data?.userId || 'N/A');
        console.log('  Username:', parsed.data?.username || 'N/A');
        if (parsed.data?.emailVerificationRequired) {
          console.log('  ⚠️  Verificação de e-mail necessária!');
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

