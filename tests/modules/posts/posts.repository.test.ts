/**
 * Testes Unitários: Posts Repository
 * 
 * Testa todas as operações do repositório de posts.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PostsRepository } from '../../../src/modules/posts/posts.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { PostStatus } from '../../../src/modules/posts/post.model';

describe('PostsRepository', () => {
  let repository: PostsRepository;
  let prisma: jest.Mocked<PrismaService>;
  let loggerSpy: jest.SpyInstance;

  const mockPost = {
    id: 'post-123',
    title: 'Post de teste',
    slug: 'post-de-teste',
    content: 'Conteúdo do post',
    status: 'PUBLISHED',
    authorId: 'user-123',
    subcategoryId: 'subcat-123',
    featured: false,
    allowComments: true,
    pinned: false,
    priority: 0,
    views: 0,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPostWithRelations = {
    ...mockPost,
    author: {
      id: 'user-123',
      name: 'Test User',
      username: 'testuser',
      avatar: null,
    },
    subcategory: {
      id: 'subcat-123',
      name: 'JavaScript',
      slug: 'javascript',
      color: '#f0db4f',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsRepository,
        {
          provide: PrismaService,
          useValue: {
            post: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<PostsRepository>(PostsRepository);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Spy no logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(repository).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve criar post com sucesso', async () => {
      const createData = {
        title: 'Post de teste',
        slug: 'post-de-teste',
        content: 'Conteúdo do post',
        authorId: 'user-123',
        subcategoryId: 'subcat-123',
      };

      (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await repository.create(createData);

      expect(prisma.post.create).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
      expect(loggerSpy).toHaveBeenCalledWith('Creating post: Post de teste');
    });

    it('deve usar valores padrão quando não fornecidos', async () => {
      const createData = {
        title: 'Post de teste',
        slug: 'post-de-teste',
        content: 'Conteúdo',
        authorId: 'user-123',
        subcategoryId: 'subcat-123',
      };

      await repository.create(createData);

      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
            featured: false,
            allowComments: true,
            pinned: false,
            priority: 0,
          }),
        })
      );
    });

    it('deve criar post com publishedAt quando fornecido', async () => {
      const publishedDate = '2024-01-15T00:00:00Z';
      const createData = {
        title: 'Published Post',
        slug: 'published-post',
        content: 'Content',
        authorId: 'user-123',
        subcategoryId: 'subcat-123',
        publishedAt: publishedDate,
      };

      (prisma.post.create as jest.Mock).mockResolvedValue({
        ...mockPost,
        publishedAt: new Date(publishedDate),
      });

      const result = await repository.create(createData);

      const callArg = (prisma.post.create as jest.Mock).mock.calls[0][0];
      expect(callArg.data.publishedAt).toBeInstanceOf(Date);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('deve criar post com publishedAt null quando não fornecido', async () => {
      const createData = {
        title: 'Draft Post',
        slug: 'draft-post',
        content: 'Content',
        authorId: 'user-123',
        subcategoryId: 'subcat-123',
        // publishedAt não fornecido
      };

      (prisma.post.create as jest.Mock).mockResolvedValue({
        ...mockPost,
        publishedAt: null,
      });

      await repository.create(createData);

      const callArg = (prisma.post.create as jest.Mock).mock.calls[0][0];
      expect(callArg.data.publishedAt).toBeNull();
    });

    it('deve respeitar valores fornecidos', async () => {
      const createData = {
        title: 'Post Featured',
        slug: 'post-featured',
        content: 'Conteúdo',
        authorId: 'user-123',
        subcategoryId: 'subcat-123',
        status: PostStatus.PUBLISHED,
        featured: true,
        pinned: true,
        priority: 5,
      };

      await repository.create(createData);

      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PUBLISHED',
            featured: true,
            pinned: true,
            priority: 5,
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('deve encontrar post por ID com relações', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPostWithRelations);

      const result = await repository.findById('post-123');

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        include: expect.objectContaining({
          author: expect.any(Object),
          subcategory: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockPostWithRelations);
      expect(loggerSpy).toHaveBeenCalledWith('Finding post by ID: post-123');
    });

    it('deve retornar null se post não existe', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });

    it('deve incluir dados do autor', async () => {
      await repository.findById('post-123');

      expect(prisma.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            author: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                username: true,
                avatar: true,
              }),
            }),
          }),
        })
      );
    });
  });

  describe('findBySlug', () => {
    it('deve encontrar post por slug', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(mockPostWithRelations);

      const result = await repository.findBySlug('post-de-teste');

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { slug: 'post-de-teste' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockPostWithRelations);
      expect(loggerSpy).toHaveBeenCalledWith('Finding post by slug: post-de-teste');
    });

    it('deve retornar null se slug não existe', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findBySlug('invalid-slug');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('deve listar posts com paginação padrão', async () => {
      const posts = [mockPostWithRelations];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);
      (prisma.post.count as jest.Mock).mockResolvedValue(1);

      const result = await repository.findMany({});

      expect(result.posts).toEqual(posts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('deve aplicar paginação customizada', async () => {
      const posts = [mockPostWithRelations];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);
      (prisma.post.count as jest.Mock).mockResolvedValue(25);

      const result = await repository.findMany({ page: 2, limit: 5 });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        totalPages: 5,
      });
    });

    it('deve filtrar por status', async () => {
      await repository.findMany({ status: 'PUBLISHED' });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        })
      );
    });

    it('deve filtrar por subcategoryId', async () => {
      await repository.findMany({ subcategoryId: 'subcat-123' });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subcategoryId: 'subcat-123',
          }),
        })
      );
    });

    it('deve filtrar por authorId', async () => {
      await repository.findMany({ authorId: 'user-123' });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 'user-123',
          }),
        })
      );
    });

    it('deve filtrar por featured', async () => {
      await repository.findMany({ featured: true });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            featured: true,
          }),
        })
      );
    });

    it('deve ordenar por createdAt desc', async () => {
      await repository.findMany({});

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('update', () => {
    it('deve atualizar post com sucesso', async () => {
      const updateData = {
        title: 'Título atualizado',
        status: PostStatus.PUBLISHED,
      };

      const updatedPost = { ...mockPost, ...updateData };
      (prisma.post.update as jest.Mock).mockResolvedValue(updatedPost);

      const result = await repository.update('post-123', updateData);

      expect(prisma.post.update).toHaveBeenCalled();
      expect(result).toEqual(updatedPost);
      expect(loggerSpy).toHaveBeenCalledWith('Updating post: post-123');
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const updateData = { title: 'Novo título' };

      await repository.update('post-123', updateData);

      const callArg = (prisma.post.update as jest.Mock).mock.calls[0][0];
      expect(callArg.data).toHaveProperty('title', 'Novo título');
      expect(callArg.data).not.toHaveProperty('content');
    });

    it('deve atualizar publishedAt com null', async () => {
      const updateData = { publishedAt: null };
      
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      await repository.update('post-123', updateData);

      const callArg = (prisma.post.update as jest.Mock).mock.calls[0][0];
      expect(callArg.data.publishedAt).toBeNull();
    });

    it('deve atualizar publishedAt com data válida', async () => {
      const newDate = '2024-01-15T00:00:00Z';
      const updateData = { publishedAt: newDate };
      
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      await repository.update('post-123', updateData);

      const callArg = (prisma.post.update as jest.Mock).mock.calls[0][0];
      expect(callArg.data.publishedAt).toBeInstanceOf(Date);
    });

    it('deve atualizar subcategoryId usando connect', async () => {
      const updateData = { subcategoryId: 'new-subcat-123' };
      
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      await repository.update('post-123', updateData);

      const callArg = (prisma.post.update as jest.Mock).mock.calls[0][0];
      expect(callArg.data.subcategory).toEqual({ connect: { id: 'new-subcat-123' } });
    });

    it('deve atualizar todos os campos opcionais', async () => {
      const updateData = {
        title: 'Novo Título',
        slug: 'novo-titulo',
        content: 'Novo conteúdo',
        status: 'PUBLISHED' as PostStatus,
        featured: true,
        allowComments: false,
        pinned: true,
        priority: 5,
      };
      
      (prisma.post.update as jest.Mock).mockResolvedValue({
        ...mockPost,
        ...updateData,
      });

      const result = await repository.update('post-123', updateData);

      const callArg = (prisma.post.update as jest.Mock).mock.calls[0][0];
      
      // Verificar que todos os campos foram passados
      expect(callArg.data.title).toBe('Novo Título');
      expect(callArg.data.slug).toBe('novo-titulo');
      expect(callArg.data.content).toBe('Novo conteúdo');
      expect(callArg.data.status).toBe('PUBLISHED');
      expect(callArg.data.featured).toBe(true);
      expect(callArg.data.allowComments).toBe(false);
      expect(callArg.data.pinned).toBe(true);
      expect(callArg.data.priority).toBe(5);
      
      expect(result.title).toBe('Novo Título');
    });
  });

  describe('delete', () => {
    it('deve deletar post com sucesso', async () => {
      (prisma.post.delete as jest.Mock).mockResolvedValue(mockPost);

      const result = await repository.delete('post-123');

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-123' },
      });
      expect(result).toBe(true);
      expect(loggerSpy).toHaveBeenCalledWith('Deleting post: post-123');
    });
  });

  describe('incrementViews', () => {
    it('deve incrementar visualizações', async () => {
      (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);

      await repository.incrementViews('post-123');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        data: { views: { increment: 1 } },
      });
    });
  });

  describe('findBySubcategory', () => {
    it('deve buscar posts por subcategoria', async () => {
      const posts = [mockPost];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      const result = await repository.findBySubcategory('subcat-123');

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: {
          subcategoryId: 'subcat-123',
          status: 'PUBLISHED',
        },
        orderBy: { publishedAt: 'desc' },
      });
      expect(result).toEqual(posts);
      expect(loggerSpy).toHaveBeenCalledWith('Finding posts by subcategory: subcat-123');
    });

    it('deve retornar apenas posts publicados', async () => {
      await repository.findBySubcategory('subcat-123');

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        })
      );
    });
  });

  describe('findByAuthor', () => {
    it('deve buscar posts por autor', async () => {
      const posts = [mockPost];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      const result = await repository.findByAuthor('user-123');

      expect(prisma.post.findMany).toHaveBeenCalledWith({
        where: { authorId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(posts);
      expect(loggerSpy).toHaveBeenCalledWith('Finding posts by author: user-123');
    });

    it('deve ordenar por createdAt desc', async () => {
      await repository.findByAuthor('user-123');

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });
});

