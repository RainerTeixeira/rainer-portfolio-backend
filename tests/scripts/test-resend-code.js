/**
 * Script para testar reenvio de código de confirmação
 */
const http = require('http');

const data = JSON.stringify({
  email: 'veral62193@lovleo.com'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/auth/resend-confirmation-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Database-Provider': 'PRISMA',
    'Content-Length': data.length
  }
};

console.log('🔄 Reenviando código de confirmação para: veral62193@lovleo.com\n');

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

