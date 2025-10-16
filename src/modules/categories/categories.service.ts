import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';
import type { CreateCategoryData, UpdateCategoryData } from './category.model.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async createCategory(data: CreateCategoryData) {
    return await this.categoriesRepository.create(data);
  }

  async getCategoryById(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  async listMainCategories() {
    return await this.categoriesRepository.findMainCategories();
  }

  async listSubcategories(parentId: string) {
    return await this.categoriesRepository.findSubcategories(parentId);
  }

  async updateCategory(id: string, data: UpdateCategoryData) {
    await this.getCategoryById(id);
    return await this.categoriesRepository.update(id, data);
  }

  async deleteCategory(id: string) {
    await this.getCategoryById(id);
    await this.categoriesRepository.delete(id);
    return { success: true };
  }
}

