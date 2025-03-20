import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * @interface DynamoDBSubcategoryItem
 * @description Interface que define a estrutura de um item de subcategoria no DynamoDB.
 * Contém as propriedades que são armazenadas no banco de dados.
 */
interface DynamoDBSubcategoryItem {
    'categoryId#subcategoryId'?: { S?: string };
    subcategoryId?: { S?: string };
    name?: { S?: string };
    slug?: { S?: string };
    description?: { S?: string };
    keywords?: { S?: string };
    title?: { S?: string };
}

/**
 * @class SubcategoryService
 * @classdesc Serviço responsável pela lógica de negócio das subcategorias.
 * Este serviço interage com o DynamoDB para realizar operações CRUD (Create, Read, Update, Delete)
 * na tabela de subcategorias. Utiliza o padrão de projeto Repository para abstrair a camada de acesso a dados.
 */
@ApiTags('Subcategories')
@Injectable()
export class SubcategoryService {
    /**
     * @private
     * @readonly
     * @property {string} tableName - Nome da tabela de subcategorias no DynamoDB.
     * Obtido através da variável de ambiente DYNAMO_TABLE_NAME_SUBCATEGORIES_POSTS.
     */
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_SUBCATEGORIES_POSTS;

    /**
     * @constructor
     * @param {DynamoDbService} dynamoDbService - Serviço injetado para interação com o DynamoDB.
     */
    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * @async
     * @method createSubcategory
     * @description Cria uma nova subcategoria no DynamoDB.
     * @param {CreateSubcategoryDto} createSubcategoryDto - DTO contendo os dados para criar a subcategoria.
     * @returns {Promise<SubcategoryDto>} Uma Promise que resolve para o DTO da subcategoria criada.
     * @throws {BadRequestException} Se `categoryId` ou `subcategoryId` não forem fornecidos no DTO.
     */
    @ApiOperation({ summary: 'Criar uma nova subcategoria' })
    @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    async createSubcategory(createSubcategoryDto: CreateSubcategoryDto): Promise<SubcategoryDto> {
        if (!createSubcategoryDto.categoryId || !createSubcategoryDto.subcategoryId) {
            throw new BadRequestException('categoryId e subcategoryId são obrigatórios.');
        }

        const compositeKey = `${createSubcategoryDto.categoryId}#${createSubcategoryDto.subcategoryId}`;

        const params = {
            TableName: this.tableName,
            Item: {
                'categoryId#subcategoryId': { S: compositeKey },
                subcategoryId: { S: createSubcategoryDto.subcategoryId },
                name: { S: createSubcategoryDto.name },
                slug: { S: createSubcategoryDto.slug },
                description: { S: createSubcategoryDto.description },
                keywords: { S: createSubcategoryDto.keywords },
                title: { S: createSubcategoryDto.title },
            },
        };

        await this.dynamoDbService.putItem(params);
        return this.getSubcategoryById(createSubcategoryDto.categoryId, createSubcategoryDto.subcategoryId);
    }

    /**
     * @async
     * @method getAllSubcategories
     * @description Busca todas as subcategorias pertencentes a uma categoria específica no DynamoDB.
     * Utiliza a operação de `scan` com um filtro para buscar subcategorias pelo `categoryId`.
     * @param {string} categoryId - ID da categoria para buscar as subcategorias.
     * @returns {Promise<SubcategoryDto>} Uma Promise que resolve para um array de DTOs de subcategorias encontradas.
     */
    @ApiOperation({ summary: 'Buscar todas as subcategorias de uma categoria' })
    @ApiResponse({ status: 200, description: 'Lista de subcategorias retornada com sucesso.', type: [SubcategoryDto] })
    async getAllSubcategories(categoryId: string): Promise<SubcategoryDto> {
        const params = {
            TableName: this.tableName,
            FilterExpression: 'begins_with(#pk, :pk_prefix)',
            ExpressionAttributeNames: {
                '#pk': 'categoryId#subcategoryId',
            },
            ExpressionAttributeValues: {
                ':pk_prefix': { S: `${categoryId}#` },
            },
        };

        const result = await this.dynamoDbService.scan(params);
        if (!result.Items) {
            return;
        }

        return result.Items.map((item: DynamoDBSubcategoryItem) => this.mapToDto(item));
    }

