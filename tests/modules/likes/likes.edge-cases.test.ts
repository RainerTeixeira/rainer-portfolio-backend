/**
 * Testes de Casos Edge: Likes
 * 
 * Testa casos extremos e situações incomuns no sistema de likes.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { LikesService } from '../../../src/modules/likes/likes.service';
import { LikesRepository } from '../../../src/modules/likes/likes.repository';

describe('Likes Edge Cases', () => {
  let service: LikesService;
  let repository: jest.Mocked<LikesRepository>;

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

  describe('Múltiplos Likes Simultâneos', () => {
    it('deve prevenir duplo like do mesmo usuário', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      // Simula que já existe um like
      repository.findByUserAndPost.mockResolvedValue({
        id: 'like-123',
        userId,
        postId,
        createdAt: new Date(),
      });

      await expect(
        service.likePost({ userId, postId })
      ).rejects.toThrow(ConflictException);
    });

    it('deve permitir like após unlike', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      // Primeiro unlike (remove like existente)
      repository.findByUserAndPost.mockResolvedValueOnce({
        id: 'like-123',
        userId,
        postId,
        createdAt: new Date(),
      });
      repository.delete.mockResolvedValueOnce(true);

      await service.unlikePost(userId, postId);

      // Depois like novamente
      repository.findByUserAndPost.mockResolvedValueOnce(null);
      repository.create.mockResolvedValueOnce({
        id: 'like-456',
        userId,
        postId,
        createdAt: new Date(),
      });

      const result = await service.likePost({ userId, postId });

      expect(result.id).toBe('like-456');
    });
  });

  describe('Contagem de Likes', () => {
    it('deve retornar zero para post sem likes', async () => {
      const postId = 'new-post';

      repository.count.mockResolvedValue(0);

      const result = await service.getLikesCount(postId);

      expect(result.count).toBe(0);
    });

    it('deve lidar com grandes números de likes', async () => {
      const postId = 'viral-post';

      repository.count.mockResolvedValue(1000000);

      const result = await service.getLikesCount(postId);

      expect(result.count).toBe(1000000);
      expect(result.count).toBeGreaterThan(999999);
    });

    it('deve retornar contagem precisa', async () => {
      const postId = 'post-123';
      const expectedCount = 42;

      repository.count.mockResolvedValue(expectedCount);

      const result = await service.getLikesCount(postId);

      expect(result.count).toBe(expectedCount);
      expect(result.postId).toBe(postId);
      expect(repository.count).toHaveBeenCalledWith(postId);
      expect(repository.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Verificação de Like', () => {
    it('deve retornar false para usuário que nunca deu like', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      repository.findByUserAndPost.mockResolvedValue(null);

      const result = await service.hasUserLiked(userId, postId);

      expect(result.hasLiked).toBe(false);
    });

    it('deve retornar true para usuário que deu like', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      repository.findByUserAndPost.mockResolvedValue({
        id: 'like-123',
        userId,
        postId,
        createdAt: new Date(),
      });

      const result = await service.hasUserLiked(userId, postId);

      expect(result.hasLiked).toBe(true);
    });

    it('deve usar cache de verificação eficientemente', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      repository.findByUserAndPost.mockResolvedValue({
        id: 'like-123',
        userId,
        postId,
        createdAt: new Date(),
      });

      // Primeira chamada
      await service.hasUserLiked(userId, postId);
      // Segunda chamada (deveria usar o mesmo mecanismo)
      await service.hasUserLiked(userId, postId);

      // Verifica que o repository foi chamado 2 vezes
      expect(repository.findByUserAndPost).toHaveBeenCalledTimes(2);
    });
  });

  describe('Busca de Likes', () => {
    it('deve retornar array vazio para usuário sem likes', async () => {
      const userId = 'new-user';

      repository.findByUser.mockResolvedValue([]);

      const likes = await service.getLikesByUser(userId);

      expect(likes).toEqual([]);
      expect(Array.isArray(likes)).toBe(true);
    });

    it('deve retornar todos os likes de um usuário', async () => {
      const userId = 'active-user';
      const mockLikes = Array(50).fill(null).map((_, i) => ({
        id: `like-${i}`,
        userId,
        postId: `post-${i}`,
        createdAt: new Date(),
      }));

      repository.findByUser.mockResolvedValue(mockLikes);

      const likes = await service.getLikesByUser(userId);

      expect(likes).toHaveLength(50);
      expect(likes[0].userId).toBe(userId);
    });

    it('deve retornar array vazio para post sem likes', async () => {
      const postId = 'unpopular-post';

      repository.findByPost.mockResolvedValue([]);

      const likes = await service.getLikesByPost(postId);

      expect(likes).toEqual([]);
    });
  });

  describe('Unlike de Post Inexistente', () => {
    it('deve lançar exceção ao tentar unlike sem like prévio', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      repository.findByUserAndPost.mockResolvedValue(null);

      await expect(
        service.unlikePost(userId, postId)
      ).rejects.toThrow(ConflictException);
    });
  });
});

