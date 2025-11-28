/**
 * Seed do DynamoDB - Popular Banco de Dados
 * 
 * Script para popular o DynamoDB com dados iniciais de exemplo.
 * Suporta DynamoDB Local (desenvolvimento) e AWS DynamoDB (produção).
 * 
 * Cria exatamente os mesmos dados que mongodb.seed.ts para compatibilidade total.
 * 
 * Uso:
 * ```bash
 * npm run dynamodb:seed
 * # ou
 * npx tsx src/prisma/dynamodb.seed.ts
 * ```
 * 
 * @fileoverview Seed do DynamoDB
 * @module prisma/dynamodb.seed
 */

import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { env, TABLES } from '../config/env.js';
import { nanoid } from 'nanoid';

/**
 * Detecta automaticamente o ambiente
 * - Lambda (AWS_LAMBDA_FUNCTION_NAME existe) → AWS DynamoDB
 * - Local com DYNAMODB_ENDPOINT → DynamoDB Local
 * - Local sem DYNAMODB_ENDPOINT → AWS DynamoDB (scripts manuais)
 */
const isRunningInLambda = !!(
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_EXECUTION_ENV
);
const isLocalEnvironment = !isRunningInLambda && !!env.DYNAMODB_ENDPOINT;
const environment = isLocalEnvironment ? 'DynamoDB Local' : 'AWS DynamoDB';

/**
 * Cliente DynamoDB
 */
const client = new DynamoDBClient({
  region: env.AWS_REGION,
  endpoint: env.DYNAMODB_ENDPOINT || undefined,
  credentials: isLocalEnvironment ? {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  } : undefined, // AWS usa credenciais do ambiente (IAM Role, AWS CLI, etc)
});

const dynamodb = DynamoDBDocumentClient.from(client);

/**
 * Cria usuários de exemplo (IDÊNTICOS ao MongoDB)
 */
async function seedUsers() {
  console.log('\n👥 Inserindo usuários...');
  
  const users = [
    {
      cognitoSub: '44085408-7021-7051-e274-ae704499cd72', // CognitoSub fixo para testes com usuário aoline
      email: 'admin@blog.com',
      nickname: 'admin',
      fullName: 'Administrador Sistema',
      avatar: 'https://i.pravatar.cc/150?img=1',
      bio: 'Administrador principal do sistema. Gerencio tudo por aqui!',
      website: 'https://blog.com',
      role: 'ADMIN',
      isActive: true,
      postsCount: 0,
      commentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
      cognitoSub: `cognito-${nanoid()}`,
    email: 'editor@blog.com',
      nickname: 'editor',
      fullName: 'Maria Silva',
      avatar: 'https://i.pravatar.cc/150?img=2',
      bio: 'Editora de conteúdo. Amo revisar e aprovar posts incríveis!',
      website: 'https://mariasilva.com',
    role: 'EDITOR',
      isActive: true,
      postsCount: 1,
      commentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
      cognitoSub: `cognito-${nanoid()}`,
      email: 'joao@blog.com',
      nickname: 'joaodev',
      fullName: 'João Desenvolvedor',
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
      postsCount: 5,
      commentsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
      cognitoSub: `cognito-${nanoid()}`,
    email: 'ana@blog.com',
      nickname: 'anadesigner',
      fullName: 'Ana Designer',
      avatar: 'https://i.pravatar.cc/150?img=4',
      bio: 'Designer UX/UI. Criando experiências digitais incríveis desde 2015.',
      website: 'https://anadesigner.com',
      socialLinks: {
        behance: 'https://behance.net/anadesigner',
        dribbble: 'https://dribbble.com/anadesigner',
      },
      role: 'AUTHOR',
      isActive: true,
      postsCount: 2,
      commentsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
      cognitoSub: `cognito-${nanoid()}`,
      email: 'carlos@example.com',
      nickname: 'carlosleitor',
      fullName: 'Carlos Leitor',
      avatar: 'https://i.pravatar.cc/150?img=5',
      bio: 'Leitor assíduo de tecnologia e desenvolvimento.',
      role: 'SUBSCRIBER',
      isActive: true,
      postsCount: 0,
      commentsCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
  
  for (const user of users) {
    // PutCommand sempre sobrescreve/atualiza, garantindo que o administrador fixo seja sempre atualizado
    await dynamodb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user,
    }));
    
    // Mostrar cognitoSub completo para o administrador fixo
    const cognitoDisplay = user.cognitoSub === '6488d4d8-9081-7058-108b-07aab2786b43' 
      ? user.cognitoSub 
      : `${user.cognitoSub.substring(0, 20)}...`;
    console.log(`   ✅ ${user.fullName} (@${user.nickname}) - ${user.role} [cognitoSub: ${cognitoDisplay}]`);
  }
  
  console.log(`✅ ${users.length} usuários inseridos`);
  return users;
}

