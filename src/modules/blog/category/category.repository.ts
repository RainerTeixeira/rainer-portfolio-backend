import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CategoryEntity } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryRepository {
    private readonly TABLE_NAME = 'blog-table';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(createDto: CreateCategoryDto): Promise<CategoryEntity> {
        const category = new CategoryEntity(createDto);
        const params = {
            TableName: this.TABLE_NAME,
            Item: category,
        };
        await this.dynamoDbService.put(params);
        return category;
    }

    async findById(id: string): Promise<CategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'CATEGORY#id': id, METADATA: 'METADATA' },
        };
        const result = await this.dynamoDbService.get(params);
        if (!result?.data?.Item) {
            throw new NotFoundException(`Category with id ${id} not found`);
        }
        return new CategoryEntity(result.data.Item);
    }

    async update(id: string, updateDto: UpdateCategoryDto): Promise<CategoryEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...updateDto };
        const params = {
            TableName: this.TABLE_NAME,
            Item: updated,
        };
        await this.dynamoDbService.put(params);
        return new CategoryEntity(updated);
    }

    async delete(id: string): Promise<void> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'CATEGORY#id': id, METADATA: 'METADATA' },
        };
        await this.dynamoDbService.delete(params);
    }

    // Consulta por GSI_Slug (busca por slug)
    async findBySlug(slug: string): Promise<CategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'gsiSlug = :slug and gsiSlugType = :type',
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'CATEGORY',
            },
        };
        const result = await this.dynamoDbService.query(params);
        if (!result?.data?.Items || result.data.Items.length === 0) {
            throw new NotFoundException(`Category with slug ${slug} not found`);
        }
        return new CategoryEntity(result.data.Items[0]);
    }

    // Consulta por GSI_Popular (categorias mais populares)
    async findPopularCategories(): Promise<CategoryEntity[]> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Popular',
            KeyConditionExpression: 'gsiPopularType = :type',
            ExpressionAttributeValues: {
                ':type': 'CATEGORY',
            },
            ScanIndexForward: false, // categorias com maior post_count primeiro
        };
        const result = await this.dynamoDbService.query(params);
        return result.data.Items.map((item: any) => new CategoryEntity(item));
    }
}
