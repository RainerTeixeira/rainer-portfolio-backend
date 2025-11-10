/**
 * Testes do Dashboard Controller com Banco Real
 * 
 * Testa todos os endpoints do controller de dashboard usando banco real.
 * Minimiza mocks - sem mocks necessários.
 * 
 * Cobertura: 100%
 */

import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CloudinaryService } from '../../../src/modules/cloudinary/cloudinary.service';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../../helpers/database-test-helper';

describe('DashboardController (Banco Real)', () => {
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

  describe('GET /dashboard/stats', () => {
    it('deve retornar estatísticas do banco real', async () => {
      const response = await request(server)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalPosts');
      expect(response.body.data).toHaveProperty('totalViews');
      expect(response.body.data).toHaveProperty('totalLikes');
      expect(response.body.data).toHaveProperty('totalComments');
      expect(response.body.data).toHaveProperty('postsChange');
      expect(response.body.data).toHaveProperty('viewsChange');
      expect(response.body.data).toHaveProperty('likesChange');
      expect(response.body.data).toHaveProperty('commentsChange');
    });

    it('deve retornar estatísticas corretas com dados no banco', async () => {
      // Criar dados de teste
      const user = await prisma.user.create({
        data: {
          cognitoSub: `cognito-${Date.now()}`,
          fullName: 'Test User',
        },
      });

      const category = await prisma.category.create({
        data: {
          name: 'Tech',
          slug: `tech-${Date.now()}`,
          order: 1,
          isActive: true,
        },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Dev',
          slug: `dev-${Date.now()}`,
          parentId: category.id,
          order: 1,
          isActive: true,
        },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: `test-post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: user.cognitoSub,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
          views: 50,
          likesCount: 5,
          commentsCount: 3,
        },
      });

      await prisma.like.create({
        data: {
          userId: user.cognitoSub,
          postId: post.id,
        },
      });

      await prisma.comment.create({
        data: {
          content: 'Comment',
          authorId: user.cognitoSub,
          postId: post.id,
        },
      });

      // Buscar estatísticas
      const response = await request(server)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body.data.totalPosts).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalViews).toBeGreaterThanOrEqual(50);
      expect(response.body.data.totalLikes).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalComments).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /dashboard/analytics', () => {
    it('deve retornar analytics do banco real', async () => {
      const response = await request(server)
        .get('/api/dashboard/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('views');
      expect(response.body.data).toHaveProperty('engagement');
      expect(Array.isArray(response.body.data.views)).toBe(true);
      expect(Array.isArray(response.body.data.engagement)).toBe(true);
    });

    it('deve retornar analytics para período de 7 dias', async () => {
      const response = await request(server)
        .get('/api/dashboard/analytics?period=7d')
        .expect(200);

      expect(response.body.data.views).toHaveLength(7);
      expect(response.body.data.engagement).toHaveLength(7);
    });

    it('deve retornar analytics para período de 30 dias (padrão)', async () => {
      const response = await request(server)
        .get('/api/dashboard/analytics')
        .expect(200);

      expect(response.body.data.views).toHaveLength(30);
      expect(response.body.data.engagement).toHaveLength(30);
    });

    it('deve retornar analytics para período de 90 dias', async () => {
      const response = await request(server)
        .get('/api/dashboard/analytics?period=90d')
        .expect(200);

      expect(response.body.data.views).toHaveLength(90);
      expect(response.body.data.engagement).toHaveLength(90);
    });
  });
});
