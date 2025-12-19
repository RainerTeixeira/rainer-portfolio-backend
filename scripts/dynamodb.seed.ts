/**
 * Seed do DynamoDB - Popular Banco de Dados com Dados Reais
 * 
 * Script para popular o DynamoDB com dados profissionais e reais do portfolio.
 * Suporta DynamoDB Local (desenvolvimento) e AWS DynamoDB (produção).
 * 
 * Uso:
 * ```bash
 * npm run dynamodb:seed
 * # ou
 * npx tsx scripts/dynamodb.seed.ts
 * ```
 * 
 * @fileoverview Seed do DynamoDB com dados reais
 * @module scripts/dynamodb.seed
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  ScanCommand, 
  DeleteCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { config } from '../src/common/config/index.js';

// Nomes das tabelas
const TABLES = {
  USERS: `${config.database.tableName}-users`,
  POSTS: `${config.database.tableName}-posts`,
  CATEGORIES: `${config.database.tableName}-categories`,
  COMMENTS: `${config.database.tableName}-comments`,
  LIKES: `${config.database.tableName}-likes`,
  BOOKMARKS: `${config.database.tableName}-bookmarks`,
  NOTIFICATIONS: `${config.database.tableName}-notifications`,
};

/**
 * Detecta automaticamente o ambiente
 */
const isRunningInLambda = !!(
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_EXECUTION_ENV
);
const isLocalEnvironment = !isRunningInLambda && config.aws.useLocalDynamoDB;
const environment = isLocalEnvironment ? 'DynamoDB Local' : 'AWS DynamoDB';

/**
 * Cliente DynamoDB
 */
const client = new DynamoDBClient({
  region: config.aws.region,
  endpoint: config.aws.useLocalDynamoDB ? process.env.DYNAMODB_ENDPOINT : undefined,
  credentials: isLocalEnvironment ? {
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  } : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * Limpa todos os dados das tabelas
 */
async function cleanup() {
  console.log('🧹 Limpando banco de dados...');
  
  const tables = Object.values(TABLES);
  
  for (const tableName of tables) {
    try {
      console.log(`   🗑️  Limpando ${tableName}...`);
      
      // Scan todos os itens
      const scanResult = await docClient.send(new ScanCommand({
        TableName: tableName,
      }));
      
      if (!scanResult.Items || scanResult.Items.length === 0) {
        console.log(`   ✅ ${tableName} já está vazia`);
        continue;
      }
      
      // Delete em batches de 25 (limite do DynamoDB)
      const items = scanResult.Items;
      const batches = [];
      
      for (let i = 0; i < items.length; i += 25) {
        const batch = items.slice(i, i + 25);
        batches.push(batch);
      }
      
      for (const batch of batches) {
        const deleteRequests = batch.map(item => {
          // Determinar a chave primária baseada na tabela
          let key: any = {};
          
          if (tableName === TABLES.USERS) {
            key = { cognitoSub: item.cognitoSub };
          } else {
            key = { id: item.id };
          }
          
          return {
            DeleteRequest: { Key: key }
          };
        });
        
        await docClient.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: deleteRequests
          }
        }));
      }
      
      console.log(`   ✅ ${items.length} itens removidos de ${tableName}`);
      
    } catch (error: any) {
      console.warn(`   ⚠️  Aviso ao limpar ${tableName}:`, error?.message || error);
    }
  }
  
  console.log('✅ Banco limpo!');
}

/**
 * Cria usuários reais do portfolio
 */
