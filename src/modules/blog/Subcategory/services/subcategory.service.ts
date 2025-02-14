// src/modules/blog/Subcategory/services/subcaSubcategorytegoria.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamodb.service'; // Importa DynamoDbService usando alias @src.
import { CreateSubcategoryDto } from '@src/modules/blog/subcategory/dto/create-subcategory.dto'; // Importa CreateSubcategoriaDto usando alias @src.
import { UpdateSubcategoryDto } from '@src/modules/blog/subcategory/dto/update-subcategory.dto'; // Importa UpdateSubcategoriaDto usando alias @src.
import { SubcategoryDto } from '@src/modules/blog/subcategory/dto/subcategory.dto'; // Importa SubcategoryDto usando alias @src.

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
        return this.findOne(categorySubcategoryId, createSubcategoryDto.subcategoryId);
    }

    async findAll(): Promise<SubcategoryDto[]> {
        const params = {
            TableName: this.tableName,
        };
        const result = await this.dynamoDbService.scanItems(params);
        return (result.Items as SubcategoryDto[]) || [];
    }

    async findOne(categoryIdSubcategoryId: string, subcategoryId: string): Promise<SubcategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                subcategoryId: { S: subcategoryId },
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Subcategoria com categoryId#subcategoryId '${categoryIdSubcategoryId}' e subcategoryId '${subcategoryId}' não encontrada`);
        }
        return result.Item as SubcategoryDto;
    }

    async update(categoryIdSubcategoryId: string, subcategoryId: string, updateSubcategoryDto: UpdateSubcategoriaDto): Promise<SubcategoryDto> {
        await this.findOne(categoryIdSubcategoryId, subcategoryId);
        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoriaDto);
        if (!updateExpression) {
            return this.findOne(categoryIdSubcategoryId, subcategoryId);
        }

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                subcategoryId: { S: subcategoryId },
            },
            ...updateExpression,
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return result.Attributes as SubcategoryDto;
    }

    async remove(categoryIdSubcategoryId: string, subcategoryId: string): Promise<void> {
        await this.findOne(categoryIdSubcategoryId, subcategoryId);
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                subcategoryId: { S: subcategoryId },
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }
}