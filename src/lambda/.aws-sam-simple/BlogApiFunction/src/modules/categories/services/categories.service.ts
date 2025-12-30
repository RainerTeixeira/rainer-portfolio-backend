/**
 * @fileoverview Serviço de Categorias
 *
 * Camada de serviço que coordena operações de categorias.
 *
 * Responsabilidades:
 * - Gerar `id` para novas categorias.
 * - Aplicar defaults simples (ex.: `isActive` quando não informado).
 * - Delegar persistência/consulta ao `CategoryRepository`.
 *
 * @module modules/categories/services/categories.service
 */

import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../../../database/tokens';
import { CategoryRepository } from '../../../database/interfaces/category-repository.interface';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoriesRepo: CategoryRepository,
  ) {}

  /**
   * Cria uma nova categoria.
   *
   * Por que o service gera `id` e defaults:
   * - Evita depender do banco para gerar identificador.
   * - Mantém consistência para `isActive`/`postsCount` independentemente do repositório.
   * - Centraliza regra simples de criação fora do controller.
   *
   * @param {CreateCategoryDto} dto Dados da categoria.
   * @returns {Promise<unknown>} Categoria criada.
   */
  async createCategory(dto: CreateCategoryDto): Promise<unknown> {
    const id = randomUUID();

    return this.categoriesRepo.create({
      id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      isActive: dto.isActive ?? true,
      postsCount: 0,
    });
  }

  /**
   * Busca uma categoria por ID.
   *
   * @param {string} id ID da categoria.
   * @returns {Promise<unknown>} Categoria encontrada.
   */
  async getCategoryById(id: string): Promise<unknown> {
    return this.categoriesRepo.findById(id);
  }

  /**
   * Busca uma categoria por slug.
   *
   * @param {string} slug Slug da categoria.
   * @returns {Promise<unknown>} Categoria encontrada.
   */
  async getCategoryBySlug(slug: string): Promise<unknown> {
    return this.categoriesRepo.findBySlug(slug);
  }

  /**
   * Lista todas as categorias.
   *
   * @returns {Promise<unknown>} Lista de categorias.
   */
  async getAllCategories(): Promise<unknown> {
    return this.categoriesRepo.findAll();
  }

  /**
   * Atualiza dados de uma categoria.
   *
   * @param {string} id ID da categoria.
   * @param {UpdateCategoryDto} dto Campos para atualização.
   * @returns {Promise<unknown>} Categoria atualizada.
   */
  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<unknown> {
    return this.categoriesRepo.update(id, dto);
  }

  /**
   * Remove uma categoria.
   *
   * @param {string} id ID da categoria.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async deleteCategory(id: string): Promise<void> {
    await this.categoriesRepo.delete(id);
  }
}
