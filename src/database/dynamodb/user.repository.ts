import { Injectable } from '@nestjs/common';
import { User, UserRepository } from '../interfaces/user-repository.interface';
import { DynamoDBService } from './dynamodb.service';

@Injectable()
export class DynamoUserRepository implements UserRepository {
  private readonly tableName = 'portfolio-backend-table-users';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const item: User = {
      ...data,
      id: data.cognitoSub, // Use cognitoSub as id
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put({
      ...item,
    }, this.tableName);

    return item;
  }

  async findById(id: string): Promise<User | null> {
    // In DynamoDB, we use cognitoSub as the primary key
    // So findById actually searches by cognitoSub
    const result = await this.dynamo.get({ cognitoSub: id }, this.tableName);
    if (!result) return null;
    
    // Ensure id field exists and matches cognitoSub
    const user = result as User & { cognitoSub: string };
    user.id = user.cognitoSub;
    return user;
  }

  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    // Implementação simplificada - em produção usaria GSI1
    // Por enquanto, busca por scan
    const users = await this.scanUsers();
    return users.find(u => u.cognitoSub === cognitoSub) || null;
  }

  async findAll(): Promise<User[]> {
    // Implementação simplificada - em produção usaria scan
    return this.scanUsers();
  }

  async findByEmail(email: string): Promise<User | null> {
    // Implementação simplificada - em produção usaria GSI1
    // Por enquanto, busca por scan
    const users = await this.scanUsers();
    return users.find(u => u.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    // Implementação simplificada - em produção usaria GSI1
    // Por enquanto, busca por scan
    const users = await this.scanUsers();
    return users.find(u => u.username === username) || null;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('User not found');

    const updated: User = {
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
    // For DynamoDB single table, we need to delete by the primary key
    const user = await this.findById(id);
    if (user) {
      await this.dynamo.delete(user.cognitoSub, '', this.tableName);
    }
  }

  async isNameTaken(_fullName: string): Promise<boolean> {
    // Implementação simplificada - em produção faria uma consulta real
    return false;
  }

  async checkNicknameAvailability(_nickname: string, _excludeCognitoSub?: string): Promise<boolean> {
    // Implementação simplificada - em produção faria uma consulta real
    return true;
  }

  async updateUserNickname(cognitoSub: string, newNickname: string): Promise<void> {
    const user = await this.findByCognitoSub(cognitoSub);
    if (!user) throw new Error('User not found');

    if (user.id) {
      await this.update(user.id, { nickname: newNickname });
    }
  }

  private async scanUsers(): Promise<User[]> {
    try {
      const items = await this.dynamo.scan({}, this.tableName);
      
      // Ensure all users have id field matching cognitoSub
      const users = items.map(item => {
        const user = item as unknown as User & { cognitoSub: string };
        user.id = user.cognitoSub;
        return user;
      });
      
      return users;
    } catch (error) {
      // Error scanning users
      return [];
    }
  }
}
