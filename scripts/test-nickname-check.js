/**
 * Script de teste para verificar disponibilidade de nickname
 * Testa a função checkNicknameAvailability no backend
 */

const http = require('http');

const testNickname = async (nickname, excludeCognitoSub = null) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      nickname,
      ...(excludeCognitoSub && { excludeCognitoSub }),
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/auth/check-nickname',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          reject(new Error(`Erro ao parsear resposta: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Erro na requisição: ${e.message}`));
    });

    req.write(data);
    req.end();
  });
};

const runTests = async () => {
  console.log('\n🧪 TESTANDO VERIFICAÇÃO DE NICKNAME E ERROS DO CONSOLE\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Teste 1: Nickname disponível
  console.log('📝 Teste 1: Verificando nickname disponível (teste123)');
  try {
    const result1 = await testNickname('teste123');
    console.log('✅ Resultado:', JSON.stringify(result1, null, 2));
    console.log(`   Disponível: ${result1.data?.available ? 'SIM ✅' : 'NÃO ❌'}\n`);
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 2: Nickname muito curto
  console.log('📝 Teste 2: Verificando nickname muito curto (ab)');
  try {
    const result2 = await testNickname('ab');
    console.log('✅ Resultado:', JSON.stringify(result2, null, 2));
    console.log(`   Disponível: ${result2.data?.available ? 'SIM ✅' : 'NÃO ❌'}\n`);
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 3: Nickname vazio
  console.log('📝 Teste 3: Verificando nickname vazio (string vazia)');
  try {
    const result3 = await testNickname('');
    console.log('✅ Resultado:', JSON.stringify(result3, null, 2));
    console.log(`   Disponível: ${result3.data?.available ? 'SIM ✅' : 'NÃO ❌'}\n`);
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 4: Nickname null
  console.log('📝 Teste 4: Verificando nickname null');
  try {
    const result4 = await testNickname(null);
    console.log('✅ Resultado:', JSON.stringify(result4, null, 2));
    console.log(`   Disponível: ${result4.data?.available ? 'SIM ✅' : 'NÃO ❌'}\n`);
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 5: Nickname muito longo
  console.log('📝 Teste 5: Verificando nickname muito longo (31 caracteres)');
  try {
    const longNickname = 'a'.repeat(31);
    const result5 = await testNickname(longNickname);
    console.log('✅ Resultado:', JSON.stringify(result5, null, 2));
    console.log(`   Disponível: ${result5.data?.available ? 'SIM ✅' : 'NÃO ❌'}\n`);
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 6: Nickname com caracteres especiais
  console.log('📝 Teste 6: Verificando nickname com caracteres especiais (teste@123)');
  try {
    const result6 = await testNickname('teste@123');
    console.log('✅ Resultado:', JSON.stringify(result6, null, 2));
    console.log(`   Disponível: ${result6.data?.available ? 'SIM ✅' : 'NÃO ❌'}\n`);
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 7: Nickname com underscore
  console.log('📝 Teste 7: Verificando nickname com underscore (teste_123)');
  try {
    const result7 = await testNickname('teste_123');
    console.log('✅ Resultado:', JSON.stringify(result7, null, 2));
    console.log(`   Disponível: ${result7.data?.available ? 'SIM ✅' : 'NÃO ❌'}\n`);
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 8: Requisição sem body
  console.log('📝 Teste 8: Requisição sem body (deve falhar)');
  try {
    const result8 = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/auth/check-nickname',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': 0,
        },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Erro ao parsear: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
    console.log('✅ Resultado:', JSON.stringify(result8, null, 2), '\n');
  } catch (error) {
    console.error('❌ Erro esperado:', error.message, '\n');
  }

  // Teste 9: Requisição com JSON inválido
  console.log('📝 Teste 9: Requisição com JSON inválido');
  try {
    const result9 = await new Promise((resolve, reject) => {
      const data = '{invalid json}';
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/auth/check-nickname',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Erro ao parsear: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
    console.log('✅ Resultado:', JSON.stringify(result9, null, 2), '\n');
  } catch (error) {
    console.error('❌ Erro esperado:', error.message, '\n');
  }

  // Teste 10: Múltiplas requisições simultâneas (teste de concorrência)
  console.log('📝 Teste 10: Múltiplas requisições simultâneas (teste de concorrência)');
  try {
    const promises = Array.from({ length: 5 }, (_, i) => 
      testNickname(`concurrent${i}`)
    );
    const results = await Promise.all(promises);
    console.log(`✅ ${results.length} requisições concluídas simultaneamente`);
    results.forEach((result, i) => {
      console.log(`   Requisição ${i + 1}: ${result.data?.available ? 'Disponível ✅' : 'Indisponível ❌'}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Erro:', error.message, '\n');
  }

  // Teste 11: Verificar se há erros no console do backend
  console.log('📝 Teste 11: Verificando se há erros no backend');
  console.log('   ⚠️  IMPORTANTE: Verifique os logs do backend para:');
  console.log('      - Erros do Cognito (ListUsersCommand)');
  console.log('      - Warnings sobre nicknames já em uso');
  console.log('      - Erros de validação');
  console.log('      - Timeouts ou problemas de conexão');
  console.log('      - Erros de parsing ou validação de dados\n');

  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✅ Testes concluídos! Verifique os logs do backend para erros.\n');
};

runTests().catch(console.error);

