import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../../../../src/modules/comments/services/comments.service';
import { COMMENT_REPOSITORY } from '../../../../src/database/tokens';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockCommentRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByPostId: jest.fn(),
    findByAuthorId: jest.fn(),
    findReplies: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: COMMENT_REPOSITORY,
          useValue: mockCommentRepository,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const dto = {
        content: 'Great post!',
        authorId: 'user-1',
        postId: 'post-1',
        parentId: 'parent-1',
        status: 'PENDING' as const,
      };

      const createdComment = {
        id: 'comment-1',
        content: 'Great post!',
        authorId: 'user-1',
        postId: 'post-1',
        parentId: 'parent-1',
        status: 'PENDING',
      };

      mockCommentRepository.create.mockResolvedValue(createdComment);

      const result = await service.createComment(dto);

      expect(result).toEqual(createdComment);
      expect(mockCommentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Great post!',
          authorId: 'user-1',
          postId: 'post-1',
          parentId: 'parent-1',
          status: 'PENDING',
        })
      );
    });

    it('should create comment with default PENDING status', async () => {
      const dto = {
        content: 'Great post!',
        authorId: 'user-1',
        postId: 'post-1',
      };

      const createdComment = {
        id: 'comment-1',
        content: 'Great post!',
        authorId: 'user-1',
        postId: 'post-1',
        status: 'PENDING',
      };

      mockCommentRepository.create.mockResolvedValue(createdComment);

      const result = await service.createComment(dto);

      expect(result).toEqual(createdComment);
      expect(mockCommentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Great post!',
          authorId: 'user-1',
          postId: 'post-1',
          status: 'PENDING',
        })
      );
    });
  });

  describe('getCommentById', () => {
    it('should return comment by id', async () => {
      const comment = {
        id: 'comment-1',
        content: 'Great post!',
        authorId: 'user-1',
        postId: 'post-1',
      };

      mockCommentRepository.findById.mockResolvedValue(comment);

      const result = await service.getCommentById('comment-1');

      expect(result).toEqual(comment);
      expect(mockCommentRepository.findById).toHaveBeenCalledWith('comment-1');
    });

    it('should return null when comment not found', async () => {
      mockCommentRepository.findById.mockResolvedValue(null);

      const result = await service.getCommentById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getCommentsByPostId', () => {
    it('should return comments for a post with options', async () => {
      const comments = [
        { id: '1', content: 'Comment 1', postId: 'post-1' },
        { id: '2', content: 'Comment 2', postId: 'post-1' },
      ];

      const options = {
        limit: 10,
        offset: 0,
      };

      mockCommentRepository.findByPostId.mockResolvedValue(comments);

      const result = await service.getCommentsByPostId('post-1', options);

      expect(result).toEqual(comments);
      expect(mockCommentRepository.findByPostId).toHaveBeenCalledWith('post-1', options);
    });

    it('should return comments for a post without options', async () => {
      const comments = [
        { id: '1', content: 'Comment 1', postId: 'post-1' },
      ];

      mockCommentRepository.findByPostId.mockResolvedValue(comments);

      const result = await service.getCommentsByPostId('post-1');

      expect(result).toEqual(comments);
      expect(mockCommentRepository.findByPostId).toHaveBeenCalledWith('post-1', undefined);
    });
  });

  describe('getCommentsByAuthorId', () => {
    it('should return comments by author with options', async () => {
      const comments = [
        { id: '1', content: 'Comment 1', authorId: 'user-1' },
        { id: '2', content: 'Comment 2', authorId: 'user-1' },
      ];

      const options = {
        limit: 10,
        offset: 0,
      };

      mockCommentRepository.findByAuthorId.mockResolvedValue(comments);

      const result = await service.getCommentsByAuthorId('user-1', options);

      expect(result).toEqual(comments);
      expect(mockCommentRepository.findByAuthorId).toHaveBeenCalledWith('user-1', options);
    });
  });

  describe('getReplies', () => {
    it('should return replies for a parent comment', async () => {
      const replies = [
        { id: '1', content: 'Reply 1', parentId: 'parent-1' },
        { id: '2', content: 'Reply 2', parentId: 'parent-1' },
      ];

      mockCommentRepository.findReplies.mockResolvedValue(replies);

      const result = await service.getReplies('parent-1');

      expect(result).toEqual(replies);
      expect(mockCommentRepository.findReplies).toHaveBeenCalledWith('parent-1');
    });
  });

  describe('updateComment', () => {
    it('should update comment', async () => {
      const id = 'comment-1';
      const dto = {
        content: 'Updated content',
      };

      const updatedComment = {
        id: 'comment-1',
        content: 'Updated content',
        authorId: 'user-1',
        postId: 'post-1',
      };

      mockCommentRepository.update.mockResolvedValue(updatedComment);

      const result = await service.updateComment(id, dto);

      expect(result).toEqual(updatedComment);
      expect(mockCommentRepository.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment', async () => {
      await service.deleteComment('comment-1');

      expect(mockCommentRepository.delete).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('approveComment', () => {
    it('should approve comment', async () => {
      await service.approveComment('comment-1');

      expect(mockCommentRepository.approve).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('rejectComment', () => {
    it('should reject comment', async () => {
      await service.rejectComment('comment-1');

      expect(mockCommentRepository.reject).toHaveBeenCalledWith('comment-1');
    });
  });
});
