/**
 * Testes E2E: Funcionalidades Avançadas
 * 
 * Testa funcionalidades avançadas e casos de uso complexos através da API HTTP.
 * Valida integrações complexas entre módulos.
 * 
 * Minimiza mocks - usa apenas para serviços externos.
 */

import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CloudinaryService } from '../../src/modules/cloudinary/cloudinary.service';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../helpers/database-test-helper';

describe('E2E - Funcionalidades Avançadas', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let module: TestingModule;

  beforeAll(async () => {
    // Criar módulo com banco real - apenas mock do Cloudinary
    module = await createDatabaseTestModule({
      imports: [AppModule],
      providers: [
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn().mockResolvedValue({ url: 'http://example.com/image.jpg' }),
            deleteImage: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    });

    app = module.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('Fluxo de Likes e Bookmarks', () => {
    it('deve criar post, dar like e bookmark, validar no banco', async () => {
      // 1. Criar usuário
      const userRes = await request(server)
        .post('/users')
        .send({
          fullName: 'User',
          cognitoSub: `cognito-${Date.now()}`,
        })
        .expect(201);

      const userId = userRes.body.data.cognitoSub;

      // 2. Criar categoria e post
      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Tech',
          slug: `tech-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Dev',
          slug: `dev-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      const postRes = await request(server)
        .post('/posts')
        .send({
          title: 'Post',
          slug: `post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: userId,
          subcategoryId: subcategoryRes.body.data.id,
          status: 'PUBLISHED',
        })
        .expect(201);

      const postId = postRes.body.data.id;

      // 3. Dar like
      await request(server)
        .post('/likes')
        .send({
          userId: userId,
          postId: postId,
        })
        .expect(201);

      // 4. Criar bookmark
      await request(server)
        .post('/bookmarks')
        .send({
          userId: userId,
          postId: postId,
        })
        .expect(201);

      // 5. Verificar no banco
      const postInDb = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          likes: true,
          bookmarks: true,
        },
      });

      expect(postInDb?.likes.length).toBeGreaterThanOrEqual(1);
      expect(postInDb?.bookmarks.length).toBeGreaterThanOrEqual(1);
      expect(postInDb?.likesCount).toBeGreaterThan(0);
      expect(postInDb?.bookmarksCount).toBeGreaterThan(0);
    });
  });

  describe('Fluxo de Notificações', () => {
    it('deve criar notificações e marcar como lidas', async () => {
      const userRes = await request(server)
        .post('/users')
        .send({
          fullName: 'User',
          cognitoSub: `cognito-${Date.now()}`,
        })
        .expect(201);

      const userId = userRes.body.data.cognitoSub;

      // Criar notificação via banco (não há endpoint público)
      const notification = await prisma.notification.create({
        data: {
          userId: userId,
          type: 'NEW_COMMENT',
          title: 'Novo comentário',
          message: 'Alguém comentou no seu post',
        },
      });

      // Buscar notificações do usuário (assumindo que há endpoint)
      // Como não há endpoint público, validamos diretamente no banco
      const notificationsInDb = await prisma.notification.findMany({
        where: { userId: userId },
      });

      expect(notificationsInDb.length).toBeGreaterThanOrEqual(1);
      expect(notificationsInDb[0].isRead).toBe(false);

      // Marcar como lida
      await prisma.notification.update({
        where: { id: notification.id },
        data: { isRead: true, readAt: new Date() },
      });

      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification.id },
      });

      expect(updatedNotification?.isRead).toBe(true);
      expect(updatedNotification?.readAt).not.toBeNull();
    });
  });

  describe('Fluxo de Busca e Filtros', () => {
    it('deve buscar posts com múltiplos filtros', async () => {
      // Setup
      const userRes = await request(server)
        .post('/users')
        .send({
          fullName: 'Author',
          cognitoSub: `cognito-${Date.now()}`,
        })
        .expect(201);

      const userId = userRes.body.data.cognitoSub;

      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Tech',
          slug: `tech-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Dev',
          slug: `dev-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      const subcategoryId = subcategoryRes.body.data.id;

      // Criar posts publicados
      await request(server)
        .post('/posts')
        .send({
          title: 'Published Post 1',
          slug: `published-1-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: userId,
          subcategoryId: subcategoryId,
          status: 'PUBLISHED',
        })
        .expect(201);

      await request(server)
        .post('/posts')
        .send({
          title: 'Published Post 2',
          slug: `published-2-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: userId,
          subcategoryId: subcategoryId,
          status: 'PUBLISHED',
        })
        .expect(201);

      // Criar post em draft
      await request(server)
        .post('/posts')
        .send({
          title: 'Draft Post',
          slug: `draft-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: userId,
          subcategoryId: subcategoryId,
          status: 'DRAFT',
        })
        .expect(201);

      // Buscar apenas publicados
      const publishedRes = await request(server)
        .get('/posts')
        .query({ status: 'PUBLISHED' })
        .expect(200);

      expect(publishedRes.body.posts.length).toBeGreaterThanOrEqual(2);
      publishedRes.body.posts.forEach((post: any) => {
        expect(post.status).toBe('PUBLISHED');
      });

      // Buscar por subcategoria
      const subcategoryPostsRes = await request(server)
        .get('/posts')
        .query({ subcategoryId: subcategoryId })
        .expect(200);

      expect(subcategoryPostsRes.body.posts.length).toBeGreaterThanOrEqual(3);

      // Buscar por autor
      const authorRes = await request(server)
        .get('/posts')
        .query({ authorId: userId })
        .expect(200);

      expect(authorRes.body.posts.length).toBeGreaterThanOrEqual(3);
      authorRes.body.posts.forEach((post: any) => {
        expect(post.authorId).toBe(userId);
      });
    });
  });

  describe('Fluxo de Paginação', () => {
    it('deve paginar posts corretamente', async () => {
      // Setup
      const userRes = await request(server)
        .post('/users')
        .send({
          fullName: 'Author',
          cognitoSub: `cognito-${Date.now()}`,
        })
        .expect(201);

      const userId = userRes.body.data.cognitoSub;

      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Tech',
          slug: `tech-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Dev',
          slug: `dev-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      // Criar 5 posts
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/posts')
          .send({
            title: `Post ${i + 1}`,
            slug: `post-${i + 1}-${Date.now()}`,
            content: { type: 'doc', content: [] },
            authorId: userId,
            subcategoryId: subcategoryRes.body.data.id,
            status: 'PUBLISHED',
          })
          .expect(201);
      }

      // Primeira página (limite 2)
      const page1Res = await request(server)
        .get('/posts')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(page1Res.body.posts.length).toBeLessThanOrEqual(2);
      expect(page1Res.body.pagination.page).toBe(1);
      expect(page1Res.body.pagination.limit).toBe(2);
      expect(page1Res.body.pagination.total).toBeGreaterThanOrEqual(5);

      // Segunda página
      const page2Res = await request(server)
        .get('/posts')
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(page2Res.body.posts.length).toBeLessThanOrEqual(2);
      expect(page2Res.body.pagination.page).toBe(2);
    });
  });

  describe('Fluxo de Relacionamentos Complexos', () => {
    it('deve buscar post com todos os relacionamentos', async () => {
      // Setup completo
      const authorRes = await request(server)
        .post('/users')
        .send({
          fullName: 'Author',
          cognitoSub: `cognito-author-${Date.now()}`,
        })
        .expect(201);

      const commenterRes = await request(server)
        .post('/users')
        .send({
          fullName: 'Commenter',
          cognitoSub: `cognito-commenter-${Date.now()}`,
        })
        .expect(201);

      const authorId = authorRes.body.data.cognitoSub;
      const commenterId = commenterRes.body.data.cognitoSub;

      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Tech',
          slug: `tech-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Dev',
          slug: `dev-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      const postRes = await request(server)
        .post('/posts')
        .send({
          title: 'Complex Post',
          slug: `complex-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: authorId,
          subcategoryId: subcategoryRes.body.data.id,
          status: 'PUBLISHED',
        })
        .expect(201);

      const postId = postRes.body.data.id;

      // Criar comentário
      await request(server)
        .post('/comments')
        .send({
          content: 'Comment',
          authorId: commenterId,
          postId: postId,
        })
        .expect(201);

      // Dar like
      await request(server)
        .post('/likes')
        .send({
          userId: commenterId,
          postId: postId,
        })
        .expect(201);

      // Criar bookmark
      await request(server)
        .post('/bookmarks')
        .send({
          userId: commenterId,
          postId: postId,
        })
        .expect(201);

      // Buscar post com relacionamentos
      const postWithRelations = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: true,
          subcategory: {
            include: {
              parent: true,
            },
          },
          comments: {
            include: {
              author: true,
            },
          },
          likes: {
            include: {
              user: true,
            },
          },
          bookmarks: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(postWithRelations).not.toBeNull();
      
      // Verificar relacionamento com author
      if (postWithRelations?.author) {
        expect(postWithRelations.author.cognitoSub).toBe(authorId);
      } else {
        expect(postWithRelations?.authorId).toBe(authorId);
      }
      
      expect(postWithRelations?.subcategory.parent?.name).toBe('Tech');
      expect(postWithRelations?.comments.length).toBeGreaterThanOrEqual(1);
      
      // Verificar relacionamento com comentários
      if (postWithRelations?.comments && postWithRelations.comments.length > 0) {
        if (postWithRelations.comments[0].author) {
          expect(postWithRelations.comments[0].author.cognitoSub).toBe(commenterId);
        } else {
          expect(postWithRelations.comments[0].authorId).toBe(commenterId);
        }
      }
      expect(postWithRelations?.likes.length).toBeGreaterThanOrEqual(1);
      expect(postWithRelations?.bookmarks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Fluxo de Validações e Erros', () => {
    it('deve retornar erro 404 para recursos não encontrados', async () => {
      // Usar ObjectIds válidos mas que não existem no banco
      const validButNonExistentId = '507f1f77bcf86cd799439011';
      
      await request(server)
        .get(`/posts/${validButNonExistentId}`)
        .expect(404);

      await request(server)
        .get(`/users/${validButNonExistentId}`)
        .expect(404);

      await request(server)
        .get(`/categories/${validButNonExistentId}`)
        .expect(404);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      await request(server)
        .post('/posts')
        .send({
          // Dados incompletos
          title: 'Post',
        })
        .expect(400);

      await request(server)
        .post('/users')
        .send({
          // Dados incompletos
          fullName: 'User',
        })
        .expect(400);
    });

    it('deve retornar erro 409 para conflitos (duplicatas)', async () => {
      const userRes = await request(server)
        .post('/users')
        .send({
          fullName: 'User',
          cognitoSub: `cognito-${Date.now()}`,
        })
        .expect(201);

      const userId = userRes.body.data.cognitoSub;

      // Tentar criar usuário com mesmo cognitoSub
      await request(server)
        .post('/users')
        .send({
          fullName: 'Another User',
          cognitoSub: userId, // Mesmo cognitoSub
        })
        .expect(409);
    });
  });
});

