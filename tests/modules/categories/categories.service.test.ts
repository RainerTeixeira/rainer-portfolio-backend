/**
 * Testes Unitários: Categories Service - SIMPLIFICADO
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../../../src/modules/categories/categories.service';
import { CategoriesRepository } from '../../../src/modules/categories/categories.repository';
import { createMockCategory } from '../../helpers/mocks';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findMainCategories: jest.fn(),
            findSubcategories: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(CategoriesRepository) as jest.Mocked<CategoriesRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar categoria com sucesso', async () => {
    const createData = { name: 'Test Category', slug: 'test-category' };
    const mockCategory = createMockCategory(createData);
    repository.create.mockResolvedValue(mockCategory);

    const result = await service.createCategory(createData);

    expect(repository.create).toHaveBeenCalledWith(createData);
    expect(result).toEqual(mockCategory);
  });

  it('deve buscar categoria por ID', async () => {
    const mockCategory = createMockCategory();
    repository.findById.mockResolvedValue(mockCategory);

    const result = await service.getCategoryById('cat-123');

    expect(repository.findById).toHaveBeenCalledWith('cat-123');
    expect(result).toEqual(mockCategory);
  });

  it('deve lançar NotFoundException quando categoria não existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.getCategoryById('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('deve listar subcategorias', async () => {
    const mockCategories = [createMockCategory()];
    repository.findSubcategories.mockResolvedValue(mockCategories);

    const result = await service.listSubcategories('cat-123');

    expect(repository.findSubcategories).toHaveBeenCalledWith('cat-123');
    expect(result).toEqual(mockCategories);
  });

  it('deve atualizar categoria', async () => {
    const mockCategory = createMockCategory();
    const updateData = { name: 'Updated Name' };
    repository.findById.mockResolvedValue(mockCategory);
    repository.update.mockResolvedValue({ ...mockCategory, ...updateData });

    const result = await service.updateCategory('cat-123', updateData);

    expect(repository.update).toHaveBeenCalledWith('cat-123', updateData);
    expect(result.name).toBe('Updated Name');
  });

  it('deve deletar categoria', async () => {
    const mockCategory = createMockCategory();
    repository.findById.mockResolvedValue(mockCategory);
    repository.delete.mockResolvedValue(true);

    const result = await service.deleteCategory('cat-123');

    expect(repository.delete).toHaveBeenCalledWith('cat-123');
    expect(result.success).toBe(true);
  });

  it('deve buscar categoria por slug', async () => {
    const mockCategory = createMockCategory();
    repository.findBySlug.mockResolvedValue(mockCategory);

    const result = await service.getCategoryBySlug('tech');

    expect(repository.findBySlug).toHaveBeenCalledWith('tech');
    expect(result).toEqual(mockCategory);
  });

  it('deve lançar NotFoundException quando slug não existe', async () => {
    repository.findBySlug.mockResolvedValue(null);

    await expect(service.getCategoryBySlug('invalid-slug')).rejects.toThrow('Categoria não encontrada');
  });

  it('deve listar categorias principais', async () => {
    const mockCategories = [createMockCategory(), createMockCategory()];
    repository.findMainCategories.mockResolvedValue(mockCategories);

    const result = await service.listMainCategories();

    expect(repository.findMainCategories).toHaveBeenCalled();
    expect(result).toEqual(mockCategories);
  });
});