    /**
     * @async
     * @method getSubcategoryById
     * @description Busca uma subcategoria específica pelo ID da categoria e pelo ID da subcategoria.
     * @param {string} categoryId - ID da categoria da subcategoria.
     * @param {string} subcategoryId - ID da subcategoria a ser buscada.
     * @returns {Promise<SubcategoryDto>} Uma Promise que resolve para o DTO da subcategoria encontrada.
     * @throws {NotFoundException} Se a subcategoria com o ID especificado não for encontrada na categoria.
     */
    @ApiOperation({ summary: 'Buscar uma subcategoria por ID' })
    @ApiResponse({ status: 200, description: 'Subcategoria retornada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async getSubcategoryById(categoryId: string, subcategoryId: string): Promise<SubcategoryDto> {
        const categoryIdSubcategoryId = `${categoryId}#${subcategoryId}`;
        return this.findOne(categoryIdSubcategoryId, subcategoryId);
    }

    /**
     * @async
     * @method updateSubcategory
     * @description Atualiza os dados de uma subcategoria existente no DynamoDB.
     * @param {string} categoryId - ID da categoria da subcategoria a ser atualizada.
     * @param {string} subcategoryId - ID da subcategoria a ser atualizada.
     * @param {UpdateSubcategoryDto} updateSubcategoryDto - DTO contendo os dados a serem atualizados na subcategoria.
     * @returns {Promise<SubcategoryDto>} Uma Promise que resolve para o DTO da subcategoria atualizada.
     * @throws {NotFoundException} Se a subcategoria com os IDs especificados não for encontrada.
     */
    @ApiOperation({ summary: 'Atualizar uma subcategoria existente' })
    @ApiResponse({ status: 200, description: 'Subcategoria atualizada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async updateSubcategory(
        categoryId: string,
        subcategoryId: string,
        updateSubcategoryDto: UpdateSubcategoryDto
    ): Promise<SubcategoryDto> {
        const categoryIdSubcategoryId = `${categoryId}#${subcategoryId}`;
        await this.findOne(categoryIdSubcategoryId, subcategoryId);

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateSubcategoryDto);
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
        };

        const result = await this.dynamoDbService.updateItem(params);
        if (!result.Attributes) {
            throw new NotFoundException(`Subcategoria '${subcategoryId}' na categoria '${categoryId}' não encontrada após atualização.`);
        }
        return this.mapToDto(result.Attributes as DynamoDBSubcategoryItem);
    }

    /**
     * @async
     * @method deleteSubcategory
     * @description Deleta uma subcategoria do DynamoDB com base no ID da categoria e no ID da subcategoria.
     * @param {string} categoryId - ID da categoria da subcategoria a ser deletada.
     * @param {string} subcategoryId - ID da subcategoria a ser deletada.
     * @returns {Promise<void>} Uma Promise que resolve quando a subcategoria é deletada com sucesso.
     * @throws {NotFoundException} Se a subcategoria com os IDs especificados não for encontrada.
     */
    @ApiOperation({ summary: 'Deletar uma subcategoria' })
    @ApiResponse({ status: 200, description: 'Subcategoria deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async deleteSubcategory(categoryId: string, subcategoryId: string): Promise<void> {
        const categoryIdSubcategoryId = `${categoryId}#${subcategoryId}`;
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

    /**
     * @async
     * @private
     * @method findOne
     * @description Busca uma subcategoria específica no DynamoDB usando a chave composta e o ID da subcategoria.
     * @param {string} categoryIdSubcategoryId - Chave composta da categoria e da subcategoria (categoryId#subcategoryId).
     * @param {string} subcategoryId - ID da subcategoria.
     * @returns {Promise<SubcategoryDto>} Uma Promise que resolve para o DTO da subcategoria encontrada.
     * @throws {NotFoundException} Se a subcategoria com os IDs especificados não for encontrada.
     */
    private async findOne(categoryIdSubcategoryId: string, subcategoryId: string): Promise<SubcategoryDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
                subcategoryId: { S: subcategoryId },
            },
        };

        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Subcategoria '${subcategoryId}' na categoria '${categoryIdSubcategoryId.split('#')[0]}' não encontrada.`);
        }
        return this.mapToDto(result.Item as DynamoDBSubcategoryItem);
    }

    /**
     * @private
     * @method mapToDto
     * @description Mapeia um item retornado do DynamoDB para um objeto SubcategoryDto.
     * @param {DynamoDBSubcategoryItem} item - Item retornado do DynamoDB.
     * @returns {SubcategoryDto} Objeto SubcategoryDto com os dados mapeados.
     */
    private mapToDto(item: DynamoDBSubcategoryItem): SubcategoryDto {
        return {
            categoryIdSubcategoryId: item['categoryId#subcategoryId']?.S,
            subcategoryId: item.subcategoryId?.S,
            name: item.name?.S,
            slug: item.slug?.S,
            description: item.description?.S,
            keywords: item.keywords?.S,
            title: item.title?.S,
        };
    }
}