async function seedUsers() {
  console.log('\n👥 Criando usuários...');
  console.log('   ℹ️  Email gerenciado pelo Cognito (não armazenado no DynamoDB)');
  
  const users = [
    {
      cognitoSub: '44085408-7021-7051-e274-ae704499cd72', // CognitoSub real do usuário aoline
      fullName: 'Rainer Teixeira',
      nickname: 'rainer',
      bio: 'Desenvolvedor Full Stack especializado em React, Node.js e AWS. Fundador da Rainer Soft, criando soluções digitais inovadoras desde 2020.',
      avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/rainer-avatar.jpg',
      website: 'https://rainersoft.com.br',
      socialLinks: {
        github: 'https://github.com/RainerTeixeira',
        linkedin: 'https://linkedin.com/in/rainer-teixeira',
        twitter: 'https://twitter.com/rainersoft',
        instagram: 'https://instagram.com/rainersoft',
      },
      role: 'ADMIN',
      isActive: true,
      isBanned: false,
      postsCount: 0, // Será atualizado após criar posts
      commentsCount: 0,
      createdAt: new Date('2020-01-15').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'Maria Silva',
      nickname: 'maria-editor',
      bio: 'Editora de conteúdo técnico com 8 anos de experiência. Especialista em revisar e otimizar artigos sobre tecnologia e desenvolvimento.',
      avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/maria-avatar.jpg',
      website: 'https://mariasilva.dev',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/maria-silva-editor',
        medium: 'https://medium.com/@mariasilva',
      },
      role: 'EDITOR',
      isActive: true,
      isBanned: false,
      postsCount: 0,
      commentsCount: 0,
      createdAt: new Date('2021-03-10').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'João Santos',
      nickname: 'joao-dev',
      bio: 'Desenvolvedor Frontend especializado em React, Next.js e TypeScript. Contribuidor ativo em projetos open source.',
      avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/joao-avatar.jpg',
      website: 'https://joaosantos.dev',
      socialLinks: {
        github: 'https://github.com/joaosantos',
        linkedin: 'https://linkedin.com/in/joao-santos-dev',
        twitter: 'https://twitter.com/joaodev',
      },
      role: 'AUTHOR',
      isActive: true,
      isBanned: false,
      postsCount: 0,
      commentsCount: 0,
      createdAt: new Date('2021-07-22').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'Ana Costa',
      nickname: 'ana-designer',
      bio: 'UX/UI Designer com foco em design systems e acessibilidade. Criando experiências digitais inclusivas e intuitivas.',
      avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/ana-avatar.jpg',
      website: 'https://anacosta.design',
      socialLinks: {
        behance: 'https://behance.net/anacosta',
        dribbble: 'https://dribbble.com/anacosta',
        linkedin: 'https://linkedin.com/in/ana-costa-ux',
      },
      role: 'AUTHOR',
      isActive: true,
      isBanned: false,
      postsCount: 0,
      commentsCount: 0,
      createdAt: new Date('2022-01-15').toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      cognitoSub: `cognito-${nanoid()}`,
      fullName: 'Carlos Oliveira',
      nickname: 'carlos-reader',
      bio: 'Entusiasta de tecnologia e leitor assíduo. Sempre em busca de novos conhecimentos em desenvolvimento e inovação.',
      avatar: 'https://res.cloudinary.com/rainersoft/image/upload/v1/avatars/carlos-avatar.jpg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/carlos-oliveira',
      },
      role: 'SUBSCRIBER',
      isActive: true,
      isBanned: false,
      postsCount: 0,
      commentsCount: 0,
      createdAt: new Date('2023-05-20').toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    await docClient.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: userData,
    }));
    
    createdUsers.push(userData);
    
    const cognitoDisplay = userData.cognitoSub === '44085408-7021-7051-e274-ae704499cd72' 
      ? userData.cognitoSub 
      : `${userData.cognitoSub.substring(0, 20)}...`;
    console.log(`   ✅ ${userData.fullName} - ${userData.role} [cognitoSub: ${cognitoDisplay}]`);
  }

  console.log('   ℹ️  Emails dos usuários estão no Cognito, não no DynamoDB');
  return createdUsers;
}

/**
 * Cria categorias hierárquicas reais
 */
