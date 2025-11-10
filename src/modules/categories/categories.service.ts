/**
 * Serviço de Categorias
 *
 * Camada de lógica de negócio para categorias e subcategorias.
 * Implementa CRUD, navegação hierárquica e consultas por slug/ID.
 *
 * @module modules/categories/categories.service
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';
import type { CreateCategoryData, UpdateCategoryData } from './category.model.js';

/**
 * CategoriesService
 *
 * Camada de regras de negócio para categorias e subcategorias. Implementa
 * operações de CRUD, navegação hierárquica e consultas por slug/ID.
 *
 * Convenções:
 * - Lança NotFoundException quando o recurso não existe.
 * - Estruturas de retorno simples e previsíveis.
 *
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  /**
   * Cria uma nova categoria.
   *
   * @param data Dados da categoria (nome, slug, parentId opcional).
   * @returns Categoria criada.
   */
  async createCategory(data: CreateCategoryData) {
    return await this.categoriesRepository.create(data);
  }

  /**
   * Retorna uma categoria por ID.
   *
   * @param id ID da categoria.
   * @returns Categoria encontrada.
   * @throws NotFoundException se não existir.
   */
  async getCategoryById(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  /**
   * Retorna uma categoria por slug.
   *
   * @param slug Slug da categoria.
   * @returns Categoria encontrada.
   * @throws NotFoundException se não existir.
   */
  async getCategoryBySlug(slug: string) {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return category;
  }

  /**
   * Lista categorias principais (sem `parentId`).
   *
   * @returns Coleção de categorias principais.
   */
  async listMainCategories() {
    return await this.categoriesRepository.findMainCategories();
  }

  /**
   * Lista subcategorias de uma categoria pai.
   *
   * @param parentId ID da categoria pai.
   * @returns Coleção de subcategorias.
   */
  async listSubcategories(parentId: string) {
    return await this.categoriesRepository.findSubcategories(parentId);
  }

  /**
   * Lista todas as subcategorias disponíveis (`parentId != null`).
   *
   * @returns Coleção de todas as subcategorias.
   */
  async listAllSubcategories() {
    return await this.categoriesRepository.findAllSubcategories();
  }

  /**
   * Atualiza uma categoria por ID.
   *
   * @param id ID da categoria.
   * @param data Dados a atualizar.
   * @returns Categoria atualizada.
   */
  async updateCategory(id: string, data: UpdateCategoryData) {
    await this.getCategoryById(id);
    return await this.categoriesRepository.update(id, data);
  }

  /**
   * Remove uma categoria por ID.
   *
   * @param id ID da categoria.
   * @returns Objeto `{ success: true }` em caso de sucesso.
   */
  async deleteCategory(id: string) {
    await this.getCategoryById(id);
    await this.categoriesRepository.delete(id);
    return { success: true };
  }
}

