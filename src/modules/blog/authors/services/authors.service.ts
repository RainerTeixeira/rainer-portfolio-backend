// src/modules/blog/authors/services/authors.service.ts

import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importe DynamoDbService
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb'; // Importe UpdateCommandInput
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuthorDto } from '@src/modules/blog/authors/dto/create-author.dto';
import { UpdateAuthorDto } from '@src/modules/blog/authors/dto/update-author.dto';
import { AuthorDto } from '@src/modules/blog/authors/dto/author.dto';

@Injectable()
export class AuthorsService {
    private readonly tableName = 'Authors'; // Nome da tabela DynamoDB para Authors

    constructor(private readonly dynamoDbService: DynamoDbService) { } // Injeta DynamoDbService

    async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDto> {
        const params = {
            TableName: this.tableName,
            Item: createAuthorDto,
        };
        await this.dynamoDbService.putItem(params);
        return this.findOne(createAuthorDto.postId, createAuthorDto.authorId); // Retorna o autor criado
    }

    async findAll(): Promise<AuthorDto[]> {
        const params = {
            TableName: this.tableName,
            //  IndexName: 'your-index-name', // Se precisar usar um GSI
        };
        const result = await this.dynamoDbService.scan(params); // Use scan instead of scanItems
        return (result.Items || []).map(item => this.mapAuthorFromDynamoDb(item));
    }

    async findOne(postId: string, authorId: string): Promise<AuthorDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                postId: { S: postId }, // postId como String
                authorId: { S: authorId }, // authorId como String
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Author com postId '<span class="math-inline">\{postId\}' e authorId '</span>{authorId}' não encontrado`);
        }
        return this.mapAuthorFromDynamoDb(result.Item);
    }

    async update(postId: string, authorId: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDto> {
        // Verifica se o autor existe antes de atualizar
        await this.findOne(postId, authorId);

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateAuthorDto);
        if (!updateExpression) {
            return this.findOne(postId, authorId); // Se não houver campos para atualizar, retorna o autor existente
        }

        const params: UpdateCommandInput = { // Use UpdateCommandInput type
            TableName: this.tableName,
            Key: {
                postId: { S: postId },
                authorId: { S: authorId },
            },
            ...updateExpression, // Aplica UpdateExpression, ExpressionAttributeNames e ExpressionAttributeValues
            ReturnValues: 'ALL_NEW', // Retorna o item atualizado
        };

        const result = await this.dynamoDbService.updateItem(params);
        return this.mapAuthorFromDynamoDb(result.Attributes as Record<string, any>) as AuthorDto; // Retorna o autor atualizado
    }

    async remove(postId: string, authorId: string): Promise<void> {
        // Verifica se o autor existe antes de deletar
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

    private mapAuthorFromDynamoDb(item: Record<string, any>): AuthorDto {
        return {
            postId: item.postId?.S,
            authorId: item.authorId?.S,
            name: item.name?.S,
            slug: item.slug?.S,
            expertise: item.expertise?.L?.map((expertiseItem: any) => expertiseItem.S) || [],
            socialProof: Object.entries(item.socialProof?.M || {}).reduce((obj: { [key: string]: string }, [key, value]: [string, any]) => { // Specify types for reduce function
                obj[key] = value?.S; // Use optional chaining and nullish coalescing
                return obj;
            }, {}) as { [key: string]: string } || {}, // Explicit type for reduce initial value and return
        } as AuthorDto;
    }
}