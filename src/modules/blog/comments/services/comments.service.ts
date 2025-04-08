import { DynamoDbService } from '@src/services/dynamoDb.service';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateCommentDto } from '@src/modules/blog/comments/dto/create-comment.dto';
import { UpdateCommentDto } from '@src/modules/blog/comments/dto/update-comment.dto';
import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReturnValue } from '@aws-sdk/client-dynamodb'; // Importe o tipo ReturnValue

/**
 * @CommentsService
 * Serviço responsável pela lógica de negócio dos comentários.
 */
@ApiTags('comments')
@Injectable()
export class CommentsService {
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_COMMENTS || 'Comments';
    private readonly logger = new Logger(CommentsService.name); // Adicionando o logger

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria um novo comentário.
     * @param createCommentDto - Dados para criar um novo comentário.
     * @returns O comentário criado.
     */
    @ApiOperation({ summary: 'Cria um novo comentário' })
    @ApiResponse({ status: 201, description: 'Comentário criado com sucesso.', type: CommentDto })
    async create(createCommentDto: CreateCommentDto): Promise<{ success: boolean; data: CommentDto }> {
        const commentId = Date.now().toString(36); // Gerar um ID único para o comentário
        const params = {
            TableName: this.tableName,
            Item: {
                postId: { S: createCommentDto.postId },
                commentId: { S: commentId },
                content: { S: createCommentDto.content },
                date: { S: createCommentDto.date },
            },
        };
        await this.dynamoDbService.putItem(params);
        const comment = await this.findOne(createCommentDto.postId, commentId);
        return { success: true, data: comment };
    }

