import { DynamoDbService } from '@src/services/dynamoDb.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from '@src/modules/blog/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/categories/dto/update-category.dto';
import { CategoryDto } from '@src/modules/blog/categories/dto/category.dto';
import { UpdateCommandInput, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import * as dotenv from 'dotenv';

// Carregar as variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Interface que representa a estrutura de um item de categoria no DynamoDB.
 */
interface DynamoDBCategoryItem {
    categoryId: string;
    name: string;
    description?: string;
}

/**
 * Serviço responsável por gerenciar as operações de categorias dentro do contexto do blog.
 */
@Injectable()
export class CategoryService {
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_CATEGORIES;  // Usando a variável de ambiente para o nome da tabela

    /**
     * Construtor da classe CategoryService.
     * @param dynamoDbService Serviço responsável pela interação com o DynamoDB.
     */
    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria uma nova categoria no banco de dados DynamoDB.
     * @param createCategoryDto DTO contendo as informações da categoria a ser criada.
     * @returns Uma Promise que resolve para o DTO da categoria criada.
     */
    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Item: createCategoryDto,
        };
        // Inserção do item no DynamoDB
        await this.dynamoDbService.putItem(params);
        // Retorna a categoria recém-criada
        return this.findOne(createCategoryDto.categoryId);
    }

    /**
     * Retorna todas as categorias armazenadas no DynamoDB.
     * @returns Uma Promise que resolve para um array de DTOs de categorias.
     */
    async findAll(): Promise<CategoryDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCategoryFromDynamoDb(item as DynamoDBCategoryItem));
    }

    /**
     * Busca uma categoria específica no DynamoDB utilizando seu ID.
     * @param categoryId O ID da categoria a ser buscada.
     * @returns Uma Promise que resolve para o DTO da categoria encontrada.
     * @throws NotFoundException Caso nenhuma categoria seja encontrada com o ID fornecido.
     */
    async findOne(categoryId: string): Promise<CategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                categoryId: categoryId,
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Categoria com o ID '${categoryId}' não foi encontrada.`);
        }
        return this.mapCategoryFromDynamoDb(result.Item as DynamoDBCategoryItem);
    }

    /**
     * Atualiza os dados de uma categoria existente no DynamoDB.
     * @param categoryId O ID da categoria a ser atualizada.
     * @param updateCategoryDto DTO contendo os dados a serem atualizados na categoria.
     * @returns Uma Promise que resolve para o DTO da categoria atualizada.
     * @throws NotFoundException Caso nenhuma categoria seja encontrada com o ID fornecido.
     */
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

        const result = await this.dynamoDbService.updateItem(params) as UpdateCommandOutput;
        return this.mapCategoryFromDynamoDb(result.Attributes as DynamoDBCategoryItem);
    }

    /**
     * Remove uma categoria do banco de dados DynamoDB utilizando seu ID.
     * @param categoryId O ID da categoria a ser removida.
     * @returns Uma Promise que resolve quando a categoria for removida com sucesso.
     * @throws NotFoundException Caso nenhuma categoria seja encontrada com o ID fornecido.
     */
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

    /**
     * Mapeia um item do DynamoDB para o DTO de categoria.
     * @param item O item retornado pelo DynamoDB.
     * @returns O DTO de categoria correspondente.
     */
    private mapCategoryFromDynamoDb(item: DynamoDBCategoryItem): CategoryDto {
        return {
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
        } as CategoryDto;
    }

    /**
     * Busca uma categoria específica pelo seu ID.
     * @param categoryId O ID da categoria a ser buscada.
     * @returns Uma Promise que resolve para o DTO da categoria encontrada.
     * @throws NotFoundException Caso nenhuma categoria seja encontrada com o ID fornecido.
     */
    async getCategoryById(categoryId: string): Promise<CategoryDto> {
        return this.findOne(categoryId);
    }
}
