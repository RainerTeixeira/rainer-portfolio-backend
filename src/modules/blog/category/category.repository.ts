import { Injectable } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CategoryEntity } from '../entities/category.entity';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

@Injectable()
export class CategoryRepository {
    private readonly tableName = 'YourTableName';

    constructor(private readonly dynamoDb: DynamoDbService) { }

    /**
     * Busca categoria por slug usando GSI
     */
    async findBySlug(slug: string): Promise<CategoryEntity | null> {
        const result = await this.dynamoDb.query({
            TableName: this.tableName,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: '#slug = :slug AND #type = :type',
            ExpressionAttributeNames: {
                '#slug': 'slug',
                '#type': 'type'
            },
            ExpressionAttributeValues: {
                ':slug': { S: slug },
                ':type': { S: 'CATEGORY' }
            }
        });

        return result.Items?.length ? this.mapDynamoItem(result.Items[0]) : null;
    }

    /**
     * Lista categorias populares usando GSI
     */
    async findPopular(): Promise<CategoryEntity[]> {
        const result = await this.dynamoDb.query({
            TableName: this.tableName,
            IndexName: 'GSI_Popular',
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: { '#type': 'type' },
            ExpressionAttributeValues: { ':type': { S: 'CATEGORY' } },
            ScanIndexForward: false,
            Limit: 10
        });

        return result.Items?.map(item => this.mapDynamoItem(item)) || [];
    }

    private mapDynamoItem(item: Record<string, AttributeValue>): CategoryEntity {
        return new CategoryEntity({
            id: item.id.S,
            name: item.name.S,
            slug: item.slug.S,
            description: item.description.S,
            keywords: item.keywords.SS || [],
            post_count: Number(item.post_count.N),
            meta_description: item.meta_description.S,
            created_at: item.created_at.S,
            updated_at: item.updated_at.S
        });
    }
}