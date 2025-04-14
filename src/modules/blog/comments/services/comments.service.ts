// src/modules/blog/comments/services/comments.service.ts

/**
 * Serviço para gestão de comentários no sistema
 *
 * Responsabilidades principais:
 * - CRUD de comentários
 * - Cache de dados (por post e individual)
 * - Integração com DynamoDB via DynamoDbService centralizado
 * - Validação de dados e tratamento de erros padronizado
 * - Geração de IDs e timestamps
 *
 * Estratégias chave:
 * - Cache de comentários por post e individualmente.
 * - Operações atômicas com tratamento de erros específicos via DynamoDbService.
 * - Mapeamento seguro entre DTOs e itens DynamoDB (DocumentClient).
 * - Uso de UUIDs para IDs de comentários.
 * - TTL para expiração automática.
 */
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Inject,
    Logger,
    ForbiddenException, // Para casos de permissão (ex: tentar editar comentário de outro autor)
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { DynamoDbService, DynamoDBOperationError } from '@src/services/dynamoDb.service'; // Ajuste o path
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CommentDto } from '../dto/comment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// Constante para o nome do índice GSI, se usado
// const STATUS_DATE_INDEX = 'status-date-index';

@ApiTags('comments')
@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_COMMENTS || 'Comments';
    private readonly cacheTtl = 300; // Cache de 5 minutos (em segundos)
    private readonly commentTtlDays = 7; // Tempo de vida do comentário em dias

    constructor(
        private readonly dynamoDbService: DynamoDbService,
        @Inject(CACHE_MANAGER) private cache: Cache,
    ) { }

    // --- Operações CRUD Principais ---

    /**
     * Cria um novo comentário para um post.
     * Gera commentId, date, status inicial e TTL.
     *
     * @param dto Dados do comentário a ser criado (postId, authorId, content).
     * @returns O comentário criado.
     * @throws BadRequestException para dados inválidos.
     * @throws InternalServerErrorException para erros inesperados.
     */
    @ApiOperation({ summary: 'Cria um novo comentário' })
    @ApiResponse({ status: 201, description: 'Comentário criado com sucesso.', type: CommentDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    async create(dto: CreateCommentDto): Promise<CommentDto> {
        const commentId = uuidv4(); // Gera um ID único
        const currentDate = new Date().toISOString(); // Data atual em ISO 8601
        const initialStatus = 'pending'; // Status inicial padrão
        const ttlTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * this.commentTtlDays; // TTL em segundos

        const itemToCreate = {
            postId: dto.postId,
            commentId: commentId,
            authorId: dto.authorId,
            content: dto.content,
            date: currentDate,
            status: initialStatus,
            ttl: ttlTimestamp,
        };

        try {
            this.logger.log(`Criando comentário para post ${dto.postId} por autor ${dto.authorId}`);
            await this.dynamoDbService.putItem({
                TableName: this.tableName,
                Item: itemToCreate,
                // ConditionExpression: 'attribute_not_exists(commentId)' // Garante unicidade (UUID já é altamente único)
            });

            // Limpa o cache de comentários para este post
            await this.clearPostCommentsCache(dto.postId);

            // Retorna o comentário recém-criado (buscando-o para popular cache individual)
            // Não é estritamente necessário buscar novamente se o itemToCreate já é o DTO completo,
            // mas buscar garante consistência e preenche o cache individual.
            // Vamos mapear diretamente e colocar no cache, evitando uma leitura extra
            const createdCommentDto = CommentDto.fromDynamoDbItem(itemToCreate);
            if (!createdCommentDto) {
                this.logger.error(`Falha ao mapear o item recém-criado: ${JSON.stringify(itemToCreate)}`);
                throw new InternalServerErrorException("Erro ao processar o comentário criado.");
            }
            await this.cache.set(this.cacheKey(dto.postId, commentId), createdCommentDto, this.cacheTtl);
            return createdCommentDto;
            // return this.getCommentByIdWithCache(dto.postId, commentId); // Alternativa com re-fetch

        } catch (error) {
            this.handleDynamoError(error, `create-comment-post-${dto.postId}`);
        }
    }

    /**
     * Lista todos os comentários de um post específico, com cache.
     *
     * @param postId ID do post cujos comentários serão listados.
     * @returns Lista de comentários formatados.
     * @throws InternalServerErrorException para erros de banco de dados.
     */
    @ApiOperation({ summary: 'Obtém todos os comentários de um post' })
    @ApiResponse({ status: 200, description: 'Lista de comentários do post.', type: [CommentDto] })
    async findAllByPostId(postId: string): Promise<CommentDto[]> {
        if (!this.isValidId(postId)) {
            throw new BadRequestException('ID do post inválido.');
        }
        const cacheKey = this.cacheKeyForPostComments(postId);
        try {
            const cached = await this.cache.get<CommentDto[]>(cacheKey);
            if (cached) {
                this.logger.debug(`Retornando comentários do post ${postId} do cache.`);
                return cached;
            }

            this.logger.debug(`Buscando comentários do post ${postId} do DynamoDB.`);
            const result = await this.dynamoDbService.query({
                TableName: this.tableName,
                KeyConditionExpression: 'postId = :postIdVal',
                ExpressionAttributeValues: {
                    ':postIdVal': postId, // DocumentClient syntax
                },
                // ProjectionExpression: 'postId, commentId, authorId, content, #dt, #st', // Opcional: otimizar payload
                // ExpressionAttributeNames: { '#dt': 'date', '#st': 'status' } // Se usar ProjectionExpression com palavras reservadas
            });

            const comments = (result.data.Items || [])
                .map(item => CommentDto.fromDynamoDbItem(item as Record<string, any>))
                .filter((comment): comment is CommentDto => comment !== null);

            // Ordenar por data, se necessário (mais recente primeiro)
            comments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


            await this.cache.set(cacheKey, comments, this.cacheTtl);
            return comments;

        } catch (error) {
            this.handleDynamoError(error, `findAllByPostId-${postId}`);
        }
    }

    /**
     * Obtém um comentário específico por ID do post e ID do comentário, usando cache.
     *
     * @param postId ID do post.
     * @param commentId ID do comentário.
     * @returns Detalhes completos do comentário.
     * @throws BadRequestException para IDs inválidos.
     * @throws NotFoundException se o comentário não existir.
     */
    @ApiOperation({ summary: 'Obtém um comentário específico por ID' })
    @ApiResponse({ status: 200, description: 'Retorna o comentário.', type: CommentDto })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    @ApiResponse({ status: 400, description: 'IDs inválidos.' })
    async findOne(postId: string, commentId: string): Promise<CommentDto> {
        if (!this.isValidId(postId) || !this.isValidId(commentId)) {
            throw new BadRequestException('ID do post ou do comentário inválido.');
        }
        return this.getCommentByIdWithCache(postId, commentId);
    }

    /**
     * Atualiza um comentário existente.
     * Permite atualizar 'content' e 'status'.
     *
     * @param postId ID do post.
     * @param commentId ID do comentário a ser atualizado.
     * @param dto Dados para atualização.
     * @param requestingAuthorId (Opcional) ID do autor que está fazendo a requisição, para verificação de permissão.
     * @returns Comentário atualizado.
     * @throws BadRequestException para IDs ou dados inválidos.
     * @throws NotFoundException se o comentário não existir.
     * @throws ForbiddenException se o autor não tiver permissão.
     * @throws InternalServerErrorException para erros inesperados.
     */
    @ApiOperation({ summary: 'Atualiza um comentário' })
    @ApiResponse({ status: 200, description: 'Comentário atualizado com sucesso.', type: CommentDto })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    @ApiResponse({ status: 400, description: 'IDs ou dados inválidos.' })
    @ApiResponse({ status: 403, description: 'Sem permissão para atualizar este comentário.' })
    async update(postId: string, commentId: string, dto: UpdateCommentDto, requestingAuthorId?: string): Promise<CommentDto> {
        if (!this.isValidId(postId) || !this.isValidId(commentId)) {
            throw new BadRequestException('ID do post ou do comentário inválido.');
        }
        if (Object.keys(dto).length === 0) {
            throw new BadRequestException('Nenhum dado fornecido para atualização.');
        }

        // 1. Verificar se o comentário existe (e obter o authorId para verificação de permissão)
        const existingComment = await this.getCommentByIdWithCache(postId, commentId); // Já trata NotFound
        if (requestingAuthorId && existingComment.authorId !== requestingAuthorId) {
            // Adicionar lógica aqui se apenas o autor original (ou admin) pode editar
            // throw new ForbiddenException('Você não tem permissão para editar este comentário.');
        }


        try {
            // Constrói a expressão de atualização dinamicamente
            const updateExpressionParts: string[] = [];
            const expressionAttributeValues: Record<string, any> = {};
            const expressionAttributeNames: Record<string, string> = {}; // Para palavras reservadas

            if (dto.content !== undefined) {
                updateExpressionParts.push('#cont = :contentVal');
                expressionAttributeNames['#cont'] = 'content';
                expressionAttributeValues[':contentVal'] = dto.content;
            }
            if (dto.status !== undefined) {
                updateExpressionParts.push('#stat = :statusVal');
                expressionAttributeNames['#stat'] = 'status';
                expressionAttributeValues[':statusVal'] = dto.status;
            }

            if (updateExpressionParts.length === 0) {
                throw new BadRequestException("Nenhum campo válido para atualizar foi fornecido no DTO.");
            }
            const updateExpression = `SET ${updateExpressionParts.join(', ')}`;


            const result = await this.dynamoDbService.updateItem({
                TableName: this.tableName,
                Key: { postId: postId, commentId: commentId },
                UpdateExpression: updateExpression,
                ExpressionAttributeNames: expressionAttributeNames, // Inclui os aliases
                ExpressionAttributeValues: expressionAttributeValues,
                ConditionExpression: 'attribute_exists(commentId)', // Garante que ainda existe
                ReturnValues: 'ALL_NEW',
            });

            // Invalida os caches relevantes
            await this.clearCache(postId, commentId);

            const updatedAttributes = result.data.Attributes;
            if (!updatedAttributes) {
                this.logger.error(`[update-${commentId}] UpdateItem retornou sucesso, mas sem Attributes.`);
                throw new InternalServerErrorException('Falha ao obter dados atualizados do comentário após a atualização.');
            }

            const updatedComment = CommentDto.fromDynamoDbItem(updatedAttributes as Record<string, any>);
            if (!updatedComment) {
                this.logger.error(`[update-${commentId}] Falha ao mapear Attributes retornados para CommentDto: ${JSON.stringify(updatedAttributes)}`);
                throw new InternalServerErrorException('Formato de dados inválido retornado pelo banco após atualização.');
            }

            // Atualiza o cache individual com os novos dados
            await this.cache.set(this.cacheKey(postId, commentId), updatedComment, this.cacheTtl);

            return updatedComment;

        } catch (error) {
            this.handleDynamoError(error, `update-comment-${commentId}`);
        }
    }

    /**
     * Remove um comentário.
     *
     * @param postId ID do post.
     * @param commentId ID do comentário a ser removido.
     * @param requestingAuthorId (Opcional) ID do autor que está fazendo a requisição, para verificação de permissão.
     * @returns void
     * @throws BadRequestException para IDs inválidos.
     * @throws NotFoundException se o comentário não existir.
     * @throws ForbiddenException se o autor não tiver permissão.
     * @throws InternalServerErrorException para erros inesperados.
     */
    @ApiOperation({ summary: 'Remove um comentário' })
    @ApiResponse({ status: 204, description: 'Comentário removido com sucesso.' })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    @ApiResponse({ status: 400, description: 'IDs inválidos.' })
    @ApiResponse({ status: 403, description: 'Sem permissão para remover este comentário.' })
    async remove(postId: string, commentId: string, requestingAuthorId?: string): Promise<void> {
        if (!this.isValidId(postId) || !this.isValidId(commentId)) {
            throw new BadRequestException('ID do post ou do comentário inválido.');
        }

        // 1. Verificar se o comentário existe (e obter o authorId para verificação de permissão)
        // Usar findOne que já tem cache e tratamento de erro
        const existingComment = await this.findOne(postId, commentId);
        if (requestingAuthorId && existingComment.authorId !== requestingAuthorId) {
            // Adicionar lógica aqui se apenas o autor original (ou admin) pode remover
            // throw new ForbiddenException('Você não tem permissão para remover este comentário.');
        }

        try {
            this.logger.log(`Removendo comentário ${commentId} do post ${postId}`);
            await this.dynamoDbService.deleteItem({
                TableName: this.tableName,
                Key: { postId: postId, commentId: commentId },
                ConditionExpression: 'attribute_exists(commentId)', // Garante que existe
            });

            // Limpa os caches após a remoção bem-sucedida
            await this.clearCache(postId, commentId);
            this.logger.log(`Comentário ${commentId} removido e caches limpos.`);

        } catch (error) {
            this.handleDynamoError(error, `remove-comment-${commentId}`);
        }
    }

    // --- Métodos para Consultas Específicas (Ex: GSI) ---

    // Exemplo: Buscar comentários por status usando um GSI
    // async findByStatus(status: string): Promise<CommentDto[]> { ... }
    // Lembre-se de adicionar cache e tratamento de erro similar a findAllByPostId

    // --- Métodos Auxiliares ---

    /**
     * Obtém um comentário por ID com camada de cache. Uso interno.
     * @param postId ID do post.
     * @param commentId ID do comentário.
     * @returns O comentário encontrado.
     * @throws NotFoundException se não encontrado após busca no DB.
     * @throws InternalServerErrorException para outros erros.
     * @private
     */
    private async getCommentByIdWithCache(postId: string, commentId: string): Promise<CommentDto> {
        const cacheKey = this.cacheKey(postId, commentId);
        try {
            const cached = await this.cache.get<CommentDto>(cacheKey);
            if (cached) {
                this.logger.debug(`Retornando comentário ${commentId} (post ${postId}) do cache.`);
                return cached;
            }

            this.logger.debug(`Buscando comentário ${commentId} (post ${postId}) do DynamoDB.`);
            const result = await this.dynamoDbService.getItem({
                TableName: this.tableName,
                Key: { postId: postId, commentId: commentId }, // DocumentClient Key format
            });

            if (!result.data || !result.data.Item) {
                throw new NotFoundException(`Comentário com ID '${commentId}' não encontrado no post '${postId}'.`);
            }

            const comment = CommentDto.fromDynamoDbItem(result.data.Item as Record<string, any>);
            if (!comment) {
                this.logger.error(`[getCommentByIdWithCache-${commentId}] Falha ao mapear Item retornado para CommentDto: ${JSON.stringify(result.data.Item)}`);
                throw new InternalServerErrorException('Formato de dados inválido retornado pelo banco de dados.');
            }

            await this.cache.set(cacheKey, comment, this.cacheTtl);
            return comment;

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.handleDynamoError(error, `getCommentByIdWithCache-${commentId}`);
        }
    }

    /** Valida formato básico de ID. */
    private isValidId(id: string): boolean {
        return typeof id === 'string' && id.trim().length > 0;
        // Adicionar validação de UUID se commentId for sempre UUID
        // if (isUUID(id)) return true; else return false;
    }

    /** Tratamento centralizado de erros do DynamoDbService. */
    private handleDynamoError(error: unknown, context: string): never {
        if (error instanceof DynamoDBOperationError) {
            this.logger.error(`[${context}] DynamoDB Operation Error: ${error.message}`, error.stack);
            this.logger.error(`[${context}] Original Error: ${error.context.originalError}`);
            this.logger.error(`[${context}] Params: ${JSON.stringify(error.context.params)}`);

            const originalErrorName = error.context.originalError;

            switch (originalErrorName) {
                case 'ConditionalCheckFailedException':
                    throw new NotFoundException(`Operação falhou: O comentário alvo não foi encontrado ou a condição não foi satisfeita (${context}).`);
                case 'ResourceNotFoundException':
                    throw new NotFoundException(`Recurso (tabela ${this.tableName}?) não encontrado.`);
                case 'ValidationException':
                    throw new BadRequestException(`Erro de validação na requisição ao DynamoDB: ${error.message}`);
                case 'ProvisionedThroughputExceededException':
                case 'ThrottlingException':
                    this.logger.warn(`[${context}] Throttling/Limite do DynamoDB excedido: ${originalErrorName}`);
                    // Considerar Retry aqui ou retornar um erro 503
                    throw new InternalServerErrorException(`Serviço temporariamente sobrecarregado. Tente novamente mais tarde.`);
                default:
                    this.logger.error(`[${context}] Erro DynamoDB não mapeado: ${originalErrorName}`);
                    throw new InternalServerErrorException(`Erro inesperado durante a operação de banco de dados (${context}).`);
            }
        } else if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
            // Re-lança exceções HTTP já tratadas
            throw error;
        } else if (error instanceof Error) {
            this.logger.error(`[${context}] Generic Error: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Erro interno no serviço (${context}): ${error.message}`);
        } else {
            this.logger.error(`[${context}] Unknown Error Type: ${String(error)}`);
            throw new InternalServerErrorException(`Erro interno desconhecido no serviço (${context}).`);
        }
    }


    // --- Gerenciamento de Cache ---

    /** Gera chave de cache para comentário individual. */
    private cacheKey(postId: string, commentId: string): string {
        return `comment_${postId}_${commentId}`;
    }

    /** Gera chave de cache para lista de comentários de um post. */
    private cacheKeyForPostComments(postId: string): string {
        return `comments_post_${postId}`;
    }

    /** Limpa cache individual e da lista do post relacionado. */
    private async clearCache(postId: string, commentId: string): Promise<void> {
        const individualKey = this.cacheKey(postId, commentId);
        const listKey = this.cacheKeyForPostComments(postId);
        this.logger.debug(`Limpando caches: ${individualKey}, ${listKey}`);
        await Promise.all([
            this.cache.del(individualKey),
            this.cache.del(listKey)
        ]);
        // Adicionar limpeza de caches de queries GSI se necessário
    }

    /** Limpa apenas o cache da lista de comentários de um post. */
    private async clearPostCommentsCache(postId: string): Promise<void> {
        const listKey = this.cacheKeyForPostComments(postId);
        this.logger.debug(`Limpando cache da lista do post: ${listKey}`);
        await this.cache.del(listKey);
        // Adicionar limpeza de caches de queries GSI se necessário
    }

    // --- Métodos Removidos/Consolidados ---
    // - findAll(): Scan é geralmente ineficiente. Removido. Se precisar, implementar com paginação e cuidado.
    // - getCommentsByPostId(): Consolidado em findAllByPostId com cache.
    // - getCommentsByStatusAndDate(): Mantido comentado como exemplo de GSI. Implementar se necessário.
    // - mapCommentFromDynamoDb(): Substituído pelo método estático CommentDto.fromDynamoDbItem.

}