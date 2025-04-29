// src/modules/blog/posts/post.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { PostEntity } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostRepository {
    private readonly TABLE_NAME = 'Post';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(createDto: CreatePostDto): Promise<PostEntity> {
        const post = new PostEntity(createDto);
        await this.dynamoDbService.put({ TableName: this.TABLE_NAME, Item: post });
        return post;
    }

    async findById(id: string): Promise<PostEntity> {
        const result = await this.dynamoDbService.get({
            TableName: this.TABLE_NAME,
            Key: { 'POST#id': id, METADATA: 'METADATA' },
        });
        if (!result?.data?.Item) {
            throw new NotFoundException(`Post with id ${id} not found`);
        }
        return new PostEntity(result.data.Item);
    }

    async update(id: string, updateDto: UpdatePostDto): Promise<PostEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...updateDto };
        await this.dynamoDbService.put({ TableName: this.TABLE_NAME, Item: updated });
        return new PostEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await this.dynamoDbService.delete({
            TableName: this.TABLE_NAME,
            Key: { 'POST#id': id, METADATA: 'METADATA' },
        });
    }

    async findPostsByAuthor(authorId: string): Promise<PostEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_AuthorPosts',
            KeyConditionExpression: 'gsiAuthorId = :authorId',
            ExpressionAttributeValues: { ':authorId': authorId },
            ScanIndexForward: true,
        });
        const items = result.data?.Items || [];
        return items.map(i => new PostEntity(i));
    }

    async findPostsByCategory(categoryId: string): Promise<PostEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_CategoryPosts',
            KeyConditionExpression: 'gsiCategoryId = :categoryId',
            ExpressionAttributeValues: { ':categoryId': categoryId },
            ScanIndexForward: false,
        });
        const items = result.data?.Items || [];
        return items.map(i => new PostEntity(i));
    }

    async findRecentPosts(): Promise<PostEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_RecentPosts',
            KeyConditionExpression: 'gsiRecentType = :type',
            ExpressionAttributeValues: { ':type': 'POST' },
            ScanIndexForward: false,
        });
        const items = result.data?.Items || [];
        return items.map(i => new PostEntity(i));
    }

    async findBySlug(slug: string): Promise<PostEntity> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'gsiSlug = :slug and gsiSlugType = :type',
            ExpressionAttributeValues: { ':slug': slug, ':type': 'POST' },
        });
        const items = result.data?.Items || [];
        if (items.length === 0) {
            throw new NotFoundException(`Post with slug ${slug} not found`);
        }
        return new PostEntity(items[0]);
    }
}