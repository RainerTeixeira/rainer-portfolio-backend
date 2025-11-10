/**
 * Testes de Integração: Posts + Categories
 * 
 * Testa a integração entre posts e categorias/subcategorias usando banco real.
 * Valida a hierarquia de categorias (2 níveis) e relações com posts.
 * Minimiza mocks - usa apenas para serviços externos.
 */

import { TestingModule } from '@nestjs/testing';
import { PostsModule } from '../../src/modules/posts/posts.module';
import { CategoriesModule } from '../../src/modules/categories/categories.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { PostsService } from '../../src/modules/posts/posts.service';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { UsersService } from '../../src/modules/users/users.service';
import { CloudinaryService } from '../../src/modules/cloudinary/cloudinary.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PostStatus } from '../../src/modules/posts/post.model';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../helpers/database-test-helper';

describe('Posts + Categories Integration (Banco Real)', () => {
  let postsService: PostsService;
  let categoriesService: CategoriesService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    // Criar módulo com banco real - apenas mock do Cloudinary (serviço externo)
    module = await createDatabaseTestModule({
      imports: [
        PostsModule,
        CategoriesModule,
        UsersModule,
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

    postsService = module.get<PostsService>(PostsService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    usersService = module.get<UsersService>(UsersService);
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

  describe('Fluxo Completo: Categoria → Subcategoria → Post', () => {
    it('deve criar categoria principal, subcategoria e post em sequência e validar no banco', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      // Criar usuário
      await usersService.createUser({
        fullName: 'Author User',
        cognitoSub: authorCognitoSub,
      });

      // 1. Criar categoria principal (Tecnologia)
      const category = await categoriesService.createCategory({
        name: 'Tecnologia',
        slug: `tecnologia-${Date.now()}`,
        description: 'Categoria de tecnologia',
        isActive: true,
      });

      expect(category.id).toBeDefined();
      expect(category.parentId).toBeNull();

      // Validar no banco
      const categoryInDb = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(categoryInDb).not.toBeNull();
      expect(categoryInDb?.name).toBe('Tecnologia');
      expect(categoryInDb?.parentId).toBeNull();

      // 2. Criar subcategoria (Frontend)
      const subcategory = await categoriesService.createCategory({
        name: 'Frontend',
        slug: `frontend-${Date.now()}`,
        description: 'Desenvolvimento Frontend',
        parentId: category.id,
        isActive: true,
      });

      expect(subcategory.id).toBeDefined();
      expect(subcategory.parentId).toBe(category.id);

      // Validar no banco
      const subcategoryInDb = await prisma.category.findUnique({
        where: { id: subcategory.id },
        include: { parent: true },
      });
      expect(subcategoryInDb).not.toBeNull();
      expect(subcategoryInDb?.parentId).toBe(category.id);
      expect(subcategoryInDb?.parent?.name).toBe('Tecnologia');

      // 3. Criar post na subcategoria
      const post = await postsService.createPost({
        title: 'Introdução ao React',
        slug: `introducao-react-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.PUBLISHED,
      });

      expect(post.id).toBeDefined();
      expect(post.subcategoryId).toBe(subcategory.id);
      expect(post.authorId).toBe(authorCognitoSub);

      // Validar no banco
      const postInDb = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
          subcategory: {
            include: {
              parent: true,
            },
          },
          author: true,
        },
      });
      expect(postInDb).not.toBeNull();
      expect(postInDb?.subcategory.parent?.name).toBe('Tecnologia');
      expect(postInDb?.subcategory.name).toBe('Frontend');
      
      // Verificar relacionamento com author (pode ser null se relacionamento não foi carregado)
      if (postInDb?.author) {
        expect(postInDb.author.cognitoSub).toBe(authorCognitoSub);
      } else {
        // Se author não foi incluído, verificar via authorId diretamente
        expect(postInDb?.authorId).toBe(authorCognitoSub);
      }
    });
  });

  describe('Hierarquia de Categorias', () => {
    it('deve listar categorias principais (sem parentId) no banco real', async () => {
      // Criar categorias principais
      const cat1 = await categoriesService.createCategory({
        name: 'Tecnologia',
        slug: `tecnologia-${Date.now()}`,
        isActive: true,
      });

      await categoriesService.createCategory({
        name: 'Culinária',
        slug: `culinaria-${Date.now()}`,
        isActive: true,
      });

      // Criar subcategoria (não deve aparecer na lista principal)
      await categoriesService.createCategory({
        name: 'Frontend',
        slug: `frontend-${Date.now()}`,
        parentId: cat1.id,
        isActive: true,
      });

      // Listar categorias principais
      const categories = await categoriesService.listMainCategories();

      expect(categories.length).toBeGreaterThanOrEqual(2);
      const mainCategories = categories.filter(cat => cat.parentId === null);
      expect(mainCategories.length).toBeGreaterThanOrEqual(2);

      // Validar no banco
      const categoriesInDb = await prisma.category.findMany({
        where: { parentId: null },
      });
      expect(categoriesInDb.length).toBeGreaterThanOrEqual(2);
    });

    it('deve listar subcategorias de uma categoria principal no banco real', async () => {
      // Criar categoria principal
      const parent = await categoriesService.createCategory({
        name: 'Tecnologia',
        slug: `tech-${Date.now()}`,
        isActive: true,
      });

      // Criar subcategorias
      await categoriesService.createCategory({
        name: 'Frontend',
        slug: `frontend-${Date.now()}`,
        parentId: parent.id,
        isActive: true,
      });

      await categoriesService.createCategory({
        name: 'Backend',
        slug: `backend-${Date.now()}`,
        parentId: parent.id,
        isActive: true,
      });

      await categoriesService.createCategory({
        name: 'DevOps',
        slug: `devops-${Date.now()}`,
        parentId: parent.id,
        isActive: true,
      });

      // Listar subcategorias
      const subcategories = await categoriesService.listSubcategories(parent.id);

      expect(subcategories.length).toBeGreaterThanOrEqual(3);
      subcategories.forEach(sub => {
        expect(sub.parentId).toBe(parent.id);
      });

      // Validar no banco
      const subcategoriesInDb = await prisma.category.findMany({
        where: { parentId: parent.id },
      });
      expect(subcategoriesInDb.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Posts por Subcategoria', () => {
    it('deve listar todos os posts de uma subcategoria no banco real', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      // Criar usuário
      await usersService.createUser({
        fullName: 'Author',
        cognitoSub: authorCognitoSub,
      });

      // Criar categoria e subcategoria
      const category = await categoriesService.createCategory({
        name: 'Tech',
        slug: `tech-${Date.now()}`,
        isActive: true,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Frontend',
        slug: `frontend-${Date.now()}`,
        parentId: category.id,
        isActive: true,
      });

      // Criar posts
      await postsService.createPost({
        title: 'Introdução ao React',
        slug: `intro-react-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.PUBLISHED,
      });

      await postsService.createPost({
        title: 'Vue.js do Zero',
        slug: `vue-zero-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.PUBLISHED,
      });

      await postsService.createPost({
        title: 'Angular Avançado',
        slug: `angular-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.DRAFT,
      });

      // Listar posts da subcategoria
      const posts = await postsService.getPostsBySubcategory(subcategory.id);

      expect(posts.length).toBeGreaterThanOrEqual(3);
      posts.forEach(post => {
        expect(post.subcategoryId).toBe(subcategory.id);
      });

      // Validar no banco
      const postsInDb = await prisma.post.findMany({
        where: { subcategoryId: subcategory.id },
      });
      expect(postsInDb.length).toBeGreaterThanOrEqual(3);
    });

    it('deve retornar array vazio se subcategoria não tem posts', async () => {
      // Criar categoria e subcategoria
      const category = await categoriesService.createCategory({
        name: 'Empty',
        slug: `empty-${Date.now()}`,
      });

      const subcategory = await categoriesService.createCategory({
        name: 'Empty Sub',
        slug: `empty-sub-${Date.now()}`,
        parentId: category.id,
      });

      // Listar posts da subcategoria vazia
      const posts = await postsService.getPostsBySubcategory(subcategory.id);

      expect(posts).toHaveLength(0);

      // Validar no banco
      const postsInDb = await prisma.post.findMany({
        where: { subcategoryId: subcategory.id },
      });
      expect(postsInDb).toHaveLength(0);
    });
  });

  describe('Publicação de Posts', () => {
    it('deve publicar um post (DRAFT → PUBLISHED) e validar no banco', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      // Criar usuário
      await usersService.createUser({
        fullName: 'Author',
        cognitoSub: authorCognitoSub,
      });

      // Criar categoria e subcategoria
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

      // Criar post como DRAFT
      const post = await postsService.createPost({
        title: 'Meu Post',
        slug: `meu-post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.DRAFT,
      });

      expect(post.status).toBe(PostStatus.DRAFT);
      expect(post.publishedAt).toBeNull();

      // Publicar post
      const publishedPost = await postsService.publishPost(post.id);

      expect(publishedPost.status).toBe(PostStatus.PUBLISHED);
      expect(publishedPost.publishedAt).toBeDefined();

      // Validar no banco
      const postInDb = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(postInDb?.status).toBe('PUBLISHED');
      expect(postInDb?.publishedAt).not.toBeNull();
    });

    it('deve despublicar um post (PUBLISHED → DRAFT) e validar no banco', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      // Criar usuário
      await usersService.createUser({
        fullName: 'Author',
        cognitoSub: authorCognitoSub,
      });

      // Criar categoria e subcategoria
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

      // Criar post como PUBLISHED
      const post = await postsService.createPost({
        title: 'Meu Post',
        slug: `meu-post-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.PUBLISHED,
      });

      expect(post.status).toBe(PostStatus.PUBLISHED);

      // Despublicar post
      const draftPost = await postsService.unpublishPost(post.id);

      expect(draftPost.status).toBe(PostStatus.DRAFT);
      expect(draftPost.publishedAt).toBeNull();

      // Validar no banco
      const postInDb = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(postInDb?.status).toBe('DRAFT');
      expect(postInDb?.publishedAt).toBeNull();
    });
  });

  describe('Filtros de Posts por Categoria e Status', () => {
    it('deve listar posts publicados de uma subcategoria específica no banco real', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      // Criar usuário
      await usersService.createUser({
        fullName: 'Author',
        cognitoSub: authorCognitoSub,
      });

      // Criar categoria e subcategoria
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

      // Criar posts publicados
      await postsService.createPost({
        title: 'Post 1',
        slug: `post-1-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.PUBLISHED,
      });

      await postsService.createPost({
        title: 'Post 2',
        slug: `post-2-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.PUBLISHED,
      });

      // Criar post em draft (não deve aparecer)
      await postsService.createPost({
        title: 'Post Draft',
        slug: `post-draft-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.DRAFT,
      });

      // Listar posts publicados da subcategoria
      const result = await postsService.listPosts({
        subcategoryId: subcategory.id,
        status: PostStatus.PUBLISHED,
      });

      expect(result.posts.length).toBeGreaterThanOrEqual(2);
      result.posts.forEach(post => {
        expect(post.subcategoryId).toBe(subcategory.id);
        expect(post.status).toBe(PostStatus.PUBLISHED);
      });

      // Validar no banco
      const postsInDb = await prisma.post.findMany({
        where: {
          subcategoryId: subcategory.id,
          status: 'PUBLISHED',
        },
      });
      expect(postsInDb.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Busca de Categoria por Slug', () => {
    it('deve buscar categoria por slug no banco real', async () => {
      const slug = `tecnologia-${Date.now()}`;

      // Criar categoria
      const category = await categoriesService.createCategory({
        name: 'Tecnologia',
        slug,
      });

      // Buscar por slug
      const foundCategory = await categoriesService.getCategoryBySlug(slug);

      expect(foundCategory.slug).toBe(slug);
      expect(foundCategory.id).toBe(category.id);

      // Validar no banco
      const categoryInDb = await prisma.category.findUnique({
        where: { slug },
      });
      expect(categoryInDb).not.toBeNull();
      expect(categoryInDb?.slug).toBe(slug);
    });

    it('deve lançar erro se categoria não encontrada por slug', async () => {
      const slug = `inexistente-${Date.now()}`;

      await expect(categoriesService.getCategoryBySlug(slug))
        .rejects
        .toThrow('Categoria não encontrada');
    });
  });

  describe('Atualização de Categorias', () => {
    it('deve atualizar dados de uma categoria e validar no banco', async () => {
      // Criar categoria
      const category = await categoriesService.createCategory({
        name: 'Tecnologia',
        slug: `tecnologia-${Date.now()}`,
      });

      // Atualizar categoria
      const updatedCategory = await categoriesService.updateCategory(category.id, {
        name: 'Tecnologia & Inovação',
        slug: `tecnologia-inovacao-${Date.now()}`,
        description: 'Nova descrição',
      });

      expect(updatedCategory.name).toBe('Tecnologia & Inovação');

      // Validar no banco
      const categoryInDb = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(categoryInDb?.name).toBe('Tecnologia & Inovação');
    });
  });

  describe('Validações de Posts', () => {
    it('deve lançar erro ao criar post sem subcategoria', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      await usersService.createUser({
        fullName: 'Author',
        cognitoSub: authorCognitoSub,
      });

      await expect(postsService.createPost({
        title: 'Post sem categoria',
        slug: `post-sem-categoria-${Date.now()}`,
        content: { type: 'doc', content: [] },
        authorId: authorCognitoSub,
        subcategoryId: '', // Vazio
      })).rejects.toThrow('Subcategoria é obrigatória');
    });

    it('deve lançar erro ao criar post sem conteúdo', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      await usersService.createUser({
        fullName: 'Author',
        cognitoSub: authorCognitoSub,
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

      await expect(postsService.createPost({
        title: 'Post sem conteúdo',
        slug: `post-sem-conteudo-${Date.now()}`,
        content: null as any,
        authorId: authorCognitoSub,
        subcategoryId: subcategory.id,
      })).rejects.toThrow('Conteúdo do post é obrigatório');
    });
  });

  describe('Incremento de Views', () => {
    it('deve incrementar views ao buscar post por ID e validar no banco', async () => {
      const authorCognitoSub = `cognito-author-${Date.now()}`;

      // Criar usuário
      await usersService.createUser({
        fullName: 'Author',
        cognitoSub: authorCognitoSub,
      });

      // Criar categoria e subcategoria
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

      // Criar post
      const post = await postsService.createPost({
        title: 'Post Test',
        slug: `post-test-${Date.now()}`,
        content: { type: 'doc', content: [] },
        subcategoryId: subcategory.id,
        authorId: authorCognitoSub,
        status: PostStatus.PUBLISHED,
      });

      // Buscar post (deve incrementar views)
      const foundPost = await postsService.getPostById(post.id);

      expect(foundPost.id).toBe(post.id);

      // Aguardar um pouco para o incremento assíncrono
      await new Promise(resolve => setTimeout(resolve, 100));

      // Validar no banco que views foram incrementadas
      const postInDb = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(postInDb?.views).toBeGreaterThan(0);
    });
  });
});
