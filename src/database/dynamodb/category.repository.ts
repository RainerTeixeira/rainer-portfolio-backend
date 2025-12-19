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
  private readonly tableName = 'portfolio-backend-table-categories';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Category, 'createdAt' | 'updatedAt'>): Promise<Category> {
    const now = new Date();
    const item: Category = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put({
      ...item,
    }, this.tableName);

    return item;
  }

  async findById(id: string): Promise<Category | null> {
    const result = await this.dynamo.get({ id }, this.tableName);
    if (!result) return null;
    return result as Category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const categories = await this.findAll();
    return categories.find(c => c.slug === slug) || null;
  }

  async findAll(): Promise<Category[]> {
    try {
      const items = await this.dynamo.scan({}, this.tableName);
      return items as Category[];
    } catch (error) {
      console.error('Error scanning categories:', error);
      return [];
    }
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
      ...updated,
    }, this.tableName);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    if (category) {
      await this.dynamo.delete(id, '', this.tableName);
    }
  }


}
