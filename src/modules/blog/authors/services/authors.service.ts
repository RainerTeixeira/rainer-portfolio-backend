// src/modules/blog/authors/services/authors.service.ts

/**
 * Serviço para gestão de autores no sistema
 * 
 * Responsabilidades principais:
 * - CRUD de autores
 * - Cache de dados
 * - Integração com DynamoDB
 * - Validação de dados
 * 
 * Estratégias chave:
 * - Cache em dois níveis (individual e lista completa)
 * - Operações atômicas com tratamento de erros específicos
 * - Mapeamento seguro entre DTOs e DynamoDB
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
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { DynamoDbService, DynamoDBOperationError } from '@src/services/dynamoDb.service';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { AuthorDetailDto } from '../dto/author-detail.dto';

@Injectable()
export class AuthorsService {
    private readonly logger = new Logger(AuthorsService.name);
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_AUTHORS || 'Authors';
    private readonly cacheTtl = 300; // 5 minutos em segundos

    constructor(
        private readonly dynamoDb: DynamoDbService,
        @Inject(CACHE_MANAGER) private cache: Cache,
    ) { }

    // --- Operações CRUD Principais ---

    /**
     * Cria um novo autor no sistema
     * 
     * Fluxo principal:
     * 1. Validação implícita via DTO
     * 2. Conversão para formato DynamoDB
     * 3. Inserção atômica com verificação de duplicidade
     * 4. Atualização de cache
     * 
     * @param dto Dados do autor a ser criado
     * @returns Autor criado com dados completos
     * @throws BadRequestException se o autor já existir
     * @throws InternalServerErrorException para erros inesperados
     */
    async create(dto: CreateAuthorDto): Promise<AuthorDetailDto> {
        try {
            // Operação atômica com verificação de existência
            await this.dynamoDb.putItem({
                TableName: this.tableName,
                Item: this.mapToDynamoItem(dto),
                ConditionExpression: 'attribute_not_exists(authorId)'
            });

            // Invalida cache de lista
            await this.clearListCache();

            // Retorna o novo autor com cache warm-up
            return this.getAuthorById(dto.authorId);
        } catch (error) {
            this.handleDynamoError(error, `create-${dto.authorId}`);
        }
    }

    /**
     * Lista todos os autores com estratégia de cache
     * 
     * Otimizações:
     * - Projeção de campos para reduzir transferência de dados
     * - Cache de lista completa com TTL configurável
     * 
     * @returns Lista de autores formatados
     * @throws InternalServerErrorException para erros de banco de dados
     */
    async findAll(): Promise<AuthorDetailDto[]> {
        const cacheKey = 'authors_all';
        try {
            // Tenta obter do cache primeiro
            const cached = await this.cache.get<AuthorDetailDto[]>(cacheKey);
            if (cached) return cached;

            // Scan com projeção otimizada
            const result = await this.dynamoDb.scan({
                TableName: this.tableName,
                ProjectionExpression: 'authorId, #name, slug, socialProof',
                ExpressionAttributeNames: { '#name': 'name' }
            });

            // Mapeamento e filtro de dados inválidos
            const authors = (result.data.Items || [])
                .map(item => AuthorDetailDto.fromDynamoDB(item as Record<string, AttributeValue>))
                .filter((author): author is AuthorDetailDto => author !== null);

            // Atualiza cache com nova lista
            await this.cache.set(cacheKey, authors, this.cacheTtl);
            return authors;
        } catch (error) {
            this.handleDynamoError(error, 'findAll');
        }
    }

    /**
     * Obtém um autor específico por ID
     * 
     * Estratégias:
     * - Cache individual com TTL
     * - Validação de formato de ID
     * 
     * @param authorId ID único do autor (UUID)
     * @returns Detalhes completos do autor
     * @throws BadRequestException para IDs inválidos
     * @throws NotFoundException se o autor não existir
     */
    async findOne(authorId: string): Promise<AuthorDetailDto> {
        if (!this.isValidId(authorId)) {
            throw new BadRequestException('Formato de ID do autor inválido');
        }
        return this.getAuthorById(authorId);
    }

    /**
     * Atualiza parcialmente um autor existente
     * 
     * Funcionamento:
     * 1. Validação de ID
     * 2. Construção dinâmica da query
     * 3. Atualização atômica
     * 4. Invalidação de cache
     * 
     * @param authorId ID do autor a ser atualizado
     * @param dto Campos para atualização
     * @returns Autor atualizado
     * @throws NotFoundException se o autor não existir
     */
    async update(authorId: string, dto: UpdateAuthorDto): Promise<AuthorDetailDto> {
        if (!this.isValidId(authorId)) {
            throw new BadRequestException('ID do autor inválido');
        }

        try {
            // Construção dinâmica da query
            const updateExpression = this.buildUpdateExpression(dto);
            const expressionAttributes = this.buildExpressionAttributes(dto);
            const attributeNames = this.buildExpressionAttributeNames(dto);

            // Operação de update atômica
            await this.dynamoDb.updateItem({
                TableName: this.tableName,
                Key: { authorId: { S: authorId } },
                UpdateExpression: updateExpression,
                ExpressionAttributeNames: attributeNames,
                ExpressionAttributeValues: expressionAttributes,
                ReturnValues: 'ALL_NEW'
            });

            // Invalida caches relevantes
            await this.clearCache(authorId);

            // Retorna dados atualizados
            return this.getAuthorById(authorId);
        } catch (error) {
            this.handleDynamoError(error, `update-${authorId}`);
        }
    }

    /**
     * Remove um autor do sistema
     * 
     * Considerações:
     * - Operação irreversível
     * - Limpeza de cache imediata
     * 
     * @param authorId ID do autor a ser removido
     * @throws NotFoundException se o autor não existir
     */
    async remove(authorId: string): Promise<void> {
        if (!this.isValidId(authorId)) {
            throw new BadRequestException('ID do autor inválido');
        }

        try {
            await this.dynamoDb.deleteItem({
                TableName: this.tableName,
                Key: { authorId: { S: authorId } }
            });

            await this.clearCache(authorId);
        } catch (error) {
            this.handleDynamoError(error, `remove-${authorId}`);
        }
    }

    // --- Métodos Auxiliares ---

    /**
     * Obtém um autor com cache layer
     * 
     * Fluxo:
     * 1. Verifica cache
     * 2. Busca no DynamoDB se necessário
     * 3. Atualiza cache
     * 
     * @param authorId ID do autor
     * @private
     */
    private async getAuthorById(authorId: string): Promise<AuthorDetailDto> {
        const cacheKey = this.cacheKey(authorId);
        try {
            // Tenta obter do cache primeiro
            const cached = await this.cache.get<AuthorDetailDto>(cacheKey);
            if (cached) return cached;

            // Operação de leitura no DynamoDB
            const result = await this.dynamoDb.getItem({
                TableName: this.tableName,
                Key: { authorId: { S: authorId } }
            });

            if (!result.data.Item) {
                throw new NotFoundException(`Autor ${authorId} não encontrado`);
            }

            // Conversão e validação do DTO
            const author = AuthorDetailDto.fromDynamoDB(result.data.Item);
            if (!author) {
                throw new InternalServerErrorException('Formato de dados inválido do banco');
            }

            // Warm-up do cache
            await this.cache.set(cacheKey, author, this.cacheTtl);
            return author;
        } catch (error) {
            this.handleDynamoError(error, `getAuthorById-${authorId}`);
        }
    }

    /**
     * Valida o formato do ID do autor
     * 
     * @param authorId ID a ser validado
     * @returns true se válido
     * @private
     */
    private isValidId(authorId: string): boolean {
        return typeof authorId === 'string' && authorId.trim().length > 0;
    }

    /**
     * Tratamento centralizado de erros do DynamoDB
     * 
     * @param error Objeto de erro original
     * @param context Contexto da operação
     * @private
     */
    private handleDynamoError(error: any, context: string): never {
        this.logger.error(`[${context}] ${error.message}`, error.stack);

        if (error instanceof DynamoDBOperationError) {
            switch (error.context.originalError) {
                case 'ConditionalCheckFailedException':
                    throw new BadRequestException('Conflito: Autor já existe');
                case 'ResourceNotFoundException':
                    throw new NotFoundException('Recurso não encontrado');
                case 'ValidationException':
                    throw new BadRequestException('Parâmetros inválidos na requisição');
            }
        }

        throw new InternalServerErrorException(`Falha na operação: ${context}`);
    }

    /**
     * Converte DTO para formato DynamoDB
     * 
     * @param dto DTO de entrada
     * @returns Item formatado para DynamoDB
     * @private
     */
    private mapToDynamoItem(dto: CreateAuthorDto | UpdateAuthorDto): Record<string, AttributeValue> {
        const item: Record<string, AttributeValue> = {};

        // Mapeamento de campos com sanitização
        if ('authorId' in dto) item.authorId = { S: dto.authorId };
        if (dto.name) item.name = { S: dto.name.trim() };
        if (dto.slug) item.slug = { S: dto.slug.trim() };

        // Conversão de objetos aninhados
        if (dto.socialProof) {
            item.socialProof = {
                M: Object.entries(dto.socialProof).reduce((acc, [key, value]) => {
                    acc[key] = { S: value.toString().trim() };
                    return acc;
                }, {})
            };
        }

        return item;
    }

    /**
     * Constrói expressão de atualização dinâmica
     * 
     * @param dto DTO com campos para atualizar
     * @returns Expressão SET para DynamoDB
     * @private
     */
    private buildUpdateExpression(dto: UpdateAuthorDto): string {
        const updates: string[] = [];
        if (dto.name) updates.push('#name = :name');
        if (dto.slug) updates.push('#slug = :slug');
        if (dto.socialProof) updates.push('socialProof = :socialProof');

        return `SET ${updates.join(', ')}`;
    }

    /**
     * Mapeia nomes de atributos para evitar conflitos
     * 
     * @param dto DTO de atualização
     * @returns Mapa de nomes de atributos
     * @private
     */
    private buildExpressionAttributeNames(dto: UpdateAuthorDto): Record<string, string> {
        const names: Record<string, string> = {};
        if (dto.name) names['#name'] = 'name';
        if (dto.slug) names['#slug'] = 'slug';
        return names;
    }

    /**
     * Constrói valores para expressões DynamoDB
     * 
     * @param dto DTO de atualização
     * @returns Valores formatados
     * @private
     */
    private buildExpressionAttributes(dto: UpdateAuthorDto): Record<string, AttributeValue> {
        const attributes: Record<string, AttributeValue> = {};

        if (dto.name) attributes[':name'] = { S: dto.name };
        if (dto.slug) attributes[':slug'] = { S: dto.slug };
        if (dto.socialProof) {
            attributes[':socialProof'] = {
                M: Object.entries(dto.socialProof).reduce((acc, [k, v]) => {
                    acc[k] = { S: v };
                    return acc;
                }, {})
            };
        }

        return attributes;
    }

    // --- Gerenciamento de Cache ---

    /**
     * Gera chave de cache para autor individual
     * 
     * @param authorId ID do autor
     * @returns Chave de cache formatada
     * @private
     */
    private cacheKey(authorId: string): string {
        return `author_${authorId}`;
    }

    /**
     * Limpa cache relacionado a um autor específico
     * 
     * @param authorId ID do autor
     * @private
     */
    private async clearCache(authorId: string): Promise<void> {
        await Promise.all([
            this.cache.del(this.cacheKey(authorId)),
            this.cache.del('authors_all')
        ]);
    }

    /**
     * Limpa cache da lista completa de autores
     * 
     * @private
     */
    private async clearListCache(): Promise<void> {
        await this.cache.del('authors_all');
    }
}