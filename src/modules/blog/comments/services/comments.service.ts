// src/modules/blog/comments/services/comments.service.ts

import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importe o DynamoDbService
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from '@src/modules/blog/comments/dto/create-comment.dto';
import { UpdateCommentDto } from '@src/modules/blog/comments/dto/update-comment.dto';
import { CommentDto } from '@src/modules/blog/comments/dto/comment.dto';
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb'; // Importe UpdateCommandInput


@Injectable()
export class CommentsService {
    private readonly tableName = 'Comments'; // Nome da tabela DynamoDB para Comments

    constructor(private readonly dynamoDbService: DynamoDbService) { } // Injeta DynamoDbService

    async create(createCommentDto: CreateCommentDto): Promise<CommentDto> {
        const params = {
            TableName: this.tableName,
            Item: createCommentDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createCommentDto.postId, createCommentDto.authorId);
    }

    async findAll(): Promise<CommentDto[]> {
        const result = await this.dynamoDbService.scan({ TableName: this.tableName });
        return (result.Items || []).map(item => this.mapCommentFromDynamoDb(item));
    }

    async findOne(postId: number, authorId: string): Promise<CommentDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                postId: { N: postId.toString() }, // postId como Number (convertido para String ao usar como Key no DynamoDB)
                authorId: { S: authorId }, // authorId como String
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Comment com postId '<span class="math-inline">\{postId\}' e authorId '</span>{authorId}' não encontrado`);
        }
        return this.mapCommentFromDynamoDb(result.Item);
    }

    async update(postId: number, authorId: string, updateCommentDto: UpdateCommentDto): Promise<CommentDto> {
        // Verifica se o comentário existe antes de atualizar
        await this.findOne(postId, authorId);

        const params: UpdateCommandInput = { // Use UpdateCommandInput type
            TableName: this.tableName,
            Key: {
                postId: { N: postId.toString() }, // postId como Number (convertido para String ao usar como Key no DynamoDB)
                authorId: { S: authorId },
            },
            UpdateExpression: 'SET content = :content, #status = :status, #date = :date', // Use 'SET' e placeholders para atualizar
            ExpressionAttributeNames: { // Mapeamento de nomes de atributos
                '#status': 'status', // '#status' será substituído por 'status' (evita palavras reservadas)
                '#date': 'date', // '#date' será substituído por 'date' (evita palavras reservadas)
            },
            ExpressionAttributeValues: { // Valores para substituir nos placeholders
                ':content': { S: updateCommentDto.content }, // Formato correto do valor string para DynamoDB
                ':status': { S: updateCommentDto.status || 'pending' }, // Valor padrão 'pending' se status não for fornecido
                ':date': { S: updateCommentDto.date || new Date().toISOString() }, // Valor padrão data atual se não fornecido
            },
            ReturnValues: 'ALL_NEW', // Defina o tipo de retorno esperado
        };

        const result = await this.dynamoDbService.updateItem(params);
        return this.mapCommentFromDynamoDb(result.Attributes as Record<string, any>) as CommentDto;
    }

    async remove(postId: number, authorId: string): Promise<void> {
        // Verifica se o comentário existe antes de deletar
        await this.findOne(postId, authorId);

        const params = {
            TableName: this.tableName,
            Key: {
                postId: { N: postId.toString() }, // postId como Number (convertido para String ao usar como Key no DynamoDB)
                authorId: { S: authorId },
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }

    private mapCommentFromDynamoDb(item: Record<string, any>): CommentDto {
        return {
            postId: Number(item.postId?.N), // Converte de volta para Number ao mapear do DynamoDB
            authorId: item.authorId?.S,
            content: item.content?.S,
            date: item.date?.S,
            status: item.status?.S,
        } as CommentDto;
    }
}