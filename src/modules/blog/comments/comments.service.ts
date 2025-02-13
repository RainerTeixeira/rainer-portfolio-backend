import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentDto } from './dto/comment.dto';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe seu DynamoDbService

@Injectable()
export class CommentsService {
    constructor(
        @Inject(DynamoDbService) private dynamoDbService: DynamoDbService, // Injete seu DynamoDbService
    ) { }

    private commentsTable = 'Comments'; // Nome da sua tabela Comments no DynamoDB

    async create(createCommentDto: CreateCommentDto): Promise<CommentDto> {
        const commentId = Date.now(); // Gera um ID simples (pode usar UUID ou outra estratégia)
        const params = {
            TableName: this.commentsTable,
            Item: {
                commentId: { N: String(commentId) }, // DynamoDB espera Number como String
                postId: { N: String(createCommentDto.postId) },
                content: { S: createCommentDto.content },
                date: { S: createCommentDto.date },
                status: { S: createCommentDto.status || 'pending' }, // Status padrão 'pending'
                author: { M: { name: { S: createCommentDto.author.name }, emailHash: { S: createCommentDto.author.emailHash } } },
            },
        };
        await this.dynamoDbService.put(params).catch(err => {
            console.error('DynamoDB Put Error:', err);
            throw err;
        });

        return this.findOne(commentId); // Busca o comment recém-criado para retornar
    }

    async findAll(): Promise<CommentDto[]> {
        const params = {
            TableName: this.commentsTable,
        };
        const result = await this.dynamoDbService.scan(params).catch(err => {
            console.error('DynamoDB Scan Error:', err);
            throw err;
        });
        return result.Items.map(item => this.parseCommentFromDynamoDB(item)) as CommentDto[];
    }

    async findOne(id: number): Promise<CommentDto> {
        const params = {
            TableName: this.commentsTable,
            Key: {
                commentId: { N: String(id) }, // Busca pela chave primária: commentId
            },
        };
        const result = await this.dynamoDbService.get(params).catch(err => {
            console.error('DynamoDB Get Error:', err);
            throw err;
        });

        if (!result.Item) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }
        return this.parseCommentFromDynamoDB(result.Item) as CommentDto;
    }

    async update(id: number, updateCommentDto: UpdateCommentDto): Promise<CommentDto> {
        const updateParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.commentsTable,
            Key: { commentId: { N: String(id) } },
            UpdateExpression: 'SET postId = :postId, content = :content, #date = :date, status = :status, author.#name = :authorName, author.emailHash = :authorEmailHash', // 'date' é palavra reservada
            ExpressionAttributeNames: {
                '#date': 'date',
                '#name': 'name',
            },
            ExpressionAttributeValues: {
                ':postId': updateCommentDto.postId,
                ':content': updateCommentDto.content,
                ':date': updateCommentDto.date,
                ':status': updateCommentDto.status,
                ':authorName': updateCommentDto.author?.name,
                ':authorEmailHash': updateCommentDto.author?.emailHash,
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.update(updateParams).catch(err => {
            console.error('DynamoDB Update Error:', err);
            throw err;
        });

        return this.parseCommentFromDynamoDB(result.Attributes) as CommentDto;
    }

    async remove(id: number): Promise<void> {
        const params = {
            TableName: this.commentsTable,
            Key: {
                commentId: { N: String(id) },
            },
        };
        await this.dynamoDbService.delete(params).catch(err => {
            console.error('DynamoDB Delete Error:', err);
            throw err;
        });
    }

    private parseCommentFromDynamoDB(item: AWS.DynamoDB.DocumentClient.AttributeMap): CommentDto {
        return {
            commentId: Number(item.commentId.N),
            postId: Number(item.postId.N),
            content: item.content.S,
            date: item.date.S,
            status: item.status?.S,
            author: {
                name: item.author.M.name.S,
                emailHash: item.author.M.emailHash.S,
            },
        };
    }
}