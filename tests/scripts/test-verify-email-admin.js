/**
 * Script para verificar e-mail administrativamente no Cognito
 * Útil quando o usuário não consegue verificar o e-mail normalmente
 */
const http = require('http');

// Pode usar tanto o cognitoSub (sub) quanto o username
const identifier = process.argv[2] || 'f48854d8-7081-704a-1756-077f177aee4e'; // cognitoSub de adriana_galisteu

const data = JSON.stringify({
  identifier: identifier
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/auth/verify-email-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Database-Provider': 'PRISMA',
    'Content-Length': data.length
  }
};

console.log(`✅ Verificando e-mail administrativamente para: ${identifier}\n`);

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
        console.log('\n✅ E-mail verificado com sucesso!');
        console.log('💡 Agora você pode redefinir a senha do usuário no console AWS.');
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
  console.error('  node test-verify-email-admin.js <identifier>');
  console.error('  node test-verify-email-admin.js f48854d8-7081-704a-1756-077f177aee4e');
  console.error('  node test-verify-email-admin.js adriana_galisteu');
});

req.write(data);
req.end();

