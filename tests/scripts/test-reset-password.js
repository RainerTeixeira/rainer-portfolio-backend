/**
 * Script para redefinir senha usando código de verificação
 */
const http = require('http');

// Dados do usuário
const email = process.argv[2] || 'veral62193@lovleo.com';
const code = process.argv[3] || '378246';
const newPassword = process.argv[4] || 'R@iner98152749';

const data = JSON.stringify({
  email: email,
  code: code,
  newPassword: newPassword
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/auth/reset-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Database-Provider': 'PRISMA',
    'Content-Length': data.length
  }
};

console.log(`🔑 Redefinindo senha para: ${email}`);
console.log(`📧 Código: ${code}`);
console.log(`🔒 Nova senha: ${newPassword}\n`);

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
      
      if (res.statusCode === 200) {
        console.log('\n✅ Senha redefinida com sucesso!');
        console.log('💡 Agora o usuário pode fazer login com a nova senha.');
      }
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error.message);
  console.error('\n💡 Certifique-se de que o backend está rodando em http://localhost:4000');
  console.error('\n📖 Uso:');
  console.error('  node test-reset-password.js <email> <code> <novaSenha>');
  console.error('  node test-reset-password.js veral62193@lovleo.com 378246 "R@iner98152749"');
});

req.write(data);
req.end();

