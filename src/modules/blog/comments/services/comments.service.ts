import { DynamoDbService } from '@src/services/dynamoDb.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from '@src/modules/blog/comments/dto/create-comment.dto';
import { UpdateCommentDto } from '@src/modules/blog/comments/dto/update-comment.dto';
import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class CommentsService {
    private readonly tableName = 'Comments';

    constructor(private readonly dynamoDbService: DynamoDbService) { }

    async create(createCommentDto: CreateCommentDto): Promise<CommentDto> {
        const params = {
            TableName: this.tableName,
            Item: createCommentDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createCommentDto.postId.toString(), createCommentDto.authorId); // Converte postId para string
    }

    async findAll(): Promise<CommentDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCommentFromDynamoDb(item));
    }

    async findOne(postId: string, authorId: string): Promise<CommentDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                postId: { S: postId },
                authorId: { S: authorId },
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Comment com postId '${postId}' e authorId '${authorId}' não encontrado`);
        }
        return this.mapCommentFromDynamoDb(result.Item);
    }

    async update(postId: string, authorId: string, updateCommentDto: UpdateCommentDto): Promise<CommentDto> {
        await this.findOne(postId, authorId);

        const params: UpdateCommandInput = {
            TableName: this.tableName,
            Key: {
                postId: { S: postId },
                authorId: { S: authorId },
            },
            UpdateExpression: 'SET content = :content, #status = :status, #date = :date',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#date': 'date',
            },
            ExpressionAttributeValues: {
                ':content': { S: updateCommentDto.content },
                ':status': { S: updateCommentDto.status || 'pending' },
                ':date': { S: updateCommentDto.date || new Date().toISOString() },
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return this.mapCommentFromDynamoDb(result.Attributes as Record<string, any>) as CommentDto;
    }

    async remove(postId: string, authorId: string): Promise<void> {
        await this.findOne(postId, authorId);

        const params = {
            TableName: this.tableName,
            Key: {
                postId: { S: postId },
                authorId: { S: authorId },
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }

    private mapCommentFromDynamoDb(item: Record<string, any>): CommentDto {
        return {
            postId: item.postId?.S,
            commentId: item.commentId?.S,
            authorId: item.authorId?.S,
            content: item.content?.S,
            date: item.date?.S,
            status: item.status?.S,
        } as CommentDto;
    }
}