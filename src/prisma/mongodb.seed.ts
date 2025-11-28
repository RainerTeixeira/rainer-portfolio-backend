/**
 * Seed do MongoDB - Popular Banco de Dados
 * 
 * Script para popular o MongoDB com dados iniciais de exemplo usando Prisma ORM.
 * 
 * Uso:
 * ```bash
 * npm run seed
 * # ou
 * npx tsx src/prisma/mongodb.seed.ts
 * ```
 * 
 * @fileoverview Seed do MongoDB com Prisma
 * @module prisma/mongodb.seed
 */

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

/**
 * Limpa todos os dados do banco
 */
async function cleanup() {
  console.log('🧹 Limpando banco de dados...');
  
  try {
    // Deletar em ordem reversa das dependências
    await prisma.notification.deleteMany();
    console.log('   ✓ Notificações removidas');
    
    await prisma.bookmark.deleteMany();
    console.log('   ✓ Bookmarks removidos');
    
    await prisma.like.deleteMany();
    console.log('   ✓ Likes removidos');
    
    await prisma.comment.deleteMany();
    console.log('   ✓ Comentários removidos');
    
    await prisma.post.deleteMany();
    console.log('   ✓ Posts removidos');
    
    // Deletar subcategorias primeiro (onde parentId não é null)
    const subcategoriesDeleted = await prisma.category.deleteMany({
      where: {
        parentId: { not: null }
      }
    });
    console.log(`   ✓ ${subcategoriesDeleted.count} subcategorias removidas`);
    
    // Depois deletar categorias principais (onde parentId é null)
    const categoriesDeleted = await prisma.category.deleteMany({
      where: {
        parentId: null
      }
    });
    console.log(`   ✓ ${categoriesDeleted.count} categorias principais removidas`);
    
    await prisma.user.deleteMany();
    console.log('   ✓ Usuários removidos');
    
    console.log('✅ Banco limpo!');
  } catch (error: any) {
    console.warn('⚠️  Aviso ao limpar banco (pode ser normal se estiver vazio):', error?.message || error);
  }
}

/**
 * Cria usuários de exemplo
 * 
 * IMPORTANTE: Email NÃO é armazenado no MongoDB.
 * Email vem apenas do Amazon Cognito (JWT token).
 * MongoDB armazena apenas cognitoSub + dados complementares.
 */
