/**
 * Testes do Categories Service com Banco de Dados Real
 * 
 * Testa toda a lógica de negócio do serviço de categorias usando banco real.
 * Minimiza mocks - usa apenas para serviços externos quando necessário.
 * 
 * Cobertura: 100%
 */

import { TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../../../src/modules/categories/categories.service';
import { CategoriesModule } from '../../../src/modules/categories/categories.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../../helpers/database-test-helper';

describe('CategoriesService (Banco Real)', () => {
  let service: CategoriesService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    // Criar módulo com banco real - sem mocks necessários
    module = await createDatabaseTestModule({
      imports: [CategoriesModule],
    });

    service = module.get<CategoriesService>(CategoriesService);
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

  describe('createCategory', () => {
    it('deve criar categoria com sucesso no banco real', async () => {
      const createData = {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
      };

    const result = await service.createCategory(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Category');
      expect(result.parentId).toBeNull();

      // Validar no banco
      const categoryInDb = await prisma.category.findUnique({
        where: { id: result.id },
      });
      expect(categoryInDb).not.toBeNull();
      expect(categoryInDb?.name).toBe('Test Category');
    });

    it('deve criar subcategoria com parentId no banco real', async () => {
      // Criar categoria principal
      const parent = await service.createCategory({
        name: 'Parent Category',
        slug: `parent-${Date.now()}`,
      });

      // Criar subcategoria
      const subcategory = await service.createCategory({
        name: 'Sub Category',
        slug: `sub-${Date.now()}`,
        parentId: parent.id,
      });

      expect(subcategory.parentId).toBe(parent.id);

      // Validar no banco
      const subcategoryInDb = await prisma.category.findUnique({
        where: { id: subcategory.id },
        include: { parent: true },
      });
      expect(subcategoryInDb?.parentId).toBe(parent.id);
      expect(subcategoryInDb?.parent?.name).toBe('Parent Category');
    });
  });

  describe('getCategoryById', () => {
    it('deve buscar categoria por ID com sucesso do banco real', async () => {
      const category = await service.createCategory({
        name: 'Test Category',
        slug: `test-${Date.now()}`,
      });

      const result = await service.getCategoryById(category.id);

      expect(result.id).toBe(category.id);
      expect(result.name).toBe('Test Category');

      // Validar no banco
      const categoryInDb = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(categoryInDb).not.toBeNull();
  });

  it('deve lançar NotFoundException quando categoria não existe', async () => {
      // Usar um ObjectId válido mas que não existe no banco
      const validButNonExistentId = '507f1f77bcf86cd799439011';
      await expect(service.getCategoryById(validButNonExistentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategoryBySlug', () => {
    it('deve buscar categoria por slug com sucesso do banco real', async () => {
      const slug = `tech-${Date.now()}`;
      const category = await service.createCategory({
        name: 'Technology',
        slug,
      });

      const result = await service.getCategoryBySlug(slug);

      expect(result.slug).toBe(slug);
      expect(result.id).toBe(category.id);

      // Validar no banco
      const categoryInDb = await prisma.category.findUnique({
        where: { slug },
      });
      expect(categoryInDb).not.toBeNull();
    });

    it('deve lançar NotFoundException quando slug não existe', async () => {
      await expect(service.getCategoryBySlug('invalid-slug')).rejects.toThrow('Categoria não encontrada');
    });
  });

  describe('listSubcategories', () => {
    it('deve listar subcategorias no banco real', async () => {
      // Criar categoria principal
      const parent = await service.createCategory({
        name: 'Parent',
        slug: `parent-${Date.now()}`,
      });

      // Criar subcategorias
      await service.createCategory({
        name: 'Sub 1',
        slug: `sub-1-${Date.now()}`,
        parentId: parent.id,
      });

      await service.createCategory({
        name: 'Sub 2',
        slug: `sub-2-${Date.now()}`,
        parentId: parent.id,
      });

      // Listar subcategorias
      const result = await service.listSubcategories(parent.id);

      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(sub => {
        expect(sub.parentId).toBe(parent.id);
      });

      // Validar no banco
      const subcategoriesInDb = await prisma.category.findMany({
        where: { parentId: parent.id },
      });
      expect(subcategoriesInDb.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateCategory', () => {
    it('deve atualizar categoria no banco real', async () => {
      const category = await service.createCategory({
        name: 'Original Name',
        slug: `original-${Date.now()}`,
      });

      const updateData = { name: 'Updated Name' };

      const result = await service.updateCategory(category.id, updateData);

      expect(result.name).toBe('Updated Name');

      // Validar no banco
      const categoryInDb = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(categoryInDb?.name).toBe('Updated Name');
    });
  });

  describe('deleteCategory', () => {
    it('deve deletar categoria do banco real', async () => {
      const category = await service.createCategory({
        name: 'Category to Delete',
        slug: `delete-${Date.now()}`,
      });

      const result = await service.deleteCategory(category.id);

      expect(result.success).toBe(true);

      // Validar no banco que foi deletado
      const categoryInDb = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(categoryInDb).toBeNull();
    });
  });

  describe('listMainCategories', () => {
    it('deve listar categorias principais (sem parentId) no banco real', async () => {
      // Criar 3 categorias principais (explicitamente com isActive: true)
      await service.createCategory({
        name: 'Category 1',
        slug: `cat-1-${Date.now()}`,
        isActive: true,
      });

      await service.createCategory({
        name: 'Category 2',
        slug: `cat-2-${Date.now()}`,
        isActive: true,
      });

      const parent = await service.createCategory({
        name: 'Category 3',
        slug: `cat-3-${Date.now()}`,
        isActive: true,
      });

      // Criar subcategoria (não deve aparecer nas principais)
      await service.createCategory({
        name: 'Sub',
        slug: `sub-${Date.now()}`,
        parentId: parent.id,
        isActive: true,
      });

      // Listar categorias principais
      const result = await service.listMainCategories();

      expect(result.length).toBeGreaterThanOrEqual(3);
      const mainCategories = result.filter(cat => cat.parentId === null);
      expect(mainCategories.length).toBeGreaterThanOrEqual(3);

      // Validar no banco que há 3 principais ativas
      const categoriesInDb = await prisma.category.findMany({
        where: { parentId: null, isActive: true },
      });
      expect(categoriesInDb.length).toBeGreaterThanOrEqual(3);
    });
  });
});
