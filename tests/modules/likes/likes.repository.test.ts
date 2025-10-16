/**
 * Testes Unitários: Likes Repository
 * 
 * Testa todas as operações do repositório de likes.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LikesRepository } from '../../../src/modules/likes/likes.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('LikesRepository', () => {
  let repository: LikesRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockLike = {
    id: 'like-123',
    userId: 'user-123',
    postId: 'post-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesRepository,
        {
          provide: PrismaService,
          useValue: {
            like: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<LikesRepository>(LikesRepository);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
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
    it('deve criar like com sucesso', async () => {
      const createData = {
        userId: 'user-123',
        postId: 'post-123',
      };

      (prisma.like.create as jest.Mock).mockResolvedValue(mockLike);

      const result = await repository.create(createData);

      expect(prisma.like.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockLike);
    });
  });

  describe('findByUserAndPost', () => {
    it('deve encontrar like por userId e postId', async () => {
      (prisma.like.findFirst as jest.Mock).mockResolvedValue(mockLike);

      const result = await repository.findByUserAndPost('user-123', 'post-123');

      expect(prisma.like.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123', postId: 'post-123' },
      });
      expect(result).toEqual(mockLike);
    });

    it('deve retornar null se like não existe', async () => {
      (prisma.like.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByUserAndPost('user-123', 'post-123');

      expect(result).toBeNull();
    });
  });

  describe('findByPost', () => {
    it('deve buscar todos os likes do post', async () => {
      const likes = [mockLike];
      (prisma.like.findMany as jest.Mock).mockResolvedValue(likes);

      const result = await repository.findByPost('post-123');

      expect(prisma.like.findMany).toHaveBeenCalledWith({
        where: { postId: 'post-123' },
      });
      expect(result).toEqual(likes);
    });

    it('deve retornar array vazio se não há likes', async () => {
      (prisma.like.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByPost('post-123');

      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('deve buscar todos os likes do usuário', async () => {
      const likes = [mockLike];
      (prisma.like.findMany as jest.Mock).mockResolvedValue(likes);

      const result = await repository.findByUser('user-123');

      expect(prisma.like.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(result).toEqual(likes);
    });

    it('deve retornar array vazio se usuário não tem likes', async () => {
      (prisma.like.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByUser('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deve deletar like com sucesso', async () => {
      (prisma.like.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await repository.delete('user-123', 'post-123');

      expect(prisma.like.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', postId: 'post-123' },
      });
      expect(result).toBe(true);
    });

    it('deve retornar true mesmo se nenhum like foi deletado', async () => {
      (prisma.like.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await repository.delete('user-123', 'post-123');

      expect(result).toBe(true);
    });
  });

  describe('count', () => {
    it('deve contar likes do post', async () => {
      (prisma.like.count as jest.Mock).mockResolvedValue(42);

      const result = await repository.count('post-123');

      expect(prisma.like.count).toHaveBeenCalledWith({
        where: { postId: 'post-123' },
      });
      expect(result).toBe(42);
    });

    it('deve retornar 0 para post sem likes', async () => {
      (prisma.like.count as jest.Mock).mockResolvedValue(0);

      const result = await repository.count('post-123');

      expect(result).toBe(0);
    });

    it('deve retornar número válido', async () => {
      (prisma.like.count as jest.Mock).mockResolvedValue(100);

      const result = await repository.count('post-123');

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

