import { Injectable } from '@nestjs/common';
import { Comment, CommentRepository } from '../interfaces/comment-repository.interface';
import { MongoDBService } from './mongodb.service';
import { Collection, Filter, UpdateFilter } from 'mongodb';

@Injectable()
export class MongoCommentRepository implements CommentRepository {
  private collection: Collection<Comment>;

  constructor(private readonly mongo: MongoDBService) {}

  private getCollection(): Collection<Comment> {
    if (!this.collection) {
      this.collection = this.mongo.getCollection<Comment>('comments');
    }
    return this.collection;
  }

  async create(data: Omit<Comment, 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const comment: Comment = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.getCollection().insertOne(comment);
    return comment;
  }

  async findById(id: string): Promise<Comment | null> {
    return await this.getCollection().findOne({ id });
  }

  async findByPost(postId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    const cursor = this.getCollection().find({ postId })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async findByAuthor(authorId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
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

  async findAll(options: {
    postId?: string;
    authorId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    const filter: Filter<Comment> = {};

    if (options.postId) {
      filter.postId = options.postId;
    }
    if (options.authorId) {
      filter.authorId = options.authorId;
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

  async update(id: string, data: Partial<Comment>): Promise<Comment | null> {
    const updateDoc: UpdateFilter<Comment> = {
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

  async findByPostAndAuthor(postId: string, authorId: string): Promise<Comment | null> {
    return await this.getCollection().findOne({ postId, authorId });
  }

  async countByPost(postId: string): Promise<number> {
    return await this.getCollection().countDocuments({ postId });
  }

  async countByAuthor(authorId: string): Promise<number> {
    return await this.getCollection().countDocuments({ authorId });
  }

  async findByPostId(postId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    const cursor = this.getCollection().find({ postId })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async findByAuthorId(authorId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
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

  async findReplies(parentId: string): Promise<Comment[]> {
    return await this.getCollection().find({ parentId })
      .sort({ createdAt: 1 })
      .toArray();
  }

  async approve(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $set: { status: 'APPROVED' } }
    );
  }

  async reject(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id },
      { $set: { status: 'REJECTED' } }
    );
  }
}
