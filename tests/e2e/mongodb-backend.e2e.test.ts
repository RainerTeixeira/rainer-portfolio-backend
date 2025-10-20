/**
 * Testes End-to-End: Backend Completo com MongoDB
 * 
 * Valida o fluxo completo:
 * 1. Servidor NestJS inicia
 * 2. Conecta ao MongoDB
 * 3. Rotas funcionam
 * 4. CRUD completo funciona
 * 5. Swagger está acessível
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Backend E2E - MongoDB/Prisma', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let server: any;

  beforeAll(async () => {
    // Forçar uso do Prisma nos testes E2E
    process.env.DATABASE_PROVIDER = 'PRISMA';
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    
    // Configurar Swagger para os testes E2E
    const config = new DocumentBuilder()
      .setTitle('📝 Blog API - E2E Tests')
      .setDescription('API para testes E2E')
      .setVersion('4.0.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    
    prisma = app.get<PrismaService>(PrismaService);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Limpar banco antes de cada teste
    await prisma.notification.deleteMany({});
    await prisma.bookmark.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    
    // Deletar categorias: primeiro subcategorias (com parentId), depois principais
    await prisma.category.deleteMany({
      where: { parentId: { not: null } },
    });
    await prisma.category.deleteMany({
      where: { parentId: null },
    });
    
    await prisma.user.deleteMany({});
  });

  describe('🏥 Health Check', () => {
    it('GET /health - deve retornar status OK', () => {
      return request(server)
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('status', 'ok');
          expect(res.body.data).toHaveProperty('database');
        });
    });

    it('GET /health - deve confirmar conexão MongoDB', () => {
      return request(server)
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.database).toHaveProperty('provider', 'PRISMA');
        });
    });
  });

  describe('📚 Swagger Documentation', () => {
    it('GET /docs - deve retornar página Swagger', () => {
      return request(server)
        .get('/docs')
        .expect(200)
        .expect('Content-Type', /html/);
    });

    it('GET /docs-json - deve retornar OpenAPI JSON', () => {
      return request(server)
        .get('/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('openapi');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('paths');
        });
    });
  });

  describe('👥 Users CRUD', () => {
    it('POST /users - deve criar um usuário', () => {
      return request(server)
        .post('/users')
        .send({
          cognitoSub: 'e2e-cognito-001',
          email: 'e2e@example.com',
          username: 'e2euser',
          name: 'E2E User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.email).toBe('e2e@example.com');
        });
    });

    it('GET /users - deve listar usuários', async () => {
      // Criar usuário de teste
      await prisma.user.create({
        data: {
          cognitoSub: 'e2e-cognito-002',
          email: 'list@example.com',
          username: 'listuser',
          name: 'List User',
        },
      });

      return request(server)
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.users)).toBe(true);
          expect(res.body.users.length).toBeGreaterThan(0);
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('GET /users/:id - deve buscar usuário específico', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'e2e-cognito-003',
          email: 'find@example.com',
          username: 'finduser',
          name: 'Find User',
        },
      });

      return request(server)
        .get(`/users/${user.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data.id).toBe(user.id);
          expect(res.body.data.email).toBe('find@example.com');
        });
    });
  });

  describe('📁 Categories CRUD', () => {
    it('POST /categories - deve criar categoria', () => {
      return request(server)
        .post('/categories')
        .send({
          name: 'E2E Category',
          slug: 'e2e-category',
          description: 'Categoria de teste E2E',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe('E2E Category');
        });
    });

    it('GET /categories - deve listar categorias', async () => {
      await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: 'test-category',
        },
      });

      return request(server)
        .get('/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('📝 Posts CRUD', () => {
    it('POST /posts - deve criar post completo', async () => {
      // Setup: criar user e category
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'e2e-author-001',
          email: 'author-e2e@example.com',
          username: 'authore2e',
          name: 'Author E2E',
        },
      });

      const category = await prisma.category.create({
        data: {
          name: 'Tech',
          slug: 'tech',
        },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Backend',
          slug: 'backend',
          parentId: category.id,
        },
      });

      return request(server)
        .post('/posts')
        .send({
          title: 'Post E2E Test',
          slug: 'post-e2e-test',
          content: { type: 'doc', content: [] },
          authorId: user.id,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.title).toBe('Post E2E Test');
        });
    });

    it('GET /posts - deve listar posts publicados', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'e2e-author-002',
          email: 'author2-e2e@example.com',
          username: 'author2e2e',
          name: 'Author 2 E2E',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Cat', slug: 'cat' },
      });

      await prisma.post.create({
        data: {
          title: 'Published Post',
          slug: 'published-post',
          content: {},
          authorId: user.id,
          subcategoryId: category.id,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      return request(server)
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.posts)).toBe(true);
          expect(res.body).toHaveProperty('pagination');
        });
    });
  });

  describe('💬 Comments CRUD', () => {
    it('POST /comments - deve criar comentário', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'e2e-commenter-001',
          email: 'commenter-e2e@example.com',
          username: 'commentere2e',
          name: 'Commenter E2E',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Cat', slug: 'cat' },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post',
          slug: 'post',
          content: {},
          authorId: user.id,
          subcategoryId: category.id,
        },
      });

      return request(server)
        .post('/comments')
        .send({
          content: 'Comentário E2E',
          authorId: user.id,
          postId: post.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.content).toBe('Comentário E2E');
        });
    });
  });

  describe('❤️ Likes CRUD', () => {
    it('POST /likes - deve dar like em post', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'e2e-liker-001',
          email: 'liker-e2e@example.com',
          username: 'likere2e',
          name: 'Liker E2E',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Cat', slug: 'cat' },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post',
          slug: 'post',
          content: {},
          authorId: user.id,
          subcategoryId: category.id,
        },
      });

      return request(server)
        .post('/likes')
        .send({
          userId: user.id,
          postId: post.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('id');
        });
    });
  });

  describe('🔗 Fluxo Completo', () => {
    it('deve executar fluxo completo: User → Category → Post → Comment → Like', async () => {
      // 1. Criar usuário
      const userRes = await request(server)
        .post('/users')
        .send({
          cognitoSub: 'e2e-flow-001',
          email: 'flow@example.com',
          username: 'flowuser',
          name: 'Flow User',
        })
        .expect(201);

      const userId = userRes.body.data.id;

      // 2. Criar categoria
      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Flow Category',
          slug: 'flow-category',
        })
        .expect(201);

      const categoryId = categoryRes.body.data.id;

      // 3. Criar post
      const postRes = await request(server)
        .post('/posts')
        .send({
          title: 'Flow Post',
          slug: 'flow-post',
          content: {},
          authorId: userId,
          subcategoryId: categoryId,
          status: 'PUBLISHED',
        })
        .expect(201);

      const postId = postRes.body.data.id;

      // 4. Criar comentário
      await request(server)
        .post('/comments')
        .send({
          content: 'Flow Comment',
          authorId: userId,
          postId: postId,
        })
        .expect(201);

      // 5. Dar like
      await request(server)
        .post('/likes')
        .send({
          userId: userId,
          postId: postId,
        })
        .expect(201);

      // 6. Verificar post com relacionamentos
      const finalPost = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: true,
          comments: true,
          likes: true,
        },
      });

      expect(finalPost).not.toBeNull();
      expect(finalPost?.comments).toHaveLength(1);
      expect(finalPost?.likes).toHaveLength(1);
    });
  });
});

