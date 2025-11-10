/**
 * Testes Unitários: Comments Controller
 * 
 * Testa todos os endpoints do controller de comentários.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from '../../../src/modules/comments/comments.controller';
import { CommentsService } from '../../../src/modules/comments/comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: jest.Mocked<CommentsService>;

  const mockComment = {
    id: 'comment-123',
    content: 'Comentário de teste',
    postId: 'post-123',
    authorId: 'cognito-user-123',
    parentId: null,
    isApproved: true,
    isReported: false,
    isEdited: false,
    likesCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: {
            createComment: jest.fn(),
            getCommentById: jest.fn(),
            getCommentsByPost: jest.fn(),
            getCommentsByAuthor: jest.fn(),
            updateComment: jest.fn(),
            deleteComment: jest.fn(),
            approveComment: jest.fn(),
            disapproveComment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get(CommentsService) as jest.Mocked<CommentsService>;
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
    it('deve criar comentário com sucesso', async () => {
      const createData = {
        content: 'Comentário de teste',
        postId: 'post-123',
        authorId: 'cognito-user-123',
      };

      service.createComment.mockResolvedValue(mockComment);

      const result = await controller.create(createData);

      expect(service.createComment).toHaveBeenCalledWith(createData);
      expect(result).toEqual({
        success: true,
        data: mockComment,
      });
    });
  });

  describe('findById', () => {
    it('deve buscar comentário por ID', async () => {
      service.getCommentById.mockResolvedValue(mockComment);

      const result = await controller.findById('comment-123');

      expect(service.getCommentById).toHaveBeenCalledWith('comment-123');
      expect(result).toEqual({
        success: true,
        data: mockComment,
      });
    });

    it('deve propagar NotFoundException', async () => {
      const error = new Error('Comentário não encontrado');
      service.getCommentById.mockRejectedValue(error);

      await expect(controller.findById('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('getByPost', () => {
    it('deve buscar comentários do post', async () => {
      const comments = [mockComment];
      service.getCommentsByPost.mockResolvedValue(comments);

      const result = await controller.getByPost('post-123');

      expect(service.getCommentsByPost).toHaveBeenCalledWith('post-123');
      expect(result).toEqual({
        success: true,
        data: comments,
      });
    });

    it('deve retornar array vazio se não há comentários', async () => {
      service.getCommentsByPost.mockResolvedValue([]);

      const result = await controller.getByPost('post-123');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('getByAuthor', () => {
    it('deve buscar comentários do autor', async () => {
      const comments = [mockComment];
      service.getCommentsByAuthor.mockResolvedValue(comments);

      const result = await controller.getByAuthor('user-123');

      expect(service.getCommentsByAuthor).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        success: true,
        data: comments,
      });
    });

    it('deve retornar array vazio se autor não tem comentários', async () => {
      service.getCommentsByAuthor.mockResolvedValue([]);

      const result = await controller.getByAuthor('user-123');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('update', () => {
    it('deve atualizar comentário com sucesso', async () => {
      const updateData = {
        content: 'Comentário atualizado',
      };

      const updatedComment = { ...mockComment, ...updateData };
      service.updateComment.mockResolvedValue(updatedComment);

      const result = await controller.update('comment-123', updateData);

      expect(service.updateComment).toHaveBeenCalledWith('comment-123', updateData);
      expect(result).toEqual({
        success: true,
        data: updatedComment,
      });
    });

    it('deve propagar NotFoundException se comentário não existe', async () => {
      const error = new Error('Comentário não encontrado');
      service.updateComment.mockRejectedValue(error);

      await expect(controller.update('invalid-id', {})).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('deve deletar comentário com sucesso', async () => {
      service.deleteComment.mockResolvedValue({ success: true });

      const result = await controller.delete('comment-123');

      expect(service.deleteComment).toHaveBeenCalledWith('comment-123');
      expect(result).toEqual({ success: true });
    });

    it('deve propagar NotFoundException se comentário não existe', async () => {
      const error = new Error('Comentário não encontrado');
      service.deleteComment.mockRejectedValue(error);

      await expect(controller.delete('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('approve', () => {
    it('deve aprovar comentário com sucesso', async () => {
      const approvedComment = { ...mockComment, isApproved: true };
      service.approveComment.mockResolvedValue(approvedComment);

      const result = await controller.approve('comment-123');

      expect(service.approveComment).toHaveBeenCalledWith('comment-123');
      expect(result).toEqual({
        success: true,
        data: approvedComment,
      });
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro ao aprovar');
      service.approveComment.mockRejectedValue(error);

      await expect(controller.approve('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('disapprove', () => {
    it('deve reprovar comentário com sucesso', async () => {
      const disapprovedComment = { ...mockComment, isApproved: false };
      service.disapproveComment.mockResolvedValue(disapprovedComment);

      const result = await controller.disapprove('comment-123');

      expect(service.disapproveComment).toHaveBeenCalledWith('comment-123');
      expect(result).toEqual({
        success: true,
        data: disapprovedComment,
      });
    });

    it('deve propagar erro do service', async () => {
      const error = new Error('Erro ao reprovar');
      service.disapproveComment.mockRejectedValue(error);

      await expect(controller.disapprove('invalid-id')).rejects.toThrow(error);
    });
  });
});

