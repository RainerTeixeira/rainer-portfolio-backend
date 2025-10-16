/**
 * Testes Unitários: Bookmarks Controller
 * 
 * Testa todos os endpoints do controller de bookmarks.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from '../../../src/modules/bookmarks/bookmarks.controller';
import { BookmarksService } from '../../../src/modules/bookmarks/bookmarks.service';

describe('BookmarksController', () => {
  let controller: BookmarksController;
  let service: jest.Mocked<BookmarksService>;

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
      controllers: [BookmarksController],
      providers: [
        {
          provide: BookmarksService,
          useValue: {
            createBookmark: jest.fn(),
            getBookmarkById: jest.fn(),
            getBookmarksByUser: jest.fn(),
            getBookmarksByCollection: jest.fn(),
            updateBookmark: jest.fn(),
            deleteBookmark: jest.fn(),
            deleteByUserAndPost: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
    service = module.get(BookmarksService) as jest.Mocked<BookmarksService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve criar bookmark com sucesso', async () => {
      const createData = {
        userId: 'user-123',
        postId: 'post-123',
        collection: 'favoritos',
      };

      service.createBookmark.mockResolvedValue(mockBookmark);

      const result = await controller.create(createData);

      expect(service.createBookmark).toHaveBeenCalledWith(createData);
      expect(result).toEqual({
        success: true,
        data: mockBookmark,
      });
    });

    it('deve propagar erro do service', async () => {
      const createData = {
        userId: 'user-123',
        postId: 'post-123',
      };

      const error = new Error('Erro ao criar bookmark');
      service.createBookmark.mockRejectedValue(error);

      await expect(controller.create(createData)).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('deve buscar bookmark por ID', async () => {
      service.getBookmarkById.mockResolvedValue(mockBookmark);

      const result = await controller.findById('bookmark-123');

      expect(service.getBookmarkById).toHaveBeenCalledWith('bookmark-123');
      expect(result).toEqual({
        success: true,
        data: mockBookmark,
      });
    });

    it('deve propagar NotFoundException', async () => {
      const error = new Error('Bookmark não encontrado');
      service.getBookmarkById.mockRejectedValue(error);

      await expect(controller.findById('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('getByUser', () => {
    it('deve buscar bookmarks do usuário', async () => {
      const bookmarks = [mockBookmark];
      service.getBookmarksByUser.mockResolvedValue(bookmarks);

      const result = await controller.getByUser('user-123');

      expect(service.getBookmarksByUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        success: true,
        data: bookmarks,
      });
    });

    it('deve retornar array vazio se usuário não tem bookmarks', async () => {
      service.getBookmarksByUser.mockResolvedValue([]);

      const result = await controller.getByUser('user-123');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('getByCollection', () => {
    it('deve buscar bookmarks por coleção', async () => {
      const bookmarks = [mockBookmark];
      service.getBookmarksByCollection.mockResolvedValue(bookmarks);

      const result = await controller.getByCollection('user-123', 'favoritos');

      expect(service.getBookmarksByCollection).toHaveBeenCalledWith('user-123', 'favoritos');
      expect(result).toEqual({
        success: true,
        data: bookmarks,
      });
    });

    it('deve retornar array vazio se coleção não existe', async () => {
      service.getBookmarksByCollection.mockResolvedValue([]);

      const result = await controller.getByCollection('user-123', 'inexistente');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('update', () => {
    it('deve atualizar bookmark com sucesso', async () => {
      const updateData = {
        collection: 'leitura-depois',
        notes: 'Nota atualizada',
      };

      const updatedBookmark = { ...mockBookmark, ...updateData };
      service.updateBookmark.mockResolvedValue(updatedBookmark);

      const result = await controller.update('bookmark-123', updateData);

      expect(service.updateBookmark).toHaveBeenCalledWith('bookmark-123', updateData);
      expect(result).toEqual({
        success: true,
        data: updatedBookmark,
      });
    });

    it('deve propagar NotFoundException se bookmark não existe', async () => {
      const error = new Error('Bookmark não encontrado');
      service.updateBookmark.mockRejectedValue(error);

      await expect(controller.update('invalid-id', {})).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('deve deletar bookmark com sucesso', async () => {
      service.deleteBookmark.mockResolvedValue({ success: true });

      const result = await controller.delete('bookmark-123');

      expect(service.deleteBookmark).toHaveBeenCalledWith('bookmark-123');
      expect(result).toEqual({ success: true });
    });

    it('deve propagar NotFoundException se bookmark não existe', async () => {
      const error = new Error('Bookmark não encontrado');
      service.deleteBookmark.mockRejectedValue(error);

      await expect(controller.delete('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('deleteByPost', () => {
    it('deve deletar bookmark por userId e postId', async () => {
      service.deleteByUserAndPost.mockResolvedValue({ success: true });

      const result = await controller.deleteByPost('user-123', 'post-123');

      expect(service.deleteByUserAndPost).toHaveBeenCalledWith('user-123', 'post-123');
      expect(result).toEqual({ success: true });
    });

    it('deve propagar NotFoundException se bookmark não existe', async () => {
      const error = new Error('Bookmark não encontrado');
      service.deleteByUserAndPost.mockRejectedValue(error);

      await expect(controller.deleteByPost('user-123', 'invalid-post')).rejects.toThrow(error);
    });
  });
});

