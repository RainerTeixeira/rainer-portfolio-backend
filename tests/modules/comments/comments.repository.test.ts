/**
 * Testes Unitários: Comments Repository
 * 
 * Testa todas as operações do repositório de comentários.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommentsRepository } from '../../../src/modules/comments/comments.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('CommentsRepository', () => {
  let repository: CommentsRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockComment = {
    id: 'comment-123',
    content: 'Comentário de teste',
    postId: 'post-123',
    authorId: 'user-123',
    parentId: null,
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsRepository,
        {
          provide: PrismaService,
          useValue: {
            comment: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<CommentsRepository>(CommentsRepository);
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
    it('deve criar comentário com sucesso', async () => {
      const createData = {
        content: 'Comentário de teste',
        postId: 'post-123',
        authorId: 'user-123',
      };

      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await repository.create(createData);

      expect(prisma.comment.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockComment);
    });
  });

  describe('findById', () => {
    it('deve encontrar comentário por ID', async () => {
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);

      const result = await repository.findById('comment-123');

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
      });
      expect(result).toEqual(mockComment);
    });

    it('deve retornar null se comentário não existe', async () => {
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByPost', () => {
    it('deve buscar todos os comentários do post', async () => {
      const comments = [mockComment];
      (prisma.comment.findMany as jest.Mock).mockResolvedValue(comments);

      const result = await repository.findByPost('post-123');

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { postId: 'post-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(comments);
    });

    it('deve retornar array vazio se não há comentários', async () => {
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByPost('post-123');

      expect(result).toEqual([]);
    });

    it('deve ordenar por createdAt desc', async () => {
      await repository.findByPost('post-123');

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('findByAuthor', () => {
    it('deve buscar todos os comentários do autor', async () => {
      const comments = [mockComment];
      (prisma.comment.findMany as jest.Mock).mockResolvedValue(comments);

      const result = await repository.findByAuthor('user-123');

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { authorId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(comments);
    });

    it('deve retornar array vazio se autor não tem comentários', async () => {
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findByAuthor('user-123');

      expect(result).toEqual([]);
    });

    it('deve ordenar por createdAt desc', async () => {
      await repository.findByAuthor('user-123');

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('update', () => {
    it('deve atualizar comentário com sucesso', async () => {
      const updateData = {
        content: 'Comentário atualizado',
      };

      const updatedComment = { ...mockComment, ...updateData };
      (prisma.comment.update as jest.Mock).mockResolvedValue(updatedComment);

      const result = await repository.update('comment-123', updateData);

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
        data: updateData,
      });
      expect(result).toEqual(updatedComment);
    });

    it('deve atualizar isApproved', async () => {
      const updateData = { isApproved: true };
      const approvedComment = { ...mockComment, isApproved: true };

      (prisma.comment.update as jest.Mock).mockResolvedValue(approvedComment);

      const result = await repository.update('comment-123', updateData);

      expect(result.isApproved).toBe(true);
    });
  });

  describe('delete', () => {
    it('deve deletar comentário com sucesso', async () => {
      (prisma.comment.delete as jest.Mock).mockResolvedValue(mockComment);

      const result = await repository.delete('comment-123');

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
      });
      expect(result).toBe(true);
    });

    it('deve retornar true mesmo se Prisma retornar void', async () => {
      (prisma.comment.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete('comment-123');

      expect(result).toBe(true);
    });
  });
});

