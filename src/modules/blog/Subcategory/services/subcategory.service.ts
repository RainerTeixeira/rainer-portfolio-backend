import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AttributeValue } from '@aws-sdk/client-dynamodb'; // Adicionado para corrigir o erro TS2304

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
    seo?: { M?: Record<string, unknown> }; // Adicionado para corrigir o erro TS2339
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
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_SUBCATEGORIES_POSTS || 'Subcategories';
    private readonly logger = new Logger(SubcategoryService.name); // Adicionado logger

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
     * @returns {Promise<{ success: boolean; data: SubcategoryDto }>} Uma Promise que resolve para o DTO da subcategoria criada.
     * @throws {BadRequestException} Se `categoryId` ou `subcategoryId` não forem fornecidos no DTO.
     */
    @ApiOperation({ summary: 'Criar uma nova subcategoria' })
    @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    async createSubcategory(createSubcategoryDto: CreateSubcategoryDto): Promise<{ success: boolean; data: SubcategoryDto }> {
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
                seo: createSubcategoryDto.seo ? { M: createSubcategoryDto.seo } : undefined, // Verifica se `seo` existe
            },
        };

        await this.dynamoDbService.putItem(params);
        const subcategory = await this.getSubcategoryById(
            createSubcategoryDto.categoryId,
            createSubcategoryDto.subcategoryId
        );
        return { success: true, data: subcategory.data };
    }

    /**
     * @async
     * @method getAllSubcategories
     * @description Busca todas as subcategorias pertencentes a uma categoria específica no DynamoDB.
     * Utiliza a operação de `query` com um filtro para buscar subcategorias pelo `categoryId`.
     * @param {string} categoryId - ID da categoria para buscar as subcategorias.
     * @returns {Promise<{ success: boolean; data: SubcategoryDto[] }>} Uma Promise que resolve para um array de DTOs de subcategorias encontradas.
     */
    @ApiOperation({ summary: 'Buscar todas as subcategorias de uma categoria' })
    @ApiResponse({ status: 200, description: 'Lista de subcategorias retornada com sucesso.', type: [SubcategoryDto] })
    async getAllSubcategories(categoryId: string): Promise<{ success: boolean; data: SubcategoryDto[] }> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'begins_with(categoryId#subcategoryId, :categoryId)',
            ExpressionAttributeValues: { ':categoryId': { S: `${categoryId}#` } },
            ProjectionExpression: 'categoryId#subcategoryId, subcategoryId, name, slug, seo', // Retorna apenas os atributos necessários
        };

        const result = await this.dynamoDbService.query(params);
        const items = result.data.Items || [];
        const subcategories = items.map((item: DynamoDBSubcategoryItem) => this.mapToDto(item));
        return { success: true, data: subcategories };
    }

    /**
     * @async
     * @method getSubcategoryById
     * @description Busca uma subcategoria específica pelo ID da categoria e pelo ID da subcategoria.
     * @param {string} categoryId - ID da categoria da subcategoria.
     * @param {string} subcategoryId - ID da subcategoria a ser buscada.
     * @returns {Promise<{ success: boolean; data: SubcategoryDto }>} Uma Promise que resolve para o DTO da subcategoria encontrada.
     * @throws {NotFoundException} Se a subcategoria com o ID especificado não for encontrada na categoria.
     */
    @ApiOperation({ summary: 'Buscar uma subcategoria por ID' })
    @ApiResponse({ status: 200, description: 'Subcategoria retornada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async getSubcategoryById(categoryId: string, subcategoryId: string): Promise<{ success: boolean; data: SubcategoryDto }> {
        const subcategory = await this.findOne(categoryId, subcategoryId);
        return { success: true, data: subcategory };
    }

    /**
     * @async
     * @method getSubcategory
     * @description Alias para getSubcategoryById para compatibilidade.
     * @param {string} categoryId - ID da categoria.
     * @param {string} subcategoryId - ID da subcategoria.
     * @returns {Promise<{ success: boolean; data: SubcategoryDto }>} Uma Promise que resolve para o DTO da subcategoria encontrada.
     */
    async getSubcategory(categoryId: string, subcategoryId: string): Promise<{ success: boolean; data: SubcategoryDto }> {
        return this.getSubcategoryById(categoryId, subcategoryId);
    }

    /**
     * @async
     * @method updateSubcategory
     * @description Atualiza os dados de uma subcategoria existente no DynamoDB.
     * @param {string} categoryId - ID da categoria da subcategoria a ser atualizada.
     * @param {string} subcategoryId - ID da subcategoria a ser atualizada.
     * @param {UpdateSubcategoryDto} updateSubcategoryDto - DTO contendo os dados a serem atualizados na subcategoria.
     * @returns {Promise<{ success: boolean; data: SubcategoryDto }>} Uma Promise que resolve para o DTO da subcategoria atualizada.
     * @throws {NotFoundException} Se a subcategoria com os IDs especificados não for encontrada.
     */
    @ApiOperation({ summary: 'Atualizar uma subcategoria existente' })
    @ApiResponse({ status: 200, description: 'Subcategoria atualizada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    async updateSubcategory(
        categoryId: string,
        subcategoryId: string,
        updateSubcategoryDto: UpdateSubcategoryDto
    ): Promise<{ success: boolean; data: SubcategoryDto }> {
        await this.findOne(categoryId, subcategoryId);

        const updateData = this.mapDtoToDynamoAttributes(updateSubcategoryDto);

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateData);

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: `${categoryId}#${subcategoryId}` },
            },
            UpdateExpression: updateExpression.UpdateExpression,
            ExpressionAttributeNames: updateExpression.ExpressionAttributeNames,
            ExpressionAttributeValues: updateExpression.ExpressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(
            params.TableName,
            params.Key as Record<string, AttributeValue>,
            updateData,
            'ALL_NEW'
        );

        const attributes = result.data.Attributes;
        if (!attributes) {
            throw new NotFoundException(`Subcategoria '${subcategoryId}' na categoria '${categoryId}' não encontrada após atualização.`);
        }
        const updatedSubcategory = this.mapToDto(attributes as DynamoDBSubcategoryItem);
        return { success: true, data: updatedSubcategory };
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
        const categoryIdSubcategoryId = `${categoryId}#${subcategoryId}`; // Define a variável corretamente

        const params = {
            TableName: this.tableName,
            Key: {
                'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
            },
        };

        await this.dynamoDbService.deleteItem(params);
    }

    /**
     * Obtém todas as subcategorias.
     */
    async findAll(): Promise<{ success: boolean; data: SubcategoryDto[] }> {
        const params = {
            TableName: this.tableName,
        };

        const result = await this.dynamoDbService.scan(params);
        const items = result.data.Items || []; // Acesse `data` antes de `Items`
        const subcategories = items.map((item: DynamoDBSubcategoryItem) => this.mapToDto(item));
        return { success: true, data: subcategories };
    }

    /**
     * @async
     * @public
     * @method findOne
     * @description Busca uma subcategoria específica no DynamoDB usando a chave composta e o ID da subcategoria.
     * @param {string} categoryId - ID da categoria.
     * @param {string} subcategoryId - ID da subcategoria.
     * @returns {Promise<SubcategoryDto>} Uma Promise que resolve para o DTO da subcategoria encontrada.
     * @throws {NotFoundException} Se a subcategoria com os IDs especificados não for encontrada.
     */
    public async findOne(categoryId: string, subcategoryId: string): Promise<SubcategoryDto> {
        const compositeKey = `${categoryId}#${subcategoryId}`; // Concatenar a chave composta
        const params = {
            TableName: 'Subcategories',
            Key: {
                'categoryId#subcategoryId': { S: compositeKey }, // Usar a chave composta
            },
        };

        const result = await this.dynamoDbService.getItem(params);
        const item = result.data.Item; // Acesse `data` antes de `Item`
        if (!item) {
            throw new NotFoundException(`Subcategoria com ID '${subcategoryId}' não encontrada na categoria '${categoryId}'.`);
        }

        return this.mapSubcategoryFromDynamoDb(item);
    }

    /**
     * @async
     * @method getAllCategoryIdSubcategoryId
     * @description Retorna todas as combinações de `categoryId#subcategoryId` existentes na tabela.
     * @returns {Promise<string[]>} Uma lista de strings no formato `categoryId#subcategoryId`.
     */
    async getAllCategoryIdSubcategoryId(): Promise<string[]> {
        const params = {
            TableName: this.tableName,
            ProjectionExpression: 'categoryId#subcategoryId', // Retorna apenas o atributo necessário
        };

        const result = await this.dynamoDbService.scan(params);
        const items = result.data.Items || []; // Acesse `data` antes de `Items`

        // Mapeia os itens para extrair apenas o valor de `categoryId#subcategoryId`
        return items
            .map(item => item['categoryId#subcategoryId']?.S)
            .filter(Boolean); // Remove valores nulos ou indefinidos
    }

    /**
     * Obtém uma subcategoria pelo slug.
     * @param slug - Slug da subcategoria.
     * @returns A subcategoria encontrada.
     * @throws NotFoundException Se a subcategoria não for encontrada.
     */
    async getSubcategoryBySlug(slug: string): Promise<{ success: boolean; data: SubcategoryDto }> {
        const params = {
            TableName: this.tableName,
            IndexName: 'slug-index', // Usa o índice criado
            KeyConditionExpression: 'slug = :slug',
            ExpressionAttributeValues: { ':slug': { S: slug } },
            ProjectionExpression: 'categoryId#subcategoryId, subcategoryId, name, slug, seo', // Retorna apenas os atributos necessários
        };

        const result = await this.dynamoDbService.query(params);
        const items = result.data.Items || [];
        if (items.length === 0) {
            throw new NotFoundException(`Subcategoria com slug '${slug}' não encontrada.`);
        }
        const subcategory = this.mapToDto(items[0]);
        return { success: true, data: subcategory };
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
            categoryIdSubcategoryId: item['categoryId#subcategoryId']?.S || '',
            subcategoryId: item.subcategoryId?.S || '',
            name: item.name?.S || '',
            slug: item.slug?.S || '',
            description: item.description?.S || '', // Adicionado para suportar o campo description
            keywords: item.keywords?.S,
            title: item.title?.S,
            seo: item.seo?.M ? (item.seo.M as Record<string, unknown>) : undefined, // Corrigido para verificar se `seo` existe
        };
    }

    /**
     * @private
     * @method mapToSubcategoryDto
     * @description Mapeia um item retornado do DynamoDB para um objeto SubcategoryDto.
     * @param {Record<string, unknown>} item - Item retornado do DynamoDB.
     * @returns {SubcategoryDto} Objeto SubcategoryDto com os dados mapeados.
     */
    private mapToSubcategoryDto(item: Record<string, unknown>): SubcategoryDto {
        return {
            categoryIdSubcategoryId: item['categoryId#subcategoryId'] as string,
            subcategoryId: item.subcategoryId as string,
            name: item.name as string,
            slug: item.slug as string,
            seo: item.seo as Record<string, unknown>,
        };
    }

    /**
     * Mapeia um item do DynamoDB para um SubcategoryDto.
     * @param item - Item do DynamoDB.
     * @returns O SubcategoryDto mapeado.
     */
    private mapSubcategoryFromDynamoDb(item: Record<string, AttributeValue>): SubcategoryDto {
        const seo = item.seo?.M ? {
            canonical: item.seo.M.canonical?.S || '',
            description: item.seo.M.description?.S || '',
            keywords: item.seo.M.keywords?.SS || [],
            metaTitle: item.seo.M.metaTitle?.S || '',
            priority: item.seo.M.priority?.S || '',
        } : {};

        return {
            categoryIdSubcategoryId: item['categoryId#subcategoryId']?.S || '',
            subcategoryId: item.subcategoryId?.S || '',
            name: item.name?.S || '',
            slug: item.slug?.S || '',
            description: item.description?.S || '', // Adicionado para suportar o campo description
            seo,
        };
    }

    private mapDtoToDynamoAttributes(dto: UpdateSubcategoryDto): Record<string, AttributeValue> {
        const attributes: Record<string, AttributeValue> = {};
        if (dto.name) attributes['name'] = { S: dto.name };
        if (dto.slug) attributes['slug'] = { S: dto.slug };
        if (dto.description) attributes['description'] = { S: dto.description };
        if (dto.keywords) attributes['keywords'] = { S: dto.keywords };
        if (dto.title) attributes['title'] = { S: dto.title };
        if (dto.seo) {
            attributes['seo'] = {
                M: Object.entries(dto.seo).reduce<Record<string, AttributeValue>>((acc, [key, value]) => {
                    acc[key] = { S: value as string };
                    return acc;
                }, {}),
            };
        }
        return attributes;
    }
}