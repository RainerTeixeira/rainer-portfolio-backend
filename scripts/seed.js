const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');
  
  // Create categories
  const backend = await prisma.category.create({
    data: {
      name: 'Backend',
      slug: 'backend',
      description: 'Artigos sobre desenvolvimento backend',
      color: '#3B82F6',
      icon: 'server'
    }
  });
  
  const cloud = await prisma.category.create({
    data: {
      name: 'Cloud',
      slug: 'cloud',
      description: 'Artigos sobre serviços em nuvem',
      color: '#10B981',
      icon: 'cloud'
    }
  });
  
  // Create user
  const user = await prisma.user.create({
    data: {
      cognitoSub: 'user-123',
      email: 'joao@example.com',
      name: 'João Silva',
      nickname: 'João',
      role: 'AUTHOR',
      bio: 'Desenvolvedor Full Stack',
      website: 'https://joaosilva.dev',
      avatar: 'https://picsum.photos/200/200',
      socialLinks: {
        github: 'https://github.com/joaosilva',
        linkedin: 'https://linkedin.com/in/joaosilva'
      }
    }
  });
  
  // Create posts
  await prisma.post.create({
    data: {
      title: 'Introdução ao NestJS',
      slug: 'introducao-ao-nestjs',
      content: 'NestJS é um framework para construir aplicações Node.js server-side eficientes...',
      excerpt: 'Aprenda os conceitos básicos do NestJS',
      published: true,
      featured: true,
      authorId: user.cognitoSub,
      categoryId: backend.id,
      tags: ['nestjs', 'nodejs', 'backend'],
      readingTime: 5,
      viewCount: 150,
      likeCount: 25,
      commentCount: 5
    }
  });
  
  await prisma.post.create({
    data: {
      title: 'DynamoDB com Serverless',
      slug: 'dynamodb-com-serverless',
      content: 'DynamoDB é um banco NoSQL totalmente gerenciado que oferece performance escalável...',
      excerpt: 'Como usar DynamoDB em arquiteturas serverless',
      published: true,
      featured: false,
      authorId: user.cognitoSub,
      categoryId: cloud.id,
      tags: ['dynamodb', 'aws', 'serverless'],
      readingTime: 8,
      viewCount: 89,
      likeCount: 12,
      commentCount: 3
    }
  });
  
  console.log('Seed completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\();
  });