    /**
     * Obtém todos os comentários.
     * @returns Uma lista de todos os comentários.
     */
    @ApiOperation({ summary: 'Obtém todos os comentários' })
    @ApiResponse({ status: 200, description: 'Lista de comentários.', type: [CommentDto] })
    async findAll(): Promise<{ success: boolean; data: CommentDto[] }> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        const items = result.data.Items || []; // Acesse `data` antes de `Items`
        const comments = items.map(item => this.mapCommentFromDynamoDb(item));
        return { success: true, data: comments };
    }

    /**
     * Obtém um comentário pelo postId e authorId.
     * @param postId - ID do post.
     * @param authorId - ID do autor.
     * @returns O comentário encontrado.
     * @throws NotFoundException se o comentário não for encontrado.
     */
    @ApiOperation({ summary: 'Obtém um comentário pelo postId e authorId' })
    @ApiResponse({ status: 200, description: 'Comentário encontrado.', type: CommentDto })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    async findOne(postId: string, commentId: string): Promise<CommentDto> {
        this.logger.log(`Buscando comentário com postId: ${postId} e commentId: ${commentId}`);
        const params = {
            TableName: this.tableName,
            Key: {
                postId: { S: postId },
                commentId: { S: commentId },
            },
        };

        const result = await this.dynamoDbService.getItem(params);
        const item = result.data.Item; // Acesse `data` antes de `Item`
        if (!item) {
            throw new NotFoundException(`Comentário com ID '${commentId}' não encontrado no post '${postId}'.`);
        }
        return this.mapCommentFromDynamoDb(item);
    }

    /**
     * Obtém comentários pelo postId.
     * @param postId - ID do post.
     * @returns Uma lista de comentários encontrados.
     */
    @ApiOperation({ summary: 'Obtém comentários pelo postId' })
    @ApiResponse({ status: 200, description: 'Comentários encontrados.', type: [CommentDto] })
    async getCommentsByPostId(postId: string): Promise<CommentDto[]> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'postId = :postId',
            ExpressionAttributeValues: { ':postId': { S: postId } },
            ProjectionExpression: 'postId, commentId, content, date, status', // Retorna apenas os atributos necessários
        };

        const result = await this.dynamoDbService.query(params);
        const items = result.data.Items || [];
        return items.map(item => this.mapCommentFromDynamoDb(item));
    }

    /**
     * Obtém todos os comentários de um post pelo postId.
     * @param postId - ID do post.
     * @returns Uma lista de comentários encontrados.
     */
    async findAllByPostId(postId: string): Promise<CommentDto[]> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'postId = :postId',
            ExpressionAttributeValues: { ':postId': { S: postId } },
        };
        const result = await this.dynamoDbService.query(params);
        const items = result.data.Items || []; // Acesse `data` antes de `Items`
        return items.map(item => this.mapCommentFromDynamoDb(item));
    }

    /**
     * Obtém comentários pelo status e data.
     * @param status - Status do comentário (ex: 'published').
     * @param date - Data do comentário (opcional).
     * @returns Uma lista de comentários encontrados.
     */
    async getCommentsByStatusAndDate(status: string, date?: string): Promise<CommentDto[]> {
        const params = {
            TableName: this.tableName,
            IndexName: 'status-date-index', // Usa o índice criado
            KeyConditionExpression: 'status = :status' + (date ? ' AND #date = :date' : ''),
            ExpressionAttributeValues: {
                ':status': { S: status },
                ...(date && { ':date': { S: date } }),
            },
            ExpressionAttributeNames: {
                '#date': 'date',
            },
            ProjectionExpression: 'postId, commentId, content, date, status', // Retorna apenas os atributos necessários
        };

        const result = await this.dynamoDbService.query(params);
        const items = result.data.Items || [];
        return items.map(item => this.mapCommentFromDynamoDb(item));
    }

    /**
     * Atualiza um comentário.
     * @param postId - ID do post.
     * @param authorId - ID do autor.
     * @param updateCommentDto - Dados para atualizar o comentário.
     * @returns O comentário atualizado.
     * @throws NotFoundException se o comentário não for encontrado.
     */
    @ApiOperation({ summary: 'Atualiza um comentário' })
    @ApiResponse({ status: 200, description: 'Comentário atualizado com sucesso.', type: CommentDto })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    async update(postId: string, authorId: string, updateCommentDto: UpdateCommentDto): Promise<CommentDto> {
        this.logger.log(`Atualizando comentário com postId: ${postId} e authorId: ${authorId}`);
        await this.findOne(postId, authorId);

        const params = {
            TableName: this.tableName,
            Key: { postId, authorId }, // Adicionando a chave primária
            UpdateExpression: 'set #content = :content',
            ExpressionAttributeNames: { '#content': 'content' },
            ExpressionAttributeValues: { ':content': updateCommentDto.content },
            ReturnValues: 'ALL_NEW',
        };

        await this.dynamoDbService.updateItem(
            params.TableName,
            params.Key,
            {
                content: updateCommentDto.content,
            },
            params.ReturnValues as ReturnValue | undefined,
        ); // Ajustando a chamada para passar os argumentos corretos

        return this.findOne(postId, authorId);
    }

    /**
     * Remove um comentário.
     * @param postId - ID do post.
     * @param authorId - ID do autor.
     * @throws NotFoundException se o comentário não for encontrado.
     */
    @ApiOperation({ summary: 'Remove um comentário' })
    @ApiResponse({ status: 200, description: 'Comentário removido com sucesso.' })
    @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
    async remove(postId: string, authorId: string): Promise<void> {
        await this.findOne(postId, authorId);

        const params = {
            TableName: this.tableName,
            Key: {
                postId: postId,
                authorId: authorId,
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }

    /**
     * Mapeia um item do DynamoDB para um CommentDto.
     * @param item - Item do DynamoDB.
     * @returns O CommentDto mapeado.
     */
    private mapCommentFromDynamoDb(item: Record<string, unknown>): CommentDto {
        return {
            postId: item.postId as string,
            commentId: item.commentId as string,
            authorId: item.authorId as string,
            content: item.content as string,
            date: item.date as string,
            status: item.status as string,
        } as CommentDto;
    }
}