async function seedUsers() {
  console.log('\n👥 Criando usuários...');
  console.log('   ℹ️  Email gerenciado pelo Cognito (não armazenado no MongoDB)');
  
  const users: any[] = [
    {
      cognitoSub: '44085408-7021-7051-e274-ae704499cd72', // CognitoSub fixo para testes com usuário aoline
      fullName: 'Administrador Sistema',
      nickname: 'admin',
      avatar: 'https://i.pravatar.cc/150?img=1',
      bio: 'Administrador principal do sistema. Gerencio tudo por aqui!',
      website: 'https://blog.com',
      role: 'ADMIN',
      isActive: true,
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'Maria Silva',
      nickname: 'editor',
      avatar: 'https://i.pravatar.cc/150?img=2',
      bio: 'Editora de conteúdo. Amo revisar e aprovar posts incríveis!',
      website: 'https://mariasilva.com',
      role: 'EDITOR',
      isActive: true,
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'João Desenvolvedor',
      nickname: 'joaodev',
      avatar: 'https://i.pravatar.cc/150?img=3',
      bio: 'Desenvolvedor Full Stack apaixonado por tecnologia e boas práticas.',
      website: 'https://joaodev.com.br',
      socialLinks: {
        github: 'https://github.com/joaodev',
        linkedin: 'https://linkedin.com/in/joaodev',
        twitter: 'https://twitter.com/joaodev',
      },
      role: 'AUTHOR',
      isActive: true,
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'Ana Designer',
      nickname: 'anadesigner',
      avatar: 'https://i.pravatar.cc/150?img=4',
      bio: 'Designer UX/UI. Criando experiências digitais incríveis desde 2015.',
      website: 'https://anadesigner.com',
      socialLinks: {
        behance: 'https://behance.net/anadesigner',
        dribbble: 'https://dribbble.com/anadesigner',
      },
      role: 'AUTHOR',
      isActive: true,
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'Carlos Leitor',
      nickname: 'carlosleitor',
      avatar: 'https://i.pravatar.cc/150?img=5',
      bio: 'Leitor assíduo de tecnologia e desenvolvimento.',
      role: 'SUBSCRIBER',
      isActive: true,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    // Usar upsert para garantir que sempre crie/atualize o usuário
    // Isso é especialmente importante para o administrador com cognitoSub fixo
    const { cognitoSub, ...userDataWithoutId } = userData;
    
    let user = await prisma.user.upsert({
      where: { cognitoSub },
      update: {
        ...userDataWithoutId,
        updatedAt: new Date(),
      },
      create: userData,
    });
    
    createdUsers.push(user);
    
    // Mostrar cognitoSub completo para o administrador fixo
    const cognitoDisplay = cognitoSub === '44085408-7021-7051-e274-ae704499cd72' 
      ? cognitoSub 
      : `${user.cognitoSub.substring(0, 20)}...`;
    console.log(`   ✅ ${user.fullName} - ${user.role} [cognitoSub: ${cognitoDisplay}]`);
  }

  console.log('   ℹ️  Emails dos usuários estão no Cognito, não no MongoDB');
  return createdUsers;
}

/**
 * Cria categorias com hierarquia de 2 níveis
 */
async function seedCategories() {
  console.log('\n📂 Criando categorias...');
  
  // CATEGORIAS PRINCIPAIS - usando upsert para evitar duplicatas
  const tecnologia = await prisma.category.upsert({
    where: { slug: 'tecnologia' },
    update: {},
    create: {
      name: 'Tecnologia',
      slug: 'tecnologia',
      description: 'Tudo sobre tecnologia, programação e inovação',
      color: '#3498DB',
      icon: 'code',
      isActive: true,
      order: 1,
    },
  });
  console.log('   ✅ Tecnologia (categoria principal)');

  const design = await prisma.category.upsert({
    where: { slug: 'design' },
    update: {},
    create: {
      name: 'Design',
      slug: 'design',
      description: 'Design UX/UI, Design Gráfico e tendências visuais',
      color: '#E74C3C',
      icon: 'palette',
      isActive: true,
      order: 2,
    },
  });
  console.log('   ✅ Design (categoria principal)');

  const carreira = await prisma.category.upsert({
    where: { slug: 'carreira' },
    update: {},
    create: {
      name: 'Carreira',
      slug: 'carreira',
      description: 'Dicas de carreira, produtividade e desenvolvimento pessoal',
      color: '#2ECC71',
      icon: 'briefcase',
      isActive: true,
      order: 3,
    },
  });
  console.log('   ✅ Carreira (categoria principal)');

  // SUBCATEGORIAS DE TECNOLOGIA - usando upsert
  const frontend = await prisma.category.upsert({
    where: { slug: 'frontend' },
    update: { 
      parentId: tecnologia.id,
      updatedAt: new Date(),
    },
    create: {
      name: 'Frontend',
      slug: 'frontend',
      description: 'React, Vue, Angular, Next.js e tecnologias frontend',
      color: '#61DAFB',
      icon: 'monitor',
      parentId: tecnologia.id,
      isActive: true,
      order: 1,
    },
  });
  console.log('   ✅ Frontend (subcategoria de Tecnologia)');

  const backend = await prisma.category.upsert({
    where: { slug: 'backend' },
    update: { 
      parentId: tecnologia.id,
      updatedAt: new Date(),
    },
    create: {
      name: 'Backend',
      slug: 'backend',
      description: 'Node.js, NestJS, APIs e arquitetura de sistemas',
      color: '#68A063',
      icon: 'server',
      parentId: tecnologia.id,
      isActive: true,
      order: 2,
    },
  });
  console.log('   ✅ Backend (subcategoria de Tecnologia)');

  const devops = await prisma.category.upsert({
    where: { slug: 'devops' },
    update: { 
      parentId: tecnologia.id,
      updatedAt: new Date(),
    },
    create: {
      name: 'DevOps',
      slug: 'devops',
      description: 'CI/CD, Docker, Kubernetes, Cloud e infraestrutura',
      color: '#FF6B35',
      icon: 'cloud',
      parentId: tecnologia.id,
      isActive: true,
      order: 3,
    },
  });
  console.log('   ✅ DevOps (subcategoria de Tecnologia)');

  // SUBCATEGORIAS DE DESIGN - usando upsert
  const uxui = await prisma.category.upsert({
    where: { slug: 'ux-ui-design' },
    update: { 
      parentId: design.id,
      updatedAt: new Date(),
    },
    create: {
      name: 'UX/UI Design',
      slug: 'ux-ui-design',
      description: 'User Experience, User Interface e Design de Produto',
      color: '#9B59B6',
      icon: 'layout',
      parentId: design.id,
      isActive: true,
      order: 1,
    },
  });
  console.log('   ✅ UX/UI Design (subcategoria de Design)');

  const designGrafico = await prisma.category.upsert({
    where: { slug: 'design-grafico' },
    update: { 
      parentId: design.id,
      updatedAt: new Date(),
    },
    create: {
      name: 'Design Gráfico',
      slug: 'design-grafico',
      description: 'Ilustração, branding e design visual',
      color: '#E67E22',
      icon: 'image',
      parentId: design.id,
      isActive: true,
      order: 2,
    },
  });
  console.log('   ✅ Design Gráfico (subcategoria de Design)');

  // SUBCATEGORIAS DE CARREIRA - usando upsert
  const produtividade = await prisma.category.upsert({
    where: { slug: 'produtividade' },
    update: { 
      parentId: carreira.id,
      updatedAt: new Date(),
    },
    create: {
      name: 'Produtividade',
      slug: 'produtividade',
      description: 'Técnicas, ferramentas e dicas para ser mais produtivo',
      color: '#1ABC9C',
      icon: 'zap',
      parentId: carreira.id,
      isActive: true,
      order: 1,
    },
  });
  console.log('   ✅ Produtividade (subcategoria de Carreira)');

  return {
    tecnologia,
    design,
    carreira,
    frontend,
    backend,
    devops,
    uxui,
    designGrafico,
    produtividade,
  };
}

/**
 * Cria posts de exemplo
 */
async function seedPosts(users: any[], categories: any) {
  console.log('\n📝 Criando posts...');
  
  const posts = [
    // Posts de Frontend
    {
      title: 'Introdução ao React 18: O Que Há de Novo',
      slug: 'introducao-react-18-novidades',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'O React 18 trouxe várias mudanças importantes que revolucionam a forma como desenvolvemos aplicações. Neste artigo, vamos explorar as principais novidades como Concurrent Rendering, Automatic Batching, Transitions e o novo hook useId. Prepare-se para descobrir como essas features podem melhorar significativamente a performance e experiência do usuário nas suas aplicações React.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.frontend.id,
      authorId: users[2].cognitoSub, // João Dev
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      publishedAt: new Date('2025-10-01'),
    },
    {
      title: 'Next.js 14: Server Actions e App Router na Prática',
      slug: 'nextjs-14-server-actions-app-router',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Next.js 14 introduziu Server Actions, uma maneira revolucionária de fazer mutações de dados sem precisar criar rotas de API separadas. Neste tutorial completo, vamos construir uma aplicação do zero usando App Router, Server Components e Server Actions. Você vai aprender quando usar cada abordagem e como otimizar sua aplicação para máxima performance com estratégias de cache inteligentes.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.frontend.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date('2025-10-05'),
    },
    // Posts de Backend
    {
      title: 'NestJS: Arquitetura Modular e Dependency Injection',
      slug: 'nestjs-arquitetura-modular-dependency-injection',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'NestJS é um framework Node.js que traz os melhores padrões de arquitetura do mundo corporativo para o JavaScript. Neste artigo detalhado, vamos explorar como estruturar uma aplicação NestJS de forma profissional usando módulos, dependency injection, repository pattern e muito mais. Aprenda a criar APIs escaláveis e testáveis seguindo as melhores práticas da indústria.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.backend.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      featured: false,
      publishedAt: new Date('2025-10-10'),
    },
    {
      title: 'Prisma ORM: Do Zero à Produção com MongoDB',
      slug: 'prisma-orm-zero-producao-mongodb',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Prisma é um ORM moderno que facilita o trabalho com bancos de dados em aplicações Node.js e TypeScript. Neste guia completo, vamos desde a instalação e configuração inicial até patterns avançados de queries, migrations, relações complexas e otimizações de performance. Descubra como o Prisma pode transformar sua experiência de desenvolvimento com type-safety completo e produtividade máxima.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.backend.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      publishedAt: new Date('2025-10-12'),
    },
    // Posts de DevOps
    {
      title: 'Docker para Desenvolvedores: Guia Prático Completo',
      slug: 'docker-para-desenvolvedores-guia-pratico',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Docker revolucionou a forma como desenvolvemos e deployamos aplicações. Neste guia prático e hands-on, você vai aprender a containerizar suas aplicações, criar Dockerfiles otimizados, usar Docker Compose para ambientes complexos, trabalhar com volumes e networks, e preparar suas aplicações para produção. Inclui exemplos reais com Node.js, MongoDB, Redis e muito mais.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.devops.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      publishedAt: new Date('2025-10-08'),
    },
    // Posts de UX/UI
    {
      title: 'Princípios de Design de Interface: O Guia Definitivo',
      slug: 'principios-design-interface-guia-definitivo',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Design de interface vai muito além de fazer algo bonito. Envolve entender psicologia, acessibilidade, hierarquia visual e experiência do usuário. Neste artigo abrangente, vamos explorar os 10 princípios fundamentais de design de interface que todo designer e desenvolvedor deve conhecer. Aprenda a criar interfaces que são não apenas visualmente atraentes, mas também intuitivas, acessíveis e eficientes.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.uxui.id,
      authorId: users[3].cognitoSub, // Ana Designer
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date('2025-10-03'),
    },
    {
      title: 'Figma: Do Básico ao Avançado em Design Systems',
      slug: 'figma-basico-avancado-design-systems',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Figma se tornou a ferramenta número um para design de interfaces e colaboração em equipe. Neste curso prático, vamos desde os conceitos básicos até a criação de Design Systems completos e escaláveis. Aprenda a usar Auto Layout, Components, Variants, e a organizar seus arquivos de forma profissional. Inclui templates e exemplos reais de empresas de tecnologia.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.uxui.id,
      authorId: users[3].cognitoSub,
      status: 'PUBLISHED',
      publishedAt: new Date('2025-10-07'),
    },
    // Posts de Produtividade
    {
      title: 'GTD (Getting Things Done): Sistema Completo de Produtividade',
      slug: 'gtd-getting-things-done-sistema-produtividade',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Getting Things Done é um dos sistemas de produtividade mais populares e eficazes do mundo. Criado por David Allen, o GTD ajuda você a organizar todas as suas tarefas, projetos e compromissos de forma que sua mente fique livre para ser criativa. Neste guia completo, vou mostrar como implementar o GTD do zero, quais ferramentas usar e como adaptar o sistema para sua realidade.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.produtividade.id,
      authorId: users[1].cognitoSub, // Maria Editor
      status: 'PUBLISHED',
      publishedAt: new Date('2025-10-09'),
    },
    // Post em rascunho
    {
      title: 'AWS Lambda: Serverless na Prática com Node.js',
      slug: 'aws-lambda-serverless-pratica-nodejs',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'AWS Lambda permite executar código sem provisionar servidores, pagando apenas pelo tempo de computação usado. Neste tutorial, vamos criar uma aplicação serverless completa usando Lambda, API Gateway, DynamoDB e S3. Aprenda a estruturar seu código, gerenciar variáveis de ambiente, monitorar logs e otimizar custos.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.devops.id,
      authorId: users[2].cognitoSub,
      status: 'DRAFT',
      featured: false,
    },
  ];

  const createdPosts = [];
  for (const postData of posts) {
    const post = await prisma.post.create({ data: postData as any });
    createdPosts.push(post);
    console.log(`   ✅ "${post.title}" (${post.status})`);
  }

  // Atualizar contador de posts nas categorias
  await prisma.category.update({
    where: { id: categories.frontend.id },
    data: { postsCount: 2 },
  });
  await prisma.category.update({
    where: { id: categories.backend.id },
    data: { postsCount: 2 },
  });
  await prisma.category.update({
    where: { id: categories.devops.id },
    data: { postsCount: 2 },
  });
  await prisma.category.update({
    where: { id: categories.uxui.id },
    data: { postsCount: 2 },
  });
  await prisma.category.update({
    where: { id: categories.produtividade.id },
    data: { postsCount: 1 },
  });

  // Atualizar contador de posts dos autores
  await prisma.user.update({
    where: { cognitoSub: users[2].cognitoSub },
    data: { postsCount: 5 },
  });
  await prisma.user.update({
    where: { cognitoSub: users[3].cognitoSub },
    data: { postsCount: 2 },
  });
  await prisma.user.update({
    where: { cognitoSub: users[1].cognitoSub },
    data: { postsCount: 1 },
  });

  return createdPosts;
}

/**
 * Cria comentários de exemplo (incluindo threads)
 */
async function seedComments(users: any[], posts: any[]) {
  console.log('\n💬 Criando comentários...');
  
  // Comentário no post de React
  const comment1 = await prisma.comment.create({
    data: {
      content: 'Excelente artigo! O Concurrent Rendering realmente muda o jogo. Já estou usando no meu projeto e a diferença de performance é notável.',
      authorId: users[4].cognitoSub, // Carlos
      postId: posts[0].id,
      isApproved: true,
    },
  });
  console.log('   ✅ Comentário de Carlos no post de React');

  // Resposta ao comentário (thread)
  const comment2 = await prisma.comment.create({
    data: {
      content: 'Que bom que gostou, Carlos! O Concurrent Rendering é mesmo impressionante. Você já experimentou o Suspense para data fetching?',
      authorId: users[2].cognitoSub, // João (autor do post)
      postId: posts[0].id,
      parentId: comment1.id,
      isApproved: true,
    },
  });
  console.log('   ✅ Resposta de João para Carlos (thread)');

  // Comentário no post de Next.js
  const comment3 = await prisma.comment.create({
    data: {
      content: 'Server Actions são o futuro! Não preciso mais criar rotas de API separadas. Isso economiza muito tempo e deixa o código mais limpo.',
      authorId: users[3].cognitoSub, // Ana
      postId: posts[1].id,
      isApproved: true,
    },
  });
  console.log('   ✅ Comentário de Ana no post de Next.js');

  // Comentário no post de NestJS
  const comment4 = await prisma.comment.create({
    data: {
      content: 'NestJS é incrível para projetos grandes. A arquitetura modular facilita muito a manutenção. Estou migrando meu projeto Express para NestJS.',
      authorId: users[4].cognitoSub,
      postId: posts[2].id,
      isApproved: true,
    },
  });
  console.log('   ✅ Comentário de Carlos no post de NestJS');

  // Comentário aguardando moderação
  const comment5 = await prisma.comment.create({
    data: {
      content: 'Adorei o artigo sobre Figma! Muito útil para iniciantes.',
      authorId: users[4].cognitoSub,
      postId: posts[5].id,
      isApproved: false, // Aguardando aprovação
    },
  });
  console.log('   ✅ Comentário aguardando moderação');

  // Atualizar contador de comentários nos posts
  await prisma.post.update({
    where: { id: posts[0].id },
    data: { commentsCount: 2 },
  });
  await prisma.post.update({
    where: { id: posts[1].id },
    data: { commentsCount: 1 },
  });
  await prisma.post.update({
    where: { id: posts[2].id },
    data: { commentsCount: 1 },
  });
  await prisma.post.update({
    where: { id: posts[5].id },
    data: { commentsCount: 1 },
  });

  // Atualizar contador de comentários dos usuários
  await prisma.user.update({
    where: { cognitoSub: users[4].cognitoSub },
    data: { commentsCount: 3 },
  });
  await prisma.user.update({
    where: { cognitoSub: users[2].cognitoSub },
    data: { commentsCount: 1 },
  });
  await prisma.user.update({
    where: { cognitoSub: users[3].cognitoSub },
    data: { commentsCount: 1 },
  });

  return [comment1, comment2, comment3, comment4, comment5];
}

/**
 * Cria likes de exemplo
 */
async function seedLikes(users: any[], posts: any[]) {
  console.log('\n❤️  Criando likes...');
  
  const likes = [
    // Carlos curtiu vários posts
    { userId: users[4].cognitoSub, postId: posts[0].id },
    { userId: users[4].cognitoSub, postId: posts[1].id },
    { userId: users[4].cognitoSub, postId: posts[2].id },
    { userId: users[4].cognitoSub, postId: posts[4].id },
    
    // Ana curtiu posts de tech
    { userId: users[3].cognitoSub, postId: posts[0].id },
    { userId: users[3].cognitoSub, postId: posts[1].id },
    { userId: users[3].cognitoSub, postId: posts[2].id },
    
    // João curtiu posts de design
    { userId: users[2].cognitoSub, postId: posts[5].id },
    { userId: users[2].cognitoSub, postId: posts[6].id },
    
    // Maria curtiu vários
    { userId: users[1].cognitoSub, postId: posts[0].id },
    { userId: users[1].cognitoSub, postId: posts[5].id },
  ];

  for (const likeData of likes) {
    await prisma.like.create({ data: likeData });
  }
  console.log(`   ✅ ${likes.length} likes criados`);

  // Atualizar contadores nos posts
  await prisma.post.update({ where: { id: posts[0].id }, data: { likesCount: 3 } });
  await prisma.post.update({ where: { id: posts[1].id }, data: { likesCount: 2 } });
  await prisma.post.update({ where: { id: posts[2].id }, data: { likesCount: 2 } });
  await prisma.post.update({ where: { id: posts[4].id }, data: { likesCount: 1 } });
  await prisma.post.update({ where: { id: posts[5].id }, data: { likesCount: 2 } });
  await prisma.post.update({ where: { id: posts[6].id }, data: { likesCount: 1 } });

  return likes;
}

/**
 * Cria bookmarks de exemplo
 */
async function seedBookmarks(users: any[], posts: any[]) {
  console.log('\n🔖 Criando bookmarks...');
  
  const bookmarks = [
    // Carlos salvou posts para ler depois
    {
      userId: users[4].cognitoSub,
      postId: posts[0].id,
      collection: 'Para Ler Depois',
      notes: 'Preciso estudar Concurrent Rendering com calma',
    },
    {
      userId: users[4].cognitoSub,
      postId: posts[3].id,
      collection: 'Estudar',
      notes: 'Importante para o projeto atual',
    },
    
    // Ana salvou posts de referência
    {
      userId: users[3].cognitoSub,
      postId: posts[1].id,
      collection: 'Favoritos',
    },
    {
      userId: users[3].cognitoSub,
      postId: posts[2].id,
      collection: 'Aprender Backend',
      notes: 'NestJS parece interessante para projetos grandes',
    },
    
    // João salvou posts de design
    {
      userId: users[2].cognitoSub,
      postId: posts[5].id,
      collection: 'Design Inspiration',
    },
  ];

  for (const bookmarkData of bookmarks) {
    await prisma.bookmark.create({ data: bookmarkData });
  }
  console.log(`   ✅ ${bookmarks.length} bookmarks criados`);

  // Atualizar contadores nos posts
  await prisma.post.update({ where: { id: posts[0].id }, data: { bookmarksCount: 1 } });
  await prisma.post.update({ where: { id: posts[1].id }, data: { bookmarksCount: 1 } });
  await prisma.post.update({ where: { id: posts[2].id }, data: { bookmarksCount: 1 } });
  await prisma.post.update({ where: { id: posts[3].id }, data: { bookmarksCount: 1 } });
  await prisma.post.update({ where: { id: posts[5].id }, data: { bookmarksCount: 1 } });

  return bookmarks;
}

/**
 * Cria notificações de exemplo
 */
async function seedNotifications(users: any[], posts: any[]) {
  console.log('\n🔔 Criando notificações...');
  
  const notifications = [
    // Notificação de novo comentário para João
    {
      type: 'NEW_COMMENT',
      title: 'Novo Comentário',
      message: 'Carlos comentou no seu post "Introdução ao React 18"',
      link: `/posts/${posts[0].id}`,
      userId: users[2].cognitoSub,
      isRead: false,
      metadata: {
        postId: posts[0].id,
        commentAuthor: 'Carlos Leitor',
      },
    },
    // Notificação de like
    {
      type: 'NEW_LIKE',
      title: 'Novo Like',
      message: 'Ana Designer curtiu seu post "Next.js 14: Server Actions"',
      link: `/posts/${posts[1].id}`,
      userId: users[2].cognitoSub,
      isRead: true,
      readAt: new Date('2025-10-11'),
      metadata: {
        postId: posts[1].id,
        likeAuthor: 'Ana Designer',
      },
    },
    // Notificação de post publicado
    {
      type: 'POST_PUBLISHED',
      title: 'Post Publicado',
      message: 'Seu post "Prisma ORM: Do Zero à Produção" foi publicado com sucesso!',
      link: `/posts/${posts[3].id}`,
      userId: users[2].cognitoSub,
      isRead: true,
      readAt: new Date('2025-10-12'),
    },
    // Notificação para Ana
    {
      type: 'NEW_COMMENT',
      title: 'Novo Comentário',
      message: 'Carlos comentou no seu post "Figma: Do Básico ao Avançado"',
      link: `/posts/${posts[5].id}`,
      userId: users[3].cognitoSub,
      isRead: false,
    },
    // Notificação do sistema
    {
      type: 'SYSTEM',
      title: 'Bem-vindo ao Blog!',
      message: 'Obrigado por se cadastrar. Explore nossos artigos e não se esqueça de deixar seus comentários!',
      userId: users[4].cognitoSub,
      isRead: false,
    },
  ];

  for (const notificationData of notifications) {
    await prisma.notification.create({ data: notificationData as any });
  }
  console.log(`   ✅ ${notifications.length} notificações criadas`);

  return notifications;
}

/**
 * Incrementa views em alguns posts
 */
async function updateViews(posts: any[]) {
  console.log('\n👁️  Atualizando visualizações...');
  
  await prisma.post.update({ where: { id: posts[0].id }, data: { views: 1250 } });
  await prisma.post.update({ where: { id: posts[1].id }, data: { views: 890 } });
  await prisma.post.update({ where: { id: posts[2].id }, data: { views: 650 } });
  await prisma.post.update({ where: { id: posts[3].id }, data: { views: 420 } });
  await prisma.post.update({ where: { id: posts[4].id }, data: { views: 580 } });
  await prisma.post.update({ where: { id: posts[5].id }, data: { views: 720 } });
  await prisma.post.update({ where: { id: posts[6].id }, data: { views: 310 } });
  
  console.log('   ✅ Views atualizadas');
}

/**
 * Função principal de seed
 */
async function main() {
  console.log('\n🌱 Iniciando seed do banco de dados...\n');
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    // Limpar banco
    await cleanup();

    // Criar dados
    const users = await seedUsers();
    const categories = await seedCategories();
    const posts = await seedPosts(users, categories);
    const comments = await seedComments(users, posts);
    const likes = await seedLikes(users, posts);
    const bookmarks = await seedBookmarks(users, posts);
    const notifications = await seedNotifications(users, posts);
    
    // Atualizar views
    await updateViews(posts);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('\n✅ Seed concluído com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`   • ${users.length} usuários`);
    console.log(`   • 9 categorias (3 principais + 6 subcategorias)`);
    console.log(`   • ${posts.length} posts (${posts.filter(p => p.status === 'PUBLISHED').length} publicados, ${posts.filter(p => p.status === 'DRAFT').length} rascunho)`);
    console.log(`   • ${comments.length} comentários (${comments.filter((c: any) => c.isApproved).length} aprovados)`);
    console.log(`   • ${likes.length} likes`);
    console.log(`   • ${bookmarks.length} bookmarks`);
    console.log(`   • ${notifications.length} notificações (${notifications.filter((n: any) => !n.isRead).length} não lidas)`);
    console.log('\n🎉 Banco de dados populado e pronto para uso!\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao popular banco:', error);
    throw error;
  }
}

// Executar seed
main()
  .catch((e) => {
    console.error(e);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

