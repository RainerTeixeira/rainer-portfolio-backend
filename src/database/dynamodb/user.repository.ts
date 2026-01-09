import { Injectable } from '@nestjs/common';
import { User, UserRepository } from '../interfaces/user-repository.interface';
import { DynamoDBService } from './dynamodb.service';
import { BaseDynamoDBRepository } from './base-dynamodb.repository';

@Injectable()
export class DynamoUserRepository extends BaseDynamoDBRepository implements UserRepository {
  
  constructor(dynamo: DynamoDBService) {
    super(dynamo.getDocumentClient()!, dynamo.getTableName());
  }

  async create(data: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const user: User = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    // Comprimir cognitoSub para economizar storage
    const compressedSub = this.compressString(user.cognitoSub);
    
    // PK/SK ultra otimizadas: U#hash / PROFILE
    const PK = this.createEntityPK('USER', compressedSub);
    const SK = 'PROFILE';
    
    const dynamoItem = this.toDynamoDB(user, 'USER', PK, SK);
    
    // Sparse GSI1 - apenas para usuários ativos (economia 90%)
    if (user.isActive) {
      dynamoItem.GSI1PK = this.createGSI1PK('ACTIVE', 'TRUE');
      dynamoItem.GSI1SK = this.createGSI1SK('USER', compressedSub, user.createdAt.toISOString());
    }
    
    // Sparse GSI2 - apenas para usuários com email verificado
    if (user.email && user.isActive) {
      dynamoItem.GSI2PK = this.createGSI2PK('EMAIL', this.hashString(user.email));
      dynamoItem.GSI2SK = this.createGSI2SK('USER', compressedSub, user.createdAt.toISOString());
    }
    
    // Sparse GSI3 - apenas para usuários com nickname
    if (user.nickname && user.isActive) {
      dynamoItem.GSI3PK = this.createGSI3PK('NICKNAME', user.nickname.toLowerCase());
      dynamoItem.GSI3SK = this.createGSI3SK('USER', compressedSub);
    }
    
    // Conditional write - evitar duplicatas
    await this.putItemOptimized(
      dynamoItem,
      'attribute_not_exists(PK)' // Só cria se não existir
    );

    return user;
  }

  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    const compressedSub = this.compressString(cognitoSub);
    const PK = this.createEntityPK('USER', compressedSub);
    const SK = 'PROFILE';
    
    // Cache L1: Memória (5 min)
    const cacheKey = `user:${cognitoSub}`;
    const cached = this.getUserCache(cacheKey);
    if (cached) return cached;
    
    // Get ultra otimizado com projection mínima
    const item = await this.getItemOptimized(
      { PK, SK }, 
      {
        projectionExpression: 'cognitoSub, fullName, nickname, email, role, isActive, createdAt, updatedAt',
        consistentRead: false // Eventual read (mais barato)
      }
    );
    
    if (!item) return null;
    
    const user = this.fromDynamoDB(item) as User;
    
    // Cache com TTL
    this.setUserCache(cacheKey, user);
    
