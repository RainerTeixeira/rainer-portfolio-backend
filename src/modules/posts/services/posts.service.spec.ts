import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { POST_REPOSITORY } from '../../../database/tokens';

describe('PostsService', () => {
  let service: PostsService;

  const mockPostRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    incrementViewCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: POST_REPOSITORY,
          useValue: mockPostRepository,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const dto = {
        title: 'My First Post',
        slug: 'my-first-post',
        content: 'This is the content',
        excerpt: 'This is the excerpt',
        coverImage: 'image.jpg',
        authorId: 'user-1',
        categoryId: 'category-1',
        status: 'DRAFT' as const,
        publishedAt: new Date(),
        tags: ['tag1', 'tag2'],
        readTime: 5,
        isFeatured: false,
      };

      const createdPost = {
        id: 'post-1',
        ...dto,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
      };

      mockPostRepository.create.mockResolvedValue(createdPost);

      const result = await service.createPost(dto);

      expect(result).toEqual(createdPost);
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My First Post',
          slug: 'my-first-post',
          content: 'This is the content',
          authorId: 'user-1',
          subcategoryId: 'category-1',
          status: 'DRAFT',
          featured: false,
          allowComments: true,
          pinned: false,
          priority: 0,
          views: 0,
          likesCount: 0,
          commentsCount: 0,
          bookmarksCount: 0,
          publishedAt: expect.any(Date),
        })
      );
    });

    it('should create post with default values', async () => {
      const dto = {
        title: 'My First Post',
        slug: 'my-first-post',
        content: 'This is the content',
        authorId: 'user-1',
        categoryId: 'category-1',
      };

      const createdPost = {
        id: 'post-1',
        title: 'My First Post',
        slug: 'my-first-post',
        content: 'This is the content',
        status: 'DRAFT',
        tags: [],
        readTime: 0,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        isFeatured: false,
      };

      mockPostRepository.create.mockResolvedValue(createdPost);

      const result = await service.createPost(dto);

      expect(result).toEqual(createdPost);
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My First Post',
          slug: 'my-first-post',
          content: 'This is the content',
          authorId: 'user-1',
          subcategoryId: 'category-1',
          status: 'DRAFT',
          featured: false,
          allowComments: true,
          pinned: false,
          priority: 0,
          views: 0,
          likesCount: 0,
          commentsCount: 0,
          bookmarksCount: 0,
        })
      );
    });
  });

  describe('getPostById', () => {
    it('should return post by id', async () => {
      const post = {
        id: 'post-1',
        title: 'My First Post',
        slug: 'my-first-post',
      };

      mockPostRepository.findById.mockResolvedValue(post);

      const result = await service.getPostById('post-1');

      expect(result).toEqual(post);
      expect(mockPostRepository.findById).toHaveBeenCalledWith('post-1');
    });

    it('should return null when post not found', async () => {
      mockPostRepository.findById.mockResolvedValue(null);

      const result = await service.getPostById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPostBySlug', () => {
    it('should return post by slug', async () => {
      const post = {
        id: 'post-1',
        title: 'My First Post',
        slug: 'my-first-post',
      };

      mockPostRepository.findBySlug.mockResolvedValue(post);

      const result = await service.getPostBySlug('my-first-post');

      expect(result).toEqual(post);
      expect(mockPostRepository.findBySlug).toHaveBeenCalledWith('my-first-post');
    });

    it('should return null when slug not found', async () => {
      mockPostRepository.findBySlug.mockResolvedValue(null);

      const result = await service.getPostBySlug('nonexistent-slug');

      expect(result).toBeNull();
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts with options', async () => {
      const posts = [
        { id: '1', title: 'Post 1', status: 'PUBLISHED' },
        { id: '2', title: 'Post 2', status: 'PUBLISHED' },
      ];

      const options = {
        status: 'PUBLISHED',
        authorId: 'user-1',
        categoryId: 'category-1',
        limit: 10,
        offset: 0,
      };

      mockPostRepository.findAll.mockResolvedValue(posts);

      const result = await service.getAllPosts(options);

      expect(result).toEqual(posts);
      expect(mockPostRepository.findAll).toHaveBeenCalledWith(options);
    });

    it('should return all posts without options', async () => {
      const posts = [
        { id: '1', title: 'Post 1' },
      ];

      mockPostRepository.findAll.mockResolvedValue(posts);

      const result = await service.getAllPosts();

      expect(result).toEqual(posts);
      expect(mockPostRepository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('updatePost', () => {
    it('should update post', async () => {
      const id = 'post-1';
      const dto = {
        title: 'Updated Post',
        content: 'Updated content',
      };

      const updatedPost = {
        id: 'post-1',
        title: 'Updated Post',
        content: 'Updated content',
        slug: 'my-first-post',
      };

      mockPostRepository.update.mockResolvedValue(updatedPost);

      const result = await service.updatePost(id, dto);

      expect(result).toEqual(updatedPost);
      expect(mockPostRepository.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('deletePost', () => {
    it('should delete post', async () => {
      await service.deletePost('post-1');

      expect(mockPostRepository.delete).toHaveBeenCalledWith('post-1');
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      await service.incrementViewCount('post-1');

      expect(mockPostRepository.incrementViewCount).toHaveBeenCalledWith('post-1');
    });
  });

  describe('publishPost', () => {
    it('should publish post', async () => {
      const id = 'post-1';
      const publishedPost = {
        id: 'post-1',
        title: 'My Post',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      };

      mockPostRepository.update.mockResolvedValue(publishedPost);

      const result = await service.publishPost(id);

      expect(result).toEqual(publishedPost);
      expect(mockPostRepository.update).toHaveBeenCalledWith(id, {
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
      });
    });
  });

  describe('archivePost', () => {
    it('should archive post', async () => {
      const id = 'post-1';
      const archivedPost = {
        id: 'post-1',
        title: 'My Post',
        status: 'ARCHIVED',
      };

      mockPostRepository.update.mockResolvedValue(archivedPost);

      const result = await service.archivePost(id);

      expect(result).toEqual(archivedPost);
      expect(mockPostRepository.update).toHaveBeenCalledWith(id, {
        status: 'ARCHIVED',
      });
    });
  });
});
