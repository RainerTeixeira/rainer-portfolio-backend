import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { PostEntity } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostRepository {
    private readonly TABLE_NAME = 'blog-table';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(createDto: CreatePostDto): Promise<PostEntity> {
        const post = new PostEntity(createDto);
        const params = {
            TableName: this.TABLE_NAME,
            Item: post,
        };
        await this.dynamoDbService.put(params);
        return post;
    }

    async findById(id: string): Promise<PostEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'POST#id': id, METADATA: 'METADATA' },
        };
        const result = await this.dynamoDbService.get(params);
        if (!result?.data?.Item) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        return new PostEntity(result.data.Item);
    }

    async update(id: string, updateDto: UpdatePostDto): Promise<PostEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...updateDto };
        const params = {
            TableName: this.TABLE_NAME,
            Item: updated,
        };
        await this.dynamoDbService.put(params);
        return new PostEntity(updated);
    }

    async delete(id: string): Promise<void> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'POST#id': id, METADATA: 'METADATA' },
        };
        await this.dynamoDbService.delete(params);
    }

    // Consulta por GSI_AuthorPosts (posts por autor)
    async findPostsByAuthor(authorId: string): Promise<PostEntity[]> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_AuthorPosts',
            KeyConditionExpression: 'gsiAuthorId = :authorId',
            ExpressionAttributeValues: {
                ':authorId': authorId,
            },
            ScanIndexForward: true,
        };
        const result = await this.dynamoDbService.query(params);
        return result.data.Items.map((item: any) => new PostEntity(item));
    }

    // Consulta por GSI_CategoryPosts (posts por categoria ordenados por views)
    async findPostsByCategory(categoryId: string): Promise<PostEntity[]> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_CategoryPosts',
            KeyConditionExpression: 'gsiCategoryId = :categoryId',
            ExpressionAttributeValues: {
                ':categoryId': categoryId,
            },
            ScanIndexForward: false,
        };
        const result = await this.dynamoDbService.query(params);
        return result.data.Items.map((item: any) => new PostEntity(item));
    }

    // Consulta por GSI_RecentPosts (últimos posts)
    async findRecentPosts(): Promise<PostEntity[]> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_RecentPosts',
            KeyConditionExpression: 'gsiRecentType = :type',
            ExpressionAttributeValues: {
                ':type': 'POST',
            },
            ScanIndexForward: false,
        };
        const result = await this.dynamoDbService.query(params);
        return result.data.Items.map((item: any) => new PostEntity(item));
    }

    // Consulta por GSI_Slug (busca por URL)
    async findBySlug(slug: string): Promise<PostEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'gsiSlug = :slug and gsiSlugType = :type',
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'POST',
            },
        };
        const result = await this.dynamoDbService.query(params);
        if (!result?.data?.Items || result.data.Items.length === 0) {
            throw new NotFoundException(`Post with slug ${slug} not found`);
        }
        return new PostEntity(result.data.Items[0]);
    }
}
