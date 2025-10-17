/**
 * Testes de Integração: MongoDB + Prisma
 * 
 * Valida:
 * - Conexão com MongoDB
 * - CRUD operations via Prisma
 * - Transações
 * - Relacionamentos
 * - Indexes
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('MongoDB/Prisma Integration', () => {
  let prisma: PrismaClient;
  let prismaService: PrismaService;

  beforeAll(async () => {
    prismaService = new PrismaService();
    prisma = prismaService;
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar banco de dados antes de cada teste
    await prisma.notification.deleteMany({});
    await prisma.bookmark.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('✅ Conexão MongoDB', () => {
    it('deve conectar ao MongoDB via Prisma', async () => {
      const result = await prisma.$runCommandRaw({
        ping: 1,
      });
      expect(result).toHaveProperty('ok', 1);
    });

    it('deve retornar informações do banco de dados', async () => {
      const result = await prisma.$runCommandRaw({
        serverStatus: 1,
      });
      expect(result).toHaveProperty('ok', 1);
      expect(result).toHaveProperty('connections');
    });
  });

  describe('🔧 CRUD - Users', () => {
    it('deve criar um usuário', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-001',
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
          role: 'AUTHOR',
        },
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.cognitoSub).toBe('test-cognito-sub-001');
    });

    it('deve buscar um usuário por email', async () => {
      await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-002',
          email: 'find@example.com',
          username: 'finduser',
          name: 'Find User',
        },
      });

      const user = await prisma.user.findUnique({
        where: { email: 'find@example.com' },
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe('find@example.com');
    });

    it('deve atualizar um usuário', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-003',
          email: 'update@example.com',
          username: 'updateuser',
          name: 'Update User',
        },
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated Name' },
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('deve deletar um usuário', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-004',
          email: 'delete@example.com',
          username: 'deleteuser',
          name: 'Delete User',
        },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const found = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('🔧 CRUD - Categories', () => {
    it('deve criar uma categoria principal', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Tecnologia',
          slug: 'tecnologia',
          description: 'Categoria de tecnologia',
          color: '#FF5733',
          icon: 'code',
        },
      });

      expect(category).toHaveProperty('id');
      expect(category.name).toBe('Tecnologia');
      expect(category.parentId).toBeNull();
    });

    it('deve criar uma subcategoria', async () => {
      const parent = await prisma.category.create({
        data: {
          name: 'Tecnologia',
          slug: 'tecnologia',
        },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Frontend',
          slug: 'frontend',
          parentId: parent.id,
        },
      });

      expect(subcategory.parentId).toBe(parent.id);

      const withParent = await prisma.category.findUnique({
        where: { id: subcategory.id },
        include: { parent: true },
      });

      expect(withParent?.parent?.name).toBe('Tecnologia');
    });

    it('deve listar subcategorias de uma categoria', async () => {
      const parent = await prisma.category.create({
        data: {
          name: 'Tecnologia',
          slug: 'tecnologia',
        },
      });

      await prisma.category.createMany({
        data: [
          { name: 'Frontend', slug: 'frontend', parentId: parent.id },
          { name: 'Backend', slug: 'backend', parentId: parent.id },
          { name: 'DevOps', slug: 'devops', parentId: parent.id },
        ],
      });

      const withChildren = await prisma.category.findUnique({
        where: { id: parent.id },
        include: { children: true },
      });

      expect(withChildren?.children).toHaveLength(3);
    });
  });

  describe('🔧 CRUD - Posts', () => {
    it('deve criar um post completo', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-005',
          email: 'author@example.com',
          username: 'author',
          name: 'Author User',
        },
      });

      const category = await prisma.category.create({
        data: {
          name: 'Tecnologia',
          slug: 'tecnologia',
        },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Frontend',
          slug: 'frontend',
          parentId: category.id,
        },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Meu Primeiro Post',
          slug: 'meu-primeiro-post',
          content: { type: 'doc', content: [] },
          authorId: user.id,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      expect(post).toHaveProperty('id');
      expect(post.title).toBe('Meu Primeiro Post');
      expect(post.status).toBe('PUBLISHED');
    });

    it('deve buscar posts com autor e categoria', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-006',
          email: 'author2@example.com',
          username: 'author2',
          name: 'Author 2',
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

      await prisma.post.create({
        data: {
          title: 'Post Test',
          slug: 'post-test',
          content: {},
          authorId: user.id,
          subcategoryId: subcategory.id,
        },
      });

      const posts = await prisma.post.findMany({
        include: {
          author: true,
          subcategory: {
            include: {
              parent: true,
            },
          },
        },
      });

      expect(posts).toHaveLength(1);
      expect(posts[0].author.email).toBe('author2@example.com');
      expect(posts[0].subcategory.name).toBe('Backend');
      expect(posts[0].subcategory.parent?.name).toBe('Tech');
    });
  });

  describe('🔧 CRUD - Comments', () => {
    it('deve criar um comentário em um post', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-007',
          email: 'commenter@example.com',
          username: 'commenter',
          name: 'Commenter',
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

      const comment = await prisma.comment.create({
        data: {
          content: 'Ótimo post!',
          authorId: user.id,
          postId: post.id,
        },
      });

      expect(comment.content).toBe('Ótimo post!');
      expect(comment.postId).toBe(post.id);
    });

    it('deve criar comentário aninhado (reply)', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-008',
          email: 'replier@example.com',
          username: 'replier',
          name: 'Replier',
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

      const parentComment = await prisma.comment.create({
        data: {
          content: 'Comentário principal',
          authorId: user.id,
          postId: post.id,
        },
      });

      const reply = await prisma.comment.create({
        data: {
          content: 'Resposta ao comentário',
          authorId: user.id,
          postId: post.id,
          parentId: parentComment.id,
        },
      });

      expect(reply.parentId).toBe(parentComment.id);
    });
  });

  describe('🔧 CRUD - Likes', () => {
    it('deve dar like em um post', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-009',
          email: 'liker@example.com',
          username: 'liker',
          name: 'Liker',
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

      const like = await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      expect(like.userId).toBe(user.id);
      expect(like.postId).toBe(post.id);
    });

    it('não deve permitir like duplicado (unique constraint)', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-010',
          email: 'liker2@example.com',
          username: 'liker2',
          name: 'Liker 2',
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

      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      await expect(
        prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('📊 Performance e Índices', () => {
    it('deve buscar usuário por email rapidamente (index)', async () => {
      // Criar múltiplos usuários
      await prisma.user.createMany({
        data: Array.from({ length: 100 }, (_, i) => ({
          cognitoSub: `cognito-${i}`,
          email: `user${i}@example.com`,
          username: `user${i}`,
          name: `User ${i}`,
        })),
      });

      const start = Date.now();
      const user = await prisma.user.findUnique({
        where: { email: 'user50@example.com' },
      });
      const duration = Date.now() - start;

      expect(user).not.toBeNull();
      expect(duration).toBeLessThan(100); // Deve ser rápido devido ao índice
    });

    it('deve contar registros eficientemente', async () => {
      await prisma.user.createMany({
        data: Array.from({ length: 50 }, (_, i) => ({
          cognitoSub: `cognito-count-${i}`,
          email: `count${i}@example.com`,
          username: `count${i}`,
          name: `Count ${i}`,
        })),
      });

      const count = await prisma.user.count();
      expect(count).toBe(50);
    });
  });

  describe('🔗 Relacionamentos Complexos', () => {
    it('deve buscar post com todos os relacionamentos', async () => {
      // Setup completo
      const author = await prisma.user.create({
        data: {
          cognitoSub: 'author-full',
          email: 'author-full@example.com',
          username: 'authorfull',
          name: 'Author Full',
        },
      });

      const commenter = await prisma.user.create({
        data: {
          cognitoSub: 'commenter-full',
          email: 'commenter-full@example.com',
          username: 'commenterfull',
          name: 'Commenter Full',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Tech', slug: 'tech' },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Frontend',
          slug: 'frontend',
          parentId: category.id,
        },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post Completo',
          slug: 'post-completo',
          content: {},
          authorId: author.id,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      // Adicionar comentários, likes, bookmarks
      await prisma.comment.create({
        data: {
          content: 'Comentário teste',
          authorId: commenter.id,
          postId: post.id,
        },
      });

      await prisma.like.create({
        data: {
          userId: commenter.id,
          postId: post.id,
        },
      });

      await prisma.bookmark.create({
        data: {
          userId: commenter.id,
          postId: post.id,
        },
      });

      // Buscar com todos os relacionamentos
      const fullPost = await prisma.post.findUnique({
        where: { id: post.id },
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

      expect(fullPost).not.toBeNull();
      expect(fullPost?.author.email).toBe('author-full@example.com');
      expect(fullPost?.subcategory.parent?.name).toBe('Tech');
      expect(fullPost?.comments).toHaveLength(1);
      expect(fullPost?.likes).toHaveLength(1);
      expect(fullPost?.bookmarks).toHaveLength(1);
    });
  });
});

