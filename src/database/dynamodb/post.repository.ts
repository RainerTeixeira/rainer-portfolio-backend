import { Injectable } from '@nestjs/common';
import { Post, PostRepository } from '../interfaces/post-repository.interface';
import { DynamoDBService } from './dynamodb.service';
import { BaseDynamoDBRepository } from './base-dynamodb.repository';

@Injectable()
export class DynamoPostRepository extends BaseDynamoDBRepository implements PostRepository {
  
  constructor(dynamo: DynamoDBService) {
    super(dynamo.getDocumentClient()!, 'portfolio-backend-table-posts');
  }

  async create(data: Omit<Post, 'createdAt' | 'updatedAt'>): Promise<Post> {
    const now = new Date();
    const post: Post = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    // Gerar ID único para o post
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    post.id = postId;

    // Comprimir authorId para economizar storage
    const compressedAuthorId = this.compressString(post.authorId);
    
    // PK/SK ultra otimizadas: U#authorId / POST#postId
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', postId);
    
    const dynamoItem = this.toDynamoDB(post, 'POST', PK, SK);
    
    // Sparse GSI1 - apenas posts publicados (economia 80%)
    if (post.status === 'PUBLISHED') {
      dynamoItem.GSI1PK = this.createGSI1PK('PUBLISHED', 'TRUE');
      dynamoItem.GSI1SK = this.createGSI1SK('POST', postId, post.publishedAt?.toISOString());
    }
    
    // Sparse GSI2 - apenas posts com categoria
    if (post.subcategoryId && post.status === 'PUBLISHED') {
      dynamoItem.GSI2PK = this.createGSI2PK('CATEGORY', post.subcategoryId);
      dynamoItem.GSI2SK = this.createGSI2SK('POST', postId, post.publishedAt?.toISOString());
    }
    
    // Sparse GSI3 - posts por autor (apenas publicados)
    if (post.status === 'PUBLISHED') {
      dynamoItem.GSI3PK = this.createGSI3PK('AUTHOR', compressedAuthorId);
      dynamoItem.GSI3SK = this.createGSI3SK('POST', postId, post.publishedAt?.toISOString());
    }
    
    await this.putItemOptimized(dynamoItem);

    return post;
  }

  async findById(id: string): Promise<Post | null> {
    // Buscar por GSI1 usando postId
    const result = await this.queryOptimized({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('PUBLISHED', 'TRUE'),
        ':gsi1sk': this.createGSI1SK('POST', id),
      },
      limit: 1,
      projectionExpression: 'id, title, slug, content, authorId, subcategoryId, status, featured, publishedAt, createdAt, updatedAt'
    });