/**
 * Cria categorias com hierarquia de 2 níveis (IDÊNTICAS ao MongoDB)
 */
async function seedCategories() {
  console.log('\n📂 Inserindo categorias...');
  
  // CATEGORIAS PRINCIPAIS (sem parentId)
  const tecnologia = {
    id: nanoid(),
    name: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Tudo sobre tecnologia, programação e inovação',
    color: '#3498DB',
    icon: 'code',
    parentId: null,
    isActive: true,
    order: 1,
    postsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const design = {
    id: nanoid(),
    name: 'Design',
    slug: 'design',
    description: 'Design UX/UI, Design Gráfico e tendências visuais',
    color: '#E74C3C',
    icon: 'palette',
    parentId: null,
    isActive: true,
    order: 2,
    postsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const carreira = {
    id: nanoid(),
    name: 'Carreira',
    slug: 'carreira',
    description: 'Dicas de carreira, produtividade e desenvolvimento pessoal',
    color: '#2ECC71',
    icon: 'briefcase',
    parentId: null,
    isActive: true,
    order: 3,
    postsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // SUBCATEGORIAS DE TECNOLOGIA
  const frontend = {
    id: nanoid(),
    name: 'Frontend',
    slug: 'frontend',
    description: 'React, Vue, Angular, Next.js e tecnologias frontend',
    color: '#61DAFB',
    icon: 'monitor',
    parentId: tecnologia.id,
    isActive: true,
    order: 1,
    postsCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const backend = {
    id: nanoid(),
    name: 'Backend',
    slug: 'backend',
    description: 'Node.js, NestJS, APIs e arquitetura de sistemas',
    color: '#68A063',
    icon: 'server',
    parentId: tecnologia.id,
    isActive: true,
    order: 2,
    postsCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const devops = {
    id: nanoid(),
    name: 'DevOps',
    slug: 'devops',
    description: 'CI/CD, Docker, Kubernetes, Cloud e infraestrutura',
    color: '#FF6B35',
    icon: 'cloud',
    parentId: tecnologia.id,
    isActive: true,
    order: 3,
    postsCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // SUBCATEGORIAS DE DESIGN
  const uxui = {
    id: nanoid(),
    name: 'UX/UI Design',
    slug: 'ux-ui-design',
    description: 'User Experience, User Interface e Design de Produto',
    color: '#9B59B6',
    icon: 'layout',
    parentId: design.id,
    isActive: true,
    order: 1,
    postsCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const designGrafico = {
    id: nanoid(),
    name: 'Design Gráfico',
    slug: 'design-grafico',
    description: 'Ilustração, branding e design visual',
    color: '#E67E22',
    icon: 'image',
    parentId: design.id,
    isActive: true,
    order: 2,
    postsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // SUBCATEGORIAS DE CARREIRA
  const produtividade = {
    id: nanoid(),
    name: 'Produtividade',
    slug: 'produtividade',
    description: 'Técnicas, ferramentas e dicas para ser mais produtivo',
    color: '#1ABC9C',
    icon: 'zap',
    parentId: carreira.id,
    isActive: true,
    order: 1,
    postsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allCategories = [tecnologia, design, carreira, frontend, backend, devops, uxui, designGrafico, produtividade];

  for (const category of allCategories) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: category,
    }));
    const type = category.parentId ? 'subcategoria' : 'categoria principal';
    console.log(`   ✅ ${category.name} (${type})`);
  }
  
  console.log(`✅ ${allCategories.length} categorias inseridas (3 principais + 6 subcategorias)`);
  
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
 * Cria posts de exemplo (IDÊNTICOS ao MongoDB)
 */
async function seedPosts(users: any[], categories: any) {
  console.log('\n📝 Inserindo posts...');
  
  const posts = [
    // Posts de Frontend
    {
      id: nanoid(),
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
                text: 'O React 18 trouxe várias mudanças importantes que revolucionam a forma como desenvolvemos aplicações. Neste artigo, vamos explorar as principais novidades como Concurrent Rendering, Automatic Batching, Transitions e o novo hook useId.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.frontend.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      pinned: false,
      priority: 0,
      publishedAt: new Date('2025-10-01').toISOString(),
      views: 1250,
      likesCount: 3,
      commentsCount: 2,
      bookmarksCount: 1,
      createdAt: new Date('2025-10-01').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
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
                text: 'Next.js 14 introduziu Server Actions, uma maneira revolucionária de fazer mutações de dados sem precisar criar rotas de API separadas.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.frontend.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      publishedAt: new Date('2025-10-05').toISOString(),
      views: 890,
      likesCount: 2,
      commentsCount: 1,
      bookmarksCount: 1,
      createdAt: new Date('2025-10-05').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Posts de Backend
    {
      id: nanoid(),
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
                text: 'NestJS é um framework Node.js que traz os melhores padrões de arquitetura do mundo corporativo para o JavaScript.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.backend.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      featured: false,
      allowComments: true,
      publishedAt: new Date('2025-10-10').toISOString(),
      views: 650,
      likesCount: 2,
      commentsCount: 1,
      bookmarksCount: 1,
      createdAt: new Date('2025-10-10').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
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
                text: 'Prisma é um ORM moderno que facilita o trabalho com bancos de dados em aplicações Node.js e TypeScript.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.backend.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      allowComments: true,
      publishedAt: new Date('2025-10-12').toISOString(),
      views: 420,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 1,
      createdAt: new Date('2025-10-12').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Posts de DevOps
    {
      id: nanoid(),
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
                text: 'Docker revolucionou a forma como desenvolvemos e deployamos aplicações.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.devops.id,
      authorId: users[2].cognitoSub,
      status: 'PUBLISHED',
      allowComments: true,
      publishedAt: new Date('2025-10-08').toISOString(),
      views: 580,
      likesCount: 1,
      commentsCount: 0,
      bookmarksCount: 0,
      createdAt: new Date('2025-10-08').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Posts de UX/UI
    {
      id: nanoid(),
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
                text: 'Design de interface vai muito além de fazer algo bonito. Envolve entender psicologia, acessibilidade, hierarquia visual e experiência do usuário.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.uxui.id,
      authorId: users[3].cognitoSub,
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      publishedAt: new Date('2025-10-03').toISOString(),
      views: 720,
      likesCount: 2,
      commentsCount: 0,
      bookmarksCount: 1,
      createdAt: new Date('2025-10-03').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
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
                text: 'Figma se tornou a ferramenta número um para design de interfaces e colaboração em equipe.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.uxui.id,
      authorId: users[3].cognitoSub,
      status: 'PUBLISHED',
      allowComments: true,
      publishedAt: new Date('2025-10-07').toISOString(),
      views: 310,
      likesCount: 1,
      commentsCount: 1,
      bookmarksCount: 0,
      createdAt: new Date('2025-10-07').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Posts de Produtividade
    {
      id: nanoid(),
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
                text: 'Getting Things Done é um dos sistemas de produtividade mais populares e eficazes do mundo.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.produtividade.id,
      authorId: users[1].cognitoSub,
      status: 'PUBLISHED',
      allowComments: true,
      publishedAt: new Date('2025-10-09').toISOString(),
      views: 0,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      createdAt: new Date('2025-10-09').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
    
  for (const post of posts) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.POSTS,
      Item: post,
    }));
    console.log(`   ✅ "${post.title}" (${post.status})`);
  }
  
  console.log(`✅ ${posts.length} posts inseridos (7 publicados)`);
  return posts;
}

/**
 * Cria comentários de exemplo (IDÊNTICOS ao MongoDB)
 */
async function seedComments(users: any[], posts: any[]) {
  console.log('\n💬 Inserindo comentários...');
  
  const comments = [
    {
      id: nanoid(),
      content: 'Excelente artigo! O Concurrent Rendering realmente muda o jogo. Já estou usando no meu projeto e a diferença de performance é notável.',
      authorId: users[4].cognitoSub,
      postId: posts[0].id,
      isApproved: true,
      isReported: false,
      isEdited: false,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      content: 'Que bom que gostou, Carlos! O Concurrent Rendering é mesmo impressionante. Você já experimentou o Suspense para data fetching?',
      authorId: users[2].cognitoSub,
      postId: posts[0].id,
      parentId: null, // Será o ID do primeiro comentário se precisar thread
      isApproved: true,
      isReported: false,
      isEdited: false,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      content: 'Server Actions são o futuro! Não preciso mais criar rotas de API separadas. Isso economiza muito tempo e deixa o código mais limpo.',
      authorId: users[3].cognitoSub,
      postId: posts[1].id,
      isApproved: true,
      isReported: false,
      isEdited: false,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      content: 'NestJS é incrível para projetos grandes. A arquitetura modular facilita muito a manutenção. Estou migrando meu projeto Express para NestJS.',
      authorId: users[4].cognitoSub,
      postId: posts[2].id,
      isApproved: true,
      isReported: false,
      isEdited: false,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      content: 'Adorei o artigo sobre Figma! Muito útil para iniciantes.',
      authorId: users[4].cognitoSub,
      postId: posts[6].id,
      isApproved: false,
      isReported: false,
      isEdited: false,
      likesCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
  ];

  for (const comment of comments) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.COMMENTS,
      Item: comment,
    }));
  }
  
  console.log(`✅ ${comments.length} comentários inseridos (4 aprovados, 1 pendente)`);
  return comments;
}

/**
 * Cria likes de exemplo (IDÊNTICOS ao MongoDB)
 */
async function seedLikes(users: any[], posts: any[]) {
  console.log('\n❤️  Inserindo likes...');
  
  const likes = [
    // Carlos curtiu vários posts
    { id: nanoid(), userId: users[4].cognitoSub, postId: posts[0].id, createdAt: new Date().toISOString() },
    { id: nanoid(), userId: users[4].cognitoSub, postId: posts[1].id, createdAt: new Date().toISOString() },
    { id: nanoid(), userId: users[4].cognitoSub, postId: posts[2].id, createdAt: new Date().toISOString() },
    { id: nanoid(), userId: users[4].cognitoSub, postId: posts[4].id, createdAt: new Date().toISOString() },
    
    // Ana curtiu posts de tech
    { id: nanoid(), userId: users[3].cognitoSub, postId: posts[0].id, createdAt: new Date().toISOString() },
    { id: nanoid(), userId: users[3].cognitoSub, postId: posts[1].id, createdAt: new Date().toISOString() },
    { id: nanoid(), userId: users[3].cognitoSub, postId: posts[2].id, createdAt: new Date().toISOString() },
    
    // João curtiu posts de design
    { id: nanoid(), userId: users[2].cognitoSub, postId: posts[5].id, createdAt: new Date().toISOString() },
    { id: nanoid(), userId: users[2].cognitoSub, postId: posts[6].id, createdAt: new Date().toISOString() },
    
    // Maria curtiu vários
    { id: nanoid(), userId: users[1].cognitoSub, postId: posts[0].id, createdAt: new Date().toISOString() },
    { id: nanoid(), userId: users[1].cognitoSub, postId: posts[5].id, createdAt: new Date().toISOString() },
  ];

  for (const like of likes) {
      await dynamodb.send(new PutCommand({
        TableName: TABLES.LIKES,
      Item: like,
    }));
  }
  
  console.log(`✅ ${likes.length} likes inseridos`);
  return likes;
}

/**
 * Cria bookmarks de exemplo (IDÊNTICOS ao MongoDB)
 */
async function seedBookmarks(users: any[], posts: any[]) {
  console.log('\n🔖 Inserindo bookmarks...');
  
  const bookmarks = [
    {
      id: nanoid(),
      userId: users[4].cognitoSub,
      postId: posts[0].id,
      collection: 'Para Ler Depois',
      notes: 'Preciso estudar Concurrent Rendering com calma',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      userId: users[4].cognitoSub,
      postId: posts[3].id,
      collection: 'Estudar',
      notes: 'Importante para o projeto atual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      userId: users[3].cognitoSub,
      postId: posts[1].id,
      collection: 'Favoritos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      userId: users[3].cognitoSub,
      postId: posts[2].id,
      collection: 'Aprender Backend',
      notes: 'NestJS parece interessante para projetos grandes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      userId: users[2].cognitoSub,
      postId: posts[5].id,
      collection: 'Design Inspiration',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const bookmark of bookmarks) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.BOOKMARKS,
      Item: bookmark,
    }));
  }
  
  console.log(`✅ ${bookmarks.length} bookmarks inseridos`);
  return bookmarks;
}

/**
 * Cria notificações de exemplo (IDÊNTICAS ao MongoDB)
 */
async function seedNotifications(users: any[], posts: any[]) {
  console.log('\n🔔 Inserindo notificações...');
  
  const notifications = [
    {
      id: nanoid(),
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
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      type: 'NEW_LIKE',
      title: 'Novo Like',
      message: 'Ana Designer curtiu seu post "Next.js 14: Server Actions"',
      link: `/posts/${posts[1].id}`,
      userId: users[2].cognitoSub,
      isRead: true,
      readAt: new Date('2025-10-11').toISOString(),
      metadata: {
        postId: posts[1].id,
        likeAuthor: 'Ana Designer',
      },
      createdAt: new Date('2025-10-10').toISOString(),
    },
    {
      id: nanoid(),
      type: 'POST_PUBLISHED',
      title: 'Post Publicado',
      message: 'Seu post "Prisma ORM: Do Zero à Produção" foi publicado com sucesso!',
      link: `/posts/${posts[3].id}`,
      userId: users[2].cognitoSub,
      isRead: true,
      readAt: new Date('2025-10-12').toISOString(),
      createdAt: new Date('2025-10-12').toISOString(),
    },
    {
      id: nanoid(),
      type: 'NEW_COMMENT',
      title: 'Novo Comentário',
      message: 'Carlos comentou no seu post "Figma: Do Básico ao Avançado"',
      link: `/posts/${posts[6].id}`,
      userId: users[3].cognitoSub,
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      type: 'SYSTEM',
      title: 'Bem-vindo ao Blog!',
      message: 'Obrigado por se cadastrar. Explore nossos artigos e não se esqueça de deixar seus comentários!',
      userId: users[4].cognitoSub,
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const notification of notifications) {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.NOTIFICATIONS,
      Item: notification,
    }));
  }
  
  console.log(`✅ ${notifications.length} notificações inseridas (3 não lidas, 2 lidas)`);
  return notifications;
}

