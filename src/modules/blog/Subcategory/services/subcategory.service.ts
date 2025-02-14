// src/modules/blog/Subcategory/services/subcaSubcategorytegoria.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa DynamoDbService com 'Db' correto
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';

@Injectable()
export class SubcategoryService {
    private readonly tableName = 'Subcategory';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(createSubcategoryDto: CreateSubcategoryDto): Promise<SubcategoryDto> {
        const categorySubcategoryId = `${createSubcategoryDto.categoryId}#${createSubcategoryDto.subcategoryId}`;

        const params = {
            TableName: this.tableName,
            Item: {
                ...createSubcategoryDto,
                'categoryId#subcategoryId': categorySubcategoryId, // Chave de partição composta
            },
        };
        await this.dynamoDbService.putItem(params);
        return this.getSubcategoryById(categorySubcategoryId, createSubcategoryDto.subcategoryId); // Changed findOne to getSubcategoryById for clarity and consistency
    }

    async getAllSubcategories(categoryIdSubcategoryId: string): Promise<SubcategoryDto[]> { // Changed findAll to getAllSubcategories and adjusted logic
        const params = {
            TableName: this.tableName,
            FilterExpression: 'begins_with(#pk, :pk_prefix)', // Corrected FilterExpression for partition key query
            ExpressionAttributeNames: {
                '#pk': 'categoryId#subcategoryId',
            },
            ExpressionAttributeValues: {
                ':pk_prefix': categoryIdSubcategoryId,
            },
        };
        const result = await this.dynamoDbService.scanItems(params);
        if (!result.Items) {
            return [];
        }
        return result.Items.map(item => ({ // Explicitly map to SubcategoryDto
            'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S,
            subcategoryId: item.subcategoryId?.S,
            name: item.name?.S,
            slug: item.slug?.S,
        } as SubcategoryDto)) || [];
    }

    async getSubcategoryById(categoryIdSubcategoryId: string, subcategoryId: string): Promise<SubcategoryDto> { // Renamed findOne to getSubcategoryById for clarity
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId,
                subcategoryId: subcategoryId,
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Subcategory com ID '${subcategoryId}' na categoria '${categoryIdSubcategoryId}' não encontrada`);
        }
        return { // Explicitly map to SubcategoryDto
            'categoryId#subcategoryId': result.Item['categoryId#subcategoryId']?.S,
            subcategoryId: result.Item.subcategoryId?.S,
            name: result.Item.name?.S,
            slug: result.Item.slug?.S,
        } as SubcategoryDto;
    }

    async updateSubcategory(categoryIdSubcategoryId: string, subcategoryId: string, updateSubcategoryDto: UpdateSubcategoryDto): Promise<SubcategoryDto> { // Renamed update to updateSubcategory for clarity
        await this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Use getSubcategoryById
        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoryDto);
        if (!updateExpression) {
            return this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Use getSubcategoryById
        }

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId,
                subcategoryId: subcategoryId,
            },
            ...updateExpression,
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return {  // Explicitly map to SubcategoryDto
            'categoryId#subcategoryId': result.Attributes['categoryId#subcategoryId']?.S,
            subcategoryId: result.Attributes.subcategoryId?.S,
            name: result.Attributes.name?.S,
            slug: result.Attributes.slug?.S,
        } as SubcategoryDto;
    }

    async removeSubcategory(categoryIdSubcategoryId: string, subcategoryId: string): Promise<void> { // Renamed remove to removeSubcategory for clarity
        await this.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Use getSubcategoryById
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': categoryIdSubcategoryId,
                subcategoryId: subcategoryId,
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }
}