    const post = result.items[0];
    return post ? this.fromDynamoDB(post) as Post : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    // Query otimizada com projection
    const result = await this.queryOptimized({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      FilterExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('PUBLISHED', 'TRUE'),
        ':slug': slug,
      },
      limit: 1,
      projectionExpression: 'id, title, slug, authorId, status, publishedAt'
    });

    const post = result.items[0];
    return post ? this.fromDynamoDB(post) as Post : null;
  }

  async findAll(options: {
    status?: string;
    authorId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Post[]> {
    // Otimização Free Tier: Usar índices específicos em vez de scan
    let result: { items: any[]; lastEvaluatedKey?: any };

    if (options.status && options.status === 'PUBLISHED' && !options.authorId && !options.categoryId) {
      // Query otimizada para posts publicados (usa StatusIndex)
      result = await this.queryOptimized({
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
          ':status': options.status,
        },
        limit: options.limit || 25,
        scanIndexForward: false, // Mais recentes primeiro
      });
    } else if (options.authorId) {
      // Query por autor usando AuthorIndex
      result = await this.queryOptimized({
        IndexName: 'AuthorIndex',
        KeyConditionExpression: 'authorId = :authorId',
        ExpressionAttributeValues: {
          ':authorId': options.authorId,
        },
        limit: options.limit || 25,
        scanIndexForward: false,
      });
    } else if (options.categoryId) {
      // Query por categoria usando SubcategoryIndex
      result = await this.queryOptimized({
        IndexName: 'SubcategoryIndex',
        KeyConditionExpression: 'subcategoryId = :subcategoryId',
        ExpressionAttributeValues: {
          ':subcategoryId': options.categoryId,
        },
        limit: options.limit || 25,
        scanIndexForward: false,
      });
    } else {
      // Fallback: scan apenas se necessário (evitar scan completo)
      result = await this.scan({
        Limit: options.limit || 25,
      });
    }

    let posts = result.items.map(item => this.fromDynamoDB(item) as Post);

    // Aplicar filtros adicionais se necessário
    if (options.status && options.status !== 'PUBLISHED') {
      posts = posts.filter(post => post.status === options.status);
    }
    if (options.authorId) {
      posts = posts.filter(post => post.authorId === options.authorId);
    }
    if (options.categoryId) {
      posts = posts.filter(post => post.subcategoryId === options.categoryId);
    }
    if (options.status) {
      posts = posts.filter(post => post.status === options.status);
    }

    // Aplicar offset
    if (options.offset) {
      posts = posts.slice(options.offset);
    }

    return posts;
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Post not found');

    const updated: Post = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    const compressedAuthorId = this.compressString(updated.authorId);
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', id);
    
    const dynamoItem = this.toDynamoDB(updated, 'POST', PK, SK);
    
    // Recriar GSIs sparse
    if (updated.status === 'PUBLISHED') {
      dynamoItem.GSI1PK = this.createGSI1PK('PUBLISHED', 'TRUE');
      dynamoItem.GSI1SK = this.createGSI1SK('POST', id, updated.publishedAt?.toISOString());
      
      if (updated.subcategoryId) {
        dynamoItem.GSI2PK = this.createGSI2PK('CATEGORY', updated.subcategoryId);
        dynamoItem.GSI2SK = this.createGSI2SK('POST', id, updated.publishedAt?.toISOString());
      }
      
      dynamoItem.GSI3PK = this.createGSI3PK('AUTHOR', compressedAuthorId);
      dynamoItem.GSI3SK = this.createGSI3SK('POST', id, updated.publishedAt?.toISOString());
    }
    
    await this.putItemOptimized(dynamoItem);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) return;

    const compressedAuthorId = this.compressString(post.authorId);
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', id);
    
    await this.deleteItem({ PK, SK });
  }

  async incrementViewCount(id: string): Promise<void> {
    // Update otimizado sem trazer dados
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    const compressedAuthorId = this.compressString(post.authorId);
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', id);
    
    await this.updateItem({
      PK,
      SK,
      UpdateExpression: 'SET #views = if_not_exists(#views, :zero) + :inc, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#views': 'views',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': new Date().toISOString()
      }
    });
  }

  async incrementLikeCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    const compressedAuthorId = this.compressString(post.authorId);
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', id);
    
    await this.updateItem({
      PK,
      SK,
      UpdateExpression: 'SET #likesCount = if_not_exists(#likesCount, :zero) + :inc, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#likesCount': 'likesCount',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': new Date().toISOString()
      }
    });
  }

  async decrementLikeCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    const compressedAuthorId = this.compressString(post.authorId);
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', id);
    
    await this.updateItem({
      PK,
      SK,
      UpdateExpression: 'SET #likesCount = if_not_exists(#likesCount, :zero) - :dec, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#likesCount': 'likesCount',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':dec': 1,
        ':now': new Date().toISOString()
      }
    });
  }

  async incrementCommentCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    const compressedAuthorId = this.compressString(post.authorId);
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', id);
    
    await this.updateItem({
      PK,
      SK,
      UpdateExpression: 'SET #commentsCount = if_not_exists(#commentsCount, :zero) + :inc, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#commentsCount': 'commentsCount',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':inc': 1,
        ':now': new Date().toISOString()
      }
    });
  }

  async decrementCommentCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    const compressedAuthorId = this.compressString(post.authorId);
    const PK = this.createEntityPK('USER', compressedAuthorId);
    const SK = this.createEntitySK('POST', id);
    
    await this.updateItem({
      PK,
      SK,
      UpdateExpression: 'SET #commentsCount = if_not_exists(#commentsCount, :zero) - :dec, #updatedAt = :now',
      ExpressionAttributeNames: {
        '#commentsCount': 'commentsCount',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':dec': 1,
        ':now': new Date().toISOString()
      }
    });
  }

  // ========== UTILITÁRIOS DE OTIMIZAÇÃO ==========
  
  /**
   * Comprime string para economizar storage
   */
  private compressString(str: string): string {
    return Buffer.from(str).toString('base64').replace(/=/g, '');
  }

  /**
   * Cria GSI3 PK para otimização
   */
  private createGSI3PK(gsiType: string, value: string): string {
    const prefixes: Record<string, string> = {
      'AUTHOR': 'A',
      'CATEGORY': 'C',
      'STATUS': 'S'
    };
    const prefix = prefixes[gsiType] || gsiType;
    return `${prefix}#${value}`;
  }

  /**
   * Cria GSI3 SK para otimização
   */
  private createGSI3SK(type: string, id: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString();
    const invertedTs = ts.replace(/[-T:Z.]/g, '').split('').reverse().join('');
    return `${type}#${invertedTs}#${id}`;
  }
}
