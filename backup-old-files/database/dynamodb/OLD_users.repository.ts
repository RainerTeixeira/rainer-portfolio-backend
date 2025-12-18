import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { 
  IUsersRepository, 
  UserEntity, 
  UserProfile, 
  ListUsersOptions, 
  UserListResult 
} from '../interfaces/users.repository.interface';

@Injectable()
export class UsersRepository extends BaseRepository<UserEntity> implements IUsersRepository {
  constructor(dynamoDBService: any) {
    super(dynamoDBService, 'USER');
  }

  /**
   * Gera PK para usuário
   */
  protected generatePK(data: Partial<UserEntity>): string {
    return `USER#${data.data?.id || this.generateId()}`;
  }

  /**
   * Gera SK para usuário
   */
  protected generateSK(): string {
    return 'PROFILE';
  }

  /**
   * Cria um novo usuário
   */
  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    const userId = userData.data?.id || this.generateId();
    const now = this.toISOString();

    const user: UserEntity = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      GSI1PK: `USER#${userData.data?.email}`,
      GSI1SK: 'PROFILE',
      entityType: 'USER',
      createdAt: now,
      updatedAt: now,
      data: {
        id: userId,
        cognitoSub: userData.data?.cognitoSub || '',
        email: userData.data?.email || '',
        emailVerified: userData.data?.emailVerified || false,
        nickname: userData.data?.nickname || '',
        fullName: userData.data?.fullName || '',
        avatar: userData.data?.avatar,
        bio: userData.data?.bio,
        role: userData.data?.role || 'SUBSCRIBER',
        isActive: userData.data?.isActive ?? true,
        isBanned: false,
        postsCount: 0,
        commentsCount: 0,
        likesCount: 0,
        followersCount: 0,
        followingCount: 0,
        lastLoginAt: userData.data?.lastLoginAt,
        preferences: userData.data?.preferences || {
          theme: 'system',
          language: 'pt-BR',
          emailNotifications: true,
          pushNotifications: true,
          newsletter: false,
        },
      },
    };

    await this.dynamoDBService.put(user);
    return user;
  }

  /**
   * Busca usuário pelo email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.dynamoDBService.query(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `USER#${email}` },
      undefined,
      'GSI1'
    );

    return result.items[0] as UserEntity || null;
  }

  /**
   * Busca usuário pelo cognitoSub
   */
  async findByCognitoSub(cognitoSub: string): Promise<UserEntity | null> {
    const result = await this.dynamoDBService.scan(
      'contains(data.cognitoSub, :cognitoSub)',
      undefined,
      { ':cognitoSub': cognitoSub }
    );

    const user = result.items.find(item => 
      item.entityType === 'USER' && 
      item.data?.cognitoSub === cognitoSub
    );

    return user as UserEntity || null;
  }

  /**
   * Lista usuários com paginação
   */
  async listUsers(options?: ListUsersOptions): Promise<UserListResult> {
    let filterExpression: string | undefined;
    const expressionAttributeValues: { [key: string]: any } = {};

    // Aplica filtros
    if (options?.filter?.role) {
      filterExpression = 'data.role = :role';
      expressionAttributeValues[':role'] = options.filter.role;
    }

    if (options?.filter?.isActive !== undefined) {
      if (filterExpression) {
        filterExpression += ' AND data.isActive = :isActive';
      } else {
        filterExpression = 'data.isActive = :isActive';
      }
      expressionAttributeValues[':isActive'] = options.filter.isActive;
    }

    // Define ordenação
    let scanIndexForward = true;
    if (options?.sortOrder === 'DESC') {
      scanIndexForward = false;
    }

    // Executa query
    const result = await this.dynamoDBService.query(
      'entityType = :entityType',
      { ':entityType': 'USER' },
      { '#entityType': 'entityType' },
      undefined,
      options?.limit,
      options?.exclusiveStartKey,
      scanIndexForward,
      filterExpression,
      expressionAttributeValues
    );

    return {
      users: result.items as UserEntity[],
      lastEvaluatedKey: result.lastEvaluatedKey,
      totalCount: result.items.length, // TODO: Implementar contagem real se necessário
    };
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserEntity> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: any } = {
      ':updatedAt': this.toISOString(),
    };

    let fieldIndex = 0;
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const attributeName = `#attr${fieldIndex}`;
        const attributeValue = `:val${fieldIndex}`;
        
        updateExpressions.push(`data.${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
        
        fieldIndex++;
      }
    }

    if (updateExpressions.length === 0) {
      // Nada para atualizar, apenas retorna o usuário atual
      const user = await this.findById(`USER#${userId}`, 'PROFILE');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }

    const updateExpression = `set #updatedAt = :updatedAt, ${updateExpressions.join(', ')}`;

    const result = await this.dynamoDBService.update(
      `USER#${userId}`,
      'PROFILE',
      updateExpression,
      { '#updatedAt': 'updatedAt', ...expressionAttributeNames },
      expressionAttributeValues
    );

    return result as UserEntity;
  }

  /**
   * Busca múltiplos usuários por IDs
   */
  async findByIds(userIds: string[]): Promise<UserEntity[]> {
    const keys = userIds.map(id => ({
      PK: `USER#${id}`,
      SK: 'PROFILE',
    }));

    const items = await this.dynamoDBService.batchGet(keys);
    return items as UserEntity[];
  }

  /**
   * Conta total de usuários
   */
  async countUsers(): Promise<number> {
    // Para performance, poderíamos manter um contador separado
    // Por enquanto, faz scan (cuidado com tabelas grandes)
    const result = await this.dynamoDBService.scan(
      'entityType = :entityType',
      { '#entityType': 'entityType' },
      { ':entityType': 'USER' }
    );

    return result.items.length;
  }

  /**
   * Incrementa contador de posts do usuário
   */
  async incrementPostsCount(userId: string): Promise<void> {
    await this.dynamoDBService.update(
      `USER#${userId}`,
      'PROFILE',
      'ADD data.postsCount :inc',
      undefined,
      { ':inc': 1 }
    );
  }

  /**
   * Incrementa contador de comentários do usuário
   */
  async incrementCommentsCount(userId: string): Promise<void> {
    await this.dynamoDBService.update(
      `USER#${userId}`,
      'PROFILE',
      'ADD data.commentsCount :inc',
      undefined,
      { ':inc': 1 }
    );
  }

  /**
   * Atualiza último login
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.dynamoDBService.update(
      `USER#${userId}`,
      'PROFILE',
      'set #updatedAt = :updatedAt, data.lastLoginAt = :lastLoginAt',
      { '#updatedAt': 'updatedAt' },
      {
        ':updatedAt': this.toISOString(),
        ':lastLoginAt': this.toISOString(),
      }
    );
  }

  /**
   * Busca usuário pelo ID (sobrescreve para usar PK correta)
   */
  async findById(userId: string): Promise<UserEntity | null> {
    const item = await this.dynamoDBService.get(`USER#${userId}`, 'PROFILE');
    return item as UserEntity || null;
  }
}
