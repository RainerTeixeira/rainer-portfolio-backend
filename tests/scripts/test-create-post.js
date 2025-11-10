/**
 * Script para testar criação de post com conteúdo TipTap otimizado
 * 
 * Este script:
 * 1. Faz login para obter token JWT
 * 2. Busca uma subcategoria existente
 * 3. Cria um post de teste com conteúdo completo (NestJS)
 * 4. Mostra estatísticas de compressão
 * 
 * Uso:
 *   node test-create-post.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

const API_URL = 'localhost';
const API_PORT = 4000;
const API_BASE = `http://${API_URL}:${API_PORT}`;

// Credenciais para login (ajuste conforme necessário)
// Pode ser passado via argumentos: node test-create-post.js email@exemplo.com senha123
const LOGIN_EMAIL = process.argv[2] || process.env.TEST_EMAIL || 'poboge8506@lovleo.com';
const LOGIN_PASSWORD = process.argv[3] || process.env.TEST_PASSWORD || 'SenhaForte123!';

// ═══════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Faz requisição HTTP
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            raw: body,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            raw: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Faz login e retorna token
 */
async function login() {
  console.log('🔐 Fazendo login...\n');
  console.log(`   Email: ${LOGIN_EMAIL}\n`);

  const loginData = JSON.stringify({
    email: LOGIN_EMAIL,
    password: LOGIN_PASSWORD,
  });

  const options = {
    hostname: API_URL,
    port: API_PORT,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-Provider': 'PRISMA',
      'Content-Length': loginData.length,
    },
  };

  try {
    const response = await makeRequest(options, loginData);

    if (response.status === 200 && response.data.accessToken) {
      console.log('✅ Login realizado com sucesso!\n');
      return response.data.accessToken;
    } else {
      throw new Error(
        `Login falhou: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    throw error;
  }
}

/**
 * Busca primeira subcategoria disponível
 */
async function getSubcategory(token) {
  console.log('📂 Buscando subcategorias...\n');

  const options = {
    hostname: API_URL,
    port: API_PORT,
    path: '/categories',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Database-Provider': 'PRISMA',
    },
  };

  try {
    const response = await makeRequest(options);

    if (response.status === 200 && response.data.categories) {
      // Buscar primeira subcategoria (com parentId)
      const subcategory = response.data.categories.find(
        (cat) => cat.parentId !== null && cat.isActive
      );

      if (subcategory) {
        console.log(`✅ Subcategoria encontrada: ${subcategory.name} (${subcategory.id})\n`);
        return subcategory;
      } else {
        // Se não encontrar subcategoria, usar primeira categoria e criar uma subcategoria
        const firstCategory = response.data.categories.find(
          (cat) => cat.parentId === null && cat.isActive
        );

        if (firstCategory) {
          console.log(`⚠️  Nenhuma subcategoria encontrada. Usando categoria: ${firstCategory.name}\n`);
          console.log('💡 Dica: Crie uma subcategoria primeiro na UI\n');
          // Retornar null para criar uma subcategoria de teste
          return null;
        }
      }
    }

    throw new Error('Nenhuma categoria encontrada');
  } catch (error) {
    console.error('❌ Erro ao buscar subcategorias:', error.message);
    throw error;
  }
}

/**
 * Busca ID do usuário atual
 */
async function getCurrentUser(token) {
  console.log('👤 Buscando informações do usuário...\n');

  const options = {
    hostname: API_URL,
    port: API_PORT,
    path: '/auth/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Database-Provider': 'PRISMA',
    },
  };

  try {
    const response = await makeRequest(options);

    if (response.status === 200 && response.data.user) {
      const userId = response.data.user.cognitoSub || response.data.user.id;
      console.log(`✅ Usuário encontrado: ${response.data.user.fullName} (${userId})\n`);
      return userId;
    }

    throw new Error('Usuário não encontrado');
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    throw error;
  }
}

/**
 * Carrega conteúdo do exemplo
 */
function loadExampleContent() {
  const examplePath = path.join(
    __dirname,
    'docs',
    'examples',
    'nestjs-post-expanded.json'
  );

  try {
    const content = fs.readFileSync(examplePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️  Não foi possível carregar exemplo. Usando conteúdo padrão.\n');
    // Retornar conteúdo mínimo
    return {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'NestJS: Framework Node.js Escalável' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'NestJS revoluciona desenvolvimento backend com arquitetura modular inspirada no Angular.',
            },
          ],
        },
      ],
    };
  }
}

/**
 * Cria post de teste
 */
async function createPost(token, authorId, subcategoryId) {
  console.log('📝 Criando post de teste...\n');

  const content = loadExampleContent();

  // Dados do post
  const postData = {
    title: 'NestJS: Framework Node.js Escalável',
    excerpt: 'NestJS revoluciona desenvolvimento backend com arquitetura modular inspirada no Angular.',
    slug: `nestjs-framework-nodejs-escalavel-${Date.now()}`,
    content: content,
    subcategoryId: subcategoryId,
    authorId: authorId,
    status: 'DRAFT',
    allowComments: true,
    featured: false,
  };

  const data = JSON.stringify(postData);

  // Calcular tamanhos
  const originalSize = Buffer.byteLength(data, 'utf8');
  console.log(`   📊 Tamanho original: ${(originalSize / 1024).toFixed(2)} KB`);

  const options = {
    hostname: API_URL,
    port: API_PORT,
    path: '/posts',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Database-Provider': 'PRISMA',
      'Content-Length': data.length,
    },
  };

  try {
    const response = await makeRequest(options, data);

    if (response.status === 201 || response.status === 200) {
      console.log('✅ Post criado com sucesso!\n');
      console.log('📋 Detalhes do post:');
      console.log(`   ID: ${response.data.post?.id || response.data.id}`);
      console.log(`   Título: ${response.data.post?.title || response.data.title}`);
      console.log(`   Slug: ${response.data.post?.slug || response.data.slug}`);
      console.log(`   Status: ${response.data.post?.status || response.data.status}`);
      console.log(`   Autor: ${response.data.post?.authorId || response.data.authorId}`);
      console.log(`   Subcategoria: ${response.data.post?.subcategoryId || response.data.subcategoryId}`);
      console.log('');

      // Verificar se conteúdo foi comprimido
      const savedContent = response.data.post?.content || response.data.content;
      if (typeof savedContent === 'string') {
        try {
          const parsed = JSON.parse(savedContent);
          const savedSize = Buffer.byteLength(JSON.stringify(parsed), 'utf8');
          const reduction = originalSize - savedSize;
          const reductionPercent = ((reduction / originalSize) * 100).toFixed(2);

          console.log('📦 Compressão aplicada:');
          console.log(`   Tamanho salvo: ${(savedSize / 1024).toFixed(2)} KB`);
          console.log(`   Redução: ${(reduction / 1024).toFixed(2)} KB (${reductionPercent}%)`);
          console.log('');
        } catch (e) {
          // Ignorar se não for JSON
        }
      }

      return response.data.post || response.data;
    } else {
      throw new Error(
        `Falha ao criar post: ${response.status} - ${JSON.stringify(response.data)}`
      );
    }
  } catch (error) {
    console.error('❌ Erro ao criar post:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     TESTE DE CRIAÇÃO DE POST COM CONTEÚDO OTIMIZADO           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Login
    const token = await login();

    // 2. Buscar usuário atual
    const authorId = await getCurrentUser(token);

    // 3. Buscar subcategoria
    const subcategory = await getSubcategory(token);

    if (!subcategory) {
      console.log('❌ Nenhuma subcategoria encontrada.');
      console.log('💡 Por favor, crie uma subcategoria primeiro na UI do dashboard.\n');
      process.exit(1);
    }

    // 4. Criar post
    const post = await createPost(token, authorId, subcategory.id);

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ TESTE CONCLUÍDO                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📝 Post criado com ID: ${post.id}`);
    console.log(`🔗 Acesse no dashboard para visualizar e editar`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

