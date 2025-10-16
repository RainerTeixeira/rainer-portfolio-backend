/**
 * Script para popular o DynamoDB Local com dados de teste
 * 
 * Este script insere dados iniciais no DynamoDB para facilitar o desenvolvimento
 * e testes locais. Os dados são similares aos do seed do Prisma.
 * 
 * Uso:
 *   npm run dynamodb:seed
 * 
 * @module scripts/seed-dynamodb
 */

import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { env, TABLES } from '../config/env.js';
import { randomUUID } from 'crypto';

/**
 * Cliente DynamoDB
 */
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || 'fakeAccessKeyId',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey',
  },
});

const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Dados de usuários de exemplo
 */
const users = [
  {
    id: randomUUID(),
    name: 'Admin User',
    email: 'admin@blog.com',
    cognitoId: 'cognito-admin-123',
    role: 'ADMIN',
    bio: 'Administrador do sistema',
    avatar: 'https://i.pravatar.cc/150?img=1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    name: 'Editor Principal',
    email: 'editor@blog.com',
    cognitoId: 'cognito-editor-123',
    role: 'EDITOR',
    bio: 'Editor responsável pela curadoria de conteúdo',
    avatar: 'https://i.pravatar.cc/150?img=2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    name: 'Maria Silva',
    email: 'maria@blog.com',
    cognitoId: 'cognito-maria-123',
    role: 'AUTHOR',
    bio: 'Desenvolvedora Full Stack apaixonada por Node.js e React',
    avatar: 'https://i.pravatar.cc/150?img=5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    name: 'João Santos',
    email: 'joao@blog.com',
    cognitoId: 'cognito-joao-123',
    role: 'AUTHOR',
    bio: 'Tech Lead com 10 anos de experiência em arquitetura de software',
    avatar: 'https://i.pravatar.cc/150?img=12',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    name: 'Ana Costa',
    email: 'ana@blog.com',
    cognitoId: 'cognito-ana-123',
    role: 'SUBSCRIBER',
    bio: 'Estudante de programação',
    avatar: 'https://i.pravatar.cc/150?img=20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Dados de categorias de exemplo
 */
const categories = [
  {
    id: randomUUID(),
    name: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Artigos sobre tecnologia, programação e inovação',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    name: 'JavaScript',
    slug: 'javascript',
    description: 'Tudo sobre JavaScript, Node.js, React e mais',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    name: 'Backend',
    slug: 'backend',
    description: 'Desenvolvimento backend, APIs e arquitetura',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Insere usuários no DynamoDB
 */
async function seedUsers() {
  console.log('👥 Inserindo usuários...');
  
  for (const user of users) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user,
    }));
    console.log(`   ✅ ${user.name} (${user.role})`);
  }
  
  console.log(`✅ ${users.length} usuários inseridos\n`);
  return users;
}

/**
 * Insere categorias no DynamoDB
 */
async function seedCategories() {
  console.log('📁 Inserindo categorias...');
  
  for (const category of categories) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: category,
    }));
    console.log(`   ✅ ${category.name}`);
  }
  
  console.log(`✅ ${categories.length} categorias inseridas\n`);
  return categories;
}

/**
 * Insere posts no DynamoDB
 */
