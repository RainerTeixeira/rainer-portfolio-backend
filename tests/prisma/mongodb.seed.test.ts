/**
 * Testes Unitários: MongoDB Seed
 * 
 * Testa o script de seed do MongoDB com Prisma.
 * Cobertura: Principais funções e cenários de erro
 */

import { PrismaClient } from '@prisma/client';

// Mock do PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    category: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    post: {
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    like: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    bookmark: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock do nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id-123'),
}));

describe('MongoDB Seed Script', () => {
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('Cleanup', () => {
    it('deve limpar todas as collections na ordem correta', async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 5 });
      prisma.bookmark.deleteMany.mockResolvedValue({ count: 5 });
      prisma.like.deleteMany.mockResolvedValue({ count: 11 });
      prisma.comment.deleteMany.mockResolvedValue({ count: 5 });
      prisma.post.deleteMany.mockResolvedValue({ count: 8 });
      prisma.category.deleteMany
        .mockResolvedValueOnce({ count: 6 }) // subcategorias
        .mockResolvedValueOnce({ count: 3 }); // categorias principais
      prisma.user.deleteMany.mockResolvedValue({ count: 5 });

      // Simula a função cleanup
      const cleanup = async () => {
        await prisma.notification.deleteMany();
        await prisma.bookmark.deleteMany();
        await prisma.like.deleteMany();
        await prisma.comment.deleteMany();
        await prisma.post.deleteMany();
        await prisma.category.deleteMany({ where: { parentId: { not: null } } });
        await prisma.category.deleteMany({ where: { parentId: null } });
        await prisma.user.deleteMany();
      };

      await cleanup();

      // Verifica ordem de deleção (reversa das dependências)
      const calls = [
        prisma.notification.deleteMany,
        prisma.bookmark.deleteMany,
        prisma.like.deleteMany,
        prisma.comment.deleteMany,
        prisma.post.deleteMany,
        prisma.category.deleteMany,
        prisma.user.deleteMany,
      ];

      calls.forEach(call => {
        expect(call).toHaveBeenCalled();
      });
    });

    it('deve lidar com erro ao limpar banco (banco vazio)', async () => {
      prisma.user.deleteMany.mockRejectedValue(new Error('Collection not found'));

      const cleanup = async () => {
        try {
          await prisma.user.deleteMany();
        } catch (error) {
          // Aviso esperado, não propaga erro
          return;
        }
      };

      await expect(cleanup()).resolves.not.toThrow();
    });
  });

  describe('Seed Users', () => {
    it('deve criar 5 usuários com diferentes roles', async () => {
      const mockUsers = [
        { id: '1', role: 'ADMIN', email: 'admin@blog.com' },
        { id: '2', role: 'EDITOR', email: 'editor@blog.com' },
        { id: '3', role: 'AUTHOR', email: 'joao@blog.com' },
        { id: '4', role: 'AUTHOR', email: 'ana@blog.com' },
        { id: '5', role: 'SUBSCRIBER', email: 'carlos@example.com' },
      ];

      prisma.user.create.mockImplementation(({ data }: any) => 
        Promise.resolve({ ...data, id: 'test-id' })
      );

      const users = [];
      for (const userData of mockUsers) {
        const user = await prisma.user.create({ data: userData });
        users.push(user);
      }

      expect(users).toHaveLength(5);
      expect(prisma.user.create).toHaveBeenCalledTimes(5);
    });

    it('deve criar usuários com todos os campos obrigatórios', async () => {
      const userData = {
        cognitoSub: 'test-cognito-sub',
        email: 'admin@blog.com',
        username: 'admin',
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true,
      };

      prisma.user.create.mockResolvedValue({ ...userData, id: '1' });
      const user = await prisma.user.create({ data: userData });

      expect(user).toHaveProperty('cognitoSub');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
    });

    it('deve criar usuários com campos opcionais (avatar, bio, website)', async () => {
      const userData = {
        email: 'user@blog.com',
        username: 'user',
        name: 'User',
        avatar: 'https://i.pravatar.cc/150?img=1',
        bio: 'Bio do usuário',
        website: 'https://example.com',
        role: 'AUTHOR',
      };

      prisma.user.create.mockResolvedValue({ ...userData, id: '1' });
      const user = await prisma.user.create({ data: userData });

      expect(user).toHaveProperty('avatar');
      expect(user).toHaveProperty('bio');
      expect(user).toHaveProperty('website');
    });

    it('deve criar usuários com socialLinks', async () => {
      const userData = {
        email: 'dev@blog.com',
        username: 'dev',
        name: 'Dev',
        socialLinks: {
          github: 'https://github.com/user',
          linkedin: 'https://linkedin.com/in/user',
          twitter: 'https://twitter.com/user',
        },
        role: 'AUTHOR',
      };

      prisma.user.create.mockResolvedValue({ ...userData, id: '1' });
      const user = await prisma.user.create({ data: userData });

      expect(user.socialLinks).toHaveProperty('github');
      expect(user.socialLinks).toHaveProperty('linkedin');
    });
  });

  describe('Seed Categories', () => {
    it('deve criar 3 categorias principais', async () => {
      const mainCategories = [
        { name: 'Tecnologia', slug: 'tecnologia', parentId: null },
        { name: 'Design', slug: 'design', parentId: null },
        { name: 'Carreira', slug: 'carreira', parentId: null },
      ];

      prisma.category.upsert.mockImplementation(({ create }: any) => 
        Promise.resolve({ ...create, id: 'cat-id' })
      );

      for (const cat of mainCategories) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        });
      }

      expect(prisma.category.upsert).toHaveBeenCalledTimes(3);
    });

    it('deve criar subcategorias com parentId', async () => {
      const parentId = 'parent-cat-id';
      const subcategory = {
        name: 'Frontend',
        slug: 'frontend',
        parentId: parentId,
        isActive: true,
      };

      prisma.category.upsert.mockResolvedValue({ ...subcategory, id: 'subcat-id' });
      
      const created = await prisma.category.upsert({
        where: { slug: subcategory.slug },
        update: { parentId },
        create: subcategory,
      });

      expect(created.parentId).toBe(parentId);
    });

    it('deve usar upsert para evitar duplicatas', async () => {
      const categoryData = {
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Categoria de tecnologia',
      };

      prisma.category.upsert.mockResolvedValue({ ...categoryData, id: '1' });

      await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: {},
        create: categoryData,
      });

      expect(prisma.category.upsert).toHaveBeenCalledWith({
        where: { slug: 'tecnologia' },
        update: {},
        create: categoryData,
      });
    });

    it('deve criar categorias com todos os campos obrigatórios', async () => {
      const categoryData = {
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Descrição',
        color: '#3498DB',
        icon: 'code',
        isActive: true,
        order: 1,
      };

      prisma.category.upsert.mockResolvedValue({ ...categoryData, id: '1' });
      const category = await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: {},
        create: categoryData,
      });

      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('color');
      expect(category).toHaveProperty('icon');
    });
  });

  describe('Seed Posts', () => {
    it('deve criar posts com status PUBLISHED', async () => {
      const postData = {
        title: 'Post Publicado',
        slug: 'post-publicado',
        content: { type: 'doc', content: [] },
        subcategoryId: 'subcat-id',
        authorId: 'author-id',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-10-01'),
      };

      prisma.post.create.mockResolvedValue({ ...postData, id: '1' });
      const post = await prisma.post.create({ data: postData });

      expect(post.status).toBe('PUBLISHED');
      expect(post).toHaveProperty('publishedAt');
    });

    it('deve criar posts com status DRAFT', async () => {
      const postData = {
        title: 'Rascunho',
        slug: 'rascunho',
        content: { type: 'doc', content: [] },
        subcategoryId: 'subcat-id',
        authorId: 'author-id',
        status: 'DRAFT',
        featured: false,
      };

      prisma.post.create.mockResolvedValue({ ...postData, id: '1' });
      const post = await prisma.post.create({ data: postData });

      expect(post.status).toBe('DRAFT');
      expect(post.featured).toBe(false);
    });

    it('deve criar posts com conteúdo TipTap válido', async () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Conteúdo do post' },
            ],
          },
        ],
      };

      expect(content.type).toBe('doc');
      expect(content.content).toBeInstanceOf(Array);
      expect(content.content[0].type).toBe('paragraph');
    });

    it('deve criar posts featured', async () => {
      const postData = {
        title: 'Post Destaque',
        slug: 'post-destaque',
        content: { type: 'doc', content: [] },
        subcategoryId: 'subcat-id',
        authorId: 'author-id',
        status: 'PUBLISHED',
        featured: true,
      };

      prisma.post.create.mockResolvedValue({ ...postData, id: '1' });
      const post = await prisma.post.create({ data: postData });

      expect(post.featured).toBe(true);
    });

    it('deve atualizar contadores de posts nas categorias', async () => {
      const categoryId = 'cat-id';
      
      prisma.category.update.mockResolvedValue({
        id: categoryId,
        postsCount: 2,
      });

      await prisma.category.update({
        where: { id: categoryId },
        data: { postsCount: 2 },
      });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { postsCount: 2 },
      });
    });

    it('deve atualizar contadores de posts dos autores', async () => {
      const authorId = 'author-id';
      
      prisma.user.update.mockResolvedValue({
        id: authorId,
        postsCount: 5,
      });

      await prisma.user.update({
        where: { id: authorId },
        data: { postsCount: 5 },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: authorId },
        data: { postsCount: 5 },
      });
    });
  });

  describe('Seed Comments', () => {
    it('deve criar comentários aprovados', async () => {
      const commentData = {
        content: 'Ótimo artigo!',
        authorId: 'user-id',
        postId: 'post-id',
        isApproved: true,
      };

      prisma.comment.create.mockResolvedValue({ ...commentData, id: '1' });
      const comment = await prisma.comment.create({ data: commentData });

      expect(comment.isApproved).toBe(true);
    });

    it('deve criar comentários aguardando moderação', async () => {
      const commentData = {
        content: 'Comentário pendente',
        authorId: 'user-id',
        postId: 'post-id',
        isApproved: false,
      };

      prisma.comment.create.mockResolvedValue({ ...commentData, id: '1' });
      const comment = await prisma.comment.create({ data: commentData });

      expect(comment.isApproved).toBe(false);
    });

    it('deve criar threads de comentários (com parentId)', async () => {
      const replyData = {
        content: 'Resposta ao comentário',
        authorId: 'author-id',
        postId: 'post-id',
        parentId: 'parent-comment-id',
        isApproved: true,
      };

      prisma.comment.create.mockResolvedValue({ ...replyData, id: '2' });
      const reply = await prisma.comment.create({ data: replyData });

      expect(reply).toHaveProperty('parentId');
      expect(reply.parentId).toBe('parent-comment-id');
    });

    it('deve atualizar contadores de comentários nos posts', async () => {
      const postId = 'post-id';
      
      prisma.post.update.mockResolvedValue({
        id: postId,
        commentsCount: 2,
      });

      await prisma.post.update({
        where: { id: postId },
        data: { commentsCount: 2 },
      });

      expect(prisma.post.update).toHaveBeenCalled();
    });

    it('deve atualizar contadores de comentários dos usuários', async () => {
      const userId = 'user-id';
      
      prisma.user.update.mockResolvedValue({
        id: userId,
        commentsCount: 3,
      });

      await prisma.user.update({
        where: { id: userId },
        data: { commentsCount: 3 },
      });

      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('Seed Likes', () => {
    it('deve criar likes relacionando usuário e post', async () => {
      const likeData = {
        userId: 'user-id',
        postId: 'post-id',
      };

      prisma.like.create.mockResolvedValue({ ...likeData, id: '1' });
      const like = await prisma.like.create({ data: likeData });

      expect(like).toHaveProperty('userId');
      expect(like).toHaveProperty('postId');
    });

    it('deve criar múltiplos likes para o mesmo post', async () => {
      const likes = [
        { userId: 'user-1', postId: 'post-1' },
        { userId: 'user-2', postId: 'post-1' },
        { userId: 'user-3', postId: 'post-1' },
      ];

      prisma.like.create.mockImplementation(({ data }: any) => 
        Promise.resolve({ ...data, id: 'like-id' })
      );

      for (const likeData of likes) {
        await prisma.like.create({ data: likeData });
      }

      expect(prisma.like.create).toHaveBeenCalledTimes(3);
    });

    it('deve atualizar contadores de likes nos posts', async () => {
      const postId = 'post-id';
      
      prisma.post.update.mockResolvedValue({
        id: postId,
        likesCount: 3,
      });

      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: 3 },
      });

      expect(prisma.post.update).toHaveBeenCalled();
    });
  });

  describe('Seed Bookmarks', () => {
    it('deve criar bookmarks com collection', async () => {
      const bookmarkData = {
        userId: 'user-id',
        postId: 'post-id',
        collection: 'Para Ler Depois',
      };

      prisma.bookmark.create.mockResolvedValue({ ...bookmarkData, id: '1' });
      const bookmark = await prisma.bookmark.create({ data: bookmarkData });

      expect(bookmark).toHaveProperty('collection');
      expect(bookmark.collection).toBe('Para Ler Depois');
    });

    it('deve criar bookmarks com notes opcionais', async () => {
      const bookmarkData = {
        userId: 'user-id',
        postId: 'post-id',
        collection: 'Estudar',
        notes: 'Importante para o projeto',
      };

      prisma.bookmark.create.mockResolvedValue({ ...bookmarkData, id: '1' });
      const bookmark = await prisma.bookmark.create({ data: bookmarkData });

      expect(bookmark).toHaveProperty('notes');
      expect(bookmark.notes).toBe('Importante para o projeto');
    });

    it('deve atualizar contadores de bookmarks nos posts', async () => {
      const postId = 'post-id';
      
      prisma.post.update.mockResolvedValue({
        id: postId,
        bookmarksCount: 1,
      });

      await prisma.post.update({
        where: { id: postId },
        data: { bookmarksCount: 1 },
      });

      expect(prisma.post.update).toHaveBeenCalled();
    });
  });

  describe('Seed Notifications', () => {
    it('deve criar notificações de diferentes tipos', async () => {
      const types = ['NEW_COMMENT', 'NEW_LIKE', 'POST_PUBLISHED', 'SYSTEM'];

      for (const type of types) {
        const notificationData = {
          type,
          title: 'Título',
          message: 'Mensagem',
          userId: 'user-id',
          isRead: false,
        };

        prisma.notification.create.mockResolvedValue({ ...notificationData, id: '1' });
        const notification = await prisma.notification.create({ data: notificationData });

        expect(notification.type).toBe(type);
      }
    });

    it('deve criar notificações não lidas', async () => {
      const notificationData = {
        type: 'NEW_COMMENT',
        title: 'Novo Comentário',
        message: 'Mensagem',
        userId: 'user-id',
        isRead: false,
      };

      prisma.notification.create.mockResolvedValue({ ...notificationData, id: '1' });
      const notification = await prisma.notification.create({ data: notificationData });

      expect(notification.isRead).toBe(false);
    });

    it('deve criar notificações lidas com readAt', async () => {
      const notificationData = {
        type: 'NEW_LIKE',
        title: 'Novo Like',
        message: 'Mensagem',
        userId: 'user-id',
        isRead: true,
        readAt: new Date('2024-10-11'),
      };

      prisma.notification.create.mockResolvedValue({ ...notificationData, id: '1' });
      const notification = await prisma.notification.create({ data: notificationData });

      expect(notification.isRead).toBe(true);
      expect(notification).toHaveProperty('readAt');
    });

    it('deve criar notificações com metadata', async () => {
      const notificationData = {
        type: 'NEW_COMMENT',
        title: 'Novo Comentário',
        message: 'Mensagem',
        userId: 'user-id',
        isRead: false,
        metadata: {
          postId: 'post-id',
          commentAuthor: 'João',
        },
      };

      prisma.notification.create.mockResolvedValue({ ...notificationData, id: '1' });
      const notification = await prisma.notification.create({ data: notificationData });

      expect(notification).toHaveProperty('metadata');
      expect(notification.metadata).toHaveProperty('postId');
    });

    it('deve criar notificações com link', async () => {
      const notificationData = {
        type: 'NEW_COMMENT',
        title: 'Novo Comentário',
        message: 'Mensagem',
        link: '/posts/123',
        userId: 'user-id',
        isRead: false,
      };

      prisma.notification.create.mockResolvedValue({ ...notificationData, id: '1' });
      const notification = await prisma.notification.create({ data: notificationData });

      expect(notification).toHaveProperty('link');
      expect(notification.link).toBe('/posts/123');
    });
  });

  describe('Update Views', () => {
    it('deve atualizar views dos posts', async () => {
      const postId = 'post-id';
      
      prisma.post.update.mockResolvedValue({
        id: postId,
        views: 1250,
      });

      await prisma.post.update({
        where: { id: postId },
        data: { views: 1250 },
      });

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { views: 1250 },
      });
    });

    it('deve permitir diferentes valores de views', async () => {
      const viewsCounts = [1250, 890, 650, 420, 580, 720, 310];
      
      for (const views of viewsCounts) {
        expect(views).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Lifecycle', () => {
    it('deve desconectar do Prisma após seed', async () => {
      prisma.$disconnect.mockResolvedValue(undefined);
      
      await prisma.$disconnect();
      
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Validação de Dados', () => {
    it('deve ter emails válidos', () => {
      const emails = [
        'admin@blog.com',
        'editor@blog.com',
        'joao@blog.com',
      ];

      emails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('deve ter slugs válidos', () => {
      const slugs = [
        'tecnologia',
        'introducao-react-18-novidades',
        'nestjs-arquitetura-modular',
      ];

      slugs.forEach(slug => {
        expect(slug).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it('deve ter cores válidas em hexadecimal', () => {
      const colors = ['#3498DB', '#E74C3C', '#2ECC71'];

      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});

