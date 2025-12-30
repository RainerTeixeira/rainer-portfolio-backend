import { Test, TestingModule } from '@nestjs/testing';
import { LikesController } from '../../../../src/modules/likes/controllers/likes.controller';
import { LikesService } from '../../../../src/modules/likes/services/likes.service';

describe('LikesController', () => {
  let controller: LikesController;

  const mockLikesService = {
    likePost: jest.fn(),
    likeComment: jest.fn(),
    unlikePost: jest.fn(),
    unlikeComment: jest.fn(),
    getLikeById: jest.fn(),
    getPostLikes: jest.fn(),
    getCommentLikes: jest.fn(),
    getUserLikes: jest.fn(),
    isPostLikedByUser: jest.fn(),
    isCommentLikedByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikesController],
      providers: [
        {
          provide: LikesService,
          useValue: mockLikesService,
        },
      ],
    }).compile();

    controller = module.get<LikesController>(LikesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
