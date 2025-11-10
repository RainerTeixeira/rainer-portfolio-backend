/**
 * Módulo de Categorias
*
* Módulo NestJS para gerenciamento de categorias e subcategorias.
* Organiza controllers e services para CRUD, navegação hierárquica e
* consultas por slug/ID.
 *
 * Controllers:
 * - CategoriesController
 *
 * Providers:
 * - CategoriesService
 * - CategoriesRepository
 *
 * Exports:
 * - CategoriesService
 * - CategoriesRepository
 *
 *
 * @module modules/categories/categories.module
 */
import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  exports: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}

