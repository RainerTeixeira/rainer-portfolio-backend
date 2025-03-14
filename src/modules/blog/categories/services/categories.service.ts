import { DynamoDbService } from '@src/services/dynamoDb.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from '@src/modules/blog/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/categories/dto/update-category.dto';
import { CategoryDto } from '@src/modules/blog/categories/dto/category.dto';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

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
        return this.findOne(createCategoryDto.categoryId.toString());
    }

    async findAll(): Promise<CategoryDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCategoryFromDynamoDb(item));
    }

    async findOne(categoryId: string): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                categoryId: categoryId, // Corrigir o formato do valor
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Category com categoryId '${categoryId}' não encontrado`);
        }
        return this.mapCategoryFromDynamoDb(result.Item);
    }

    async update(categoryId: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        await this.findOne(categoryId);

        const params: UpdateCommandInput = {
            TableName: this.tableName,
            Key: {
                categoryId: categoryId,
            },
            UpdateExpression: 'SET name = :name, description = :description',
            ExpressionAttributeValues: {
                ':name': updateCategoryDto.name,
                ':description': updateCategoryDto.description || '',
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return this.mapCategoryFromDynamoDb(result.Attributes as Record<string, any>) as CategoryDto;
    }

    async remove(categoryId: string): Promise<void> {
        await this.findOne(categoryId);

        const params = {
            TableName: this.tableName,
            Key: {
                categoryId: categoryId,
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }

    private mapCategoryFromDynamoDb(item: Record<string, any>): CategoryDto {
        return {
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
        } as CategoryDto;
    }

    async getCategoryById(categoryId: string): Promise<CategoryDto> {
        return this.findOne(categoryId);
    }
}
