import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { SubcategoryEntity } from './subcategory.entity';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoryRepository {
    private readonly TABLE_NAME = 'blog-table';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(createDto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
        const subcategory = new SubcategoryEntity(createDto);
        const params = {
            TableName: this.TABLE_NAME,
            Item: subcategory,
        };
        await this.dynamoDbService.put(params);
        return subcategory;
    }

    async findById(id: string): Promise<SubcategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'SUBCAT#parent#id': id, METADATA: 'METADATA' },
        };
        const result = await this.dynamoDbService.get(params);
        if (!result?.data?.Item) {
            throw new NotFoundException(`Subcategory with id ${id} not found`);
        }
        return new SubcategoryEntity(result.data.Item);
    }

    async update(id: string, updateDto: UpdateSubcategoryDto): Promise<SubcategoryEntity> {
        const existing = await this.findById(id);
        const updated = { ...existing, ...updateDto };
        const params = {
            TableName: this.TABLE_NAME,
            Item: updated,
        };
        await this.dynamoDbService.put(params);
        return new SubcategoryEntity(updated);
    }

    async delete(id: string): Promise<void> {
        const params = {
            TableName: this.TABLE_NAME,
            Key: { 'SUBCAT#parent#id': id, METADATA: 'METADATA' },
        };
        await this.dynamoDbService.delete(params);
    }

    // Consulta por GSI_ParentCategory (subcategorias por categoria pai)
    async findByParentCategory(parentCategoryId: string): Promise<SubcategoryEntity[]> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_ParentCategory',
            KeyConditionExpression: 'gsiParentCategoryId = :parentId',
            ExpressionAttributeValues: {
                ':parentId': parentCategoryId,
            },
            ScanIndexForward: true,
        };
        const result = await this.dynamoDbService.query(params);
        return result.data.Items.map((item: any) => new SubcategoryEntity(item));
    }

    // Consulta por GSI_Slug (busca por slug)
    async findBySlug(slug: string): Promise<SubcategoryEntity> {
        const params = {
            TableName: this.TABLE_NAME,
            IndexName: 'GSI_Slug',
            KeyConditionExpression: 'gsiSlug = :slug and gsiSlugType = :type',
            ExpressionAttributeValues: {
                ':slug': slug,
                ':type': 'SUBCATEGORY',
            },
        };
        const result = await this.dynamoDbService.query(params);
        if (!result?.data?.Items || result.data.Items.length === 0) {
            throw new NotFoundException(`Subcategory with slug ${slug} not found`);
        }
        return new SubcategoryEntity(result.data.Items[0]);
    }
}
