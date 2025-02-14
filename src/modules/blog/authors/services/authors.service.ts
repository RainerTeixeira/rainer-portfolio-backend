// src/modules/blog/authors/services/authors.service.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
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
            //  IndexName: 'your-index-name', // Se precisar usar um GSI
        };
        const result = await this.dynamoDbService.scanItems(params); // Use scanItems para buscar todos (cuidado em produção!)
        return (result.Items as AuthorDto[]) || [];
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
            throw new NotFoundException(`Author com postId '${postId}' e authorId '${authorId}' não encontrado`);
        }
        return result.Item as AuthorDto;
    }

    async update(postId: string, authorId: string, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDto> {
        // Verifica se o autor existe antes de atualizar
        await this.findOne(postId, authorId);

        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateAuthorDto);
        if (!updateExpression) {
            return this.findOne(postId, authorId); // Se não houver campos para atualizar, retorna o autor existente
        }

        const params = {
            TableName: this.tableName,
            Key: {
                postId: { S: postId },
                authorId: { S: authorId },
            },
            ...updateExpression, // Aplica UpdateExpression, ExpressionAttributeNames e ExpressionAttributeValues
            ReturnValues: 'ALL_NEW', // Retorna o item atualizado
        };

        const result = await this.dynamoDbService.updateItem(params);
        return result.Attributes as AuthorDto; // Retorna o autor atualizado
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
}