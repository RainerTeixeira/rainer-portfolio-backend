import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '../../../../src/modules/categories/controllers/categories.controller';
import { CategoriesService } from '../../../../src/modules/categories/services/categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const mockCategoriesService = {
    createCategory: jest.fn(),
    getCategoryById: jest.fn(),
    getCategoryBySlug: jest.fn(),
    getAllCategories: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
