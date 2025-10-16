import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Category, CreateCategoryData, UpdateCategoryData } from './category.model.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCategoryData): Promise<Category> {
    return await this.prisma.category.create({ data: data as any }) as any;
  }

  async findById(id: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({ where: { id } }) as any;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({ where: { slug } }) as any;
  }

  async findMainCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { order: 'asc' },
    }) as any;
  }

  async findSubcategories(parentId: string): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { parentId, isActive: true },
      orderBy: { order: 'asc' },
    }) as any;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    return await this.prisma.category.update({ where: { id }, data: data as any }) as any;
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.category.delete({ where: { id } });
    return true;
  }
}