async function seedCategories() {
  console.log('\n📂 Criando categorias...');
  
  // CATEGORIAS PRINCIPAIS
  const tecnologia = {
    id: nanoid(),
    name: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Artigos sobre desenvolvimento, programação e inovação tecnológica',
    color: '#3498DB',
    icon: 'code',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/tecnologia-cover.jpg',
    order: 1,
    metaDescription: 'Explore os últimos avanços em tecnologia, desenvolvimento de software e inovação digital.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const design = {
    id: nanoid(),
    name: 'Design',
    slug: 'design',
    description: 'UX/UI Design, Design Systems e tendências visuais',
    color: '#E74C3C',
    icon: 'palette',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/design-cover.jpg',
    order: 2,
    metaDescription: 'Descubra as melhores práticas em UX/UI Design e design de interfaces modernas.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const carreira = {
    id: nanoid(),
    name: 'Carreira',
    slug: 'carreira',
    description: 'Desenvolvimento profissional, produtividade e crescimento na carreira tech',
    color: '#2ECC71',
    icon: 'briefcase',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/carreira-cover.jpg',
    order: 3,
    metaDescription: 'Dicas e estratégias para acelerar sua carreira em tecnologia.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Salvar categorias principais
  await docClient.send(new PutCommand({ TableName: TABLES.CATEGORIES, Item: tecnologia }));
  await docClient.send(new PutCommand({ TableName: TABLES.CATEGORIES, Item: design }));
  await docClient.send(new PutCommand({ TableName: TABLES.CATEGORIES, Item: carreira }));
  
  console.log('   ✅ Tecnologia (categoria principal)');
  console.log('   ✅ Design (categoria principal)');
  console.log('   ✅ Carreira (categoria principal)');

  // SUBCATEGORIAS DE TECNOLOGIA
  const frontend = {
    id: nanoid(),
    name: 'Frontend',
    slug: 'frontend',
    description: 'React, Next.js, Vue, Angular e tecnologias frontend modernas',
    color: '#61DAFB',
    icon: 'monitor',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/frontend-cover.jpg',
    parentId: tecnologia.id,
    order: 1,
    metaDescription: 'Aprenda as melhores práticas em desenvolvimento frontend com React, Next.js e mais.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const backend = {
    id: nanoid(),
    name: 'Backend',
    slug: 'backend',
    description: 'Node.js, NestJS, APIs REST, GraphQL e arquitetura de sistemas',
    color: '#68A063',
    icon: 'server',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/backend-cover.jpg',
    parentId: tecnologia.id,
    order: 2,
    metaDescription: 'Domine o desenvolvimento backend com Node.js, APIs e arquitetura escalável.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const devops = {
    id: nanoid(),
    name: 'DevOps',
    slug: 'devops',
    description: 'CI/CD, Docker, Kubernetes, AWS e infraestrutura como código',
    color: '#FF6B35',
    icon: 'cloud',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/devops-cover.jpg',
    parentId: tecnologia.id,
    order: 3,
    metaDescription: 'Automatize deploys e gerencie infraestrutura com as melhores práticas DevOps.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
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
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/uxui-cover.jpg',
    parentId: design.id,
    order: 1,
    metaDescription: 'Crie experiências digitais excepcionais com princípios de UX/UI Design.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const designSystems = {
    id: nanoid(),
    name: 'Design Systems',
    slug: 'design-systems',
    description: 'Criação e manutenção de sistemas de design escaláveis',
    color: '#E67E22',
    icon: 'grid',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/design-systems-cover.jpg',
    parentId: design.id,
    order: 2,
    metaDescription: 'Construa design systems robustos e escaláveis para produtos digitais.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // SUBCATEGORIAS DE CARREIRA
  const produtividade = {
    id: nanoid(),
    name: 'Produtividade',
    slug: 'produtividade',
    description: 'Técnicas, ferramentas e metodologias para máxima produtividade',
    color: '#1ABC9C',
    icon: 'zap',
    coverImage: 'https://res.cloudinary.com/rainersoft/image/upload/v1/categories/produtividade-cover.jpg',
    parentId: carreira.id,
    order: 1,
    metaDescription: 'Aumente sua produtividade com técnicas e ferramentas comprovadas.',
    isActive: true,
    postsCount: 0,
    createdAt: new Date('2020-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Salvar subcategorias
  const subcategories = [frontend, backend, devops, uxui, designSystems, produtividade];
  for (const subcategory of subcategories) {
    await docClient.send(new PutCommand({ TableName: TABLES.CATEGORIES, Item: subcategory }));
    console.log(`   ✅ ${subcategory.name} (subcategoria)`);
  }

  return {
    tecnologia,
    design,
    carreira,
    frontend,
    backend,
    devops,
    uxui,
    designSystems,
    produtividade,
  };
}

/**
 * Cria posts reais e profissionais
 */
async function seedPosts(users: any[], categories: any) {
  console.log('\n📝 Criando posts...');
  
  const posts = [
    // Posts de Frontend por Rainer
    {
      id: nanoid(),
      title: 'React 19: Revolucionando o Desenvolvimento Frontend',
      slug: 'react-19-revolucionando-desenvolvimento-frontend',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'React 19 chegou com mudanças que vão transformar completamente a forma como desenvolvemos aplicações frontend. Neste artigo detalhado, exploramos as principais novidades como React Compiler, Server Components aprimorados, Actions nativas, e o novo hook use(). Descubra como essas features podem aumentar drasticamente a performance das suas aplicações e simplificar o desenvolvimento.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'React Compiler: Otimização Automática' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'O React Compiler é uma das maiores inovações do React 19. Ele analisa seu código automaticamente e aplica otimizações que antes precisavam ser feitas manualmente com useMemo, useCallback e React.memo.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.frontend.id,
      authorId: users[0].cognitoSub, // Rainer
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      pinned: true,
      priority: 1,
      publishedAt: new Date('2024-12-01').toISOString(),
      createdAt: new Date('2024-11-25').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 2847,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
    {
      id: nanoid(),
      title: 'Next.js 15: App Router e Server Actions na Prática',
      slug: 'nextjs-15-app-router-server-actions-pratica',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Next.js 15 consolidou o App Router como o futuro do framework, trazendo Server Actions estáveis e performance incomparável. Neste tutorial hands-on, construímos uma aplicação completa do zero, explorando Server Components, Client Components, streaming, caching inteligente e as melhores práticas para aplicações em produção.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.frontend.id,
      authorId: users[0].cognitoSub,
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      publishedAt: new Date('2024-11-20').toISOString(),
      createdAt: new Date('2024-11-15').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1923,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
    // Posts de Backend por Rainer
    {
      id: nanoid(),
      title: 'NestJS: Arquitetura Enterprise com DDD e Clean Architecture',
      slug: 'nestjs-arquitetura-enterprise-ddd-clean-architecture',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'NestJS é a escolha ideal para aplicações Node.js de nível enterprise. Neste guia completo, implementamos uma arquitetura robusta usando Domain-Driven Design (DDD), Clean Architecture, CQRS, Event Sourcing e microservices. Aprenda a estruturar aplicações que escalam para milhões de usuários mantendo código limpo e testável.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.backend.id,
      authorId: users[0].cognitoSub,
      status: 'PUBLISHED',
      featured: false,
      allowComments: true,
      publishedAt: new Date('2024-11-15').toISOString(),
      createdAt: new Date('2024-11-10').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1456,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
    {
      id: nanoid(),
      title: 'AWS Lambda + DynamoDB: Serverless na Prática',
      slug: 'aws-lambda-dynamodb-serverless-pratica',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Serverless é o futuro da computação em nuvem. Neste projeto prático, construímos uma API completa usando AWS Lambda, DynamoDB, API Gateway e Cognito. Exploramos patterns avançados como single-table design, optimistic locking, event-driven architecture e monitoramento com CloudWatch. Inclui código completo e deploy automatizado.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.devops.id,
      authorId: users[0].cognitoSub,
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      publishedAt: new Date('2024-11-10').toISOString(),
      createdAt: new Date('2024-11-05').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 2134,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
    // Posts de Design por Ana
    {
      id: nanoid(),
      title: 'Design Systems: Da Teoria à Implementação com Figma e Storybook',
      slug: 'design-systems-teoria-implementacao-figma-storybook',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Design Systems são essenciais para produtos digitais escaláveis. Neste guia completo, criamos um design system do zero usando Figma para design e Storybook para documentação. Abordamos tokens de design, componentes atômicos, variantes, documentação interativa e integração com desenvolvimento. Inclui templates e exemplos reais.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.designSystems.id,
      authorId: users[3].cognitoSub, // Ana
      status: 'PUBLISHED',
      featured: true,
      allowComments: true,
      publishedAt: new Date('2024-11-08').toISOString(),
      createdAt: new Date('2024-11-03').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1789,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
    {
      id: nanoid(),
      title: 'UX Research: Métodos Práticos para Produtos Digitais',
      slug: 'ux-research-metodos-praticos-produtos-digitais',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'UX Research é fundamental para criar produtos que realmente resolvem problemas dos usuários. Neste artigo prático, exploramos métodos quantitativos e qualitativos: entrevistas, surveys, testes de usabilidade, card sorting, tree testing e analytics. Aprenda a planejar, executar e apresentar pesquisas que impactam decisões de produto.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.uxui.id,
      authorId: users[3].cognitoSub,
      status: 'PUBLISHED',
      featured: false,
      allowComments: true,
      publishedAt: new Date('2024-11-05').toISOString(),
      createdAt: new Date('2024-10-30').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1234,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
    // Posts de Carreira
    {
      id: nanoid(),
      title: 'Carreira Tech: Do Júnior ao Senior em 3 Anos',
      slug: 'carreira-tech-junior-senior-3-anos',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Acelerar a carreira em tecnologia requer estratégia, dedicação e as escolhas certas. Neste guia baseado em experiência real, compartilho o roadmap completo que me levou de desenvolvedor júnior a senior em 3 anos. Inclui skills técnicas, soft skills, networking, projetos pessoais, contribuições open source e negociação salarial.',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.produtividade.id,
      authorId: users[0].cognitoSub,
      status: 'PUBLISHED',
      featured: false,
      allowComments: true,
      publishedAt: new Date('2024-11-03').toISOString(),
      createdAt: new Date('2024-10-28').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 3456,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
    // Post em rascunho
    {
      id: nanoid(),
      title: 'TypeScript 5.5: Novidades e Melhores Práticas',
      slug: 'typescript-55-novidades-melhores-praticas',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'TypeScript 5.5 trouxe melhorias significativas em performance, type inference e developer experience. Neste artigo, exploramos as principais novidades como...',
              },
            ],
          },
        ],
      },
      subcategoryId: categories.frontend.id,
      authorId: users[0].cognitoSub,
      status: 'DRAFT',
      featured: false,
      allowComments: true,
      createdAt: new Date('2024-11-28').toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
    },
  ];

  const createdPosts = [];
  for (const postData of posts) {
    await docClient.send(new PutCommand({
      TableName: TABLES.POSTS,
      Item: postData,
    }));
    
    createdPosts.push(postData);
    console.log(`   ✅ "${postData.title}" (${postData.status})`);
  }

  // Atualizar contadores nas categorias
  const publishedPosts = createdPosts.filter(p => p.status === 'PUBLISHED');
  
  // Contar posts por subcategoria
  const frontendPosts = publishedPosts.filter(p => p.subcategoryId === categories.frontend.id).length;
  const backendPosts = publishedPosts.filter(p => p.subcategoryId === categories.backend.id).length;
  const devopsPosts = publishedPosts.filter(p => p.subcategoryId === categories.devops.id).length;
  const uxuiPosts = publishedPosts.filter(p => p.subcategoryId === categories.uxui.id).length;
  const designSystemsPosts = publishedPosts.filter(p => p.subcategoryId === categories.designSystems.id).length;
  const produtividadePosts = publishedPosts.filter(p => p.subcategoryId === categories.produtividade.id).length;

  // Atualizar subcategorias
  if (frontendPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.frontend, postsCount: frontendPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (backendPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.backend, postsCount: backendPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (devopsPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.devops, postsCount: devopsPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (uxuiPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.uxui, postsCount: uxuiPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (designSystemsPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.designSystems, postsCount: designSystemsPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (produtividadePosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.produtividade, postsCount: produtividadePosts, updatedAt: new Date().toISOString() },
    }));
  }

  // Atualizar categorias principais
  const tecnologiaPosts = frontendPosts + backendPosts + devopsPosts;
  const designPosts = uxuiPosts + designSystemsPosts;
  const carreiraPosts = produtividadePosts;

  if (tecnologiaPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.tecnologia, postsCount: tecnologiaPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (designPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.design, postsCount: designPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (carreiraPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: { ...categories.carreira, postsCount: carreiraPosts, updatedAt: new Date().toISOString() },
    }));
  }

  // Atualizar contador de posts dos autores
  const rainerPosts = publishedPosts.filter(p => p.authorId === users[0].cognitoSub).length;
  const anaPosts = publishedPosts.filter(p => p.authorId === users[3].cognitoSub).length;

  if (rainerPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: { ...users[0], postsCount: rainerPosts, updatedAt: new Date().toISOString() },
    }));
  }
  if (anaPosts > 0) {
    await docClient.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: { ...users[3], postsCount: anaPosts, updatedAt: new Date().toISOString() },
    }));
  }

  return createdPosts;
}

