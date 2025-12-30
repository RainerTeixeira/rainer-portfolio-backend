import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../../../../src/modules/posts/controllers/posts.controller';
import { PostsService } from '../../../../src/modules/posts/services/posts.service';

describe('PostsController', () => {
  let controller: PostsController;

  const mockPostsService = {
    createPost: jest.fn(),
    getPostById: jest.fn(),
    getPostBySlug: jest.fn(),
    getAllPosts: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
    incrementViewCount: jest.fn(),
    publishPost: jest.fn(),
    archivePost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
