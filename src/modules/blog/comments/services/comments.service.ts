import { DynamoDbService } from '@src/services/dynamoDb.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from '@src/modules/blog/comments/dto/create-comment.dto';
import { UpdateCommentDto } from '@src/modules/blog/comments/dto/update-comment.dto';
import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * @CommentsService
 * Serviço responsável pela lógica de negócio dos comentários.
 */
@ApiTags('comments')
@Injectable()
export class CommentsService {
    private readonly tableName = 'Comments';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    /**
     * Cria um novo comentário.
     * @param createCommentDto - Dados para criar um novo comentário.
     * @returns O comentário criado.
     */
    @ApiOperation({ summary: 'Cria um novo comentário' })
    @ApiResponse({ status: 201, description: 'Comentário criado com sucesso.', type: CommentDto })
    async create(createCommentDto: CreateCommentDto): Promise<CommentDto> {
        const commentId = Date.now().toString(36); // Gerar um ID único para o comentário
        const params = {
            TableName: this.tableName,
            Item: {
                ...createCommentDto,
                commentId, // Adicionar commentId ao item
                postId: String(createCommentDto.postId), // Converte postId para string
            },
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(String(createCommentDto.postId), createCommentDto.authorId);
    }

    /**
     * Obtém todos os comentários.
     * @returns Uma lista de todos os comentários.
     */
    @ApiOperation({ summary: 'Obtém todos os comentários' })
    @ApiResponse({ status: 200, description: 'Lista de comentários.', type: [CommentDto] })
    async findAll(): Promise<CommentDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCommentFromDynamoDb(item));
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
    async findOne(postId: string, authorId: string): Promise<CommentDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                postId: postId,
                authorId: authorId,
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Comment com postId '${postId}' e authorId '${authorId}' não encontrado`);
        }
        return this.mapCommentFromDynamoDb(result.Item);
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
            ExpressionAttributeValues: { ':postId': postId },
        };
        const result = await this.dynamoDbService.query(params);
        return (result.Items || []).map(item => this.mapCommentFromDynamoDb(item));
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
            ExpressionAttributeValues: { ':postId': postId },
        };
        const result = await this.dynamoDbService.query(params);
        return (result.Items || []).map(item => this.mapCommentFromDynamoDb(item));
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
        await this.findOne(postId, authorId);

        const params: UpdateCommandInput = {
            TableName: this.tableName,
            Key: {
                postId: postId,
                authorId: authorId,
            },
            UpdateExpression: 'SET content = :content, #status = :status, #date = :date',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#date': 'date',
            },
            ExpressionAttributeValues: {
                ':content': updateCommentDto.content,
                ':status': updateCommentDto.status || 'pending',
                ':date': updateCommentDto.date || new Date().toISOString(),
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return this.mapCommentFromDynamoDb(result.Attributes as Record<string, unknown>);
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
