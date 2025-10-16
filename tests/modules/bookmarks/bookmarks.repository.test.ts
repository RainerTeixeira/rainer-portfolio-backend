/**
 * Testes Unitários: Bookmarks Repository
 * 
 * Testa todas as operações do repositório de bookmarks.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksRepository } from '../../../src/modules/bookmarks/bookmarks.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('BookmarksRepository', () => {
  let repository: BookmarksRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockBookmark = {
    id: 'bookmark-123',
    userId: 'user-123',
    postId: 'post-123',
    collection: 'favoritos',
    notes: 'Nota de teste',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksRepository,
        {
          provide: PrismaService,
          useValue: {
            bookmark: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<BookmarksRepository>(BookmarksRepository);
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
    it('deve criar bookmark com sucesso', async () => {
      const createData = {
        userId: 'user-123',
        postId: 'post-123',
        collection: 'favoritos',
      };

      (prisma.bookmark.create as jest.Mock).mockResolvedValue(mockBookmark);

      const result = await repository.create(createData);

      expect(prisma.bookmark.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockBookmark);
    });
  });

  describe('findById', () => {
    it('deve encontrar bookmark por ID', async () => {
      (prisma.bookmark.findUnique as jest.Mock).mockResolvedValue(mockBookmark);

      const result = await repository.findById('bookmark-123');

      expect(prisma.bookmark.findUnique).toHaveBeenCalledWith({
        where: { id: 'bookmark-123' },
      });
      expect(result).toEqual(mockBookmark);
    });

    it('deve retornar null se bookmark não existe', async () => {
      (prisma.bookmark.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserAndPost', () => {
    it('deve encontrar bookmark por userId e postId', async () => {
      (prisma.bookmark.findFirst as jest.Mock).mockResolvedValue(mockBookmark);

      const result = await repository.findByUserAndPost('user-123', 'post-123');

      expect(prisma.bookmark.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-123', postId: 'post-123' },
      });
      expect(result).toEqual(mockBookmark);
    });

    it('deve retornar null se bookmark não existe', async () => {
      (prisma.bookmark.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByUserAndPost('user-123', 'invalid-post');

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('deve buscar todos os bookmarks do usuário', async () => {
      const bookmarks = [mockBookmark];
      (prisma.bookmark.findMany as jest.Mock).mockResolvedValue(bookmarks);

      const result = await repository.findByUser('user-123');

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(bookmarks);
    });

    it('deve retornar array vazio se usuário não tem bookmarks', async () => {
      (prisma.bookmark.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByUser('user-123');

      expect(result).toEqual([]);
    });

    it('deve ordenar por createdAt desc', async () => {
      const bookmarks = [mockBookmark];
      (prisma.bookmark.findMany as jest.Mock).mockResolvedValue(bookmarks);

      await repository.findByUser('user-123');

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('findByCollection', () => {
    it('deve buscar bookmarks por coleção', async () => {
      const bookmarks = [mockBookmark];
      (prisma.bookmark.findMany as jest.Mock).mockResolvedValue(bookmarks);

      const result = await repository.findByCollection('user-123', 'favoritos');

      expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', collection: 'favoritos' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(bookmarks);
    });

    it('deve retornar array vazio se coleção não existe', async () => {
      (prisma.bookmark.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByCollection('user-123', 'inexistente');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('deve atualizar bookmark com sucesso', async () => {
      const updateData = {
        collection: 'leitura-depois',
        notes: 'Nota atualizada',
      };

      const updatedBookmark = { ...mockBookmark, ...updateData };
      (prisma.bookmark.update as jest.Mock).mockResolvedValue(updatedBookmark);

      const result = await repository.update('bookmark-123', updateData);

      expect(prisma.bookmark.update).toHaveBeenCalledWith({
        where: { id: 'bookmark-123' },
        data: updateData,
      });
      expect(result).toEqual(updatedBookmark);
    });
  });

  describe('delete', () => {
    it('deve deletar bookmark com sucesso', async () => {
      (prisma.bookmark.delete as jest.Mock).mockResolvedValue(mockBookmark);

      const result = await repository.delete('bookmark-123');

      expect(prisma.bookmark.delete).toHaveBeenCalledWith({
        where: { id: 'bookmark-123' },
      });
      expect(result).toBe(true);
    });

    it('deve retornar true mesmo se Prisma retornar void', async () => {
      (prisma.bookmark.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete('bookmark-123');

      expect(result).toBe(true);
    });
  });
});

