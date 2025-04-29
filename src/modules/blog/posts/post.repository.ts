import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { PostEntity } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import * as crypto from 'crypto';

/**
 * @repository PostRepository
 * @description Gerencia operações de acesso a dados para entidades Post no DynamoDB
 * @method create - Cria um novo post
 * @method findById - Busca post por ID
 * @method update - Atualiza post existente
 * @method delete - Remove post
 * @method findPostsByAuthor - Lista posts por autor usando GSI_AuthorPosts
 * @method findPostsByCategory - Lista posts por categoria usando GSI_CategoryPosts
 * @method findRecentPosts - Lista posts recentes usando GSI_RecentPosts
 * @method findBySlug - Busca post por slug usando GSI_Slug
 */
@Injectable()
export class PostRepository {
    private readonly TABLE_NAME = 'Post';
    private readonly INDEXES = {
        AUTHOR_POSTS: 'GSI_AuthorPosts',
        CATEGORY_POSTS: 'GSI_CategoryPosts',
        RECENT_POSTS: 'GSI_RecentPosts',
        SLUG: 'GSI_Slug',
    };

    private readonly ATTRIBUTES = {
        AUTHOR_ID: 'author_id',
        CATEGORY_ID: 'category_id',
        SLUG: 'slug',
        TYPE: 'type',
        PUBLISH_DATE: 'publish_date',
    };

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * @description Cria um novo post na tabela Post
     * @param createDto DTO com dados para criação do post
     * @returns PostEntity criada
     */
    async create(createDto: CreatePostDto): Promise<PostEntity> {
        const post = new PostEntity(createDto);
        await this.dynamoDbService.put({
            TableName: this.TABLE_NAME,
            Item: post,
        });
        return post;
    }

    /**
     * @description Busca post por chave primária (ID)
     * @param id ID do post no formato POST#id
     * @throws NotFoundException se o post não existir
     * @returns PostEntity encontrada
     */
    async findById(id: string): Promise<PostEntity> {
        const result = await this.dynamoDbService.get({
            TableName: this.TABLE_NAME,
            Key: {
                'POST#id': id,
                METADATA: 'METADATA'
            },
        });

        if (!result?.data?.Item) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }

