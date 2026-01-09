import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { CATEGORY_REPOSITORY } from '../../../database/tokens';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockCategoryRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const dto = {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech related posts',
        isActive: true,
      };

      const createdCategory = {
        id: 'category-1',
        name: 'Technology',
        slug: 'technology',
        description: 'Tech related posts',
        isActive: true,
      };

      mockCategoryRepository.create.mockResolvedValue(createdCategory);

      const result = await service.createCategory(dto);

      expect(result).toEqual(createdCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Technology',
          slug: 'technology',
          description: 'Tech related posts',
          isActive: true,
        })
      );
    });

    it('should create category with default isActive true', async () => {
      const dto = {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech related posts',
      };

      const createdCategory = {
        id: 'category-1',
        name: 'Technology',
        slug: 'technology',
        description: 'Tech related posts',
        isActive: true,
      };

      mockCategoryRepository.create.mockResolvedValue(createdCategory);

      const result = await service.createCategory(dto);

      expect(result).toEqual(createdCategory);
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Technology',
          slug: 'technology',
          description: 'Tech related posts',
          isActive: true,
        })
      );
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      const category = {
        id: 'category-1',
        name: 'Technology',
        slug: 'technology',
      };

      mockCategoryRepository.findById.mockResolvedValue(category);

      const result = await service.getCategoryById('category-1');

      expect(result).toEqual(category);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('category-1');
    });

    it('should return null when category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      const result = await service.getCategoryById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getCategoryBySlug', () => {
    it('should return category by slug', async () => {
      const category = {
        id: 'category-1',
        name: 'Technology',
        slug: 'technology',
      };

      mockCategoryRepository.findBySlug.mockResolvedValue(category);

      const result = await service.getCategoryBySlug('technology');

      expect(result).toEqual(category);
      expect(mockCategoryRepository.findBySlug).toHaveBeenCalledWith('technology');
    });

    it('should return null when slug not found', async () => {
      mockCategoryRepository.findBySlug.mockResolvedValue(null);

      const result = await service.getCategoryBySlug('nonexistent-slug');

      expect(result).toBeNull();
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const categories = [
        { id: '1', name: 'Technology', slug: 'technology' },
        { id: '2', name: 'Science', slug: 'science' },
      ];

      mockCategoryRepository.findAll.mockResolvedValue(categories);

      const result = await service.getAllCategories();

      expect(result).toEqual(categories);
      expect(mockCategoryRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update category', async () => {
      const id = 'category-1';
      const dto = {
        name: 'Updated Technology',
        description: 'Updated description',
      };

      const updatedCategory = {
        id: 'category-1',
        name: 'Updated Technology',
        slug: 'technology',
        description: 'Updated description',
      };

      mockCategoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(id, dto);

      expect(result).toEqual(updatedCategory);
      expect(mockCategoryRepository.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      await service.deleteCategory('category-1');

      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('category-1');
    });
  });
});
