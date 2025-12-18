import { Injectable } from '@nestjs/common';
import { Post, PostRepository } from '../interfaces/post-repository.interface';
import { MongoDBService } from './mongodb.service';
import { Collection, Filter, UpdateFilter } from 'mongodb';

@Injectable()
export class MongoPostRepository implements PostRepository {
  private collection: Collection<Post>;

  constructor(private readonly mongo: MongoDBService) {}

  private getCollection(): Collection<Post> {
    if (!this.collection) {
      this.collection = this.mongo.getCollection<Post>('posts');
    }
    return this.collection;
  }

  async create(data: Omit<Post, 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount' | 'commentCount'>): Promise<Post> {
    const post: Post = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    };

    await this.getCollection().insertOne(post);
    return post;
  }

  async findById(id: string): Promise<Post | null> {
    return await this.getCollection().findOne({ id });
  }

  async findBySlug(slug: string): Promise<Post | null> {
    return await this.getCollection().findOne({ slug });
  }

  async findAll(options: {
    status?: string;
    authorId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Post[]> {
    const filter: Filter<Post> = {};

    if (options.status) {
      filter.status = options.status as any;
    }
    if (options.authorId) {
      filter.authorId = options.authorId;
    }
    if (options.categoryId) {
      filter.categoryId = options.categoryId;
    }

    const cursor = this.getCollection().find(filter)
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    const updateDoc: UpdateFilter<Post> = {
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

  async incrementViewCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $inc: { viewCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  async findByAuthor(authorId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Post[]> {
    const cursor = this.getCollection().find({ authorId })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async incrementLikeCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $inc: { likeCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  async decrementLikeCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $inc: { likeCount: -1 }, $set: { updatedAt: new Date() } }
    );
  }

  async incrementCommentCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $inc: { commentCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  async decrementCommentCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $inc: { commentCount: -1 }, $set: { updatedAt: new Date() } }
    );
  }

  async findByCategory(categoryId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Post[]> {
    const cursor = this.getCollection().find({ categoryId, status: 'PUBLISHED' })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async findFeatured(options: {
    limit?: number;
  } = {}): Promise<Post[]> {
    const cursor = this.getCollection().find({ 
      isFeatured: true, 
      status: 'PUBLISHED' 
    })
      .sort({ createdAt: -1 });

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async search(query: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Post[]> {
    const searchRegex = new RegExp(query, 'i');
    const cursor = this.collection.find({
      $and: [
        { status: 'PUBLISHED' },
        {
          $or: [
            { title: { $regex: searchRegex } },
            { content: { $regex: searchRegex } },
            { excerpt: { $regex: searchRegex } },
          ]
        }
      ]
    })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }
}
