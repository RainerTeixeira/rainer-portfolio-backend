/**
 * Testes Unitários: Bookmarks Service
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { BookmarksService } from '../../../src/modules/bookmarks/bookmarks.service';
import { BookmarksRepository } from '../../../src/modules/bookmarks/bookmarks.repository';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let repository: jest.Mocked<BookmarksRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        {
          provide: BookmarksRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserAndPost: jest.fn(),
            findByUser: jest.fn(),
            findByCollection: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
    repository = module.get(BookmarksRepository) as jest.Mocked<BookmarksRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

    it('deve criar bookmark com sucesso', async () => {
      const bookmarkData = {
        userId: 'user-123',
        postId: 'post-123',
      };
      const mockBookmark = { 
        id: 'bookmark-123', 
        ...bookmarkData, 
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      repository.findByUserAndPost.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockBookmark);

      const result = await service.createBookmark(bookmarkData);

      expect(repository.create).toHaveBeenCalledWith(bookmarkData);
      expect(result).toEqual(mockBookmark);
    });

    it('deve lançar ConflictException se bookmark já existe', async () => {
      const bookmarkData = {
        userId: 'user-123',
        postId: 'post-123',
      };
      const existingBookmark = { 
        id: 'bookmark-123', 
        ...bookmarkData, 
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      repository.findByUserAndPost.mockResolvedValue(existingBookmark);

      await expect(service.createBookmark(bookmarkData)).rejects.toThrow(ConflictException);
    });

    it('deve remover bookmark com sucesso', async () => {
      const removeData = {
        userId: 'user-123',
        postId: 'post-123',
      };
      const existingBookmark = { 
        id: 'bookmark-123', 
        ...removeData, 
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      repository.findByUserAndPost.mockResolvedValue(existingBookmark);
      repository.delete.mockResolvedValue(true);

      const result = await service.deleteByUserAndPost('user-123', 'post-123');

      expect(repository.delete).toHaveBeenCalledWith('bookmark-123');
      expect(result.success).toBe(true);
    });

    it('deve buscar bookmarks por usuário', async () => {
      const mockBookmarks = [
        { id: 'bookmark-1', userId: 'user-123', postId: 'post-1', createdAt: new Date(), updatedAt: new Date() },
        { id: 'bookmark-2', userId: 'user-123', postId: 'post-2', createdAt: new Date(), updatedAt: new Date() },
      ];
      
      repository.findByUser.mockResolvedValue(mockBookmarks as any);

      const result = await service.getBookmarksByUser('user-123');

      expect(repository.findByUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockBookmarks);
    });

    it('deve buscar bookmark por ID', async () => {
      const mockBookmark = {
        id: 'bookmark-123',
        userId: 'user-123',
        postId: 'post-123',
        createdAt: new Date(),
      };

      repository.findById.mockResolvedValue(mockBookmark as any);

      const result = await service.getBookmarkById('bookmark-123');

      expect(repository.findById).toHaveBeenCalledWith('bookmark-123');
      expect(result).toEqual(mockBookmark);
    });

    it('deve lançar NotFoundException quando bookmark não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getBookmarkById('invalid-id')).rejects.toThrow('Bookmark não encontrado');
    });

    it('deve buscar bookmarks por coleção', async () => {
      const mockBookmarks = [
        { id: 'bookmark-1', userId: 'user-123', collection: 'Favoritos', createdAt: new Date() },
      ];

      repository.findByCollection.mockResolvedValue(mockBookmarks as any);

      const result = await service.getBookmarksByCollection('user-123', 'Favoritos');

      expect(repository.findByCollection).toHaveBeenCalledWith('user-123', 'Favoritos');
      expect(result).toEqual(mockBookmarks);
    });

    it('deve atualizar bookmark', async () => {
      const mockBookmark = {
        id: 'bookmark-123',
        userId: 'user-123',
        postId: 'post-123',
      };
      const updateData = { collection: 'Ler Depois' };

      repository.findById.mockResolvedValue(mockBookmark as any);
      repository.update.mockResolvedValue({ ...mockBookmark, ...updateData } as any);

      const result = await service.updateBookmark('bookmark-123', updateData);

      expect(repository.update).toHaveBeenCalledWith('bookmark-123', updateData);
      expect(result.collection).toBe('Ler Depois');
    });

    it('deve deletar bookmark por ID', async () => {
      const mockBookmark = {
        id: 'bookmark-123',
        userId: 'user-123',
        postId: 'post-123',
      };

      repository.findById.mockResolvedValue(mockBookmark as any);
      repository.delete.mockResolvedValue(true);

      const result = await service.deleteBookmark('bookmark-123');

      expect(repository.delete).toHaveBeenCalledWith('bookmark-123');
      expect(result.success).toBe(true);
    });

    it('deve lançar NotFoundException ao deletar por user/post se não existe', async () => {
      repository.findByUserAndPost.mockResolvedValue(null);

      await expect(
        service.deleteByUserAndPost('user-123', 'post-123')
      ).rejects.toThrow('Bookmark não encontrado');
    });
});

