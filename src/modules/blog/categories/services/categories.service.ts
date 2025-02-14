// src/modules/blog/categories/services/categories.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '../../../../services/dynamoDb.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoriesService {
    private readonly tableName = 'Categories';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Item: createCategoryDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createCategoryDto.categoryId);
    }

    async findAll(): Promise<CategoryDto[]> {
        const params = {
            TableName: this.tableName,
        };
        const result = await this.dynamoDbService.scanItems(params);
        return (result.Items as CategoryDto[]) || [];
    }

    async findOne(categoryId: string): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                categoryId: { S: categoryId },
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Category com categoryId '${categoryId}' não encontrada`);
        }
        return result.Item as CategoryDto;
    }

    async update(categoryId: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        await this.findOne(categoryId); // Verifica se existe
        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateCategoryDto);
        if (!updateExpression) {
            return this.findOne(categoryId);
        }

        const params = {
            TableName: this.tableName,
            Key: {
                categoryId: { S: categoryId },
            },
            ...updateExpression,
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return result.Attributes as CategoryDto;
    }

    async remove(categoryId: string): Promise<void> {
        await this.findOne(categoryId); // Verifica se existe
        const params = {
            TableName: this.tableName,
            Key: {
                categoryId: { S: categoryId },
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }
}