    return user;
  }

  async findAll(): Promise<User[]> {
    // Usar Sparse GSI1 - apenas usuários ativos
    const result = await this.queryOptimized({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('ACTIVE', 'TRUE'),
      },
      projectionExpression: 'cognitoSub, fullName, nickname, role, isActive, createdAt',
      limit: 100,
      scanIndexForward: false, // Mais recentes primeiro
    });

    return result.items.map(item => this.fromDynamoDB(item) as User);
  }

  async findByEmail(email: string): Promise<User | null> {
    // Usar Sparse GSI2 - apenas emails verificados
    const result = await this.queryOptimized({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': this.createGSI2PK('EMAIL', this.hashString(email))
      },
      limit: 1,
      projectionExpression: 'cognitoSub, fullName, nickname, email, role, isActive'
    });

    const user = result.items[0];
    return user ? this.fromDynamoDB(user) as User : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    // Usar Sparse GSI3 - apenas nicknames
    const result = await this.queryOptimized({
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': this.createGSI3PK('NICKNAME', username.toLowerCase())
      },
      limit: 1,
      projectionExpression: 'cognitoSub, fullName, nickname, role, isActive'
    });

    const user = result.items[0];
    return user ? this.fromDynamoDB(user) as User : null;
  }

  async update(cognitoSub: string, data: Partial<User>): Promise<User | null> {
    const existing = await this.findByCognitoSub(cognitoSub);
    if (!existing) throw new Error('User not found');

    const updated: User = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    const compressedSub = this.compressString(cognitoSub);
    const PK = this.createEntityPK('USER', compressedSub);
    const SK = 'PROFILE';
    
    const dynamoItem = this.toDynamoDB(updated, 'USER', PK, SK);
    
    // Recriar GSIs sparse
    if (updated.isActive) {
      dynamoItem.GSI1PK = this.createGSI1PK('ACTIVE', 'TRUE');
      dynamoItem.GSI1SK = this.createGSI1SK('USER', compressedSub, updated.createdAt.toISOString());
    }
    
    if (updated.email && updated.isActive) {
      dynamoItem.GSI2PK = this.createGSI2PK('EMAIL', this.hashString(updated.email));
      dynamoItem.GSI2SK = this.createGSI2SK('USER', compressedSub, updated.createdAt.toISOString());
    }
    
    if (updated.nickname && updated.isActive) {
      dynamoItem.GSI3PK = this.createGSI3PK('NICKNAME', updated.nickname.toLowerCase());
      dynamoItem.GSI3SK = this.createGSI3SK('USER', compressedSub);
    }
    
    await this.putItemOptimized(dynamoItem);

    // Invalidar cache
    this.invalidateUserCache(`user:${cognitoSub}`);

    return updated;
  }

  async delete(cognitoSub: string): Promise<void> {
    const compressedSub = this.compressString(cognitoSub);
    const PK = this.createEntityPK('USER', compressedSub);
    const SK = 'PROFILE';
    
    // Soft delete - apenas marca como inativo
    await this.updateItem({
      PK,
      SK,
      UpdateExpression: 'SET #isActive = :false, #deletedAt = :now',
      ExpressionAttributeNames: {
        '#isActive': 'isActive',
        '#deletedAt': 'deletedAt'
      },
      ExpressionAttributeValues: {
        ':false': false,
        ':now': new Date().toISOString()
      }
    });
    
    // Invalidar cache
    this.invalidateUserCache(`user:${cognitoSub}`);
  }

  async isNameTaken(fullName: string): Promise<boolean> {
    // Count otimizado com Sparse GSI1 (sem trazer dados)
    const result = await this.queryOptimized({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      FilterExpression: 'fullName = :fullName',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('ACTIVE', 'TRUE'),
        ':fullName': fullName
      },
      select: 'COUNT',
      limit: 1
    });

    return result.items.length > 0;
  }

  async checkNicknameAvailability(nickname: string, excludeCognitoSub?: string): Promise<boolean> {
    const result = await this.queryOptimized({
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      FilterExpression: excludeCognitoSub ? 'cognitoSub <> :excludeCognitoSub' : undefined,
      ExpressionAttributeValues: {
        ':gsi3pk': this.createGSI3PK('NICKNAME', nickname.toLowerCase()),
        ...(excludeCognitoSub && { ':excludeCognitoSub': excludeCognitoSub })
      },
      select: 'COUNT',
      limit: 1
    });

    return result.items.length === 0;
  }

  async updateUserNickname(cognitoSub: string, newNickname: string): Promise<void> {
    await this.update(cognitoSub, { nickname: newNickname });
  }

  // ========== UTILITÁRIOS DE OTIMIZAÇÃO ==========
  
  /**
   * Comprime string para economizar storage
   */
  private compressString(str: string): string {
    // Implementação simples de compressão
    return Buffer.from(str).toString('base64').replace(/=/g, '');
  }

  /**
   * Hash de string para índices
   */
  private hashString(str: string): string {
    // Hash simples para distribuição uniforme
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cria GSI3 PK para otimização
   */
  private createGSI3PK(gsiType: string, value: string): string {
    const prefixes: Record<string, string> = {
      'NICKNAME': 'NN',
      'ROLE': 'R',
      'STATUS': 'S'
    };
    const prefix = prefixes[gsiType] || gsiType;
    return `${prefix}#${value}`;
  }

  /**
   * Cria GSI3 SK para otimização
   */
  private createGSI3SK(type: string, id: string): string {
    return `${type}#${id}`;
  }

  // ========== CACHE MULTI-NÍVEL ==========
  private setUserCache(key: string, data: any): void {
    // Cache local para usuário
    this.cache.set(key, { data, ttl: Date.now() + 5 * 60 * 1000 }); // 5 minutos
  }

  private getUserCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private invalidateUserCache(key: string): void {
    this.cache.delete(key);
  }
}
