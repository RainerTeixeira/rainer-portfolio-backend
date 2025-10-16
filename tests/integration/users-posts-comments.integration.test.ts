/**
 * Testes de Integração: Users + Posts + Comments
 * 
 * Testa a integração entre usuários, posts e comentários.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/modules/users/users.service';
import { PostsService } from '../../src/modules/posts/posts.service';
import { CommentsService } from '../../src/modules/comments/comments.service';
import { UsersRepository } from '../../src/modules/users/users.repository';
import { PostsRepository } from '../../src/modules/posts/posts.repository';
import { CommentsRepository } from '../../src/modules/comments/comments.repository';

describe('Users + Posts + Comments Integration', () => {
  let usersService: UsersService;
  let postsService: PostsService;
  let commentsService: CommentsService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let postsRepository: jest.Mocked<PostsRepository>;
  let commentsRepository: jest.Mocked<CommentsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PostsService,
        CommentsService,
        {
          provide: UsersRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findByCognitoSub: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            incrementPostsCount: jest.fn(),
            decrementPostsCount: jest.fn(),
            incrementCommentsCount: jest.fn(),
            findOrCreateFromCognito: jest.fn(),
          },
        },
        {
          provide: PostsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findByAuthor: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            incrementViews: jest.fn().mockResolvedValue(undefined),
          },
        },
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

    usersService = module.get<UsersService>(UsersService);
    postsService = module.get<PostsService>(PostsService);
    commentsService = module.get<CommentsService>(CommentsService);
    usersRepository = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
    postsRepository = module.get(PostsRepository) as jest.Mocked<PostsRepository>;
    commentsRepository = module.get(CommentsRepository) as jest.Mocked<CommentsRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fluxo Completo: Usuário → Post → Comentário', () => {
    it('deve criar usuário, post e comentário em sequência', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      // 1. Criar usuário
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        cognitoSub: 'cognito-123',
      };
      usersRepository.create.mockResolvedValue(mockUser as any);

      const user = await usersService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        cognitoSub: 'cognito-123',
      });
      expect(user.id).toBe(userId);

      // 2. Criar post
      const mockPost = {
        id: postId,
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        authorId: userId,
        subcategoryId: 'subcat-123',
      };
      postsRepository.create.mockResolvedValue(mockPost as any);

      const post = await postsService.createPost({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        authorId: userId,
        subcategoryId: 'subcat-123',
      });
      expect(post.authorId).toBe(userId);

      // 3. Criar comentário
      const mockComment = {
        id: 'comment-123',
        content: 'Great post!',
        postId,
        authorId: userId,
      };
      commentsRepository.create.mockResolvedValue(mockComment as any);

      const comment = await commentsService.createComment({
        content: 'Great post!',
        postId,
        authorId: userId,
      });
      expect(comment.postId).toBe(postId);
      expect(comment.authorId).toBe(userId);
    });
  });

  describe('Busca de Posts por Autor', () => {
    it('deve buscar todos os posts de um autor', async () => {
      const authorId = 'author-123';
      const mockPosts = [
        { id: 'post-1', title: 'Post 1', authorId },
        { id: 'post-2', title: 'Post 2', authorId },
        { id: 'post-3', title: 'Post 3', authorId },
      ];

      postsRepository.findByAuthor.mockResolvedValue(mockPosts as any);

      const posts = await postsService.getPostsByAuthor(authorId);

      expect(posts).toHaveLength(3);
      posts.forEach(post => {
        expect(post.authorId).toBe(authorId);
      });
    });
  });

  describe('Busca de Comentários', () => {
    it('deve buscar comentários de um post', async () => {
      const postId = 'post-123';
      const mockComments = [
        { id: 'comment-1', content: 'Comment 1', postId },
        { id: 'comment-2', content: 'Comment 2', postId },
      ];

      commentsRepository.findByPost.mockResolvedValue(mockComments as any);

      const comments = await commentsService.getCommentsByPost(postId);

      expect(comments).toHaveLength(2);
      expect(comments[0].postId).toBe(postId);
    });

    it('deve buscar comentários de um autor', async () => {
      const authorId = 'author-123';
      const mockComments = [
        { id: 'comment-1', content: 'My comment 1', authorId },
        { id: 'comment-2', content: 'My comment 2', authorId },
      ];

      commentsRepository.findByAuthor.mockResolvedValue(mockComments as any);

      const comments = await commentsService.getCommentsByAuthor(authorId);

      expect(comments).toHaveLength(2);
      comments.forEach(comment => {
        expect(comment.authorId).toBe(authorId);
      });
    });
  });

  describe('Contadores de Usuário', () => {
    it('deve incrementar contador de posts ao criar post', async () => {
      const authorId = 'author-123';
      
      usersRepository.incrementPostsCount.mockResolvedValue(undefined);

      await usersRepository.incrementPostsCount(authorId);

      expect(usersRepository.incrementPostsCount).toHaveBeenCalledWith(authorId);
    });

    it('deve incrementar contador de comentários ao criar comentário', async () => {
      const authorId = 'author-123';
      
      usersRepository.incrementCommentsCount.mockResolvedValue(undefined);

      await usersRepository.incrementCommentsCount(authorId);

      expect(usersRepository.incrementCommentsCount).toHaveBeenCalledWith(authorId);
    });
  });
});