        return new PostEntity(result.data.Item);
    }

    /**
     * @description Atualiza post existente
     * @param id ID do post
     * @param updateDto DTO com dados para atualização
     * @returns PostEntity atualizada
     */
    async update(id: string, updateDto: UpdatePostDto): Promise<PostEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...updateDto };
        await this.dynamoDbService.put({
            TableName: this.TABLE_NAME,
            Item: updated,
        });
        return new PostEntity(updated);
    }

    /**
     * @description Remove post da base de dados
     * @param id ID do post a ser removido
     */
    async delete(id: string): Promise<void> {
        await this.dynamoDbService.delete({
            TableName: this.TABLE_NAME,
            Key: {
                'POST#id': id,
                METADATA: 'METADATA'
            },
        });
    }

    /**
     * @description Busca posts por autor usando índice GSI_AuthorPosts
     * @param authorId ID do autor
     * @returns Lista de PostEntity ordenadas por data de publicação
     */
    async findPostsByAuthor(authorId: string): Promise<PostEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.AUTHOR_POSTS,
            KeyConditionExpression: '#authorId = :authorId',
            ExpressionAttributeNames: {
                '#authorId': this.ATTRIBUTES.AUTHOR_ID,
            },
            ExpressionAttributeValues: {
                ':authorId': authorId
            },
            ScanIndexForward: true, // Ordem ascendente por publish_date
        });

        return this.mapItemsToEntities(result);
    }

    /**
     * @description Busca posts por autor usando índice GSI_AuthorPosts com paginação
     * @param authorId ID do autor
     * @param limit Limite de itens por página
     * @param lastKey Token de paginação seguro (base64url)
     * @returns { items, lastKey }
     */
    async findPostsByAuthorPaginated(
        authorId: string,
        limit: number = 10,
        lastKey?: string,
    ): Promise<{ items: PostEntity[]; lastKey?: string }> {
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

        const params: any = {
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.AUTHOR_POSTS,
            KeyConditionExpression: '#authorId = :authorId',
            ExpressionAttributeNames: {
                '#authorId': this.ATTRIBUTES.AUTHOR_ID,
            },
            ExpressionAttributeValues: {
                ':authorId': authorId
            },
            ScanIndexForward: true, // Ordem ascendente por publish_date
            Limit: safeLimit,
        };

        if (lastKey) {
            const parsedKey = this.decodeLastKey(lastKey);
            if (parsedKey && typeof parsedKey === 'object') {
                params.ExclusiveStartKey = parsedKey;
            }
        }

        const result = await this.dynamoDbService.query(params);

        const items = this.mapItemsToEntities(result);
        let nextLastKey: string | undefined = undefined;
        if (result.data?.LastEvaluatedKey) {
            nextLastKey = this.encodeLastKey(result.data.LastEvaluatedKey);
        }

        return { items, lastKey: nextLastKey };
    }

    /**
     * @description Busca posts por categoria usando índice GSI_CategoryPosts
     * @param categoryId ID da categoria
     * @returns Lista de PostEntity ordenadas por visualizações
     */
    async findPostsByCategory(categoryId: string): Promise<PostEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.CATEGORY_POSTS,
            KeyConditionExpression: '#categoryId = :categoryId',
            ExpressionAttributeNames: {
                '#categoryId': this.ATTRIBUTES.CATEGORY_ID,
            },
            ExpressionAttributeValues: {
                ':categoryId': categoryId
            },
            ScanIndexForward: false, // Ordem descendente por views
        });

        return this.mapItemsToEntities(result);
    }

    /**
     * @description Busca posts por categoria usando índice GSI_CategoryPosts com paginação
     * @param categoryId ID da categoria
     * @param limit Limite de itens por página
     * @param lastKey Token de paginação seguro (base64url)
     * @returns { items, lastKey }
     */
    async findPostsByCategoryPaginated(
        categoryId: string,
        limit: number = 10,
        lastKey?: string,
    ): Promise<{ items: PostEntity[]; lastKey?: string }> {
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

        const params: any = {
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.CATEGORY_POSTS,
            KeyConditionExpression: '#categoryId = :categoryId',
            ExpressionAttributeNames: {
                '#categoryId': this.ATTRIBUTES.CATEGORY_ID,
            },
            ExpressionAttributeValues: {
                ':categoryId': categoryId
            },
            ScanIndexForward: false, // Ordem descendente por views
            Limit: safeLimit,
        };

        if (lastKey) {
            const parsedKey = this.decodeLastKey(lastKey);
            if (parsedKey && typeof parsedKey === 'object') {
                params.ExclusiveStartKey = parsedKey;
            }
        }

        const result = await this.dynamoDbService.query(params);

        const items = this.mapItemsToEntities(result);
        let nextLastKey: string | undefined = undefined;
        if (result.data?.LastEvaluatedKey) {
            nextLastKey = this.encodeLastKey(result.data.LastEvaluatedKey);
        }

        return { items, lastKey: nextLastKey };
    }

    /**
     * @description Lista posts recentes usando índice GSI_RecentPosts
     * @returns Lista de PostEntity ordenadas por data de publicação
     */
    async findRecentPosts(): Promise<PostEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.RECENT_POSTS,
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: {
                '#type': this.ATTRIBUTES.TYPE,
            },
            ExpressionAttributeValues: {
                ':type': 'POST'
            },
            ScanIndexForward: false, // Posts mais recentes primeiro
        });

        return this.mapItemsToEntities(result);
    }

    /**
     * @description Lista posts recentes usando índice GSI_RecentPosts com paginação
     * @param limit Limite de itens por página
     * @param lastKey Chave do último item da página anterior (serializada em JSON)
     * @returns { items, lastKey }
     */
    async findRecentPostsPaginated(
        limit: number = 10,
        lastKey?: string,
    ): Promise<{ items: PostEntity[]; lastKey?: string }> {
        // Garante que limit seja sempre um número inteiro positivo
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

        const params: AWS.DynamoDB.DocumentClient.QueryInput = {
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.RECENT_POSTS,
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: {
                '#type': this.ATTRIBUTES.TYPE,
            },
            ExpressionAttributeValues: {
                ':type': 'POST'
            },
            ScanIndexForward: false,
            Limit: safeLimit,
        };

        // Usa decodeLastKey para obter o objeto real do hash base64url
        if (lastKey) {
            const parsedKey = this.decodeLastKey(lastKey);
            if (parsedKey && typeof parsedKey === 'object') {
                params.ExclusiveStartKey = parsedKey;
            }
        }

        const result = await this.dynamoDbService.query(params);

        const items = this.mapItemsToEntities(result);
        // Se houver LastEvaluatedKey, gera base64url
        let nextLastKey: string | undefined = undefined;
        if (result.data?.LastEvaluatedKey) {
            nextLastKey = this.encodeLastKey(result.data.LastEvaluatedKey);
        }

        return { items, lastKey: nextLastKey };
    }

    /**
     * @description Busca post por slug usando índice GSI_Slug
     * @param slug Slug único do post
     * @throws NotFoundException se nenhum post for encontrado
     * @returns PostEntity encontrada
     */
    async findBySlug(slug: string): Promise<PostEntity> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.SLUG,
            KeyConditionExpression: '#slug = :slug AND #type = :type',
            ExpressionAttributeNames: {
                '#slug': this.ATTRIBUTES.SLUG,
                '#type': this.ATTRIBUTES.TYPE,
            },
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'POST',
            },
        });

        const items = this.mapItemsToEntities(result);

        if (items.length === 0) {
            throw new NotFoundException(`Post with slug ${slug} not found`);
        }

        return items[0];
    }

    /**
     * @description Busca posts por slug usando índice GSI_Slug com paginação (caso haja múltiplos slugs)
     * @param slug Slug único do post
     * @param limit Limite de itens por página
     * @param lastKey Token de paginação seguro (base64url)
     * @returns { items, lastKey }
     */
    async findBySlugPaginated(
        slug: string,
        limit: number = 10,
        lastKey?: string,
    ): Promise<{ items: PostEntity[]; lastKey?: string }> {
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

        const params: any = {
            TableName: this.TABLE_NAME,
            IndexName: this.INDEXES.SLUG,
            KeyConditionExpression: '#slug = :slug AND #type = :type',
            ExpressionAttributeNames: {
                '#slug': this.ATTRIBUTES.SLUG,
                '#type': this.ATTRIBUTES.TYPE,
            },
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'POST',
            },
            Limit: safeLimit,
        };

        if (lastKey) {
            const parsedKey = this.decodeLastKey(lastKey);
            if (parsedKey && typeof parsedKey === 'object') {
                params.ExclusiveStartKey = parsedKey;
            }
        }

        const result = await this.dynamoDbService.query(params);

        const items = this.mapItemsToEntities(result);
        let nextLastKey: string | undefined = undefined;
        if (result.data?.LastEvaluatedKey) {
            nextLastKey = this.encodeLastKey(result.data.LastEvaluatedKey);
        }

        return { items, lastKey: nextLastKey };
    }

    /**
     * Codifica o objeto lastKey em base64url (sem map in-memory)
     */
    private encodeLastKey(lastKeyObj: Record<string, unknown>): string {
        const json = JSON.stringify(lastKeyObj);
        return Buffer.from(json).toString('base64url');
    }

    /**
     * Decodifica o base64url para objeto lastKey
     */
    private decodeLastKey(hash: string): Record<string, unknown> | undefined {
        try {
            const json = Buffer.from(hash, 'base64url').toString();
            return JSON.parse(json);
        } catch {
            return undefined;
        }
    }

    /**
     * @description Mapeia resultados do DynamoDB para entidades Post
     * @param result Resultado da consulta DynamoDB
     * @returns Array de PostEntity
     */
    private mapItemsToEntities(result: { data?: { Items?: Record<string, unknown>[] } }): PostEntity[] {
        return result.data?.Items?.map((item: Record<string, unknown>) => new PostEntity(item)) || [];
    }
}