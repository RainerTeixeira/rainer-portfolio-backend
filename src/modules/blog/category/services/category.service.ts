// src/modules/blog/category/services/category.service.ts

/**
 * Serviço para gestão de categorias no sistema
 *
 * Responsabilidades principais:
 * - CRUD de categorias
 * - Cache de dados
 * - Integração com DynamoDB via DynamoDbService centralizado
 * - Validação de dados e tratamento de erros padronizado
 *
 * Estratégias chave:
 * - Cache em dois níveis (individual e lista completa)
 * - Operações atômicas com tratamento de erros específicos via DynamoDbService
 * - Mapeamento seguro entre DTOs e itens DynamoDB (DocumentClient)
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Inject,
    Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DynamoDbService, DynamoDBOperationError } from '@src/services/dynamoDb.service'; // Ajuste o path conforme necessário
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryDto } from '../dto/category.dto';
import { CategorySeoDto } from '../dto/category-seo.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('category')
@Injectable()
export class CategoryService {
    private readonly logger = new Logger(CategoryService.name);
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_CATEGORIES || 'Category';
    private readonly cacheTtl = 300; // 5 minutos em segundos

    constructor(
        private readonly dynamoDbService: DynamoDbService,
        @Inject(CACHE_MANAGER) private cache: Cache,
    ) { }

    // --- Operações CRUD Principais ---

    /**
     * Cria uma nova categoria no sistema.
     *
     * Fluxo principal:
     * 1. Validação implícita via DTO (pelo Controller/Framework).
     * 2. Conversão para formato DynamoDB (DocumentClient).
     * 3. Inserção atômica com verificação de duplicidade.
     * 4. Atualização de cache (invalida lista).
     * 5. Retorna a categoria criada (buscando-a para garantir consistência e cache).
     *
     * @param dto Dados da categoria a ser criada.
     * @returns Categoria criada com dados completos.
     * @throws BadRequestException se a categoria já existir ou dados inválidos.
     * @throws InternalServerErrorException para erros inesperados do DynamoDB.
     */
    @ApiOperation({ summary: 'Criar uma nova categoria' })
    @ApiResponse({ status: 201, description: 'A categoria foi criada com sucesso.', type: CategoryDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou categoria já existe.' })
    async create(dto: CreateCategoryDto): Promise<CategoryDto> {
        // O ID deve ser único, gerado antes ou validado se necessário
        if (!this.isValidId(dto.categoryId)) {
            throw new BadRequestException('Formato de ID da categoria inválido');
        }

        try {
            // Prepara o item para o DocumentClient (sem tipos explícitos S, M, etc.)
            const itemToCreate = this.mapCreateDtoToDynamoItem(dto);

            await this.dynamoDbService.put({
                TableName: this.tableName,
                Item: itemToCreate,
                ConditionExpression: 'attribute_not_exists(categoryId)', // Garante unicidade
            });

            // Invalida o cache da lista completa
            await this.clearListCache();

            // Busca a categoria recém-criada para retornar e aquecer o cache individual
            // Usar o helper que já lida com cache e NotFound
            return this.getCategoryByIdWithCache(dto.categoryId);

        } catch (error) {
            this.handleDynamoError(error, `create-${dto.categoryId}`);
        }
    }

    /**
     * Lista todas as categorias com estratégia de cache.
     *
     * Otimizações:
     * - Cache de lista completa com TTL configurável.
     * - Projeção de campos para reduzir transferência de dados (opcional, mas recomendado).
     *
     * @returns Lista de categorias formatadas.
     * @throws InternalServerErrorException para erros de banco de dados.
     */
    @ApiOperation({ summary: 'Obter todas as categorias' })
    @ApiResponse({ status: 200, description: 'Retorna todas as categorias.', type: [CategoryDto] })
    async findAll(): Promise<CategoryDto[]> {
        const cacheKey = this.cacheListKey();
        try {
            const cached = await this.cache.get<CategoryDto[]>(cacheKey);
            if (cached) {
                this.logger.debug('Retornando lista de categorias do cache.');
                return cached;
            }

            this.logger.debug('Buscando lista de categorias do DynamoDB.');
            // Scan com projeção (opcional, mas bom para performance)
            const result = await this.dynamoDbService.scan({
                TableName: this.tableName,
                // Seleciona apenas os campos necessários
                ProjectionExpression: 'categoryId, #nm, slug, seo',
                ExpressionAttributeNames: {
                    '#nm': 'name' // 'name' é palavra reservada
                }
            });

            // Mapeia usando o método estático do DTO e filtra itens inválidos
            const categories = (result.data.Items || [])
                .map(item => CategoryDto.fromDynamoDbItem(item as Record<string, any>))
                .filter((category): category is CategoryDto => category !== null); // Type guard

            // Atualiza o cache
            await this.cache.set(cacheKey, categories, this.cacheTtl);
            return categories;

        } catch (error) {
            this.handleDynamoError(error, 'findAll');
        }
    }

    /**
     * Obtém uma categoria específica por ID, usando cache.
     *
     * Estratégias:
     * - Cache individual com TTL.
     * - Validação de formato de ID.
     *
     * @param categoryId ID único da categoria.
     * @returns Detalhes completos da categoria.
     * @throws BadRequestException para IDs inválidos.
     * @throws NotFoundException se a categoria não existir.
     * @throws InternalServerErrorException para erros inesperados.
     */
    @ApiOperation({ summary: 'Obter uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'Retorna a categoria.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    @ApiResponse({ status: 400, description: 'ID da categoria inválido.' })
    async findOne(categoryId: string): Promise<CategoryDto> {
        if (!this.isValidId(categoryId)) {
            throw new BadRequestException('Formato de ID da categoria inválido.');
        }
        // Utiliza o helper que já contém a lógica de cache e tratamento de não encontrado
        return this.getCategoryByIdWithCache(categoryId);
    }


    /**
     * Atualiza parcialmente uma categoria existente.
     *
     * Funcionamento:
     * 1. Validação de ID.
     * 2. Construção dinâmica da query de atualização (UpdateExpression).
     * 3. Atualização atômica no DynamoDB com verificação de existência.
     * 4. Invalidação de caches (individual e lista).
     * 5. Retorna a categoria atualizada.
     *
     * @param categoryId ID da categoria a ser atualizada.
     * @param dto Campos para atualização.
     * @returns Categoria atualizada.
     * @throws BadRequestException para ID inválido ou dados inválidos.
     * @throws NotFoundException se a categoria não existir.
     * @throws InternalServerErrorException para erros inesperados.
     */
    @ApiOperation({ summary: 'Atualizar uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'A categoria foi atualizada com sucesso.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    @ApiResponse({ status: 400, description: 'ID ou dados inválidos.' })
    async update(categoryId: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
        if (!this.isValidId(categoryId)) {
            throw new BadRequestException('ID da categoria inválido.');
        }

        // Não permite atualizar o categoryId
        if ('categoryId' in dto) {
            throw new BadRequestException('O ID da categoria não pode ser alterado.');
        }

        // Verifica se há algo para atualizar
        if (Object.keys(dto).length === 0) {
            throw new BadRequestException('Nenhum dado fornecido para atualização.');
        }


        try {
            // Constrói a expressão de atualização dinamicamente
            const updateExpression = this.buildUpdateExpression(dto);
            const expressionAttributeValues = this.buildExpressionAttributes(dto);
            const expressionAttributeNames = this.buildExpressionAttributeNames(dto); // Necessário se houver palavras reservadas

            const result = await this.dynamoDbService.update({
                TableName: this.tableName,
                Key: { categoryId: categoryId }, // DocumentClient usa o valor diretamente
                UpdateExpression: updateExpression,
                ExpressionAttributeValues: expressionAttributeValues,
                // Adicionar nomes apenas se necessário (ex: 'name')
                ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
                ConditionExpression: 'attribute_exists(categoryId)', // Garante que o item existe
                ReturnValues: 'ALL_NEW', // Retorna o item completo após a atualização
            });

            // Invalida os caches relevantes
            await this.clearCache(categoryId);

            // Mapeia o resultado retornado pelo DynamoDB
            const updatedAttributes = result.data.Attributes;
            if (!updatedAttributes) {
                this.logger.error(`[update-${categoryId}] UpdateItem retornou sucesso, mas sem Attributes.`);
                throw new InternalServerErrorException('Falha ao obter dados atualizados da categoria após a atualização.');
            }

            const updatedCategory = CategoryDto.fromDynamoDbItem(updatedAttributes as Record<string, any>);
            if (!updatedCategory) {
                this.logger.error(`[update-${categoryId}] Falha ao mapear Attributes retornados para CategoryDto: ${JSON.stringify(updatedAttributes)}`);
                throw new InternalServerErrorException('Formato de dados inválido retornado pelo banco após atualização.');
            }

            // Atualiza o cache individual com os novos dados
            await this.cache.set(this.cacheKey(categoryId), updatedCategory, this.cacheTtl);

            return updatedCategory;

        } catch (error) {
            // Se ConditionExpression falhar (item não existe), handleDynamoError mapeará para NotFound
            this.handleDynamoError(error, `update-${categoryId}`);
        }
    }

    /**
     * Remove uma categoria do sistema.
     *
     * Considerações:
     * - Operação irreversível.
     * - Limpeza de cache (individual e lista).
     * - Verifica a existência antes de tentar remover.
     *
     * @param categoryId ID da categoria a ser removida.
     * @returns void
     * @throws BadRequestException para ID inválido.
     * @throws NotFoundException se a categoria não existir.
     * @throws InternalServerErrorException para erros inesperados.
     */
    @ApiOperation({ summary: 'Deletar uma categoria por ID' })
    @ApiResponse({ status: 204, description: 'A categoria foi deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    @ApiResponse({ status: 400, description: 'ID da categoria inválido.' })
    async remove(categoryId: string): Promise<void> {
        if (!this.isValidId(categoryId)) {
            throw new BadRequestException('ID da categoria inválido.');
        }

        try {
            await this.dynamoDbService.getdelete({
                TableName: this.tableName,
                Key: { categoryId: categoryId },
                ConditionExpression: 'attribute_exists(categoryId)', // Garante que existe antes de deletar
            });

            // Limpa os caches após a remoção bem-sucedida
            await this.clearCache(categoryId);
            this.logger.log(`Categoria ${categoryId} removida e caches limpos.`);

        } catch (error) {
            // Se ConditionExpression falhar (item não existe), handleDynamoError mapeará para NotFound
            this.handleDynamoError(error, `remove-${categoryId}`);
        }
    }

    // --- Métodos Auxiliares ---

    /**
     * Obtém uma categoria por ID com camada de cache. Uso interno.
     * @param categoryId ID da categoria.
     * @returns A categoria encontrada.
     * @throws NotFoundException se não encontrada após busca no DB.
     * @throws InternalServerErrorException para outros erros.
     * @private
     */
    private async getCategoryByIdWithCache(categoryId: string): Promise<CategoryDto> {
        const cacheKey = this.cacheKey(categoryId);
        try {
            const cached = await this.cache.get<CategoryDto>(cacheKey);
            if (cached) {
                this.logger.debug(`Retornando categoria ${categoryId} do cache.`);
                return cached;
            }

            this.logger.debug(`Buscando categoria ${categoryId} do DynamoDB.`);
            const result = await this.dynamoDbService.get({
                TableName: this.tableName,
                Key: { categoryId: categoryId }, // DocumentClient Key format
            });

            if (!result.data || !result.data.Item) {
                throw new NotFoundException(`Categoria com ID '${categoryId}' não encontrada.`);
            }

            // Mapeia o item do DynamoDB para o DTO
            const category = CategoryDto.fromDynamoDbItem(result.data.Item as Record<string, any>);
            if (!category) {
                // Log do item problemático pode ser útil aqui
                this.logger.error(`[getCategoryByIdWithCache-${categoryId}] Falha ao mapear Item retornado para CategoryDto: ${JSON.stringify(result.data.Item)}`);
                throw new InternalServerErrorException('Formato de dados inválido retornado pelo banco de dados.');
            }

            // Armazena no cache antes de retornar
            await this.cache.set(cacheKey, category, this.cacheTtl);
            return category;

        } catch (error) {
            // Se o erro já for NotFoundException, apenas relança
            if (error instanceof NotFoundException) {
                throw error;
            }
            // Para outros erros, usa o handler padronizado
            this.handleDynamoError(error, `getCategoryByIdWithCache-${categoryId}`);
        }
    }

    /**
     * Valida o formato básico do ID da categoria.
     * @param categoryId ID a ser validado.
     * @returns true se válido, false caso contrário.
     * @private
     */
    private isValidId(categoryId: string): boolean {
        // Adicione aqui validações mais específicas se necessário (ex: regex para UUID)
        return typeof categoryId === 'string' && categoryId.trim().length > 0;
    }

    /**
     * Tratamento centralizado de erros do DynamoDbService.
     * Mapeia erros comuns do DynamoDB para exceções HTTP apropriadas.
     * @param error Erro capturado (pode ser DynamoDBOperationError ou outro).
     * @param context String identificando a operação que falhou.
     * @throws Lança uma exceção NestJS (BadRequest, NotFound, InternalServer).
     * @private
     */
    private handleDynamoError(error: unknown, context: string): never {
        if (error instanceof DynamoDBOperationError) {
            this.logger.error(`[${context}] DynamoDB Operation Error: ${error.message}`, error.stack);
            this.logger.error(`[${context}] Original Error: ${error.context.originalError}`);
            this.logger.error(`[${context}] Params: ${JSON.stringify(error.context.params)}`);

            const originalErrorName = error.context.originalError; // O nome/código do erro original do AWS SDK

            switch (originalErrorName) {
                case 'ConditionalCheckFailedException':
                    // Pode significar "já existe" no create ou "não existe" no update/delete
                    if (context.startsWith('create')) {
                        throw new BadRequestException('Conflito: Categoria já existe.');
                    } else {
                        throw new NotFoundException(`Recurso não encontrado para operação ${context}. A condição falhou.`);
                    }
                case 'ResourceNotFoundException':
                    // Geralmente indica que a tabela não foi encontrada, mas pode ocorrer em outras situações
                    throw new NotFoundException(`Recurso (tabela ${this.tableName}?) não encontrado.`);
                case 'ValidationException':
                    // Erro nos parâmetros da requisição ao DynamoDB
                    throw new BadRequestException(`Erro de validação na requisição ao DynamoDB: ${error.message}`);
                case 'ItemCollectionSizeLimitExceededException':
                case 'ProvisionedThroughputExceededException':
                    // Erros relacionados a limites do DynamoDB
                    this.logger.warn(`[${context}] Limite do DynamoDB excedido: ${originalErrorName}`);
                    throw new InternalServerErrorException(`Serviço temporariamente sobrecarregado. Tente novamente mais tarde.`); // Ou um 503 Service Unavailable
                default:
                    this.logger.error(`[${context}] Erro DynamoDB não mapeado: ${originalErrorName}`);
                    throw new InternalServerErrorException(`Erro inesperado durante a operação de banco de dados (${context}).`);
            }
        } else if (error instanceof Error) {
            // Erros genéricos
            this.logger.error(`[${context}] Generic Error: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Erro interno no serviço (${context}): ${error.message}`);
        } else {
            // Erros desconhecidos
            this.logger.error(`[${context}] Unknown Error Type: ${String(error)}`);
            throw new InternalServerErrorException(`Erro interno desconhecido no serviço (${context}).`);
        }
    }


    // --- Mapeamento e Construção de Queries ---

    /**
     * Converte CreateCategoryDto para formato de item DynamoDB (DocumentClient).
     * @param dto DTO de criação.
     * @returns Item formatado para DynamoDBDocumentClient.
     * @private
     */
    private mapCreateDtoToDynamoItem(dto: CreateCategoryDto): Record<string, any> {
        const item: Record<string, any> = {
            categoryId: dto.categoryId,
            name: dto.name.trim(),
            slug: dto.slug.trim(),
            // DynamoDBDocumentClient lida com objetos aninhados diretamente
            seo: this.mapSeoDtoToObject(dto.seo)
        };
        // Remove chaves com valores undefined/null se necessário (DynamoDBDocumentClient faz isso com `removeUndefinedValues: true`)
        return item;
    }

    /**
     * Converte CategorySeoDto para um objeto simples para DynamoDB.
     * Remove campos undefined.
     * @param seoDto
     * @returns Objeto SEO limpo.
     * @private
     */
    private mapSeoDtoToObject(seoDto?: CategorySeoDto): Record<string, any> | undefined {
        if (!seoDto) return undefined;
        const seoObject: Record<string, any> = {};
        if (seoDto.canonical !== undefined) seoObject.canonical = seoDto.canonical;
        if (seoDto.description !== undefined) seoObject.description = seoDto.description;
        if (seoDto.keywords !== undefined) seoObject.keywords = seoDto.keywords;
        if (seoDto.metaTitle !== undefined) seoObject.metaTitle = seoDto.metaTitle;
        if (seoDto.priority !== undefined) seoObject.priority = seoDto.priority;
        return Object.keys(seoObject).length > 0 ? seoObject : undefined; // Retorna undefined se vazio
    }

    /**
     * Constrói a string UpdateExpression para o DynamoDB.
     * @param dto DTO com os campos a serem atualizados.
     * @returns String da expressão SET.
     * @private
     */
    private buildUpdateExpression(dto: UpdateCategoryDto): string {
        const updates: string[] = [];
        if (dto.name !== undefined) updates.push('#nm = :name'); // Usa alias #nm para 'name'
        if (dto.slug !== undefined) updates.push('#sl = :slug'); // Usa alias #sl para 'slug'
        if (dto.seo !== undefined) updates.push('seo = :seo'); // Atualiza o objeto seo inteiro

        // Adicione outros campos aqui se necessário

        if (updates.length === 0) {
            throw new BadRequestException("Nenhum campo válido para atualizar foi fornecido.");
        }

        return `SET ${updates.join(', ')}`;
    }

    /**
     * Constrói o objeto ExpressionAttributeNames para o DynamoDB UpdateItem.
     * Necessário para palavras reservadas como 'name', 'status', etc.
     * @param dto DTO com os campos a serem atualizados.
     * @returns Objeto de mapeamento de nomes.
     * @private
     */
    private buildExpressionAttributeNames(dto: UpdateCategoryDto): Record<string, string> {
        const names: Record<string, string> = {};
        if (dto.name !== undefined) names['#nm'] = 'name';
        if (dto.slug !== undefined) names['#sl'] = 'slug';
        // Adicione outros aliases se usar palavras reservadas
        return names;
    }

    /**
     * Constrói o objeto ExpressionAttributeValues para o DynamoDB UpdateItem.
     * @param dto DTO com os campos a serem atualizados.
     * @returns Objeto de mapeamento de valores.
     * @private
     */
    private buildExpressionAttributes(dto: UpdateCategoryDto): Record<string, any> {
        const values: Record<string, any> = {};
        if (dto.name !== undefined) values[':name'] = dto.name.trim();
        if (dto.slug !== undefined) values[':slug'] = dto.slug.trim();
        // Mapeia o objeto SEO inteiro se fornecido
        if (dto.seo !== undefined) {
            const mappedSeo = this.mapSeoDtoToObject(dto.seo);
            // Só adiciona se o mapeamento resultar em algo (evita setar :seo como undefined)
            if (mappedSeo !== undefined) {
                values[':seo'] = mappedSeo;
            }
            // Se dto.seo foi fornecido mas resultou em undefined (ex: objeto vazio),
            // pode ser necessário adicionar lógica para REMOVE o atributo seo se essa for a intenção.
            // Por simplicidade, aqui apenas atualizamos se houver conteúdo.
        }

        // Adicione outros campos aqui

        return values;
    }


    // --- Gerenciamento de Cache ---

    /** Gera a chave de cache para uma categoria individual. */
    private cacheKey(categoryId: string): string {
        return `category_${categoryId}`;
    }

    /** Gera a chave de cache para a lista completa de categorias. */
    private cacheListKey(): string {
        return 'categories_all';
    }

    /** Limpa o cache de uma categoria individual e o cache da lista. */
    private async clearCache(categoryId: string): Promise<void> {
        const individualKey = this.cacheKey(categoryId);
        const listKey = this.cacheListKey();
        this.logger.debug(`Limpando caches: ${individualKey}, ${listKey}`);
        await Promise.all([
            this.cache.del(individualKey),
            this.cache.del(listKey)
        ]);
    }

    /** Limpa apenas o cache da lista completa de categorias. */
    private async clearListCache(): Promise<void> {
        const listKey = this.cacheListKey();
        this.logger.debug(`Limpando cache da lista: ${listKey}`);
        await this.cache.del(listKey);
    }
}