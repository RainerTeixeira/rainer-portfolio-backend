import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from '../../../../src/modules/comments/controllers/comments.controller';
import { CommentsService } from '../../../../src/modules/comments/services/comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;

  const mockCommentsService = {
    createComment: jest.fn(),
    getCommentById: jest.fn(),
    getCommentsByPostId: jest.fn(),
    getCommentsByAuthorId: jest.fn(),
    getReplies: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    approveComment: jest.fn(),
    rejectComment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
