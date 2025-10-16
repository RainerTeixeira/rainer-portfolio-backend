/**
 * Mocks Reutilizáveis
 * 
 * Funções e objetos mock para uso em múltiplos testes.
 */

import type { User } from '../../src/modules/users/user.model';
import { UserRole } from '../../src/modules/users/user.model';
import type { Post } from '../../src/modules/posts/post.model';
import { PostStatus } from '../../src/modules/posts/post.model';
import type { Category } from '../../src/modules/categories/category.model';
import type { Comment } from '../../src/modules/comments/comment.model';

/**
 * Mock de Usuário
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  cognitoSub: 'cognito-sub-123',
  email: 'test@example.com',
  username: 'testuser',
  name: 'Test User',
  role: UserRole.AUTHOR,
  isActive: true,
  isBanned: false,
  postsCount: 0,
  commentsCount: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Mock de Post
 */
export const createMockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-123',
  title: 'Test Post',
  slug: 'test-post',
  content: 'Test content',
  status: PostStatus.PUBLISHED,
  featured: false,
  allowComments: true,
  pinned: false,
  priority: 0,
  subcategoryId: 'subcat-123',
  authorId: 'user-123',
  views: 0,
  likesCount: 0,
  commentsCount: 0,
  bookmarksCount: 0,
  publishedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Mock de Categoria
 */
export const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-123',
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test description',
  order: 0,
  isActive: true,
  postsCount: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Mock de Comentário
 */
export const createMockComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 'comment-123',
  content: 'Test comment',
  postId: 'post-123',
  authorId: 'user-123',
  parentId: null,
  isApproved: true,
  isReported: false,
  isEdited: false,
  likesCount: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Mock do PrismaService
 */
export const createMockPrismaService = (): any => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  post: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  category: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  subcategory: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  comment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  like: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  bookmark: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(createMockPrismaService())),
});

/**
 * Mock do CognitoClient
 */
export const createMockCognitoClient = () => ({
  send: jest.fn(),
});

/**
 * Mock de resposta de autenticação do Cognito
 */
export const createMockCognitoAuthResponse = () => ({
  AuthenticationResult: {
    AccessToken: 'mock-access-token',
    RefreshToken: 'mock-refresh-token',
    IdToken: 'mock-id-token',
    ExpiresIn: 3600,
    TokenType: 'Bearer',
  },
  $metadata: {
    httpStatusCode: 200,
    requestId: 'mock-request-id',
    attempts: 1,
    totalRetryDelay: 0,
  },
});

/**
 * Mock de resposta de registro do Cognito
 */
export const createMockCognitoSignUpResponse = () => ({
  UserSub: 'cognito-sub-123',
  UserConfirmed: false,
  $metadata: {
    httpStatusCode: 200,
    requestId: 'mock-request-id',
    attempts: 1,
    totalRetryDelay: 0,
  },
});

/**
 * Mock de Logger
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

