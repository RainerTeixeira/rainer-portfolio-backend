/**
 * Testes Unitários: Posts Service
 * 
 * Testa toda a lógica de negócio do serviço de posts.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PostsService } from '../../../src/modules/posts/posts.service';
import { PostsRepository } from '../../../src/modules/posts/posts.repository';
import { createMockPost } from '../../helpers/mocks';

describe('PostsService', () => {
  let service: PostsService;
  let repository: jest.Mocked<PostsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findMany: jest.fn(),
            findBySubcategory: jest.fn(),
            findByAuthor: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            incrementViews: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repository = module.get(PostsRepository) as jest.Mocked<PostsRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    const createData = {
      title: 'Test Post',
      slug: 'test-post',
      content: 'Test content',
      subcategoryId: 'subcat-123',
      authorId: 'user-123',
    };

    it('deve criar post com sucesso', async () => {
      const mockPost = createMockPost(createData);
      repository.create.mockResolvedValue(mockPost);

      const result = await service.createPost(createData);

      expect(repository.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockPost);
    });

    it('deve lançar BadRequestException quando conteúdo está ausente', async () => {
      const invalidData = { ...createData, content: '' };

      await expect(service.createPost(invalidData as any)).rejects.toThrow(BadRequestException);
      await expect(service.createPost(invalidData as any)).rejects.toThrow('Conteúdo do post é obrigatório');
    });

    it('deve lançar BadRequestException quando subcategoria está ausente', async () => {
      const invalidData = { ...createData, subcategoryId: '' };

      await expect(service.createPost(invalidData as any)).rejects.toThrow(BadRequestException);
      await expect(service.createPost(invalidData as any)).rejects.toThrow('Subcategoria é obrigatória');
    });

    it('deve lançar BadRequestException quando autor está ausente', async () => {
      const invalidData = { ...createData, authorId: '' };

      await expect(service.createPost(invalidData as any)).rejects.toThrow(BadRequestException);
      await expect(service.createPost(invalidData as any)).rejects.toThrow('Autor é obrigatório');
    });
  });

  describe('getPostById', () => {
    it('deve buscar post por ID com sucesso', async () => {
      const mockPost = createMockPost();
      repository.findById.mockResolvedValue(mockPost as any);
      repository.incrementViews.mockResolvedValue(undefined);

      const result = await service.getPostById('post-123');

      expect(repository.findById).toHaveBeenCalledWith('post-123');
      expect(result).toEqual(mockPost);
    });

    it('deve incrementar views de forma assíncrona', async () => {
      const mockPost = createMockPost();
      repository.findById.mockResolvedValue(mockPost as any);
      repository.incrementViews.mockResolvedValue(undefined);

      await service.getPostById('post-123');

      // Aguardar a chamada assíncrona
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(repository.incrementViews).toHaveBeenCalledWith('post-123');
    });

    it('deve lançar NotFoundException quando post não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getPostById('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.getPostById('invalid-id')).rejects.toThrow('Post com ID invalid-id não encontrado');
    });

    it('deve continuar mesmo se incrementViews falhar', async () => {
      const mockPost = createMockPost();
      repository.findById.mockResolvedValue(mockPost as any);
      repository.incrementViews.mockRejectedValue(new Error('DB Error'));

      const result = await service.getPostById('post-123');

      expect(result).toEqual(mockPost);
    });
  });

  describe('getPostBySlug', () => {
    it('deve buscar post por slug com sucesso', async () => {
      const mockPost = createMockPost();
      repository.findBySlug.mockResolvedValue(mockPost);

      const result = await service.getPostBySlug('test-post');

      expect(repository.findBySlug).toHaveBeenCalledWith('test-post');
      expect(result).toEqual(mockPost);
    });

    it('deve lançar NotFoundException quando slug não existe', async () => {
      repository.findBySlug.mockResolvedValue(null);

      await expect(service.getPostBySlug('invalid-slug')).rejects.toThrow(NotFoundException);
      await expect(service.getPostBySlug('invalid-slug')).rejects.toThrow('Post com slug "invalid-slug" não encontrado');
    });
  });

  describe('listPosts', () => {
    it('deve listar posts sem filtros', async () => {
      const mockPosts = [createMockPost(), createMockPost({ id: 'post-456' })];
      const mockResult = {
        posts: mockPosts,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      repository.findMany.mockResolvedValue(mockResult);

      const result = await service.listPosts();

      expect(repository.findMany).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });

    it('deve listar posts com filtros e paginação', async () => {
      const mockPosts = [createMockPost()];
      const mockResult = {
        posts: mockPosts,
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      };

      repository.findMany.mockResolvedValue(mockResult);

      const params = {
        page: 2,
        limit: 5,
        status: 'PUBLISHED',
        subcategoryId: 'subcat-123',
        authorId: 'user-123',
        featured: true,
      };

      const result = await service.listPosts(params);

      expect(repository.findMany).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updatePost', () => {
    const updateData = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('deve atualizar post com sucesso', async () => {
      const mockPost = createMockPost();
      const updatedPost = createMockPost(updateData);

      repository.findById.mockResolvedValue(mockPost as any);
      repository.update.mockResolvedValue(updatedPost);
      repository.incrementViews.mockResolvedValue(undefined);

      const result = await service.updatePost('post-123', updateData);

      expect(repository.findById).toHaveBeenCalledWith('post-123');
      expect(repository.update).toHaveBeenCalledWith('post-123', updateData);
      expect(result).toEqual(updatedPost);
    });

    it('deve lançar NotFoundException quando post não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.updatePost('invalid-id', updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePost', () => {
    it('deve deletar post com sucesso', async () => {
      const mockPost = createMockPost();
      repository.findById.mockResolvedValue(mockPost as any);
      repository.delete.mockResolvedValue(true);
      repository.incrementViews.mockResolvedValue(undefined);

      const result = await service.deletePost('post-123');

      expect(repository.findById).toHaveBeenCalledWith('post-123');
      expect(repository.delete).toHaveBeenCalledWith('post-123');
      expect(result).toEqual({
        success: true,
        message: 'Post deletado com sucesso',
      });
    });

    it('deve lançar NotFoundException quando post não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deletePost('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publishPost', () => {
    it('deve publicar post com sucesso', async () => {
      const { PostStatus } = require('../../../src/modules/posts/post.model');
      const mockPost = createMockPost({ status: PostStatus.PUBLISHED });
      repository.update.mockResolvedValue(mockPost);

      const result = await service.publishPost('post-123');

      expect(repository.update).toHaveBeenCalledWith('post-123', {
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('unpublishPost', () => {
    it('deve despublicar post com sucesso', async () => {
      const { PostStatus } = require('../../../src/modules/posts/post.model');
      const mockPost = createMockPost({ status: PostStatus.DRAFT, publishedAt: null as any });
      repository.update.mockResolvedValue(mockPost);

      const result = await service.unpublishPost('post-123');

      expect(repository.update).toHaveBeenCalledWith('post-123', {
        status: 'DRAFT',
        publishedAt: null,
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('getPostsBySubcategory', () => {
    it('deve buscar posts por subcategoria com sucesso', async () => {
      const mockPosts = [createMockPost(), createMockPost({ id: 'post-456' })];
      repository.findBySubcategory.mockResolvedValue(mockPosts);

      const result = await service.getPostsBySubcategory('subcat-123');

      expect(repository.findBySubcategory).toHaveBeenCalledWith('subcat-123');
      expect(result).toEqual(mockPosts);
    });
  });

  describe('getPostsByAuthor', () => {
    it('deve buscar posts por autor com sucesso', async () => {
      const mockPosts = [createMockPost(), createMockPost({ id: 'post-456' })];
      repository.findByAuthor.mockResolvedValue(mockPosts);

      const result = await service.getPostsByAuthor('user-123');

      expect(repository.findByAuthor).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockPosts);
    });
  });
});