/**
 * Cria comentários realistas
 */
async function seedComments(users: any[], posts: any[]) {
  console.log('\n💬 Criando comentários...');
  
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
  
  const comments = [
    // Comentários no post de React 19
    {
      id: nanoid(),
      content: 'Excelente artigo, Rainer! O React Compiler realmente vai mudar o jogo. Já testei na versão beta e a diferença de performance é impressionante. Mal posso esperar para usar em produção.',
      authorId: users[2].cognitoSub, // João
      postId: publishedPosts[0].id,
      parentId: null,
      isApproved: true,
      createdAt: new Date('2024-12-02').toISOString(),
      updatedAt: new Date('2024-12-02').toISOString(),
    },
    {
      id: nanoid(),
      content: 'Obrigado João! Realmente é uma revolução. O que mais me impressiona é como o compiler consegue otimizar código que nem imaginávamos que poderia ser melhorado. Vale muito a pena migrar.',
      authorId: users[0].cognitoSub, // Rainer respondendo
      postId: publishedPosts[0].id,
      parentId: null, // Seria o ID do comentário anterior, mas simplificando
      isApproved: true,
      createdAt: new Date('2024-12-02').toISOString(),
      updatedAt: new Date('2024-12-02').toISOString(),
    },
    // Comentário no post de Next.js
    {
      id: nanoid(),
      content: 'Tutorial fantástico! Server Actions realmente simplificam muito o desenvolvimento. Não preciso mais criar rotas de API separadas para tudo. Isso economiza muito tempo.',
      authorId: users[3].cognitoSub, // Ana
      postId: publishedPosts[1].id,
      parentId: null,
      isApproved: true,
      createdAt: new Date('2024-11-21').toISOString(),
      updatedAt: new Date('2024-11-21').toISOString(),
    },
    // Comentário no post de NestJS
    {
      id: nanoid(),
      content: 'Implementação muito sólida! Estou aplicando esses conceitos de DDD no meu projeto atual. A separação de responsabilidades fica muito mais clara com essa arquitetura.',
      authorId: users[4].cognitoSub, // Carlos
      postId: publishedPosts[2].id,
      parentId: null,
      isApproved: true,
      createdAt: new Date('2024-11-16').toISOString(),
      updatedAt: new Date('2024-11-16').toISOString(),
    },
    // Comentário no post de Design Systems
    {
      id: nanoid(),
      content: 'Ana, seu trabalho com design systems é inspirador! A integração entre Figma e Storybook que você mostrou vai revolucionar nosso workflow de design-dev.',
      authorId: users[2].cognitoSub, // João
      postId: publishedPosts[4].id,
      parentId: null,
      isApproved: true,
      createdAt: new Date('2024-11-09').toISOString(),
      updatedAt: new Date('2024-11-09').toISOString(),
    },
  ];

  const createdComments = [];
  for (const commentData of comments) {
    await docClient.send(new PutCommand({
      TableName: TABLES.COMMENTS,
      Item: commentData,
    }));
    
    createdComments.push(commentData);
  }
  
  console.log(`   ✅ ${createdComments.length} comentários criados`);

  // Atualizar contadores nos posts
  const commentCounts = {};
  createdComments.forEach(comment => {
    commentCounts[comment.postId] = (commentCounts[comment.postId] || 0) + 1;
  });

  for (const [postId, count] of Object.entries(commentCounts)) {
    const post = posts.find(p => p.id === postId);
    if (post) {
      await docClient.send(new PutCommand({
        TableName: TABLES.POSTS,
        Item: { ...post, commentsCount: count, updatedAt: new Date().toISOString() },
      }));
    }
  }

  // Atualizar contador de comentários dos usuários
  const userCommentCounts = {};
  createdComments.forEach(comment => {
    userCommentCounts[comment.authorId] = (userCommentCounts[comment.authorId] || 0) + 1;
  });

  for (const [userId, count] of Object.entries(userCommentCounts)) {
    const user = users.find(u => u.cognitoSub === userId);
    if (user) {
      await docClient.send(new PutCommand({
        TableName: TABLES.USERS,
        Item: { ...user, commentsCount: count, updatedAt: new Date().toISOString() },
      }));
    }
  }

  return createdComments;
}

