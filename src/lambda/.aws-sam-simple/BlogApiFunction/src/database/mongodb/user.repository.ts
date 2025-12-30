import { Injectable } from '@nestjs/common';
import { User, UserRepository } from '../interfaces/user-repository.interface';
import { MongoDBService } from './mongodb.service';
import { Collection, Filter, UpdateFilter } from 'mongodb';
import { CreateUserDto } from '../../modules/users/dto/create-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class MongoUserRepository implements UserRepository {
  private collection: Collection<User>;

  constructor(private readonly mongo: MongoDBService) {}

  private getCollection(): Collection<User> {
    if (!this.collection) {
      this.collection = this.mongo.getCollection<User>('users');
    }
    return this.collection;
  }

  async create(data: CreateUserDto): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      cognitoSub: data.cognitoSub || '',
      name: data.name || '',
      email: data.email || '',
      passwordHash: data.password || '',
      nickname: data.nickname,
      fullName: data.fullName || '',
      avatar: data.avatar,
      bio: data.bio,
      role: data.role || 'SUBSCRIBER',
      isActive: true,
      isBanned: false,
      postsCount: 0,
      commentsCount: 0,
      likesCount: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.getCollection().insertOne(user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return await this.getCollection().findOne({ id, isActive: true });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.getCollection().findOne({ email: email.toLowerCase(), isActive: true });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.getCollection().findOne({ username, isActive: true });
  }

  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    return await this.getCollection().findOne({ cognitoSub, isActive: true });
  }

  async findAll(options: {
    limit?: number;
    offset?: number;
    role?: string;
  } = {}): Promise<User[]> {
    const filter: Filter<User> = { isActive: true };
    
    if (options.role) {
      filter.role = options.role as User['role'];
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

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updateDoc: UpdateFilter<User> = {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    };

    const result = await this.getCollection().findOneAndUpdate(
      { id, isActive: true },
      updateDoc,
      { returnDocument: 'after' }
    );

    return result || null;
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().findOneAndUpdate(
      { id },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  }

  async checkNicknameAvailability(nickname: string): Promise<boolean> {
    const existing = await this.getCollection().findOne({
      nickname: nickname.toLowerCase(),
      isActive: true,
    });
    return !existing;
  }

  async incrementPostsCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id, isActive: true },
      { $inc: { postsCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  async incrementCommentsCount(id: string): Promise<void> {
    await this.getCollection().updateOne(
      { id, isActive: true },
      { $inc: { commentsCount: 1 }, $set: { updatedAt: new Date() } }
    );
  }

  async isNameTaken(fullName: string): Promise<boolean> {
    const existing = await this.getCollection().findOne({
      fullName: fullName.toLowerCase(),
      isActive: true,
    });
    return !!existing;
  }

  async updateUserNickname(cognitoSub: string, newNickname: string): Promise<void> {
    await this.getCollection().updateOne(
      { cognitoSub, isActive: true },
      { $set: { nickname: newNickname, updatedAt: new Date() } }
    );
  }
}
