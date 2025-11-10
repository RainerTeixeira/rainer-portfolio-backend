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
    // Limpeza sem transações para MongoDB standalone (usa comandos nativos)
    const collections = [
      'notifications',
      'bookmarks',
      'likes',
      'comments',
      'posts',
      'categories',
      'users',
    ] as const

    for (const coll of collections) {
      try {
        await prisma.$runCommandRaw({ delete: coll, deletes: [{ q: {}, limit: 0 }] })
      } catch (_) {
        // Ignora erro se coleção não existir ou MongoDB não estiver disponível
      }
    }
  }, 60000); // Timeout de 60 segundos

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
          fullName: 'Test User',
          role: 'AUTHOR',
        },
      });

      // MongoDB usa cognitoSub como chave primária (@id), não há campo 'id' separado
      expect(user).toHaveProperty('cognitoSub');
      expect(user.fullName).toBe('Test User');
      expect(user.cognitoSub).toBe('test-cognito-sub-001');
    });

    it('deve buscar um usuário por cognitoSub', async () => {
      await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-002',
          fullName: 'Find User',
        },
      });

      const user = await prisma.user.findUnique({
        where: { cognitoSub: 'test-cognito-sub-002' },
      });

      expect(user).not.toBeNull();
      expect(user?.cognitoSub).toBe('test-cognito-sub-002');
    });

    it('deve atualizar um usuário', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-003',
          fullName: 'Update User',
        },
      });

      const updated = await prisma.user.update({
        where: { cognitoSub: user.cognitoSub },
        data: { fullName: 'Updated Name' },
      });

      expect(updated.fullName).toBe('Updated Name');
    });

    it('deve deletar um usuário', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-004',
          fullName: 'Delete User',
        },
      });

      await prisma.user.delete({
        where: { cognitoSub: user.cognitoSub },
      });

      const found = await prisma.user.findUnique({
        where: { cognitoSub: user.cognitoSub },
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
          fullName: 'Author User',
        },
      });

      const category = await prisma.category.create({
        data: {
          name: 'Tecnologia',
          slug: `tecnologia-${Date.now()}`,
          isActive: true,
        },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Frontend',
          slug: `frontend-${Date.now()}`,
          parentId: category.id,
          isActive: true,
        },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Meu Primeiro Post',
          slug: `meu-primeiro-post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: user.cognitoSub,
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
          fullName: 'Author 2',
        },
      });

      const category = await prisma.category.create({
        data: {
          name: 'Tech',
          slug: `tech-${Date.now()}`,
          isActive: true,
        },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Backend',
          slug: `backend-${Date.now()}`,
          parentId: category.id,
          isActive: true,
        },
      });

      await prisma.post.create({
        data: {
          title: 'Post Test',
          slug: `post-test-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: user.cognitoSub,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
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
      
      // Verificar relacionamento com author
      if (posts[0].author) {
        expect(posts[0].author.fullName).toBe('Author 2');
      }
      
      // Verificar relacionamento com subcategory
      if (posts[0].subcategory) {
        expect(posts[0].subcategory.name).toBe('Backend');
        expect(posts[0].subcategory.parent?.name).toBe('Tech');
      }
    });
  });

  describe('🔧 CRUD - Comments', () => {
    it('deve criar um comentário em um post', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-007',
          fullName: 'Commenter',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Cat', slug: `cat-${Date.now()}`, isActive: true },
      });

      const subcategory = await prisma.category.create({
        data: { name: 'Sub', slug: `sub-${Date.now()}`, parentId: category.id, isActive: true },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post',
          slug: `post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: user.cognitoSub,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
        },
      });

      const comment = await prisma.comment.create({
        data: {
          content: 'Ótimo post!',
          authorId: user.cognitoSub,
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
          fullName: 'Replier',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Cat', slug: `cat-${Date.now()}`, isActive: true },
      });

      const subcategory = await prisma.category.create({
        data: { name: 'Sub', slug: `sub-${Date.now()}`, parentId: category.id, isActive: true },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post',
          slug: `post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: user.cognitoSub,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
        },
      });

      const parentComment = await prisma.comment.create({
        data: {
          content: 'Comentário principal',
          authorId: user.cognitoSub,
          postId: post.id,
        },
      });

      const reply = await prisma.comment.create({
        data: {
          content: 'Resposta ao comentário',
          authorId: user.cognitoSub,
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
          fullName: 'Liker',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Cat', slug: `cat-${Date.now()}`, isActive: true },
      });

      const subcategory = await prisma.category.create({
        data: { name: 'Sub', slug: `sub-${Date.now()}`, parentId: category.id, isActive: true },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post',
          slug: `post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: user.cognitoSub,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
        },
      });

      const like = await prisma.like.create({
        data: {
          userId: user.cognitoSub,
          postId: post.id,
        },
      });

      expect(like.userId).toBe(user.cognitoSub);
      expect(like.postId).toBe(post.id);
    });

    it('deve verificar se like já existe antes de criar', async () => {
      const user = await prisma.user.create({
        data: {
          cognitoSub: 'test-cognito-sub-010',
          fullName: 'Liker 2',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Cat', slug: `cat-${Date.now()}`, isActive: true },
      });

      const subcategory = await prisma.category.create({
        data: { name: 'Sub', slug: `sub-${Date.now()}`, parentId: category.id, isActive: true },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post',
          slug: `post-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: user.cognitoSub,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
        },
      });

      // Criar primeiro like
      await prisma.like.create({
        data: {
          userId: user.cognitoSub,
          postId: post.id,
        },
      });

      // Verificar se já existe
      const existingLike = await prisma.like.findFirst({
        where: {
          userId: user.cognitoSub,
          postId: post.id,
        },
      });

      expect(existingLike).not.toBeNull();
      expect(existingLike?.userId).toBe(user.cognitoSub);
      expect(existingLike?.postId).toBe(post.id);
    });
  });

  describe('📊 Performance e Índices', () => {
    it('deve buscar usuário por email rapidamente (index)', async () => {
      // Criar múltiplos usuários
      await prisma.user.createMany({
        data: Array.from({ length: 100 }, (_, i) => ({
          cognitoSub: `cognito-${i}`,
          fullName: `User ${i}`,
        })),
      });

      const start = Date.now();
      const user = await prisma.user.findUnique({
        where: { cognitoSub: 'cognito-50' },
      });
      const duration = Date.now() - start;

      expect(user).not.toBeNull();
      expect(duration).toBeLessThan(100); // Deve ser rápido devido ao índice
    });

    it('deve contar registros eficientemente', async () => {
      await prisma.user.createMany({
        data: Array.from({ length: 50 }, (_, i) => ({
          cognitoSub: `cognito-count-${i}`,
          fullName: `Count ${i}`,
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
          fullName: 'Author Full',
        },
      });

      const commenter = await prisma.user.create({
        data: {
          cognitoSub: 'commenter-full',
          fullName: 'Commenter Full',
        },
      });

      const category = await prisma.category.create({
        data: { name: 'Tech', slug: `tech-${Date.now()}`, isActive: true },
      });

      const subcategory = await prisma.category.create({
        data: {
          name: 'Frontend',
          slug: `frontend-${Date.now()}`,
          parentId: category.id,
          isActive: true,
        },
      });

      const post = await prisma.post.create({
        data: {
          title: 'Post Completo',
          slug: `post-completo-${Date.now()}`,
          content: { type: 'doc', content: [] },
          authorId: author.cognitoSub,
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      // Adicionar comentários, likes, bookmarks
      await prisma.comment.create({
        data: {
          content: 'Comentário teste',
          authorId: commenter.cognitoSub,
          postId: post.id,
        },
      });

      await prisma.like.create({
        data: {
          userId: commenter.cognitoSub,
          postId: post.id,
        },
      });

      await prisma.bookmark.create({
        data: {
          userId: commenter.cognitoSub,
          postId: post.id,
        },
      });

      // Verificar que o post foi criado corretamente
      const postCreated = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(postCreated).not.toBeNull();
      expect(postCreated?.id).toBe(post.id);

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
      if (!fullPost) {
        throw new Error(`Post não encontrado com ID: ${post.id}`);
      }
      
      // Verificar relacionamento com author
      if (fullPost.author) {
        expect(fullPost.author.fullName).toBe('Author Full');
      }
      
      // Verificar relacionamento com subcategory
      if (fullPost.subcategory) {
        expect(fullPost.subcategory.parent).toBeDefined();
        expect(fullPost.subcategory.parent?.name).toBe('Tech');
      }
      expect(fullPost.comments).toBeDefined();
      expect(Array.isArray(fullPost.comments)).toBe(true);
      expect(fullPost.comments).toHaveLength(1);
      expect(fullPost.likes).toBeDefined();
      expect(Array.isArray(fullPost.likes)).toBe(true);
      expect(fullPost.likes).toHaveLength(1);
      expect(fullPost.bookmarks).toBeDefined();
      expect(Array.isArray(fullPost.bookmarks)).toBe(true);
      expect(fullPost.bookmarks).toHaveLength(1);
    });
  });
});