/**
 * Cria likes realistas
 */
async function seedLikes(users: any[], posts: any[]) {
  console.log('\n❤️  Criando likes...');
  
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
  
  const likes = [
    // Likes no post de React 19 (mais popular)
    { id: nanoid(), userId: users[1].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-01').toISOString() },
    { id: nanoid(), userId: users[2].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-01').toISOString() },
    { id: nanoid(), userId: users[3].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-01').toISOString() },
    { id: nanoid(), userId: users[4].cognitoSub, postId: publishedPosts[0].id, createdAt: new Date('2024-12-02').toISOString() },
    
    // Likes no post de Next.js
    { id: nanoid(), userId: users[2].cognitoSub, postId: publishedPosts[1].id, createdAt: new Date('2024-11-20').toISOString() },
    { id: nanoid(), userId: users[3].cognitoSub, postId: publishedPosts[1].id, createdAt: new Date('2024-11-21').toISOString() },
    { id: nanoid(), userId: users[4].cognitoSub, postId: publishedPosts[1].id, createdAt: new Date('2024-11-21').toISOString() },
    
    // Likes no post de AWS Lambda
    { id: nanoid(), userId: users[1].cognitoSub, postId: publishedPosts[3].id, createdAt: new Date('2024-11-10').toISOString() },
    { id: nanoid(), userId: users[2].cognitoSub, postId: publishedPosts[3].id, createdAt: new Date('2024-11-11').toISOString() },
    
    // Likes no post de Design Systems
    { id: nanoid(), userId: users[0].cognitoSub, postId: publishedPosts[4].id, createdAt: new Date('2024-11-08').toISOString() },
    { id: nanoid(), userId: users[2].cognitoSub, postId: publishedPosts[4].id, createdAt: new Date('2024-11-09').toISOString() },
    
    // Likes no post de Carreira
    { id: nanoid(), userId: users[2].cognitoSub, postId: publishedPosts[6].id, createdAt: new Date('2024-11-03').toISOString() },
    { id: nanoid(), userId: users[3].cognitoSub, postId: publishedPosts[6].id, createdAt: new Date('2024-11-04').toISOString() },
    { id: nanoid(), userId: users[4].cognitoSub, postId: publishedPosts[6].id, createdAt: new Date('2024-11-04').toISOString() },
  ];

  for (const likeData of likes) {
    await docClient.send(new PutCommand({
      TableName: TABLES.LIKES,
      Item: likeData,
    }));
  }
  
  console.log(`   ✅ ${likes.length} likes criados`);

  // Atualizar contadores nos posts
  const likeCounts = {};
  likes.forEach(like => {
    likeCounts[like.postId] = (likeCounts[like.postId] || 0) + 1;
  });

  for (const [postId, count] of Object.entries(likeCounts)) {
    const post = posts.find(p => p.id === postId);
    if (post) {
      await docClient.send(new PutCommand({
        TableName: TABLES.POSTS,
        Item: { ...post, likesCount: count, updatedAt: new Date().toISOString() },
      }));
    }
  }

  return likes;
}

/**
 * Cria bookmarks realistas
 */
async function seedBookmarks(users: any[], posts: any[]) {
  console.log('\n🔖 Criando bookmarks...');
  
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
  
  const bookmarks = [
    // Carlos salvou posts técnicos
    {
      id: nanoid(),
      userId: users[4].cognitoSub,
      postId: publishedPosts[0].id, // React 19
      collection: 'Estudar Depois',
      notes: 'Preciso estudar o React Compiler com mais detalhes',
      createdAt: new Date('2024-12-01').toISOString(),
      updatedAt: new Date('2024-12-01').toISOString(),
    },
    {
      id: nanoid(),
      userId: users[4].cognitoSub,
      postId: publishedPosts[2].id, // NestJS
      collection: 'Arquitetura',
      notes: 'Implementar DDD no projeto atual',
      createdAt: new Date('2024-11-15').toISOString(),
      updatedAt: new Date('2024-11-15').toISOString(),
    },
    
    // João salvou posts de referência
    {
      id: nanoid(),
      userId: users[2].cognitoSub,
      postId: publishedPosts[1].id, // Next.js
      collection: 'Favoritos',
      notes: 'Melhor tutorial de Server Actions que já vi',
      createdAt: new Date('2024-11-20').toISOString(),
      updatedAt: new Date('2024-11-20').toISOString(),
    },
    {
      id: nanoid(),
      userId: users[2].cognitoSub,
      postId: publishedPosts[4].id, // Design Systems
      collection: 'Design',
      notes: 'Para mostrar para o time de design',
      createdAt: new Date('2024-11-08').toISOString(),
      updatedAt: new Date('2024-11-08').toISOString(),
    },
    
    // Ana salvou posts técnicos
    {
      id: nanoid(),
      userId: users[3].cognitoSub,
      postId: publishedPosts[3].id, // AWS Lambda
      collection: 'Aprender Backend',
      notes: 'Quero entender melhor serverless',
      createdAt: new Date('2024-11-10').toISOString(),
      updatedAt: new Date('2024-11-10').toISOString(),
    },
  ];

  for (const bookmarkData of bookmarks) {
    await docClient.send(new PutCommand({
      TableName: TABLES.BOOKMARKS,
      Item: bookmarkData,
    }));
  }
  
  console.log(`   ✅ ${bookmarks.length} bookmarks criados`);

  // Atualizar contadores nos posts
  const bookmarkCounts = {};
  bookmarks.forEach(bookmark => {
    bookmarkCounts[bookmark.postId] = (bookmarkCounts[bookmark.postId] || 0) + 1;
  });

  for (const [postId, count] of Object.entries(bookmarkCounts)) {
    const post = posts.find(p => p.id === postId);
    if (post) {
      await docClient.send(new PutCommand({
        TableName: TABLES.POSTS,
        Item: { ...post, bookmarksCount: count, updatedAt: new Date().toISOString() },
      }));
    }
  }

  return bookmarks;
}

/**
 * Cria notificações realistas
 */
async function seedNotifications(users: any[], posts: any[]) {
  console.log('\n🔔 Criando notificações...');
  
  const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
  
  const notifications = [
    // Notificações para Rainer (autor principal)
    {
      id: nanoid(),
      type: 'NEW_COMMENT',
      title: 'Novo Comentário',
      message: 'João Santos comentou no seu post "React 19: Revolucionando o Desenvolvimento Frontend"',
      link: `/blog/${publishedPosts[0].slug}`,
      userId: users[0].cognitoSub,
      isRead: false,
      metadata: {
        postId: publishedPosts[0].id,
        commentAuthor: 'João Santos',
        postTitle: publishedPosts[0].title,
      },
      createdAt: new Date('2024-12-02').toISOString(),
      updatedAt: new Date('2024-12-02').toISOString(),
    },
    {
      id: nanoid(),
      type: 'NEW_LIKE',
      title: 'Novo Like',
      message: 'Ana Costa curtiu seu post "Next.js 15: App Router e Server Actions na Prática"',
      link: `/blog/${publishedPosts[1].slug}`,
      userId: users[0].cognitoSub,
      isRead: true,
      readAt: new Date('2024-11-21').toISOString(),
      metadata: {
        postId: publishedPosts[1].id,
        likeAuthor: 'Ana Costa',
        postTitle: publishedPosts[1].title,
      },
      createdAt: new Date('2024-11-21').toISOString(),
      updatedAt: new Date('2024-11-21').toISOString(),
    },
    {
      id: nanoid(),
      type: 'POST_PUBLISHED',
      title: 'Post Publicado',
      message: 'Seu post "AWS Lambda + DynamoDB: Serverless na Prática" foi publicado com sucesso!',
      link: `/blog/${publishedPosts[3].slug}`,
      userId: users[0].cognitoSub,
      isRead: true,
      readAt: new Date('2024-11-10').toISOString(),
      createdAt: new Date('2024-11-10').toISOString(),
      updatedAt: new Date('2024-11-10').toISOString(),
    },
    
    // Notificações para Ana
    {
      id: nanoid(),
      type: 'NEW_COMMENT',
      title: 'Novo Comentário',
      message: 'João Santos comentou no seu post "Design Systems: Da Teoria à Implementação"',
      link: `/blog/${publishedPosts[4].slug}`,
      userId: users[3].cognitoSub,
      isRead: false,
      metadata: {
        postId: publishedPosts[4].id,
        commentAuthor: 'João Santos',
        postTitle: publishedPosts[4].title,
      },
      createdAt: new Date('2024-11-09').toISOString(),
      updatedAt: new Date('2024-11-09').toISOString(),
    },
    
    // Notificações do sistema para novos usuários
    {
      id: nanoid(),
      type: 'SYSTEM',
      title: 'Bem-vindo ao Rainer Soft Blog!',
      message: 'Obrigado por se cadastrar! Explore nossos artigos sobre tecnologia, design e carreira. Não se esqueça de deixar seus comentários e interagir com a comunidade.',
      userId: users[4].cognitoSub, // Carlos
      isRead: false,
      createdAt: new Date('2023-05-20').toISOString(),
      updatedAt: new Date('2023-05-20').toISOString(),
    },
  ];

  for (const notificationData of notifications) {
    await docClient.send(new PutCommand({
      TableName: TABLES.NOTIFICATIONS,
      Item: notificationData,
    }));
  }
  
  console.log(`   ✅ ${notifications.length} notificações criadas`);

  return notifications;
}

/**
 * Função principal de seed
 */
async function main() {
  console.log('\n🌱 Iniciando seed do DynamoDB com dados reais...\n');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log(`  🗄️  POPULANDO ${environment.toUpperCase()}`);
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  console.log(`🌍 Ambiente: ${environment}`);
  console.log(`🔗 Endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS Cloud (padrão)'}`);
  console.log(`📊 Nome base das tabelas: ${config.database.tableName}`);
  console.log(`🌎 Região: ${config.aws.region}\n`);

  try {
    // Limpar banco
    await cleanup();

    // Criar dados reais
    const users = await seedUsers();
    const categories = await seedCategories();
    const posts = await seedPosts(users, categories);
    const comments = await seedComments(users, posts);
    const likes = await seedLikes(users, posts);
    const bookmarks = await seedBookmarks(users, posts);
    const notifications = await seedNotifications(users, posts);

    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log('  ✅ SEED CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');
    
    const publishedPosts = posts.filter(p => p.status === 'PUBLISHED');
    const draftPosts = posts.filter(p => p.status === 'DRAFT');
    const approvedComments = comments.filter(c => c.isApproved);
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    console.log('📊 Resumo dos dados criados:');
    console.log(`   • ${users.length} usuários (1 admin, 1 editor, 2 autores, 1 subscriber)`);
    console.log(`   • 9 categorias (3 principais + 6 subcategorias)`);
    console.log(`   • ${posts.length} posts (${publishedPosts.length} publicados, ${draftPosts.length} rascunho)`);
    console.log(`   • ${comments.length} comentários (${approvedComments.length} aprovados)`);
    console.log(`   • ${likes.length} likes`);
    console.log(`   • ${bookmarks.length} bookmarks`);
    console.log(`   • ${notifications.length} notificações (${unreadNotifications.length} não lidas)`);
    
    console.log('\n🎯 Dados destacados:');
    console.log('   • Usuário admin: Rainer Teixeira (cognitoSub real)');
    console.log('   • Posts com conteúdo profissional e realista');
    console.log('   • Categorias: Tecnologia, Design, Carreira');
    console.log('   • Subcategorias: Frontend, Backend, DevOps, UX/UI, Design Systems, Produtividade');
    console.log('   • Views realistas nos posts (1K-3K)');
    console.log('   • Comentários e interações orgânicas');
    
    console.log('\n💡 Próximos passos:');
    console.log('   • Execute: npm run dev (iniciar servidor)');
    console.log('   • Acesse: http://localhost:4000/docs (Swagger)');
    console.log('   • Teste: GET /health (verificar status)');
    console.log('   • Login: Use o usuário aoline no Cognito');
    
    console.log('\n🎉 Banco de dados populado e pronto para produção!\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao popular banco:', error);
    throw error;
  }
}

// Executar seed
main()
  .then(() => {
    console.log('✅ Script concluído com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });