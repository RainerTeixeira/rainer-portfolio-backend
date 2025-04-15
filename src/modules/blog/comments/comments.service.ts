import {
    Injectable,
    Inject,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CommentsRepository } from '../repositories/comments.repository';
import { CommentEntity } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { DynamoDbService, DynamoDBOperationError } from '@src/services/dynamoDb.service';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_COMMENTS || 'Comments';
    private readonly cacheTtl = 300; // 5 minutos

    constructor(
        private readonly repository: CommentsRepository,
        private readonly dynamoDb: DynamoDbService,
        @Inject(CACHE_MANAGER) private cache: Cache
    ) { }

    /**
     * Cria um novo comentário
     * @param dto Dados do comentário
     * @returns Comentário criado
     */
    async create(dto: CreateCommentDto): Promise<CommentEntity> {
        try {
            const comment = new CommentEntity(dto);

            await this.dynamoDb.put({
                TableName: this.tableName,
                Item: comment.toDynamoItem(),
                ConditionExpression: 'attribute_not_exists(id)'
            });

            await this.clearRelatedCache(comment.post_id, comment.user_id);

            return comment;
        } catch (error) {
            this.handleDynamoError(error, `create-${dto.id}`);
        }
    }

    /**
     * Busca comentários por post
     * @param postId ID do post
     * @returns Lista de comentários ordenados por data
     */
    async findByPost(postId: string): Promise<CommentEntity[]> {
        const cacheKey = `comments:post:${postId}`;
        try {
            const cached = await this.cache.get<CommentEntity[]>(cacheKey);
            if (cached) return cached;

            const comments = await this.repository.findByPost(postId);
            await this.cache.set(cacheKey, comments, this.cacheTtl);
            return comments;
        } catch (error) {
            this.handleDynamoError(error, `findByPost-${postId}`);
        }
    }

    /**
     * Busca comentários por usuário
     * @param userId ID do usuário
     * @returns Lista de comentários do usuário
     */
    async findByUser(userId: string): Promise<CommentEntity[]> {
        const cacheKey = `comments:user:${userId}`;
        try {
            const cached = await this.cache.get<CommentEntity[]>(cacheKey);
            if (cached) return cached;

            const comments = await this.repository.findByUser(userId);
            await this.cache.set(cacheKey, comments, this.cacheTtl);
            return comments;
        } catch (error) {
            this.handleDynamoError(error, `findByUser-${userId}`);
        }
    }

    /**
     * Atualiza um comentário
     * @param commentId ID do comentário
     * @param dto Dados de atualização
     * @returns Comentário atualizado
     */
    async update(commentId: string, dto: UpdateCommentDto): Promise<CommentEntity> {
        try {
            const existing = await this.findById(commentId);
            const updatedComment = new CommentEntity({ ...existing, ...dto });

            const result = await this.dynamoDb.update({
                TableName: this.tableName,
                Key: { id: { S: commentId } },
                UpdateExpression: this.buildUpdateExpression(dto),
                ExpressionAttributeNames: this.buildExpressionAttributeNames(dto),
                ExpressionAttributeValues: this.buildExpressionAttributes(dto),
                ReturnValues: 'ALL_NEW'
            });

            await this.clearRelatedCache(existing.post_id, existing.user_id);

            return this.repository.mapDynamoItem(result.Attributes);
        } catch (error) {
            this.handleDynamoError(error, `update-${commentId}`);
        }
    }

    /**
     * Remove um comentário
     * @param commentId ID do comentário
     */
    async delete(commentId: string): Promise<void> {
        try {
            const comment = await this.findById(commentId);

            await this.dynamoDb.delete({
                TableName: this.tableName,
                Key: { id: { S: commentId } }
            });

            await this.clearRelatedCache(comment.post_id, comment.user_id);
        } catch (error) {
            this.handleDynamoError(error, `delete-${commentId}`);
        }
    }

    /**
     * Busca comentário por ID
     * @param commentId ID do comentário
     * @returns Comentário encontrado
     */
    private async findById(commentId: string): Promise<CommentEntity> {
        try {
            const result = await this.dynamoDb.get({
                TableName: this.tableName,
                Key: { id: { S: commentId } }
            });

            if (!result.Item) {
                throw new NotFoundException(`Comentário ${commentId} não encontrado`);
            }

            return this.repository.mapDynamoItem(result.Item);
        } catch (error) {
            this.handleDynamoError(error, `findById-${commentId}`);
        }
    }

    /**
     * Limpa cache relacionado ao comentário
     * @param postId ID do post
     * @param userId ID do usuário
     */
    private async clearRelatedCache(postId: string, userId: string): Promise<void> {
        await Promise.all([
            this.cache.del(`comments:post:${postId}`),
            this.cache.del(`comments:user:${userId}`)
        ]);
    }

    /**
     * Constrói expressão de atualização
     * @param dto Dados de atualização
     * @returns Expressão de atualização
     */
    private buildUpdateExpression(dto: UpdateCommentDto): string {
        const updates = [];
        if (dto.text) updates.push('#text = :text');
        if (dto.status) updates.push('#status = :status');
        return `SET ${updates.join(', ')}`;
    }

    /**
     * Constrói nomes de atributos
     * @param dto Dados de atualização
     * @returns Mapa de nomes
     */
    private buildExpressionAttributeNames(dto: UpdateCommentDto): Record<string, string> {
        const names = {};
        if (dto.text) names['#text'] = 'text';
        if (dto.status) names['#status'] = 'status';
        return names;
    }

    /**
     * Constrói valores de atributos
     * @param dto Dados de atualização
     * @returns Mapa de valores
     */
    private buildExpressionAttributes(dto: UpdateCommentDto): Record<string, AttributeValue> {
        const attributes = {};
        if (dto.text) attributes[':text'] = { S: dto.text };
        if (dto.status) attributes[':status'] = { S: dto.status };
        return attributes;
    }

    /**
     * Tratamento centralizado de erros
     * @param error Erro original
     * @param context Contexto da operação
     */
    private handleDynamoError(error: unknown, context: string): never {
        if (error instanceof Error) {
            this.logger.error(`[${context}] ${error.message}`, error.stack);

            if (error instanceof DynamoDBOperationError) {
                const errorCode = error.context.originalError || 'UnknownError';

                switch (errorCode.toString()) {
                    case 'ConditionalCheckFailedException':
                        throw new BadRequestException('Conflito: Comentário já existe');
                    case 'ResourceNotFoundException':
                        throw new NotFoundException('Comentário não encontrado');
                    case 'ValidationException':
                        throw new BadRequestException('Parâmetros inválidos na requisição');
                    default:
                        this.logger.error(`Erro não mapeado: ${errorCode}`);
                        throw new InternalServerErrorException(`Falha na operação: ${context}`);
                }
            }
        } else {
            this.logger.error(`[${context}] Erro desconhecido: ${String(error)}`);
        }

        throw new InternalServerErrorException(`Falha na operação: ${context}`);
    }
}