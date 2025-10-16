/**
 * Testes Unitários: Likes Service
 * 
 * Testa a lógica de negócio de likes em posts.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { LikesService } from '../../../src/modules/likes/likes.service';
import { LikesRepository } from '../../../src/modules/likes/likes.repository';

describe('LikesService', () => {
  let service: LikesService;
  let repository: jest.Mocked<LikesRepository>;

  const mockLike = {
    id: 'like-123',
    userId: 'user-123',
    postId: 'post-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: LikesRepository,
          useValue: {
            create: jest.fn(),
            findByUserAndPost: jest.fn(),
            findByPost: jest.fn(),
            findByUser: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    repository = module.get(LikesRepository) as jest.Mocked<LikesRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('likePost', () => {
    it('deve curtir post com sucesso', async () => {
      const likeData = {
        userId: 'user-123',
        postId: 'post-123',
      };

      repository.findByUserAndPost.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockLike);

      const result = await service.likePost(likeData);

      expect(repository.findByUserAndPost).toHaveBeenCalledWith('user-123', 'post-123');
      expect(repository.create).toHaveBeenCalledWith(likeData);
      expect(result).toEqual(mockLike);
    });

    it('deve lançar ConflictException se já curtiu', async () => {
      const likeData = {
        userId: 'user-123',
        postId: 'post-123',
      };

      const existingLike = { ...mockLike };
      repository.findByUserAndPost.mockResolvedValue(existingLike);

      await expect(service.likePost(likeData)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('unlikePost', () => {
    it('deve descurtir post com sucesso', async () => {
      repository.findByUserAndPost.mockResolvedValue(mockLike);
      repository.delete.mockResolvedValue(true);

      const result = await service.unlikePost('user-123', 'post-123');

      expect(repository.findByUserAndPost).toHaveBeenCalledWith('user-123', 'post-123');
      expect(repository.delete).toHaveBeenCalledWith('user-123', 'post-123');
      expect(result).toEqual({ success: true });
    });

    it('deve lançar ConflictException se não curtiu', async () => {
      repository.findByUserAndPost.mockResolvedValue(null);

      await expect(service.unlikePost('user-123', 'post-123')).rejects.toThrow(ConflictException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getLikesByPost', () => {
    it('deve buscar likes do post', async () => {
      const mockLikes = [mockLike];
      repository.findByPost.mockResolvedValue(mockLikes);

      const result = await service.getLikesByPost('post-123');

      expect(repository.findByPost).toHaveBeenCalledWith('post-123');
      expect(result).toEqual(mockLikes);
    });
  });

  describe('getLikesByUser', () => {
    it('deve buscar likes do usuário', async () => {
      const mockLikes = [mockLike];
      repository.findByUser.mockResolvedValue(mockLikes);

      const result = await service.getLikesByUser('user-123');

      expect(repository.findByUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockLikes);
    });
  });

  describe('getLikesCount', () => {
    it('deve contar likes do post', async () => {
      repository.count.mockResolvedValue(42);

      const result = await service.getLikesCount('post-123');

      expect(repository.count).toHaveBeenCalledWith('post-123');
      expect(result).toEqual({ postId: 'post-123', count: 42 });
    });
  });

  describe('hasUserLiked', () => {
    it('deve retornar true se usuário curtiu', async () => {
      repository.findByUserAndPost.mockResolvedValue(mockLike);

      const result = await service.hasUserLiked('user-123', 'post-123');

      expect(result).toEqual({ hasLiked: true });
    });

    it('deve retornar false se usuário não curtiu', async () => {
      repository.findByUserAndPost.mockResolvedValue(null);

      const result = await service.hasUserLiked('user-123', 'post-123');

      expect(result).toEqual({ hasLiked: false });
    });
  });
});
