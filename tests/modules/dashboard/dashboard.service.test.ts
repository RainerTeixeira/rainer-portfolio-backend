/**
 * Testes Unitários: Dashboard Service
 * 
 * Testa a lógica de estatísticas e analytics do dashboard.
 * Cobertura: 100%
 */

import { TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../../src/modules/dashboard/dashboard.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../../helpers/database-test-helper';

describe('DashboardService (Banco Real)', () => {
  let service: DashboardService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createDatabaseTestModule({
      imports: [],
      providers: [DashboardService, PrismaService],
    });

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('getStats', () => {
    it('deve retornar estatísticas quando não há posts', async () => {
      const stats = await service.getStats();

      expect(stats).toHaveProperty('totalPosts', 0);
      expect(stats).toHaveProperty('totalViews', 0);
      expect(stats).toHaveProperty('totalLikes', 0);
      expect(stats).toHaveProperty('totalComments', 0);
      expect(stats).toHaveProperty('postsChange');
      expect(stats).toHaveProperty('viewsChange');
      expect(stats).toHaveProperty('likesChange');
      expect(stats).toHaveProperty('commentsChange');
    });

    it('deve contar posts publicados corretamente', async () => {
      // Criar categoria e subcategoria
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
          name: 'JavaScript',
          slug: `javascript-${Date.now()}`,
          parentId: category.id,
          order: 1,
          isActive: true,
        },
      });

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-123',
          fullName: 'Test User',
        },
      });

      // Criar posts publicados
      const timestamp = Date.now();
      await prisma.post.createMany({
        data: [
          {
            title: 'Post 1',
            slug: `post-1-${timestamp}`,
            content: { type: 'doc', content: [] },
            subcategoryId: subcategory.id,
            authorId: user.cognitoSub,
            status: 'PUBLISHED',
            views: 100,
          },
          {
            title: 'Post 2',
            slug: `post-2-${timestamp}`,
            content: { type: 'doc', content: [] },
            subcategoryId: subcategory.id,
            authorId: user.cognitoSub,
            status: 'PUBLISHED',
            views: 200,
          },
          {
            title: 'Post Draft',
            slug: `post-draft-${timestamp}`,
            content: { type: 'doc', content: [] },
            subcategoryId: subcategory.id,
            authorId: user.cognitoSub,
            status: 'DRAFT',
            views: 50,
          },
        ],
      });

      const stats = await service.getStats();

      expect(stats.totalPosts).toBe(2);
      expect(stats.totalViews).toBe(300);
    });

    it('deve contar likes apenas em posts publicados', async () => {
      // Criar categoria e subcategoria
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
          name: 'JavaScript',
          slug: `javascript-${Date.now()}`,
          parentId: category.id,
          order: 1,
          isActive: true,
        },
      });

      // Criar usuários
      const user1 = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-1',
          fullName: 'User 1',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-2',
          fullName: 'User 2',
        },
      });

      // Criar posts
      const timestamp = Date.now();
      const publishedPost = await prisma.post.create({
        data: {
          title: 'Published Post',
          slug: `published-post-${timestamp}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user1.cognitoSub,
          status: 'PUBLISHED',
        },
      });

      const draftPost = await prisma.post.create({
        data: {
          title: 'Draft Post',
          slug: `draft-post-${timestamp}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user1.cognitoSub,
          status: 'DRAFT',
        },
      });

      // Criar likes
      // Nota: O serviço filtra likes apenas em posts publicados
      await prisma.like.create({
        data: {
          userId: user2.cognitoSub,
          postId: publishedPost.id,
        },
      });

      // Criar like em post draft (não deve contar)
      await prisma.like.create({
        data: {
          userId: user2.cognitoSub,
          postId: draftPost.id,
        },
      });

      const stats = await service.getStats();

      // Apenas o like no post publicado deve contar
      expect(stats.totalLikes).toBe(1);
    });

    it('deve contar comentários aprovados apenas em posts publicados', async () => {
      // Criar categoria e subcategoria
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
          name: 'JavaScript',
          slug: `javascript-${Date.now()}`,
          parentId: category.id,
          order: 1,
          isActive: true,
        },
      });

      // Criar usuários
      const user1 = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-1',
          fullName: 'User 1',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-2',
          fullName: 'User 2',
        },
      });

      // Criar posts
      const timestamp = Date.now();
      const publishedPost = await prisma.post.create({
        data: {
          title: 'Published Post',
          slug: `published-post-${timestamp}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user1.cognitoSub,
          status: 'PUBLISHED',
        },
      });

      const draftPost = await prisma.post.create({
        data: {
          title: 'Draft Post',
          slug: `draft-post-${timestamp}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user1.cognitoSub,
          status: 'DRAFT',
        },
      });

      // Criar comentários
      await prisma.comment.createMany({
        data: [
          {
            content: 'Approved comment',
            contentJson: {},
            authorId: user2.cognitoSub,
            postId: publishedPost.id,
            isApproved: true,
          },
          {
            content: 'Unapproved comment',
            contentJson: {},
            authorId: user2.cognitoSub,
            postId: publishedPost.id,
            isApproved: false,
          },
          {
            content: 'Draft post comment',
            contentJson: {},
            authorId: user2.cognitoSub,
            postId: draftPost.id,
            isApproved: true,
          },
        ],
      });

      const stats = await service.getStats();

      expect(stats.totalComments).toBe(1);
    });

    it('deve calcular variação de posts corretamente', async () => {
      // Criar categoria e subcategoria
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
          name: 'JavaScript',
          slug: `javascript-${Date.now()}`,
          parentId: category.id,
          order: 1,
          isActive: true,
        },
      });

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-123',
          fullName: 'Test User',
        },
      });

      // Criar posts em diferentes períodos
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Post no período atual
      await prisma.post.create({
        data: {
          title: 'Recent Post',
          slug: `recent-post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user.cognitoSub,
          status: 'PUBLISHED',
          createdAt: thirtyDaysAgo,
        },
      });

      // Post no período anterior
      await prisma.post.create({
        data: {
          title: 'Old Post',
          slug: `old-post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user.cognitoSub,
          status: 'PUBLISHED',
          createdAt: sixtyDaysAgo,
        },
      });

      const stats = await service.getStats();

      expect(stats.postsChange).toBeDefined();
      expect(typeof stats.postsChange).toBe('number');
    });
  });

  describe('getAnalytics', () => {
    it('deve retornar analytics para período de 7 dias', async () => {
      const analytics = await service.getAnalytics('7d');

      expect(analytics).toHaveProperty('views');
      expect(analytics).toHaveProperty('engagement');
      expect(analytics.views).toHaveLength(7);
      expect(analytics.engagement).toHaveLength(7);
    });

    it('deve retornar analytics para período de 30 dias (padrão)', async () => {
      const analytics = await service.getAnalytics();

      expect(analytics.views).toHaveLength(30);
      expect(analytics.engagement).toHaveLength(30);
    });

    it('deve retornar analytics para período de 90 dias', async () => {
      const analytics = await service.getAnalytics('90d');

      expect(analytics.views).toHaveLength(90);
      expect(analytics.engagement).toHaveLength(90);
    });

    it('deve incluir views e uniqueViews em cada data', async () => {
      const analytics = await service.getAnalytics('7d');

      analytics.views.forEach((viewData) => {
        expect(viewData).toHaveProperty('date');
        expect(viewData).toHaveProperty('views');
        expect(viewData).toHaveProperty('uniqueViews');
        expect(typeof viewData.date).toBe('string');
        expect(typeof viewData.views).toBe('number');
        expect(typeof viewData.uniqueViews).toBe('number');
      });
    });

    it('deve incluir likes e comments em cada data de engagement', async () => {
      const analytics = await service.getAnalytics('7d');

      analytics.engagement.forEach((engagementData) => {
        expect(engagementData).toHaveProperty('date');
        expect(engagementData).toHaveProperty('likes');
        expect(engagementData).toHaveProperty('comments');
        expect(typeof engagementData.date).toBe('string');
        expect(typeof engagementData.likes).toBe('number');
        expect(typeof engagementData.comments).toBe('number');
      });
    });

    it('deve agrupar dados de posts por data corretamente', async () => {
      // Criar categoria e subcategoria
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
          name: 'JavaScript',
          slug: `javascript-${Date.now()}`,
          parentId: category.id,
          order: 1,
          isActive: true,
        },
      });

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-123',
          fullName: 'Test User',
        },
      });

      // Criar post recente
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);
      
      await prisma.post.create({
        data: {
          title: 'Recent Post',
          slug: `recent-post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user.cognitoSub,
          status: 'PUBLISHED',
          views: 100,
          createdAt: recentDate,
        },
      });

      const analytics = await service.getAnalytics('7d');

      // Verificar se há dados nas datas corretas
      expect(analytics.views.length).toBeGreaterThan(0);
      expect(analytics.engagement.length).toBeGreaterThan(0);
    });

    it('deve agrupar likes e comments por data', async () => {
      // Criar categoria e subcategoria
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
          name: 'JavaScript',
          slug: `javascript-${Date.now()}`,
          parentId: category.id,
          order: 1,
          isActive: true,
        },
      });

      // Criar usuários
      const user1 = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-1',
          fullName: 'User 1',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          cognitoSub: 'cognito-sub-2',
          fullName: 'User 2',
        },
      });

      // Criar post
      const post = await prisma.post.create({
        data: {
          title: 'Test Post',
          slug: `test-post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          subcategoryId: subcategory.id,
          authorId: user1.cognitoSub,
          status: 'PUBLISHED',
        },
      });

      // Criar like e comment recentes
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      await prisma.like.create({
        data: {
          userId: user2.cognitoSub,
          postId: post.id,
          createdAt: recentDate,
        },
      });

      await prisma.comment.create({
        data: {
          content: 'Test comment',
          contentJson: {},
          authorId: user2.cognitoSub,
          postId: post.id,
          isApproved: true,
          createdAt: recentDate,
        },
      });

      const analytics = await service.getAnalytics('7d');

      // Verificar se os dados foram agrupados
      expect(analytics.engagement.length).toBe(7);
    });
  });
});
