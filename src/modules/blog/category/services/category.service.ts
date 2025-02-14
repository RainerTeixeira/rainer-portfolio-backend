// src/modules/blog/category/services/categories.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from '@src/modules/blog/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/category/dto/update-category.dto';
import { CategoryDto } from '@src/modules/blog/category/dto/category.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa DynamoDbService usando alias @src.
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb'; // Importe UpdateCommandInput


@Injectable()
export class CategoryService {
    private readonly tableName = 'Category'; // Nome da tabela DynamoDB para Category

    constructor(private readonly dynamoDbService: DynamoDbService) { } // Injeta DynamoDbService

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Item: createCategoryDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createCategoryDto.categoryId);
    }

    async findAll(): Promise<CategoryDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCategoryFromDynamoDb(item)); // Use map e função de mapeamento
    }

    async findOne(categoryId: string): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: { categoryId: { S: categoryId } },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Category com ID '${categoryId}' não encontrada`);
        }
        return this.mapCategoryFromDynamoDb(result.Item); // Use função de mapeamento
    }

    async update(categoryId: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        // Verifica se a categoria existe antes de atualizar
        await this.findOne(categoryId);

        const params: UpdateCommandInput = { // Use UpdateCommandInput type
            TableName: this.tableName,
            Key: { categoryId: { S: categoryId } },
            UpdateExpression: 'SET #name = :name, slug = :slug, seo = :seo', // Use 'SET' e placeholders para atualizar
            ExpressionAttributeNames: { // Mapeamento de nomes de atributos
                '#name': 'name', // '#name' será substituído por 'name' (evita palavras reservadas)
            },
            ExpressionAttributeValues: { // Valores para substituir nos placeholders
                ':name': { S: updateCategoryDto.name }, // Formato correto do valor string para DynamoDB
                ':slug': { S: updateCategoryDto.slug },
                ':seo': {
                    M: { // Formato correto para mapa (objeto) no DynamoDB
                        canonical: { S: updateCategoryDto.seo?.canonical || null }, // Se for opcional, use || null para evitar undefined
                        description: { S: updateCategoryDto.seo?.description || null },
                        keywords: { L: updateCategoryDto.seo?.keywords?.map(keyword => ({ S: keyword })) || [] } // Se for array, mapeie para formato de lista do DynamoDB
                    }
                },
            },
            ReturnValues: 'ALL_NEW', // Defina o tipo de retorno esperado
        };
        const result = await this.dynamoDbService.updateItem(params);
        return this.mapCategoryFromDynamoDb(result.Attributes as Record<string, any>) as CategoryDto; // Mapeie o Attributes e faça type assertion para CategoryDto
    }

    async remove(categoryId: string): Promise<void> {
        // Verifica se a categoria existe antes de deletar
        await this.findOne(categoryId);

        const params = {
            TableName: this.tableName,
            Key: { categoryId: { S: categoryId } },
        };
        await this.dynamoDbService.deleteItem(params);
    }


    private mapCategoryFromDynamoDb(item: Record<string, any>): CategoryDto { // Função para mapear
        return {
            categoryId: item.categoryId?.S, // Acessa propriedades e extrai valor string (S) do DynamoDB
            name: item.name?.S,
            slug: item.slug?.S,
            seo: { // Mapeia objeto aninhado 'seo'
                canonical: item.seo?.M?.canonical?.S,
                description: item.seo?.M?.description?.S,
                keywords: item.seo?.M?.keywords?.L?.map((keywordItem: any) => keywordItem.S) // Mapeia lista de strings
            },
        } as CategoryDto; // 'as CategoryDto' agora é mais seguro, pois você mapeou as propriedades
    }
}