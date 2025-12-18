import { Injectable } from '@nestjs/common';
import { Category, CategoryRepository } from '../interfaces/category-repository.interface';
import { DynamoDBService } from './dynamodb.service';

// Interface interna para incluir chaves do DynamoDB
interface CategoryWithKeys extends Category {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
}

@Injectable()
export class DynamoCategoryRepository implements CategoryRepository {
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Category, 'createdAt' | 'updatedAt'>): Promise<Category> {
    const now = new Date();
    const item: Category = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put({
      PK: `CATEGORY#${item.id}`,
      SK: 'PROFILE',
      GSI1PK: `SLUG#${item.slug}`,
      GSI1SK: 'CATEGORY',
      ...item,
    });

    return item;
  }

  async findById(id: string): Promise<Category | null> {
    const result = await this.dynamo.get({ PK: `CATEGORY#${id}`, SK: 'PROFILE' });

    if (!result) return null;

    const { PK, SK, GSI1PK, GSI1SK, ...category } = result as unknown as CategoryWithKeys;
    return category as Category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    // Implementação simplificada - em produção usaria GSI1
    const categories = await this.scanCategories();
    return categories.find(c => c.slug === slug) || null;
  }

  async findAll(): Promise<Category[]> {
    // Implementação simplificada - em produção usaria query
    return this.scanCategories();
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Category not found');

    const updated: Category = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    await this.dynamo.put({
      PK: `CATEGORY#${updated.id}`,
      SK: 'PROFILE',
      GSI1PK: `SLUG#${updated.slug}`,
      GSI1SK: 'CATEGORY',
      ...updated,
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.dynamo.delete(`CATEGORY#${id}`, 'PROFILE');
  }

  private async scanCategories(): Promise<Category[]> {
    // Método auxiliar para scan de categorias
    // Em produção, isso seria otimizado com queries
    return [];
  }
}