async function seedPosts(users: any[], categories: any[]) {
  console.log('📝 Inserindo posts...');
  
  const authors = users.filter(u => u.role === 'AUTHOR');
  const posts = [];
  
  for (let i = 0; i < 5; i++) {
    const author = authors[i % authors.length];
    const category = categories[i % categories.length];
    
    const post = {
      id: randomUUID(),
      title: `Post de Exemplo ${i + 1}`,
      slug: `post-exemplo-${i + 1}`,
      content: `Este é o conteúdo do post de exemplo ${i + 1}. Aqui você pode escrever sobre diversos tópicos relacionados a ${category.name}.`,
      excerpt: `Resumo do post ${i + 1}`,
      coverImage: `https://picsum.photos/seed/${i}/800/400`,
      authorId: author.id,
      categoryId: category.id,
      status: i === 0 ? 'DRAFT' : 'PUBLISHED',
      viewCount: Math.floor(Math.random() * 1000),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await dynamodb.send(new PutCommand({
      TableName: TABLES.POSTS,
      Item: post,
    }));
    
    posts.push(post);
    console.log(`   ✅ ${post.title} (${post.status})`);
  }
  
  console.log(`✅ ${posts.length} posts inseridos\n`);
  return posts;
}

/**
 * Insere comentários no DynamoDB
 */
async function seedComments(users: any[], posts: any[]) {
  console.log('💬 Inserindo comentários...');
  
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
  let commentCount = 0;
  
  for (const post of publishedPosts.slice(0, 3)) {
    for (let i = 0; i < 2; i++) {
      const user = users[i % users.length];
      
      await dynamodb.send(new PutCommand({
        TableName: TABLES.COMMENTS,
        Item: {
          id: randomUUID(),
          content: `Comentário de exemplo ${i + 1} no post "${post.title}"`,
          postId: post.id,
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }));
      
      commentCount++;
    }
  }
  
  console.log(`✅ ${commentCount} comentários inseridos\n`);
}

/**
 * Insere likes no DynamoDB
 */
async function seedLikes(users: any[], posts: any[]) {
  console.log('❤️  Inserindo likes...');
  
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
  let likeCount = 0;
  
  for (const post of publishedPosts) {
    for (const user of users.slice(0, 3)) {
      await dynamodb.send(new PutCommand({
        TableName: TABLES.LIKES,
        Item: {
          id: randomUUID(),
          postId: post.id,
          userId: user.id,
          createdAt: new Date().toISOString(),
        },
      }));
      
      likeCount++;
    }
  }
  
  console.log(`✅ ${likeCount} likes inseridos\n`);
}

/**
 * Insere bookmarks no DynamoDB
 */
async function seedBookmarks(users: any[], posts: any[]) {
  console.log('🔖 Inserindo bookmarks...');
  
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
  let bookmarkCount = 0;
  
  for (let i = 0; i < Math.min(3, publishedPosts.length); i++) {
    const user = users[i % users.length];
    const post = publishedPosts[i];
    
    await dynamodb.send(new PutCommand({
      TableName: TABLES.BOOKMARKS,
      Item: {
        id: randomUUID(),
        postId: post.id,
        userId: user.id,
        createdAt: new Date().toISOString(),
      },
    }));
    
    bookmarkCount++;
  }
  
  console.log(`✅ ${bookmarkCount} bookmarks inseridos\n`);
}

/**
 * Insere notificações no DynamoDB
 */
async function seedNotifications(users: any[]) {
  console.log('🔔 Inserindo notificações...');
  
  let notificationCount = 0;
  
  for (const user of users.slice(0, 3)) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.NOTIFICATIONS,
      Item: {
        id: randomUUID(),
        userId: user.id,
        type: 'NEW_COMMENT',
        title: 'Novo comentário',
        message: 'Você recebeu um novo comentário no seu post',
        read: false,
        createdAt: new Date().toISOString(),
      },
    }));
    
    notificationCount++;
  }
  
  console.log(`✅ ${notificationCount} notificações inseridas\n`);
}

/**
 * Função principal
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  🌱 POPULANDO DYNAMODB COM DADOS DE TESTE');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  console.log(`🔗 Conectando em: ${env.DYNAMODB_ENDPOINT || 'DynamoDB AWS'}`);
  console.log(`📊 Prefixo das tabelas: ${env.DYNAMODB_TABLE_PREFIX}`);
  console.log(`🌍 Região: ${env.AWS_REGION}\n`);

  try {
    // Insere dados em ordem
    const insertedUsers = await seedUsers();
    const insertedCategories = await seedCategories();
    const insertedPosts = await seedPosts(insertedUsers, insertedCategories);
    await seedComments(insertedUsers, insertedPosts);
    await seedLikes(insertedUsers, insertedPosts);
    await seedBookmarks(insertedUsers, insertedPosts);
    await seedNotifications(insertedUsers);

    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  ✨ DADOS INSERIDOS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    console.log('📊 Resumo:');
    console.log(`   • ${insertedUsers.length} usuários`);
    console.log(`   • ${insertedCategories.length} categorias`);
    console.log(`   • ${insertedPosts.length} posts`);
    console.log('   • Comentários, likes, bookmarks e notificações\n');

    console.log('💡 Credenciais de teste:');
    insertedUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.role})`);
    });
    
    console.log('\n🌐 Próximos passos:');
    console.log('   • Execute: npm run dev (iniciar servidor)');
    console.log('   • Acesse: http://localhost:4000/api/docs\n');

  } catch (error: any) {
    console.error('\n❌ Erro ao popular banco:', error.message);
    throw error;
  }
}

// Executa o script
main()
  .then(() => {
    console.log('✅ Seed concluído com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar seed:', error);
    process.exit(1);
  });

