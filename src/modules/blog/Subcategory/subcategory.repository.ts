// src/modules/blog/subcategory/subcategory.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { SubcategoryEntity } from './subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoryRepository {
    private readonly TABLE_NAME = 'Subcategory';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(dto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
        const entity = new SubcategoryEntity(dto);
        await this.dynamoDbService.put({ TableName: this.TABLE_NAME, Item: entity });
        return entity;
    }

    async findById(id: string): Promise<SubcategoryEntity> {
        const result = await this.dynamoDbService.get({
            TableName: this.TABLE_NAME,
            Key: { 'SUBCAT#id': id, METADATA: 'METADATA' },
        });
        if (!result?.data?.Item) {
            throw new NotFoundException(`Subcategory with id ${id} not found`);
        }
        return new SubcategoryEntity(result.data.Item);
    }

    async update(id: string, dto: UpdateSubcategoryDto): Promise<SubcategoryEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...dto };
        await this.dynamoDbService.put({ TableName: this.TABLE_NAME, Item: updated });
        return new SubcategoryEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await this.dynamoDbService.delete({
            TableName: this.TABLE_NAME,
            Key: { 'SUBCAT#id': id, METADATA: 'METADATA' },
        });
    }

    async findByParentCategory(parentCategoryId: string): Promise<SubcategoryEntity[]> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_ParentCategory',
            KeyConditionExpression: 'parent_category_id = :pid',
            ExpressionAttributeValues: { ':pid': parentCategoryId },
            ScanIndexForward: true,
        });
        const items = result.data?.Items || [];
        return items.map((i: any) => new SubcategoryEntity(i));
    }

    async findBySlug(slug: string): Promise<SubcategoryEntity> {
        const result = await this.dynamoDbService.query({
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'slug = :s and #t = :type',
            ExpressionAttributeNames: { '#t': 'type' },
            ExpressionAttributeValues: { ':s': slug, ':type': 'SUBCATEGORY' },
        });
        const items = result.data?.Items || [];
        if (!items.length) {
            throw new NotFoundException(`Subcategory with slug ${slug} not found`);
        }
        return new SubcategoryEntity(items[0]);
    }
}
