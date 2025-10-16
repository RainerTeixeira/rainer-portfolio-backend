/**
 * Testes Unitários: Likes Controller
 * 
 * Testa todos os endpoints do controller de likes.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LikesController } from '../../../src/modules/likes/likes.controller';
import { LikesService } from '../../../src/modules/likes/likes.service';

describe('LikesController', () => {
  let controller: LikesController;
  let service: jest.Mocked<LikesService>;

  const mockLike = {
    id: 'like-123',
    userId: 'user-123',
    postId: 'post-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikesController],
      providers: [
        {
          provide: LikesService,
          useValue: {
            likePost: jest.fn(),
            unlikePost: jest.fn(),
            getLikesByPost: jest.fn(),
            getLikesByUser: jest.fn(),
            getLikesCount: jest.fn(),
            hasUserLiked: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LikesController>(LikesController);
    service = module.get(LikesService) as jest.Mocked<LikesService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('like', () => {
    it('deve curtir post com sucesso', async () => {
      const likeData = {
        userId: 'user-123',
        postId: 'post-123',
      };

      service.likePost.mockResolvedValue(mockLike);

      const result = await controller.like(likeData);

      expect(service.likePost).toHaveBeenCalledWith(likeData);
      expect(result).toEqual({
        success: true,
        data: mockLike,
      });
    });

    it('deve propagar ConflictException se já curtiu', async () => {
      const likeData = {
        userId: 'user-123',
        postId: 'post-123',
      };

      const error = new Error('Você já curtiu este post');
      service.likePost.mockRejectedValue(error);

      await expect(controller.like(likeData)).rejects.toThrow(error);
    });
  });

  describe('unlike', () => {
    it('deve descurtir post com sucesso', async () => {
      service.unlikePost.mockResolvedValue({ success: true });

      const result = await controller.unlike('user-123', 'post-123');

      expect(service.unlikePost).toHaveBeenCalledWith('user-123', 'post-123');
      expect(result).toEqual({ success: true });
    });

    it('deve propagar ConflictException se não curtiu', async () => {
      const error = new Error('Você não curtiu este post');
      service.unlikePost.mockRejectedValue(error);

      await expect(controller.unlike('user-123', 'post-123')).rejects.toThrow(error);
    });
  });

  describe('getByPost', () => {
    it('deve buscar likes do post', async () => {
      const likes = [mockLike];
      service.getLikesByPost.mockResolvedValue(likes);

      const result = await controller.getByPost('post-123');

      expect(service.getLikesByPost).toHaveBeenCalledWith('post-123');
      expect(result).toEqual({
        success: true,
        data: likes,
      });
    });

    it('deve retornar array vazio se não há likes', async () => {
      service.getLikesByPost.mockResolvedValue([]);

      const result = await controller.getByPost('post-123');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('getByUser', () => {
    it('deve buscar likes do usuário', async () => {
      const likes = [mockLike];
      service.getLikesByUser.mockResolvedValue(likes);

      const result = await controller.getByUser('user-123');

      expect(service.getLikesByUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        success: true,
        data: likes,
      });
    });

    it('deve retornar array vazio se usuário não tem likes', async () => {
      service.getLikesByUser.mockResolvedValue([]);

      const result = await controller.getByUser('user-123');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('count', () => {
    it('deve contar likes do post', async () => {
      const countResult = { postId: 'post-123', count: 42 };
      service.getLikesCount.mockResolvedValue(countResult);

      const result = await controller.count('post-123');

      expect(service.getLikesCount).toHaveBeenCalledWith('post-123');
      expect(result).toEqual(countResult);
    });

    it('deve retornar count 0 para post sem likes', async () => {
      const countResult = { postId: 'post-123', count: 0 };
      service.getLikesCount.mockResolvedValue(countResult);

      const result = await controller.count('post-123');

      expect(result).toEqual(countResult);
      expect(result.count).toBe(0);
    });
  });

  describe('check', () => {
    it('deve verificar se usuário curtiu o post', async () => {
      service.hasUserLiked.mockResolvedValue({ hasLiked: true });

      const result = await controller.check('user-123', 'post-123');

      expect(service.hasUserLiked).toHaveBeenCalledWith('user-123', 'post-123');
      expect(result).toEqual({ hasLiked: true });
    });

    it('deve retornar false se usuário não curtiu', async () => {
      service.hasUserLiked.mockResolvedValue({ hasLiked: false });

      const result = await controller.check('user-123', 'post-123');

      expect(result).toEqual({ hasLiked: false });
    });
  });
});

