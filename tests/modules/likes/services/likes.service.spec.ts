import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from '../../../../src/modules/likes/services/likes.service';
import { LIKE_REPOSITORY } from '../../../../src/database/tokens';

describe('LikesService', () => {
  let service: LikesService;

  const mockLikeRepository = {
    create: jest.fn(),
    findByUserAndPost: jest.fn(),
    findByUserAndComment: jest.fn(),
    deleteByUserAndPost: jest.fn(),
    deleteByUserAndComment: jest.fn(),
    findById: jest.fn(),
    findByPost: jest.fn(),
    findByComment: jest.fn(),
    findByUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: LIKE_REPOSITORY,
          useValue: mockLikeRepository,
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('likePost', () => {
    it('should create a new like for post', async () => {
      const dto = {
        userId: 'user-1',
        postId: 'post-1',
      };

      const createdLike = {
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockLikeRepository.findByUserAndPost.mockResolvedValue(null);
      mockLikeRepository.create.mockResolvedValue(createdLike);

      const result = await service.likePost(dto);

      expect(result).toEqual(createdLike);
      expect(mockLikeRepository.findByUserAndPost).toHaveBeenCalledWith('user-1', 'post-1');
      expect(mockLikeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          postId: 'post-1',
        })
      );
    });

    it('should return existing like if already liked', async () => {
      const dto = {
        userId: 'user-1',
        postId: 'post-1',
      };

      const existingLike = {
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockLikeRepository.findByUserAndPost.mockResolvedValue(existingLike);

      const result = await service.likePost(dto);

      expect(result).toEqual(existingLike);
      expect(mockLikeRepository.findByUserAndPost).toHaveBeenCalledWith('user-1', 'post-1');
      expect(mockLikeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('likeComment', () => {
    it('should create a new like for comment', async () => {
      const dto = {
        userId: 'user-1',
        commentId: 'comment-1',
      };

      const createdLike = {
        id: 'like-1',
        userId: 'user-1',
        commentId: 'comment-1',
      };

      mockLikeRepository.findByUserAndComment.mockResolvedValue(null);
      mockLikeRepository.create.mockResolvedValue(createdLike);

      const result = await service.likeComment(dto);

      expect(result).toEqual(createdLike);
      expect(mockLikeRepository.findByUserAndComment).toHaveBeenCalledWith('user-1', 'comment-1');
      expect(mockLikeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          commentId: 'comment-1',
        })
      );
    });

    it('should return existing like if already liked', async () => {
      const dto = {
        userId: 'user-1',
        commentId: 'comment-1',
      };

      const existingLike = {
        id: 'like-1',
        userId: 'user-1',
        commentId: 'comment-1',
      };

      mockLikeRepository.findByUserAndComment.mockResolvedValue(existingLike);

      const result = await service.likeComment(dto);

      expect(result).toEqual(existingLike);
      expect(mockLikeRepository.findByUserAndComment).toHaveBeenCalledWith('user-1', 'comment-1');
      expect(mockLikeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('unlikePost', () => {
    it('should delete like by user and post', async () => {
      await service.unlikePost('user-1', 'post-1');

      expect(mockLikeRepository.deleteByUserAndPost).toHaveBeenCalledWith('user-1', 'post-1');
    });
  });

  describe('unlikeComment', () => {
    it('should delete like by user and comment', async () => {
      await service.unlikeComment('user-1', 'comment-1');

      expect(mockLikeRepository.deleteByUserAndComment).toHaveBeenCalledWith('user-1', 'comment-1');
    });
  });

  describe('getLikeById', () => {
    it('should return like by id', async () => {
      const like = {
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockLikeRepository.findById.mockResolvedValue(like);

      const result = await service.getLikeById('like-1');

      expect(result).toEqual(like);
      expect(mockLikeRepository.findById).toHaveBeenCalledWith('like-1');
    });
  });

  describe('getPostLikes', () => {
    it('should return all likes for a post', async () => {
      const likes = [
        { id: '1', userId: 'user-1', postId: 'post-1' },
        { id: '2', userId: 'user-2', postId: 'post-1' },
      ];

      mockLikeRepository.findByPost.mockResolvedValue(likes);

      const result = await service.getPostLikes('post-1');

      expect(result).toEqual(likes);
      expect(mockLikeRepository.findByPost).toHaveBeenCalledWith('post-1');
    });
  });

  describe('getCommentLikes', () => {
    it('should return all likes for a comment', async () => {
      const likes = [
        { id: '1', userId: 'user-1', commentId: 'comment-1' },
        { id: '2', userId: 'user-2', commentId: 'comment-1' },
      ];

      mockLikeRepository.findByComment.mockResolvedValue(likes);

      const result = await service.getCommentLikes('comment-1');

      expect(result).toEqual(likes);
      expect(mockLikeRepository.findByComment).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('getUserLikes', () => {
    it('should return all likes by user', async () => {
      const likes = [
        { id: '1', userId: 'user-1', postId: 'post-1' },
        { id: '2', userId: 'user-1', postId: 'post-2' },
      ];

      mockLikeRepository.findByUser.mockResolvedValue(likes);

      const result = await service.getUserLikes('user-1');

      expect(result).toEqual(likes);
      expect(mockLikeRepository.findByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('isPostLikedByUser', () => {
    it('should return true when post is liked', async () => {
      const like = {
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockLikeRepository.findByUserAndPost.mockResolvedValue(like);

      const result = await service.isPostLikedByUser('user-1', 'post-1');

      expect(result).toBe(true);
    });

    it('should return false when post is not liked', async () => {
      mockLikeRepository.findByUserAndPost.mockResolvedValue(null);

      const result = await service.isPostLikedByUser('user-1', 'post-1');

      expect(result).toBe(false);
    });
  });

  describe('isCommentLikedByUser', () => {
    it('should return true when comment is liked', async () => {
      const like = {
        id: 'like-1',
        userId: 'user-1',
        commentId: 'comment-1',
      };

      mockLikeRepository.findByUserAndComment.mockResolvedValue(like);

      const result = await service.isCommentLikedByUser('user-1', 'comment-1');

      expect(result).toBe(true);
    });

    it('should return false when comment is not liked', async () => {
      mockLikeRepository.findByUserAndComment.mockResolvedValue(null);

      const result = await service.isCommentLikedByUser('user-1', 'comment-1');

      expect(result).toBe(false);
    });
  });
});
