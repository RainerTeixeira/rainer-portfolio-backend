/**
 * Testes de Casos Edge: Likes com Banco Real
 * 
 * Testa casos extremos e situações incomuns no sistema de likes usando banco real.
 * Minimiza mocks - apenas Cloudinary (serviço externo).
 */

import { TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { LikesService } from '../../../src/modules/likes/likes.service';
import { LikesModule } from '../../../src/modules/likes/likes.module';
import { PostsModule } from '../../../src/modules/posts/posts.module';
import { UsersModule } from '../../../src/modules/users/users.module';
import { CategoriesModule } from '../../../src/modules/categories/categories.module';
import { PostsService } from '../../../src/modules/posts/posts.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { CategoriesService } from '../../../src/modules/categories/categories.service';
import { CloudinaryService } from '../../../src/modules/cloudinary/cloudinary.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { PostStatus } from '../../../src/modules/posts/post.model';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../../helpers/database-test-helper';

describe('Likes Edge Cases (Banco Real)', () => {
  let service: LikesService;
  let postsService: PostsService;
  let usersService: UsersService;
  let categoriesService: CategoriesService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createDatabaseTestModule({
      imports: [
        LikesModule,
        PostsModule,
        UsersModule,
        CategoriesModule,
      ],
      providers: [
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn().mockResolvedValue({ url: 'http://example.com/image.jpg' }),
            deleteImage: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    });

    service = module.get<LikesService>(LikesService);
    postsService = module.get<PostsService>(PostsService);
    usersService = module.get<UsersService>(UsersService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('Múltiplos Likes Simultâneos', () => {
    it('deve prevenir duplo like do mesmo usuário no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      // Criar primeiro like
      await service.likePost({
        userId: userCognitoSub,
        postId: post.id,
      });

      // Tentar criar segundo like (deve falhar)
      await expect(
        service.likePost({ userId: userCognitoSub, postId: post.id })
      ).rejects.toThrow(ConflictException);

      // Validar no banco que há apenas um like
      const likesInDb = await prisma.like.findMany({
        where: {
          userId: userCognitoSub,
          postId: post.id,
        },
      });
      expect(likesInDb.length).toBe(1);
    });

    it('deve permitir like após unlike no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      // Criar like
      await service.likePost({
        userId: userCognitoSub,
        postId: post.id,
      });

      // Remover like
      await service.unlikePost(userCognitoSub, post.id);

      // Criar like novamente
      const result = await service.likePost({
        userId: userCognitoSub,
        postId: post.id,
      });

      expect(result.id).toBeDefined();

      // Validar no banco
      const likeInDb = await prisma.like.findFirst({
        where: {
          userId: userCognitoSub,
          postId: post.id,
        },
      });
      expect(likeInDb).not.toBeNull();
      expect(likeInDb?.id).toBe(result.id);
    });
  });

  describe('Contagem de Likes', () => {
    it('deve retornar zero para post sem likes no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      const result = await service.getLikesCount(post.id);

      expect(result.count).toBe(0);

      // Validar no banco
      const likesCountInDb = await prisma.like.count({
        where: { postId: post.id },
      });
      expect(likesCountInDb).toBe(0);
    });

    it('deve retornar contagem precisa no banco real', async () => {
      // Setup
      const user1CognitoSub = `cognito-user1-${Date.now()}`;
      const user2CognitoSub = `cognito-user2-${Date.now()}`;
      const user3CognitoSub = `cognito-user3-${Date.now()}`;

      await usersService.createUser({
        fullName: 'User 1',
        cognitoSub: user1CognitoSub,
      });

      await usersService.createUser({
        fullName: 'User 2',
        cognitoSub: user2CognitoSub,
      });

      await usersService.createUser({
        fullName: 'User 3',
        cognitoSub: user3CognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: user1CognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      // Criar 3 likes
      await service.likePost({
        userId: user1CognitoSub,
        postId: post.id,
      });

      await service.likePost({
        userId: user2CognitoSub,
        postId: post.id,
      });

      await service.likePost({
        userId: user3CognitoSub,
        postId: post.id,
      });

      const result = await service.getLikesCount(post.id);

      expect(result.count).toBeGreaterThanOrEqual(3);
      expect(result.postId).toBe(post.id);

      // Validar no banco
      const likesCountInDb = await prisma.like.count({
        where: { postId: post.id },
      });
      expect(likesCountInDb).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Verificação de Like', () => {
    it('deve retornar false para usuário que nunca deu like no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      const result = await service.hasUserLiked(userCognitoSub, post.id);

      expect(result.hasLiked).toBe(false);

      // Validar no banco
      const likeInDb = await prisma.like.findFirst({
        where: {
          userId: userCognitoSub,
          postId: post.id,
        },
      });
      expect(likeInDb).toBeNull();
    });

    it('deve retornar true para usuário que deu like no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      // Criar like
      await service.likePost({
        userId: userCognitoSub,
        postId: post.id,
      });

      const result = await service.hasUserLiked(userCognitoSub, post.id);

      expect(result.hasLiked).toBe(true);

      // Validar no banco
      const likeInDb = await prisma.like.findFirst({
        where: {
          userId: userCognitoSub,
          postId: post.id,
        },
      });
      expect(likeInDb).not.toBeNull();
    });
  });

  describe('Busca de Likes', () => {
    it('deve retornar array vazio para usuário sem likes no banco real', async () => {
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const likes = await service.getLikesByUser(userCognitoSub);

      expect(likes).toEqual([]);
      expect(Array.isArray(likes)).toBe(true);
    });

    it('deve retornar array vazio para post sem likes no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      const likes = await service.getLikesByPost(post.id);

      expect(likes).toEqual([]);
    });
  });

  describe('Unlike de Post Inexistente', () => {
    it('deve lançar exceção ao tentar unlike sem like prévio no banco real', async () => {
      // Setup
      const userCognitoSub = `cognito-user-${Date.now()}`;
      await usersService.createUser({
        fullName: 'User',
        cognitoSub: userCognitoSub,
      });

      const category = await categoriesService.createCategory({
        name: 'Cat',
        slug: `cat-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      const post = await postsService.createPost({
        title: 'Post',
        slug: `post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      await expect(
        service.unlikePost(userCognitoSub, post.id)
      ).rejects.toThrow(ConflictException);
    });
  });
});
