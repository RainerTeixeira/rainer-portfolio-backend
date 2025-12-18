import { Injectable } from '@nestjs/common';
import { Category, CategoryRepository } from '../interfaces/category-repository.interface';
import { MongoDBService } from './mongodb.service';
import { Collection, UpdateFilter } from 'mongodb';

@Injectable()
export class MongoCategoryRepository implements CategoryRepository {
  private collection: Collection<Category>;

  constructor(private readonly mongo: MongoDBService) {}

  private getCollection(): Collection<Category> {
    if (!this.collection) {
      this.collection = this.mongo.getCollection<Category>('categories');
    }
    return this.collection;
  }

  async create(data: Omit<Category, 'createdAt' | 'updatedAt'>): Promise<Category> {
    const category: Category = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.getCollection().insertOne(category);
    return category;
  }

  async findById(id: string): Promise<Category | null> {
    return await this.getCollection().findOne({ id });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return await this.getCollection().findOne({ slug });
  }

  async findAll(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Category[]> {
    const cursor = this.getCollection().find({})
      .sort({ name: 1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    const updateDoc: UpdateFilter<Category> = {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    };

    const result = await this.getCollection().findOneAndUpdate(
      { id },
      updateDoc,
      { returnDocument: 'after' }
    );

    return result || null;
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ id });
  }

  async incrementPostCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $inc: { postCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  async decrementPostCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $inc: { postCount: -1 }, $set: { updatedAt: new Date() } }
    );
  }

  async findPopular(options: {
    limit?: number;
  } = {}): Promise<Category[]> {
    const cursor = this.getCollection().find({})
      .sort({ postCount: -1, name: 1 });

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async search(query: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Category[]> {
    const searchRegex = new RegExp(query, 'i');
    const cursor = this.collection.find({
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ]
    })
      .sort({ name: 1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }
}
