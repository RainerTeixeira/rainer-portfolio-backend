/**
 * Testes Unitários: Categories Repository
 * 
 * Testa todas as operações do repositório de categorias.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesRepository } from '../../../src/modules/categories/categories.repository';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('CategoriesRepository', () => {
  let repository: CategoriesRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockCategory = {
    id: 'cat-123',
    name: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Categoria de tecnologia',
    parentId: null,
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesRepository,
        {
          provide: PrismaService,
          useValue: {
            category: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<CategoriesRepository>(CategoriesRepository);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(repository).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve criar categoria com sucesso', async () => {
      const createData = {
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Categoria de tecnologia',
      };

      (prisma.category.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.create(createData);

      expect(prisma.category.create).toHaveBeenCalledWith({ data: createData });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findById', () => {
    it('deve encontrar categoria por ID', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.findById('cat-123');

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-123' },
      });
      expect(result).toEqual(mockCategory);
    });

    it('deve retornar null se categoria não existe', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('deve encontrar categoria por slug', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.findBySlug('tecnologia');

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'tecnologia' },
      });
      expect(result).toEqual(mockCategory);
    });

    it('deve retornar null se categoria não existe', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findBySlug('invalid-slug');

      expect(result).toBeNull();
    });
  });

  describe('findMainCategories', () => {
    it('deve buscar categorias principais', async () => {
      const categories = [mockCategory];
      (prisma.category.findMany as jest.Mock).mockResolvedValue(categories);

      const result = await repository.findMainCategories();

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { parentId: null, isActive: true },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(categories);
    });

    it('deve retornar array vazio se não há categorias', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findMainCategories();

      expect(result).toEqual([]);
    });

    it('deve filtrar apenas categorias ativas', async () => {
      await repository.findMainCategories();

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('deve ordenar por order asc', async () => {
      await repository.findMainCategories();

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { order: 'asc' },
        })
      );
    });
  });

  describe('findSubcategories', () => {
    it('deve buscar subcategorias de uma categoria', async () => {
      const subcategory = {
        ...mockCategory,
        id: 'subcat-123',
        name: 'JavaScript',
        slug: 'javascript',
        parentId: 'cat-123',
      };
      const subcategories = [subcategory];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(subcategories);

      const result = await repository.findSubcategories('cat-123');

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { parentId: 'cat-123', isActive: true },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(subcategories);
    });

    it('deve retornar array vazio se não há subcategorias', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await repository.findSubcategories('cat-123');

      expect(result).toEqual([]);
    });

    it('deve filtrar apenas subcategorias ativas', async () => {
      await repository.findSubcategories('cat-123');

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });
  });

  describe('update', () => {
    it('deve atualizar categoria com sucesso', async () => {
      const updateData = {
        name: 'Tecnologia Atualizada',
        description: 'Descrição atualizada',
      };

      const updatedCategory = { ...mockCategory, ...updateData };
      (prisma.category.update as jest.Mock).mockResolvedValue(updatedCategory);

      const result = await repository.update('cat-123', updateData);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-123' },
        data: updateData,
      });
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('delete', () => {
    it('deve deletar categoria com sucesso', async () => {
      (prisma.category.delete as jest.Mock).mockResolvedValue(mockCategory);

      const result = await repository.delete('cat-123');

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-123' },
      });
      expect(result).toBe(true);
    });

    it('deve retornar true mesmo se Prisma retornar void', async () => {
      (prisma.category.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete('cat-123');

      expect(result).toBe(true);
    });
  });
});

