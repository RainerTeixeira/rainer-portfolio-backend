/**
 * Testes Unitários: Comments Service - SIMPLIFICADO
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from '../../../src/modules/comments/comments.service';
import { CommentsRepository } from '../../../src/modules/comments/comments.repository';
import { createMockComment } from '../../helpers/mocks';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: jest.Mocked<CommentsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: CommentsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByPost: jest.fn(),
            findByAuthor: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    repository = module.get(CommentsRepository) as jest.Mocked<CommentsRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar comentário com sucesso', async () => {
    const createData = {
      content: 'Test comment',
      postId: 'post-123',
      authorId: 'user-123',
    };
    const mockComment = createMockComment(createData);
    repository.create.mockResolvedValue(mockComment);

    const result = await service.createComment(createData);

    expect(repository.create).toHaveBeenCalledWith(createData);
    expect(result).toEqual(mockComment);
  });

  it('deve buscar comentário por ID', async () => {
    const mockComment = createMockComment();
    repository.findById.mockResolvedValue(mockComment as any);

    const result = await service.getCommentById('comment-123');

    expect(repository.findById).toHaveBeenCalledWith('comment-123');
    expect(result).toEqual(mockComment);
  });

  it('deve lançar NotFoundException quando comentário não existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.getCommentById('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('deve buscar comentários por post', async () => {
    const mockComments = [createMockComment()];
    repository.findByPost.mockResolvedValue(mockComments as any);

    const result = await service.getCommentsByPost('post-123');

    expect(repository.findByPost).toHaveBeenCalledWith('post-123');
    expect(result).toEqual(mockComments);
  });

  it('deve atualizar comentário', async () => {
    const mockComment = createMockComment();
    const updateData = { content: 'Updated content' };
    repository.findById.mockResolvedValue(mockComment as any);
    repository.update.mockResolvedValue({ ...mockComment, ...updateData, isEdited: true });

    const result = await service.updateComment('comment-123', updateData);

    expect(repository.update).toHaveBeenCalledWith('comment-123', { ...updateData, isEdited: true });
    expect(result.content).toBe('Updated content');
  });

  it('deve deletar comentário', async () => {
    const mockComment = createMockComment();
    repository.findById.mockResolvedValue(mockComment as any);
    repository.delete.mockResolvedValue(true);

    const result = await service.deleteComment('comment-123');

    expect(repository.delete).toHaveBeenCalledWith('comment-123');
    expect(result.success).toBe(true);
  });

  it('deve aprovar comentário', async () => {
    const mockComment = createMockComment();
    const approvedComment = { ...mockComment, isApproved: true };
    
    repository.update.mockResolvedValue(approvedComment as any);

    const result = await service.approveComment('comment-123');

    expect(repository.update).toHaveBeenCalledWith('comment-123', { isApproved: true });
    expect(result.isApproved).toBe(true);
  });

  it('deve reprovar comentário', async () => {
    const mockComment = createMockComment();
    const disapprovedComment = { ...mockComment, isApproved: false };
    
    repository.update.mockResolvedValue(disapprovedComment as any);

    const result = await service.disapproveComment('comment-123');

    expect(repository.update).toHaveBeenCalledWith('comment-123', { isApproved: false });
    expect(result.isApproved).toBe(false);
  });
});
