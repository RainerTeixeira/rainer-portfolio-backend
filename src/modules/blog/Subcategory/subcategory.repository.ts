import { Injectable } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { SubcategoryEntity } from '../entities/subcategory.entity';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

@Injectable()
export class SubcategoryRepository {
    private readonly tableName = 'YourTableName';

    constructor(private readonly dynamoDb: DynamoDbService) { }

    async findByParent(parentId: string): Promise<SubcategoryEntity[]> {
        const result = await this.dynamoDb.query({
            TableName: this.tableName,
            IndexName: 'GSI_ParentCategory',
            KeyConditionExpression: '#parent = :parent',
            ExpressionAttributeNames: { '#parent': 'parent_category_id' },
            ExpressionAttributeValues: { ':parent': { S: parentId } }
        });

        return result.Items?.map(item => this.mapDynamoItem(item)) || [];
    }

    async findBySlug(slug: string): Promise<SubcategoryEntity | null> {
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
                ':type': { S: 'SUBCATEGORY' }
            }
        });

        return result.Items?.length ? this.mapDynamoItem(result.Items[0]) : null;
    }

    private mapDynamoItem(item: Record<string, AttributeValue>): SubcategoryEntity {
        return new SubcategoryEntity({
            id: item.id.S,
            name: item.name.S,
            slug: item.slug.S,
            description: item.description.S,
            post_count: Number(item.post_count.N),
            parent_category_id: item.parent_category_id.S,
            parent_category_slug: item.parent_category_slug.S,
            meta_description: item.meta_description.S,
            created_at: item.created_at.S,
            updated_at: item.updated_at.S
        });
    }
}