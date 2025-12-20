import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from '../../../../src/modules/bookmarks/controllers/bookmarks.controller';
import { BookmarksService } from '../../../../src/modules/bookmarks/services/bookmarks.service';

describe('BookmarksController', () => {
  let controller: BookmarksController;

  const mockBookmarksService = {
    bookmarkPost: jest.fn(),
    bookmarkComment: jest.fn(),
    unbookmarkPost: jest.fn(),
    unbookmarkComment: jest.fn(),
    getBookmarkById: jest.fn(),
    getPostBookmarks: jest.fn(),
    getCommentBookmarks: jest.fn(),
    getUserBookmarks: jest.fn(),
    isPostBookmarkedByUser: jest.fn(),
    isCommentBookmarkedByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [
        {
          provide: BookmarksService,
          useValue: mockBookmarksService,
        },
      ],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
