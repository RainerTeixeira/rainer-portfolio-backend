/**
 * Testes Unitários: Posts Controller
 * 
 * Testa todos os endpoints do controller de posts.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../../../src/modules/posts/posts.controller';
import { PostsService } from '../../../src/modules/posts/posts.service';
import { createMockPost } from '../../helpers/mocks';

describe('PostsController', () => {
  let controller: PostsController;
  let service: jest.Mocked<PostsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            createPost: jest.fn(),
            listPosts: jest.fn(),
            getPostById: jest.fn(),
            getPostBySlug: jest.fn(),
            getPostsBySubcategory: jest.fn(),
            getPostsByAuthor: jest.fn(),
            updatePost: jest.fn(),
            deletePost: jest.fn(),
            publishPost: jest.fn(),
            unpublishPost: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get(PostsService) as jest.Mocked<PostsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar post com sucesso', async () => {
      const createData = {
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        subcategoryId: 'subcat-123',
        authorId: 'cognito-user-123',
      };

      const mockPost = createMockPost();
      service.createPost.mockResolvedValue(mockPost);

      const result = await controller.create(createData);

      expect(service.createPost).toHaveBeenCalledWith(createData);
      expect(result).toEqual({
        success: true,
        message: 'Post criado com sucesso',
        data: mockPost,
      });
    });
  });

  describe('list', () => {
    it('deve listar posts sem filtros', async () => {
      const mockResult = {
        posts: [createMockPost()],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      service.listPosts.mockResolvedValue(mockResult);

      const result = await controller.list();

      expect(service.listPosts).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        status: undefined,
        subcategoryId: undefined,
        authorId: undefined,
        featured: undefined,
      });
      expect(result).toEqual({
        success: true,
        ...mockResult,
      });
    });

    it('deve listar posts com todos os filtros', async () => {
      const mockResult = {
        posts: [createMockPost()],
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      };

      service.listPosts.mockResolvedValue(mockResult);

      const result = await controller.list(2, 5, 'PUBLISHED', 'subcat-123', 'user-123', true);

      expect(service.listPosts).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        status: 'PUBLISHED',
        subcategoryId: 'subcat-123',
        authorId: 'user-123',
        featured: true,
      });
      expect(result).toEqual({
        success: true,
        ...mockResult,
      });
    });
  });

  describe('findById', () => {
    it('deve buscar post por ID com sucesso', async () => {
      const mockPost = createMockPost();
      service.getPostById.mockResolvedValue(mockPost as any);

      const result = await controller.findById('post-123');

      expect(service.getPostById).toHaveBeenCalledWith('post-123');
      expect(result).toEqual({
        success: true,
        data: mockPost,
      });
    });
  });

  describe('findBySlug', () => {
    it('deve buscar post por slug com sucesso', async () => {
      const mockPost = createMockPost();
      service.getPostBySlug.mockResolvedValue(mockPost);

      const result = await controller.findBySlug('test-post');

      expect(service.getPostBySlug).toHaveBeenCalledWith('test-post');
      expect(result).toEqual({
        success: true,
        data: mockPost,
      });
    });
  });

  describe('getBySubcategory', () => {
    it('deve listar posts por subcategoria com sucesso', async () => {
      const mockPosts = [createMockPost(), createMockPost({ id: 'post-456' })];
      service.getPostsBySubcategory.mockResolvedValue(mockPosts);

      const result = await controller.getBySubcategory('subcat-123');

      expect(service.getPostsBySubcategory).toHaveBeenCalledWith('subcat-123');
      expect(result).toEqual({
        success: true,
        data: mockPosts,
        count: 2,
      });
    });
  });

  describe('getByAuthor', () => {
    it('deve listar posts por autor com sucesso', async () => {
      const mockPosts = [createMockPost()];
      service.getPostsByAuthor.mockResolvedValue(mockPosts);

      const result = await controller.getByAuthor('user-123');

      expect(service.getPostsByAuthor).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        success: true,
        data: mockPosts,
        count: 1,
      });
    });
  });

  describe('update', () => {
    it('deve atualizar post com sucesso', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const mockPost = createMockPost(updateData);
      service.updatePost.mockResolvedValue(mockPost);

      const result = await controller.update('post-123', updateData);

      expect(service.updatePost).toHaveBeenCalledWith('post-123', updateData);
      expect(result).toEqual({
        success: true,
        message: 'Post atualizado com sucesso',
        data: mockPost,
      });
    });
  });

  describe('delete', () => {
    it('deve deletar post com sucesso', async () => {
      const mockResult = {
        success: true,
        message: 'Post deletado com sucesso',
      };

      service.deletePost.mockResolvedValue(mockResult);

      const result = await controller.delete('post-123');

      expect(service.deletePost).toHaveBeenCalledWith('post-123');
      expect(result).toEqual(mockResult);
    });
  });

  describe('publish', () => {
    it('deve publicar post com sucesso', async () => {
      const { PostStatus } = require('../../../src/modules/posts/post.model');
      const mockPost = createMockPost({ status: PostStatus.PUBLISHED });
      service.publishPost.mockResolvedValue(mockPost);

      const result = await controller.publish('post-123');

      expect(service.publishPost).toHaveBeenCalledWith('post-123');
      expect(result).toEqual({
        success: true,
        message: 'Post publicado com sucesso',
        data: mockPost,
      });
    });
  });

  describe('unpublish', () => {
    it('deve despublicar post com sucesso', async () => {
      const { PostStatus } = require('../../../src/modules/posts/post.model');
      const mockPost = createMockPost({ status: PostStatus.DRAFT });
      service.unpublishPost.mockResolvedValue(mockPost);

      const result = await controller.unpublish('post-123');

      expect(service.unpublishPost).toHaveBeenCalledWith('post-123');
      expect(result).toEqual({
        success: true,
        message: 'Post despublicado com sucesso',
        data: mockPost,
      });
    });
  });
});

