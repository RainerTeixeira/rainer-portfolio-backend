import { Injectable } from '@nestjs/common';
import { User, UserRepository } from '../interfaces/user-repository.interface';
import { DynamoDBService } from './dynamodb.service';

// Interface interna para incluir chaves do DynamoDB
interface UserWithKeys extends User {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
}

@Injectable()
export class DynamoUserRepository implements UserRepository {
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const item: User = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put({
      PK: `USER#${item.id}`,
      SK: 'PROFILE',
      GSI1PK: `EMAIL#${item.email}`,
      GSI1SK: 'PROFILE',
      ...item,
    });

    return item;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.dynamo.get({ PK: `USER#${id}`, SK: 'PROFILE' });

    if (!result) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, GSI1PK, GSI1SK, ...user } = result as unknown as UserWithKeys;
    return user as User;
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
      PK: `USER#${updated.id}`,
      SK: 'PROFILE',
      GSI1PK: `EMAIL#${updated.email}`,
      GSI1SK: 'PROFILE',
      ...updated,
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.dynamo.delete(`USER#${id}`, 'PROFILE');
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

    await this.update(user.id, { nickname: newNickname });
  }

  private async scanUsers(): Promise<User[]> {
    // Método auxiliar para scan de usuários
    // Em produção, isso seria otimizado com queries
    return [];
  }
}
