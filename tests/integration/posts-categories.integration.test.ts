/**
 * Testes de Integração: Posts + Categories
 * 
 * Testa a integração entre posts e categorias/subcategorias.
 * Valida a hierarquia de categorias (2 níveis) e relações com posts.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../../src/modules/posts/posts.service';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { PostsRepository } from '../../src/modules/posts/posts.repository';
import { CategoriesRepository } from '../../src/modules/categories/categories.repository';
import { PostStatus } from '../../src/modules/posts/post.model';

describe('Posts + Categories Integration', () => {
  let postsService: PostsService;
  let categoriesService: CategoriesService;
  let postsRepository: jest.Mocked<PostsRepository>;
  let categoriesRepository: jest.Mocked<CategoriesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        CategoriesService,
        {
          provide: PostsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findByAuthor: jest.fn(),
            findBySubcategory: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            incrementViews: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CategoriesRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findMainCategories: jest.fn(),
            findSubcategories: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    postsService = module.get<PostsService>(PostsService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    postsRepository = module.get(PostsRepository) as jest.Mocked<PostsRepository>;
    categoriesRepository = module.get(CategoriesRepository) as jest.Mocked<CategoriesRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fluxo Completo: Categoria → Subcategoria → Post', () => {
    it('deve criar categoria principal, subcategoria e post em sequência', async () => {
      const categoryId = 'cat-123';
      const subcategoryId = 'subcat-123';
      const postId = 'post-123';

      // 1. Criar categoria principal (Tecnologia)
      const mockCategory = {
        id: categoryId,
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Categoria de tecnologia',
        parentId: null,
        isActive: true,
        postsCount: 0,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      categoriesRepository.create.mockResolvedValue(mockCategory as any);

      const category = await categoriesService.createCategory({
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Categoria de tecnologia',
      });
      expect(category.id).toBe(categoryId);
      expect(category.parentId).toBeNull();

      // 2. Criar subcategoria (Frontend)
      const mockSubcategory = {
        id: subcategoryId,
        name: 'Frontend',
        slug: 'frontend',
        description: 'Desenvolvimento Frontend',
        parentId: categoryId,
        isActive: true,
        postsCount: 0,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      categoriesRepository.create.mockResolvedValue(mockSubcategory as any);

      const subcategory = await categoriesService.createCategory({
        name: 'Frontend',
        slug: 'frontend',
        description: 'Desenvolvimento Frontend',
        parentId: categoryId,
      });
      expect(subcategory.id).toBe(subcategoryId);
      expect(subcategory.parentId).toBe(categoryId);

      // 3. Criar post na subcategoria
      const mockPost = {
        id: postId,
        title: 'Introdução ao React',
        slug: 'introducao-react',
        content: { type: 'doc', content: [] },
        subcategoryId,
        authorId: 'author-123',
        status: PostStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      postsRepository.create.mockResolvedValue(mockPost as any);

      const post = await postsService.createPost({
        title: 'Introdução ao React',
        slug: 'introducao-react',
        content: { type: 'doc', content: [] },
        subcategoryId,
        authorId: 'author-123',
      });

      expect(post.id).toBe(postId);
      expect(post.subcategoryId).toBe(subcategoryId);
    });
  });

  describe('Hierarquia de Categorias', () => {
    it('deve listar categorias principais (sem parentId)', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Tecnologia',
          slug: 'tecnologia',
          parentId: null,
          isActive: true,
          order: 0,
        },
        {
          id: 'cat-2',
          name: 'Culinária',
          slug: 'culinaria',
          parentId: null,
          isActive: true,
          order: 1,
        },
      ];

      categoriesRepository.findMainCategories.mockResolvedValue(mockCategories as any);

      const categories = await categoriesService.listMainCategories();

      expect(categories).toHaveLength(2);
      categories.forEach(cat => {
        expect(cat.parentId).toBeNull();
      });
    });

    it('deve listar subcategorias de uma categoria principal', async () => {
      const parentId = 'cat-123';
      const mockSubcategories = [
        {
          id: 'subcat-1',
          name: 'Frontend',
          slug: 'frontend',
          parentId,
          isActive: true,
          order: 0,
        },
        {
          id: 'subcat-2',
          name: 'Backend',
          slug: 'backend',
          parentId,
          isActive: true,
          order: 1,
        },
        {
          id: 'subcat-3',
          name: 'DevOps',
          slug: 'devops',
          parentId,
          isActive: true,
          order: 2,
        },
      ];

      categoriesRepository.findSubcategories.mockResolvedValue(mockSubcategories as any);

      const subcategories = await categoriesService.listSubcategories(parentId);

      expect(subcategories).toHaveLength(3);
      subcategories.forEach(sub => {
        expect(sub.parentId).toBe(parentId);
      });
    });
  });

  describe('Posts por Subcategoria', () => {
    it('deve listar todos os posts de uma subcategoria', async () => {
      const subcategoryId = 'subcat-frontend';
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Introdução ao React',
          slug: 'intro-react',
          subcategoryId,
          status: PostStatus.PUBLISHED,
        },
        {
          id: 'post-2',
          title: 'Vue.js do Zero',
          slug: 'vue-do-zero',
          subcategoryId,
          status: PostStatus.PUBLISHED,
        },
        {
          id: 'post-3',
          title: 'Angular Avançado',
          slug: 'angular-avancado',
          subcategoryId,
          status: PostStatus.DRAFT,
        },
      ];

      postsRepository.findBySubcategory.mockResolvedValue(mockPosts as any);

      const posts = await postsService.getPostsBySubcategory(subcategoryId);

      expect(posts).toHaveLength(3);
      posts.forEach(post => {
        expect(post.subcategoryId).toBe(subcategoryId);
      });
    });

    it('deve retornar array vazio se subcategoria não tem posts', async () => {
      const subcategoryId = 'subcat-empty';

      postsRepository.findBySubcategory.mockResolvedValue([]);

      const posts = await postsService.getPostsBySubcategory(subcategoryId);

      expect(posts).toHaveLength(0);
    });
  });

  describe('Publicação de Posts', () => {
    it('deve publicar um post (DRAFT → PUBLISHED)', async () => {
      const postId = 'post-123';
      const publishedPost = {
        id: postId,
        title: 'Meu Post',
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      };

      postsRepository.update.mockResolvedValue(publishedPost as any);

      const result = await postsService.publishPost(postId);

      expect(result.status).toBe(PostStatus.PUBLISHED);
      expect(result.publishedAt).toBeDefined();
      expect(postsRepository.update).toHaveBeenCalledWith(
        postId,
        expect.objectContaining({
          status: PostStatus.PUBLISHED,
          publishedAt: expect.any(Date),
        })
      );
    });

    it('deve despublicar um post (PUBLISHED → DRAFT)', async () => {
      const postId = 'post-123';
      const draftPost = {
        id: postId,
        title: 'Meu Post',
        status: PostStatus.DRAFT,
        publishedAt: null,
      };

      postsRepository.update.mockResolvedValue(draftPost as any);

      const result = await postsService.unpublishPost(postId);

      expect(result.status).toBe(PostStatus.DRAFT);
      expect(result.publishedAt).toBeNull();
      expect(postsRepository.update).toHaveBeenCalledWith(
        postId,
        expect.objectContaining({
          status: PostStatus.DRAFT,
          publishedAt: null,
        })
      );
    });
  });

  describe('Filtros de Posts por Categoria e Status', () => {
    it('deve listar posts publicados de uma subcategoria específica', async () => {
      const subcategoryId = 'subcat-123';
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Post 1',
          subcategoryId,
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        {
          id: 'post-2',
          title: 'Post 2',
          subcategoryId,
          status: PostStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      ];

      postsRepository.findMany.mockResolvedValue({
        posts: mockPosts as any,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

      const result = await postsService.listPosts({
        subcategoryId,
        status: PostStatus.PUBLISHED,
      });

      expect(result.posts).toHaveLength(2);
      result.posts.forEach(post => {
        expect(post.subcategoryId).toBe(subcategoryId);
        expect(post.status).toBe(PostStatus.PUBLISHED);
      });
    });

    it('deve listar posts em destaque (featured)', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Featured Post 1',
          featured: true,
          status: PostStatus.PUBLISHED,
        },
        {
          id: 'post-2',
          title: 'Featured Post 2',
          featured: true,
          status: PostStatus.PUBLISHED,
        },
      ];

      postsRepository.findMany.mockResolvedValue({
        posts: mockPosts as any,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

      const result = await postsService.listPosts({
        featured: true,
        status: PostStatus.PUBLISHED,
      });

      expect(result.posts).toHaveLength(2);
      result.posts.forEach(post => {
        expect(post.featured).toBe(true);
      });
    });
  });

  describe('Busca de Categoria por Slug', () => {
    it('deve buscar categoria por slug', async () => {
      const slug = 'tecnologia';
      const mockCategory = {
        id: 'cat-123',
        name: 'Tecnologia',
        slug,
        parentId: null,
        isActive: true,
      };

      categoriesRepository.findBySlug.mockResolvedValue(mockCategory as any);

      const category = await categoriesService.getCategoryBySlug(slug);

      expect(category.slug).toBe(slug);
      expect(categoriesRepository.findBySlug).toHaveBeenCalledWith(slug);
    });

    it('deve lançar erro se categoria não encontrada por slug', async () => {
      const slug = 'inexistente';

      categoriesRepository.findBySlug.mockResolvedValue(null);

      await expect(categoriesService.getCategoryBySlug(slug))
        .rejects
        .toThrow('Categoria não encontrada');
    });
  });

  describe('Atualização de Categorias', () => {
    it('deve atualizar dados de uma categoria', async () => {
      const categoryId = 'cat-123';
      const existingCategory = {
        id: categoryId,
        name: 'Tecnologia',
        slug: 'tecnologia',
      };
      const updatedCategory = {
        id: categoryId,
        name: 'Tecnologia & Inovação',
        slug: 'tecnologia-inovacao',
        description: 'Nova descrição',
      };

      categoriesRepository.findById.mockResolvedValue(existingCategory as any);
      categoriesRepository.update.mockResolvedValue(updatedCategory as any);

      const result = await categoriesService.updateCategory(categoryId, {
        name: 'Tecnologia & Inovação',
        slug: 'tecnologia-inovacao',
        description: 'Nova descrição',
      });

      expect(result.name).toBe('Tecnologia & Inovação');
      expect(categoriesRepository.update).toHaveBeenCalledWith(
        categoryId,
        expect.objectContaining({
          name: 'Tecnologia & Inovação',
          slug: 'tecnologia-inovacao',
        })
      );
    });
  });

  describe('Validações de Posts', () => {
    it('deve lançar erro ao criar post sem subcategoria', async () => {
      await expect(postsService.createPost({
        title: 'Post sem categoria',
        slug: 'post-sem-categoria',
        content: { type: 'doc', content: [] },
        authorId: 'author-123',
        subcategoryId: '', // Vazio
      })).rejects.toThrow('Subcategoria é obrigatória');
    });

    it('deve lançar erro ao criar post sem conteúdo', async () => {
      await expect(postsService.createPost({
        title: 'Post sem conteúdo',
        slug: 'post-sem-conteudo',
        content: null as any,
        authorId: 'author-123',
        subcategoryId: 'subcat-123',
      })).rejects.toThrow('Conteúdo do post é obrigatório');
    });

    it('deve lançar erro ao criar post sem autor', async () => {
      await expect(postsService.createPost({
        title: 'Post sem autor',
        slug: 'post-sem-autor',
        content: { type: 'doc', content: [] },
        authorId: '', // Vazio
        subcategoryId: 'subcat-123',
      })).rejects.toThrow('Autor é obrigatório');
    });
  });

  describe('Incremento de Views', () => {
    it('deve incrementar views ao buscar post por ID', async () => {
      const postId = 'post-123';
      const mockPost = {
        id: postId,
        title: 'Post Test',
        views: 10,
      };

      postsRepository.findById.mockResolvedValue(mockPost as any);

      const post = await postsService.getPostById(postId);

      expect(post.id).toBe(postId);
      // O incremento é chamado de forma assíncrona
      expect(postsRepository.incrementViews).toHaveBeenCalledWith(postId);
    });
  });
});

