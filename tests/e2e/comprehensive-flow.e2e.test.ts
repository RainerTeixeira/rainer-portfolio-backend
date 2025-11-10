/**
 * Testes E2E: Fluxos Completos e Abrangentes
 * 
 * Testa fluxos completos end-to-end através da API HTTP.
 * Valida integração completa entre todos os módulos.
 * 
 * Minimiza mocks - usa apenas para serviços externos (Cloudinary, Cognito).
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

describe('E2E - Fluxos Completos e Abrangentes', () => {
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

  describe('Fluxo Completo: User → Category → Post → Comment → Like → Bookmark', () => {
    it('deve executar fluxo completo através da API', async () => {
      // 1. Criar usuário
      const userRes = await request(server)
        .post('/users')
        .send({
          fullName: 'Test User E2E',
          cognitoSub: `cognito-e2e-${Date.now()}`,
        })
        .expect(201);

      const userId = userRes.body.data.cognitoSub;

      // 2. Criar categoria
      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Technology',
          slug: `tech-${Date.now()}`,
        })
        .expect(201);

      const categoryId = categoryRes.body.data.id;

      // 3. Criar subcategoria
      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Web Development',
          slug: `webdev-${Date.now()}`,
          parentId: categoryId,
        })
        .expect(201);

      const subcategoryId = subcategoryRes.body.data.id;

      // 4. Criar post
      const postRes = await request(server)
        .post('/posts')
        .send({
          title: 'E2E Test Post',
          slug: `e2e-post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: userId,
          subcategoryId: subcategoryId,
          status: 'PUBLISHED',
        })
        .expect(201);

      const postId = postRes.body.data.id;

      // 5. Criar comentário
      const commentRes = await request(server)
        .post('/comments')
        .send({
          content: 'Great post!',
          authorId: userId,
          postId: postId,
        })
        .expect(201);

      const commentId = commentRes.body.data.id;

      // 6. Dar like no post
      await request(server)
        .post('/likes')
        .send({
          userId: userId,
          postId: postId,
        })
        .expect(201);

      // 7. Criar bookmark
      await request(server)
        .post('/bookmarks')
        .send({
          userId: userId,
          postId: postId,
        })
        .expect(201);

      // 8. Verificar estado completo no banco
      const postInDb = await prisma.post.findUnique({
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

      expect(postInDb).not.toBeNull();
      
      // Verificar relacionamento com author
      if (postInDb?.author) {
        expect(postInDb.author.cognitoSub).toBe(userId);
      } else {
        expect(postInDb?.authorId).toBe(userId);
      }
      
      expect(postInDb?.subcategory.parent?.id).toBe(categoryId);
      expect(postInDb?.comments).toHaveLength(1);
      expect(postInDb?.comments[0].id).toBe(commentId);
      expect(postInDb?.likes).toHaveLength(1);
      expect(postInDb?.bookmarks).toHaveLength(1);

      // 9. Verificar contadores do usuário
      const userInDb = await prisma.user.findUnique({
        where: { cognitoSub: userId },
      });

      expect(userInDb?.postsCount).toBe(1);
      expect(userInDb?.commentsCount).toBe(1);
    });
  });

  describe('Fluxo de Múltiplos Posts e Interações', () => {
    it('deve criar múltiplos posts e interações', async () => {
      // Setup
      const authorCognitoSub = `cognito-author-${Date.now()}`;
      await request(server)
        .post('/users')
        .send({
          fullName: 'Multi Post Author',
          cognitoSub: authorCognitoSub,
        })
        .expect(201);

      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Cat',
          slug: `cat-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Sub',
          slug: `sub-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      const subcategoryId = subcategoryRes.body.data.id;

      // Criar 3 posts
      const posts = [];
      for (let i = 0; i < 3; i++) {
        const postRes = await request(server)
          .post('/posts')
          .send({
            title: `Post ${i + 1}`,
            slug: `post-${i + 1}-${Date.now()}`,
            content: { type: 'doc', content: [] },
            authorId: authorCognitoSub,
            subcategoryId: subcategoryId,
            status: 'PUBLISHED',
          })
          .expect(201);

        posts.push(postRes.body.data.id);
      }

      // Criar comentários em cada post
      for (const postId of posts) {
        await request(server)
          .post('/comments')
          .send({
            content: `Comment on post ${postId}`,
            authorId: authorCognitoSub,
            postId: postId,
          })
          .expect(201);
      }

      // Dar like em cada post
      for (const postId of posts) {
        await request(server)
          .post('/likes')
          .send({
            userId: authorCognitoSub,
            postId: postId,
          })
          .expect(201);
      }

      // Verificar no banco
      const userInDb = await prisma.user.findUnique({
        where: { cognitoSub: authorCognitoSub },
      });

      expect(userInDb?.postsCount).toBe(3);
      expect(userInDb?.commentsCount).toBe(3);

      const likesInDb = await prisma.like.findMany({
        where: { userId: authorCognitoSub },
      });
      expect(likesInDb.length).toBe(3);
    });
  });

  describe('Fluxo de Atualização e Edição', () => {
    it('deve atualizar post e comentário', async () => {
      // Setup
      const authorCognitoSub = `cognito-author-${Date.now()}`;
      await request(server)
        .post('/users')
        .send({
          fullName: 'Author',
          cognitoSub: authorCognitoSub,
        })
        .expect(201);

      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Cat',
          slug: `cat-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Sub',
          slug: `sub-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      const postRes = await request(server)
        .post('/posts')
        .send({
          title: 'Original Title',
          slug: `original-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: authorCognitoSub,
          subcategoryId: subcategoryRes.body.data.id,
          status: 'PUBLISHED',
        })
        .expect(201);

      const postId = postRes.body.data.id;

      // Atualizar post
      await request(server)
        .patch(`/posts/${postId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(200);

      // Criar e atualizar comentário
      const commentRes = await request(server)
        .post('/comments')
        .send({
          content: 'Original comment',
          authorId: authorCognitoSub,
          postId: postId,
        })
        .expect(201);

      await request(server)
        .patch(`/comments/${commentRes.body.data.id}`)
        .send({
          content: 'Updated comment',
        })
        .expect(200);

      // Verificar no banco
      const postInDb = await prisma.post.findUnique({
        where: { id: postId },
      });
      expect(postInDb?.title).toBe('Updated Title');

      const commentInDb = await prisma.comment.findUnique({
        where: { id: commentRes.body.data.id },
      });
      expect(commentInDb?.content).toBe('Updated comment');
      expect(commentInDb?.isEdited).toBe(true);
    });
  });

  describe('Fluxo de Publicação e Despublicação', () => {
    it('deve publicar e despublicar post', async () => {
      // Setup
      const authorCognitoSub = `cognito-author-${Date.now()}`;
      await request(server)
        .post('/users')
        .send({
          fullName: 'Author',
          cognitoSub: authorCognitoSub,
        })
        .expect(201);

      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Cat',
          slug: `cat-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Sub',
          slug: `sub-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      // Criar post como DRAFT
      const postRes = await request(server)
        .post('/posts')
        .send({
          title: 'Draft Post',
          slug: `draft-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: authorCognitoSub,
          subcategoryId: subcategoryRes.body.data.id,
          status: 'DRAFT',
        })
        .expect(201);

      const postId = postRes.body.data.id;

      // Verificar que está em DRAFT
      let postInDb = await prisma.post.findUnique({
        where: { id: postId },
      });
      expect(postInDb?.status).toBe('DRAFT');
      expect(postInDb?.publishedAt).toBeNull();

      // Publicar
      await request(server)
        .patch(`/posts/${postId}/publish`)
        .expect(200);

      postInDb = await prisma.post.findUnique({
        where: { id: postId },
      });
      expect(postInDb?.status).toBe('PUBLISHED');
      expect(postInDb?.publishedAt).not.toBeNull();

      // Despublicar
      await request(server)
        .patch(`/posts/${postId}/unpublish`)
        .expect(200);

      postInDb = await prisma.post.findUnique({
        where: { id: postId },
      });
      expect(postInDb?.status).toBe('DRAFT');
      expect(postInDb?.publishedAt).toBeNull();
    });
  });

  describe('Fluxo de Listagem e Filtros', () => {
    it('deve listar posts com filtros', async () => {
      // Setup
      const authorCognitoSub = `cognito-author-${Date.now()}`;
      await request(server)
        .post('/users')
        .send({
          fullName: 'Author',
          cognitoSub: authorCognitoSub,
        })
        .expect(201);

      const categoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Cat',
          slug: `cat-${Date.now()}`,
        })
        .expect(201);

      const subcategoryRes = await request(server)
        .post('/categories')
        .send({
          name: 'Sub',
          slug: `sub-${Date.now()}`,
          parentId: categoryRes.body.data.id,
        })
        .expect(201);

      const subcategoryId = subcategoryRes.body.data.id;

      // Criar posts publicados e em draft
      await request(server)
        .post('/posts')
        .send({
          title: 'Published 1',
          slug: `published-1-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: authorCognitoSub,
          subcategoryId: subcategoryId,
          status: 'PUBLISHED',
        })
        .expect(201);

      await request(server)
        .post('/posts')
        .send({
          title: 'Published 2',
          slug: `published-2-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: authorCognitoSub,
          subcategoryId: subcategoryId,
          status: 'PUBLISHED',
        })
        .expect(201);

      await request(server)
        .post('/posts')
        .send({
          title: 'Draft',
          slug: `draft-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: authorCognitoSub,
          subcategoryId: subcategoryId,
          status: 'DRAFT',
        })
        .expect(201);

      // Listar apenas publicados
      const publishedRes = await request(server)
        .get('/posts')
        .query({ status: 'PUBLISHED' })
        .expect(200);

      expect(publishedRes.body.success).toBe(true);
      expect(publishedRes.body.posts.length).toBeGreaterThanOrEqual(2);
      publishedRes.body.posts.forEach((post: any) => {
        expect(post.status).toBe('PUBLISHED');
      });

      // Listar por subcategoria
      const subcategoryPostsRes = await request(server)
        .get('/posts')
        .query({ subcategoryId: subcategoryId })
        .expect(200);

      expect(subcategoryPostsRes.body.posts.length).toBeGreaterThanOrEqual(3);
    });
  });
});

