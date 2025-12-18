import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { BOOKMARK_REPOSITORY } from '../../../database/tokens';

describe('BookmarksService', () => {
  let service: BookmarksService;

  const mockBookmarkRepository = {
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
        BookmarksService,
        {
          provide: BOOKMARK_REPOSITORY,
          useValue: mockBookmarkRepository,
        },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bookmarkPost', () => {
    it('should create a new bookmark for post', async () => {
      const dto = {
        userId: 'user-1',
        postId: 'post-1',
      };

      const createdBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockBookmarkRepository.findByUserAndPost.mockResolvedValue(null);
      mockBookmarkRepository.create.mockResolvedValue(createdBookmark);

      const result = await service.bookmarkPost(dto);

      expect(result).toEqual(createdBookmark);
      expect(mockBookmarkRepository.findByUserAndPost).toHaveBeenCalledWith('user-1', 'post-1');
      expect(mockBookmarkRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          postId: 'post-1',
        })
      );
    });

    it('should return existing bookmark if already bookmarked', async () => {
      const dto = {
        userId: 'user-1',
        postId: 'post-1',
      };

      const existingBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockBookmarkRepository.findByUserAndPost.mockResolvedValue(existingBookmark);

      const result = await service.bookmarkPost(dto);

      expect(result).toEqual(existingBookmark);
      expect(mockBookmarkRepository.findByUserAndPost).toHaveBeenCalledWith('user-1', 'post-1');
      expect(mockBookmarkRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('bookmarkComment', () => {
    it('should create a new bookmark for comment', async () => {
      const dto = {
        userId: 'user-1',
        commentId: 'comment-1',
      };

      const createdBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        commentId: 'comment-1',
      };

      mockBookmarkRepository.findByUserAndComment.mockResolvedValue(null);
      mockBookmarkRepository.create.mockResolvedValue(createdBookmark);

      const result = await service.bookmarkComment(dto);

      expect(result).toEqual(createdBookmark);
      expect(mockBookmarkRepository.findByUserAndComment).toHaveBeenCalledWith('user-1', 'comment-1');
      expect(mockBookmarkRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          commentId: 'comment-1',
        })
      );
    });

    it('should return existing bookmark if already bookmarked', async () => {
      const dto = {
        userId: 'user-1',
        commentId: 'comment-1',
      };

      const existingBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        commentId: 'comment-1',
      };

      mockBookmarkRepository.findByUserAndComment.mockResolvedValue(existingBookmark);

      const result = await service.bookmarkComment(dto);

      expect(result).toEqual(existingBookmark);
      expect(mockBookmarkRepository.findByUserAndComment).toHaveBeenCalledWith('user-1', 'comment-1');
      expect(mockBookmarkRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('unbookmarkPost', () => {
    it('should delete bookmark by user and post', async () => {
      await service.unbookmarkPost('user-1', 'post-1');

      expect(mockBookmarkRepository.deleteByUserAndPost).toHaveBeenCalledWith('user-1', 'post-1');
    });
  });

  describe('unbookmarkComment', () => {
    it('should delete bookmark by user and comment', async () => {
      await service.unbookmarkComment('user-1', 'comment-1');

      expect(mockBookmarkRepository.deleteByUserAndComment).toHaveBeenCalledWith('user-1', 'comment-1');
    });
  });

  describe('getBookmarkById', () => {
    it('should return bookmark by id', async () => {
      const bookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockBookmarkRepository.findById.mockResolvedValue(bookmark);

      const result = await service.getBookmarkById('bookmark-1');

      expect(result).toEqual(bookmark);
      expect(mockBookmarkRepository.findById).toHaveBeenCalledWith('bookmark-1');
    });
  });

  describe('getPostBookmarks', () => {
    it('should return all bookmarks for a post', async () => {
      const bookmarks = [
        { id: '1', userId: 'user-1', postId: 'post-1' },
        { id: '2', userId: 'user-2', postId: 'post-1' },
      ];

      mockBookmarkRepository.findByPost.mockResolvedValue(bookmarks);

      const result = await service.getPostBookmarks('post-1');

      expect(result).toEqual(bookmarks);
      expect(mockBookmarkRepository.findByPost).toHaveBeenCalledWith('post-1');
    });
  });

  describe('getCommentBookmarks', () => {
    it('should return all bookmarks for a comment', async () => {
      const bookmarks = [
        { id: '1', userId: 'user-1', commentId: 'comment-1' },
        { id: '2', userId: 'user-2', commentId: 'comment-1' },
      ];

      mockBookmarkRepository.findByComment.mockResolvedValue(bookmarks);

      const result = await service.getCommentBookmarks('comment-1');

      expect(result).toEqual(bookmarks);
      expect(mockBookmarkRepository.findByComment).toHaveBeenCalledWith('comment-1');
    });
  });

  describe('getUserBookmarks', () => {
    it('should return user bookmarks with options', async () => {
      const bookmarks = [
        { id: '1', userId: 'user-1', postId: 'post-1' },
        { id: '2', userId: 'user-1', postId: 'post-2' },
      ];

      const options = {
        limit: 10,
        offset: 0,
      };

      mockBookmarkRepository.findByUser.mockResolvedValue(bookmarks);

      const result = await service.getUserBookmarks('user-1', options);

      expect(result).toEqual(bookmarks);
      expect(mockBookmarkRepository.findByUser).toHaveBeenCalledWith('user-1', options);
    });

    it('should return user bookmarks without options', async () => {
      const bookmarks = [
        { id: '1', userId: 'user-1', postId: 'post-1' },
      ];

      mockBookmarkRepository.findByUser.mockResolvedValue(bookmarks);

      const result = await service.getUserBookmarks('user-1');

      expect(result).toEqual(bookmarks);
      expect(mockBookmarkRepository.findByUser).toHaveBeenCalledWith('user-1', undefined);
    });
  });

  describe('isPostBookmarkedByUser', () => {
    it('should return true when post is bookmarked', async () => {
      const bookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
      };

      mockBookmarkRepository.findByUserAndPost.mockResolvedValue(bookmark);

      const result = await service.isPostBookmarkedByUser('user-1', 'post-1');

      expect(result).toBe(true);
    });

    it('should return false when post is not bookmarked', async () => {
      mockBookmarkRepository.findByUserAndPost.mockResolvedValue(null);

      const result = await service.isPostBookmarkedByUser('user-1', 'post-1');

      expect(result).toBe(false);
    });
  });

  describe('isCommentBookmarkedByUser', () => {
    it('should return true when comment is bookmarked', async () => {
      const bookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        commentId: 'comment-1',
      };

      mockBookmarkRepository.findByUserAndComment.mockResolvedValue(bookmark);

      const result = await service.isCommentBookmarkedByUser('user-1', 'comment-1');

      expect(result).toBe(true);
    });

    it('should return false when comment is not bookmarked', async () => {
      mockBookmarkRepository.findByUserAndComment.mockResolvedValue(null);

      const result = await service.isCommentBookmarkedByUser('user-1', 'comment-1');

      expect(result).toBe(false);
    });
  });
});
