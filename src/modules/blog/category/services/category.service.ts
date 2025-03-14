// src/modules/blog/category/services/categories.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from '@src/modules/blog/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/category/dto/update-category.dto';
import { CategoryDto } from '@src/modules/blog/category/dto/category.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa DynamoDbService usando alias @src.
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb'; // Importe UpdateCommandInput
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'; // Importe decorators do Swagger

/**
 * @CategoryService
 * Serviço responsável pela lógica de negócio das categorias.
 */
@ApiTags('category') // Adicione tag para Swagger
@Injectable()
export class CategoryService {
    private readonly tableName = 'Category'; // Nome da tabela DynamoDB para Category

    constructor(private readonly dynamoDbService: DynamoDbService) { } // Injeta DynamoDbService

    /**
     * Cria uma nova categoria.
     * @param createCategoryDto - Dados para criar a categoria.
     * @returns A categoria criada.
     */
    @ApiOperation({ summary: 'Criar uma nova categoria' })
    @ApiResponse({ status: 201, description: 'A categoria foi criada com sucesso.', type: CategoryDto })
    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Item: createCategoryDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createCategoryDto.categoryId);
    }

    /**
     * Obtém todas as categorias.
     * @returns Uma lista de todas as categorias.
     */
    @ApiOperation({ summary: 'Obter todas as categorias' })
    @ApiResponse({ status: 200, description: 'Retorna todas as categorias.', type: [CategoryDto] })
    async findAll(): Promise<CategoryDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCategoryFromDynamoDb(item)); // Use map e função de mapeamento
    }

    /**
     * Obtém uma categoria por ID.
     * @param categoryId - ID da categoria.
     * @returns A categoria encontrada.
     * @throws NotFoundException Se a categoria não for encontrada.
     */
    @ApiOperation({ summary: 'Obter uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'Retorna a categoria.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async findOne(categoryId: string): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: { categoryId: categoryId }, // Usar string diretamente
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Category com ID '${categoryId}' não encontrada`);
        }
        return this.mapCategoryFromDynamoDb(result.Item); // Use função de mapeamento
    }

    async getCategoryById(categoryId: string): Promise<CategoryDto> {
        return this.findOne(categoryId);
    }

    /**
     * Atualiza uma categoria por ID.
     * @param categoryId - ID da categoria a ser atualizada.
     * @param updateCategoryDto - Dados para atualizar a categoria.
     * @returns A categoria atualizada.
     * @throws NotFoundException Se a categoria não for encontrada.
     */
    @ApiOperation({ summary: 'Atualizar uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'A categoria foi atualizada com sucesso.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async update(categoryId: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
        // Verifica se a categoria existe antes de atualizar
        await this.findOne(categoryId);

        const params: UpdateCommandInput = { // Use UpdateCommandInput type
            TableName: this.tableName,
            Key: { categoryId }, // Corrigir o formato do valor
            UpdateExpression: 'SET #name = :name, slug = :slug, seo = :seo', // Use 'SET' e placeholders para atualizar
            ExpressionAttributeNames: { // Mapeamento de nomes de atributos
                '#name': 'name', // '#name' será substituído por 'name' (evita palavras reservadas)
            },
            ExpressionAttributeValues: { // Valores para substituir nos placeholders
                ':name': updateCategoryDto.name, // Formato correto do valor string para DynamoDB
                ':slug': updateCategoryDto.slug,
                ':seo': { // Formato correto para mapa (objeto) no DynamoDB
                    canonical: updateCategoryDto.seo?.canonical || null, // Se for opcional, use || null para evitar undefined
                    description: updateCategoryDto.seo?.description || null,
                    keywords: updateCategoryDto.seo?.keywords || [] // Se for array, mapeie para formato de lista do DynamoDB
                },
            },
            ReturnValues: 'ALL_NEW', // Defina o tipo de retorno esperado
        };
        const result = await this.dynamoDbService.updateItem(params);
        return this.mapCategoryFromDynamoDb(result.Attributes as Record<string, any>) as CategoryDto; // Mapeie o Attributes e faça type assertion para CategoryDto
    }

    /**
     * Remove uma categoria por ID.
     * @param categoryId - ID da categoria a ser removida.
     * @throws NotFoundException Se a categoria não for encontrada.
     */
    @ApiOperation({ summary: 'Deletar uma categoria por ID' })
    @ApiResponse({ status: 204, description: 'A categoria foi deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async remove(categoryId: string): Promise<void> {
        // Verifica se a categoria existe antes de deletar
        await this.findOne(categoryId);

        const params = {
            TableName: this.tableName,
            Key: { categoryId },
        };
        await this.dynamoDbService.deleteItem(params);
    }

    private mapCategoryFromDynamoDb(item: Record<string, any>): CategoryDto {
        return {
            categoryId: item.categoryId,
            name: item.name,
            slug: item.slug,
            seo: {
                canonical: item.seo?.canonical,
                description: item.seo?.description,
                keywords: item.seo?.keywords,
            },
        } as CategoryDto;
    }
}