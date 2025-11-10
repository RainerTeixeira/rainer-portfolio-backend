/**
 * Script de teste automatizado para upload de imagens Cloudinary
 * 
 * Este script simula o upload de avatar e blog usando fetch API
 * Execute: node test-cloudinary-upload.js
 */

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

async function testAvatarUpload() {
  console.log('\n🧪 TESTE 1: Upload de Avatar\n');
  
  try {
    // Simular upload de avatar
    // Nota: Este teste requer um arquivo real, então vamos apenas verificar o endpoint
    const response = await fetch(`${BACKEND_URL}/cloudinary/upload/avatar`, {
      method: 'POST',
    });
    
    if (response.status === 400) {
      console.log('✅ Endpoint de avatar está funcionando (retornou erro esperado sem arquivo)');
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint de avatar:', error.message);
  }
}

async function testBlogImageUpload() {
  console.log('\n🧪 TESTE 2: Upload de Imagem do Blog\n');
  
  try {
    const response = await fetch(`${BACKEND_URL}/cloudinary/upload/blog-image`, {
      method: 'POST',
    });
    
    if (response.status === 400) {
      console.log('✅ Endpoint de blog-image está funcionando (retornou erro esperado sem arquivo)');
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint de blog-image:', error.message);
  }
}

async function checkBackendHealth() {
  console.log('\n🏥 Verificando saúde do backend...\n');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend está rodando corretamente');
      console.log('   Status:', data.status || 'OK');
    } else {
      console.log('⚠️  Backend retornou status:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend não está acessível:', error.message);
    console.log('   Verifique se está rodando em', BACKEND_URL);
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de upload Cloudinary...\n');
  console.log('=' .repeat(50));
  
  await checkBackendHealth();
  await testAvatarUpload();
  await testBlogImageUpload();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📝 Nota: Para testar upload completo, use a UI em:');
  console.log(`   ${FRONTEND_URL}/dashboard`);
  console.log('\n✅ Testes básicos concluídos!\n');
}

runTests().catch(console.error);

