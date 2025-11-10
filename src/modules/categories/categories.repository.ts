/**
 * Repositório de Categorias
 * 
 * Camada de acesso a dados para categorias.
 * 
 * @module modules/categories/categories.repository
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Category, CreateCategoryData, UpdateCategoryData } from './category.model.js';

/**
 * CategoriesRepository
 *
 * Camada de acesso a dados de categorias hierárquicas (Prisma).
 */
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria categoria. */
  async create(data: CreateCategoryData): Promise<Category> {
    return await this.prisma.category.create({ data: data as any }) as any;
  }

  /** Retorna categoria por ID. */
  async findById(id: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({ where: { id } }) as any;
  }

  /** Retorna categoria por slug. */
  async findBySlug(slug: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({ where: { slug } }) as any;
  }

  /** Lista categorias principais (sem parentId, ativas, ordenadas). */
  async findMainCategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { order: 'asc' },
    }) as any;
  }

  /** Lista subcategorias de uma categoria pai (ativas, ordenadas). */
  async findSubcategories(parentId: string): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { parentId, isActive: true },
      orderBy: { order: 'asc' },
    }) as any;
  }

  /** Lista todas as subcategorias (parentId != null, ativas, ordenadas). */
  async findAllSubcategories(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: { 
        parentId: { not: null },
        isActive: true 
      },
      orderBy: { order: 'asc' },
    }) as any;
  }

  /** Atualiza categoria. */
  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    return await this.prisma.category.update({ 
      where: { id }, 
      data: {
        ...(data as any),
        updatedAt: new Date(), // Atualiza apenas quando há mudança real
      }
    }) as any;
  }

  /** Remove categoria por ID. */
  async delete(id: string): Promise<boolean> {
    await this.prisma.category.delete({ where: { id } });
    return true;
  }
}

