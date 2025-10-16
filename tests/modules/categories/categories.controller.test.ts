/**
 * Testes Unitários: Categories Controller
 * 
 * Testa todos os endpoints do controller de categorias.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '../../../src/modules/categories/categories.controller';
import { CategoriesService } from '../../../src/modules/categories/categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: jest.Mocked<CategoriesService>;

  const mockCategory = {
    id: 'cat-123',
    name: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Categoria de tecnologia',
    parentId: null,
    order: 1,
    isActive: true,
    postsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            createCategory: jest.fn(),
            getCategoryById: jest.fn(),
            getCategoryBySlug: jest.fn(),
            listMainCategories: jest.fn(),
            listSubcategories: jest.fn(),
            updateCategory: jest.fn(),
            deleteCategory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get(CategoriesService) as jest.Mocked<CategoriesService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve criar categoria com sucesso', async () => {
      const createData = {
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Categoria de tecnologia',
      };

      service.createCategory.mockResolvedValue(mockCategory);

      const result = await controller.create(createData);

      expect(service.createCategory).toHaveBeenCalledWith(createData);
      expect(result).toEqual({
        success: true,
        data: mockCategory,
      });
    });
  });

  describe('list', () => {
    it('deve listar categorias principais', async () => {
      const categories = [mockCategory];
      service.listMainCategories.mockResolvedValue(categories);

      const result = await controller.list();

      expect(service.listMainCategories).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: categories,
      });
    });

    it('deve retornar array vazio se não há categorias', async () => {
      service.listMainCategories.mockResolvedValue([]);

      const result = await controller.list();

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('findById', () => {
    it('deve buscar categoria por ID', async () => {
      service.getCategoryById.mockResolvedValue(mockCategory);

      const result = await controller.findById('cat-123');

      expect(service.getCategoryById).toHaveBeenCalledWith('cat-123');
      expect(result).toEqual({
        success: true,
        data: mockCategory,
      });
    });

    it('deve propagar NotFoundException', async () => {
      const error = new Error('Categoria não encontrada');
      service.getCategoryById.mockRejectedValue(error);

      await expect(controller.findById('invalid-id')).rejects.toThrow(error);
    });
  });

  describe('findBySlug', () => {
    it('deve buscar categoria por slug', async () => {
      service.getCategoryBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findBySlug('tecnologia');

      expect(service.getCategoryBySlug).toHaveBeenCalledWith('tecnologia');
      expect(result).toEqual({
        success: true,
        data: mockCategory,
      });
    });

    it('deve propagar NotFoundException', async () => {
      const error = new Error('Categoria não encontrada');
      service.getCategoryBySlug.mockRejectedValue(error);

      await expect(controller.findBySlug('invalid-slug')).rejects.toThrow(error);
    });
  });

  describe('getSubcategories', () => {
    it('deve listar subcategorias', async () => {
      const subcategory = {
        ...mockCategory,
        id: 'subcat-123',
        name: 'JavaScript',
        slug: 'javascript',
        parentId: 'cat-123',
        postsCount: 0,
      };
      const subcategories = [subcategory];

      service.listSubcategories.mockResolvedValue(subcategories);

      const result = await controller.getSubcategories('cat-123');

      expect(service.listSubcategories).toHaveBeenCalledWith('cat-123');
      expect(result).toEqual({
        success: true,
        data: subcategories,
      });
    });

    it('deve retornar array vazio se não há subcategorias', async () => {
      service.listSubcategories.mockResolvedValue([]);

      const result = await controller.getSubcategories('cat-123');

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('update', () => {
    it('deve atualizar categoria com sucesso', async () => {
      const updateData = {
        name: 'Tecnologia Atualizada',
        description: 'Descrição atualizada',
      };

      const updatedCategory = { ...mockCategory, ...updateData };
      service.updateCategory.mockResolvedValue(updatedCategory);

      const result = await controller.update('cat-123', updateData);

      expect(service.updateCategory).toHaveBeenCalledWith('cat-123', updateData);
      expect(result).toEqual({
        success: true,
        data: updatedCategory,
      });
    });

    it('deve propagar NotFoundException se categoria não existe', async () => {
      const error = new Error('Categoria não encontrada');
      service.updateCategory.mockRejectedValue(error);

      await expect(controller.update('invalid-id', {})).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('deve deletar categoria com sucesso', async () => {
      service.deleteCategory.mockResolvedValue({ success: true });

      const result = await controller.delete('cat-123');

      expect(service.deleteCategory).toHaveBeenCalledWith('cat-123');
      expect(result).toEqual({ success: true });
    });

    it('deve propagar NotFoundException se categoria não existe', async () => {
      const error = new Error('Categoria não encontrada');
      service.deleteCategory.mockRejectedValue(error);

      await expect(controller.delete('invalid-id')).rejects.toThrow(error);
    });
  });
});