/**
 * Função principal
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log(`  🌱 POPULANDO ${environment.toUpperCase()} COM DADOS DE TESTE`);
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  console.log(`🌍 Ambiente: ${environment}`);
  console.log(`🔗 Endpoint: ${env.DYNAMODB_ENDPOINT || 'AWS Cloud (padrão)'}`);
  console.log(`📊 Prefixo das tabelas: ${env.DYNAMODB_TABLE_PREFIX}`);
  console.log(`🌎 Região: ${env.AWS_REGION}\n`);

  try {
    // Insere dados em ordem (igual ao MongoDB)
    const users = await seedUsers();
    const categories = await seedCategories();
    const posts = await seedPosts(users, categories);
    const comments = await seedComments(users, posts);
    const likes = await seedLikes(users, posts);
    const bookmarks = await seedBookmarks(users, posts);
    const notifications = await seedNotifications(users, posts);

    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log('  ✨ DADOS INSERIDOS COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    console.log('📊 Resumo:');
    console.log(`   • ${users.length} usuários`);
    console.log(`   • 9 categorias (3 principais + 6 subcategorias)`);
    console.log(`   • ${posts.length} posts (${posts.filter(p => p.status === 'PUBLISHED').length} publicados)`);
    console.log(`   • ${comments.length} comentários (${comments.filter(c => c.isApproved).length} aprovados)`);
    console.log(`   • ${likes.length} likes`);
    console.log(`   • ${bookmarks.length} bookmarks`);
    console.log(`   • ${notifications.length} notificações (${notifications.filter(n => !n.isRead).length} não lidas)\n`);

    console.log('💡 Credenciais de teste:');
    users.forEach(user => {
      const displayNickname = user.nickname || 'usuario';
      console.log(`   • ${user.email} (@${displayNickname}) - ${user.role}`);
    });
    
    console.log('\n🌐 Próximos passos:');
    console.log('   • Execute: npm run dev (iniciar servidor)');
    console.log(`   • Acesse: http://localhost:${env.PORT}/docs`);
    console.log('   • Use header: X-Database-Provider: DYNAMODB');
    
    if (!isLocalEnvironment) {
      console.log('\n☁️  Ambiente AWS:');
      console.log('   • Dados inseridos na região: ' + env.AWS_REGION);
      console.log('   • Para deploy: npm run sam:deploy');
      console.log('   • Monitoramento: AWS CloudWatch Console');
    }
    
    console.log();

  } catch (error: any) {
    console.error('\n❌ Erro ao popular banco:', error.message);
    console.error(error);
    throw error;
  }
}

// Executa o script
main()
  .then(() => {
    console.log('✅ Seed concluído com sucesso!\n');
    if (process.env.NODE_ENV !== 'test') {
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar seed:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  });
