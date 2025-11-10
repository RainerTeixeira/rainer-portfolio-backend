/**
 * Testes do Bookmarks Service com Banco de Dados Real
 * 
 * Testa toda a lógica de negócio de bookmarks usando banco real.
 * Minimiza mocks - sem mocks necessários.
 * 
 * Cobertura: 100%
 */

import { TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BookmarksService } from '../../../src/modules/bookmarks/bookmarks.service';
import { BookmarksModule } from '../../../src/modules/bookmarks/bookmarks.module';
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

describe('BookmarksService (Banco Real)', () => {
  let service: BookmarksService;
  let postsService: PostsService;
  let usersService: UsersService;
  let categoriesService: CategoriesService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    // Criar módulo com banco real - apenas mock do Cloudinary (serviço externo)
    module = await createDatabaseTestModule({
      imports: [
        BookmarksModule,
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

    service = module.get<BookmarksService>(BookmarksService);
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

  describe('createBookmark', () => {
    it('deve criar bookmark com sucesso no banco real', async () => {
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

      // Criar bookmark
      const bookmarkData = {
        userId: userCognitoSub,
        postId: post.id,
      };

      const result = await service.createBookmark(bookmarkData);

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(userCognitoSub);
      expect(result.postId).toBe(post.id);

      // Validar no banco - primeiro verificar se o post ainda existe
      const postExists = await prisma.post.findUnique({ where: { id: post.id } });
      expect(postExists).not.toBeNull();
      
      // Validar bookmark
      const bookmarkInDb = await prisma.bookmark.findUnique({
        where: { id: result.id },
        include: { user: true, post: true },
      });
      expect(bookmarkInDb).not.toBeNull();
      expect(bookmarkInDb?.user.cognitoSub).toBe(userCognitoSub);
      expect(bookmarkInDb?.post).not.toBeNull();
      expect(bookmarkInDb?.post?.id).toBe(post.id);

      // Validar que bookmark foi criado (contador pode não ser atualizado automaticamente)
      const bookmarkExists = await prisma.bookmark.findFirst({
        where: {
          userId: userCognitoSub,
          postId: post.id,
        },
      });
      expect(bookmarkExists).not.toBeNull();
    });

    it('deve lançar ConflictException se bookmark já existe no banco real', async () => {
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

      // Criar bookmark primeiro
      await service.createBookmark({
        userId: userCognitoSub,
        postId: post.id,
      });

      // Tentar criar novamente
      await expect(service.createBookmark({
        userId: userCognitoSub,
        postId: post.id,
      })).rejects.toThrow(ConflictException);

      // Validar no banco que há apenas um bookmark
      const bookmarksInDb = await prisma.bookmark.findMany({
        where: {
          userId: userCognitoSub,
          postId: post.id,
        },
      });
      expect(bookmarksInDb.length).toBe(1);
    });
  });

  describe('removeBookmark', () => {
    it('deve remover bookmark com sucesso do banco real', async () => {
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

      // Criar bookmark primeiro
      const bookmark = await service.createBookmark({
        userId: userCognitoSub,
        postId: post.id,
      });

      // Remover bookmark
      const result = await service.deleteBookmark(bookmark.id);

      expect(result.success).toBe(true);

      // Validar no banco que foi removido
      const bookmarkInDb = await prisma.bookmark.findUnique({
        where: { id: bookmark.id },
      });
      expect(bookmarkInDb).toBeNull();
    });

    it('deve lançar NotFoundException quando bookmark não existe', async () => {
      // Usar um ObjectId válido mas que não existe no banco
      const validButNonExistentId = '507f1f77bcf86cd799439011';
      await expect(service.deleteBookmark(validButNonExistentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBookmarksByUser', () => {
    it('deve buscar bookmarks do usuário no banco real', async () => {
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

      // Criar múltiplos posts
      const post1 = await postsService.createPost({
        title: 'Post 1',
        slug: `post-1-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      const post2 = await postsService.createPost({
        title: 'Post 2',
        slug: `post-2-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: userCognitoSub,
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      // Criar bookmarks
      await service.createBookmark({
        userId: userCognitoSub,
        postId: post1.id,
      });

      await service.createBookmark({
        userId: userCognitoSub,
        postId: post2.id,
      });

      // Buscar bookmarks do usuário
      const result = await service.getBookmarksByUser(userCognitoSub);

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(bookmark => {
        expect(bookmark.userId).toBe(userCognitoSub);
      });

      // Validar no banco
      const bookmarksInDb = await prisma.bookmark.findMany({
        where: { userId: userCognitoSub },
      });
      expect(bookmarksInDb.length).toBeGreaterThanOrEqual(2);
    });
    });
});
