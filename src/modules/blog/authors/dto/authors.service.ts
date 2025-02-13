import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { AuthorDto } from './dto/author.dto';
import { DynamoDbService } from '../../../services/dynamoDb.service'; // Importe seu DynamoDbService

@Injectable()
export class AuthorsService {
    constructor(
        @Inject(DynamoDbService) private dynamoDbService: DynamoDbService, // Injete seu DynamoDbService
    ) { }

    private authorsTable = 'Authors'; // Nome da sua tabela Authors no DynamoDB

    async create(createAuthorDto: CreateAuthorDto): Promise<AuthorDto> {
        const authorId = Date.now(); // Gera um ID simples (pode usar UUID ou outra estratégia)
        const params = {
            TableName: this.authorsTable,
            Item: {
                authorId: { N: String(authorId) }, // DynamoDB espera Number como String
                name: { S: createAuthorDto.name },
                bio: { S: createAuthorDto.bio },
                imageUrl: { S: createAuthorDto.imageUrl },
            },
        };
        await this.dynamoDbService.put(params).catch(err => {
            console.error('DynamoDB Put Error:', err);
            throw err;
        });

        return this.findOne(authorId); // Busca o autor recém-criado para retornar
    }

    async findAll(): Promise<AuthorDto[]> {
        const params = {
            TableName: this.authorsTable,
        };
        const result = await this.dynamoDbService.scan(params).catch(err => {
            console.error('DynamoDB Scan Error:', err);
            throw err;
        });
        return result.Items.map(item => this.parseAuthorFromDynamoDB(item)) as AuthorDto[];
    }

    async findOne(id: number): Promise<AuthorDto> {
        const params = {
            TableName: this.authorsTable,
            Key: {
                authorId: { N: String(id) }, // Busca pela chave primária: authorId
            },
        };
        const result = await this.dynamoDbService.get(params).catch(err => {
            console.error('DynamoDB Get Error:', err);
            throw err;
        });

        if (!result.Item) {
            throw new NotFoundException(`Author with ID ${id} not found`);
        }
        return this.parseAuthorFromDynamoDB(result.Item) as AuthorDto;
    }

    async update(id: number, updateAuthorDto: UpdateAuthorDto): Promise<AuthorDto> {
        const updateParams: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: this.authorsTable,
            Key: { authorId: { N: String(id) } },
            UpdateExpression: 'SET #name = :name, bio = :bio, imageUrl = :imageUrl',
            ExpressionAttributeNames: {
                '#name': 'name', // 'name' é palavra reservada no DynamoDB
            },
            ExpressionAttributeValues: {
                ':name': updateAuthorDto.name,
                ':bio': updateAuthorDto.bio,
                ':imageUrl': updateAuthorDto.imageUrl,
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.update(updateParams).catch(err => {
            console.error('DynamoDB Update Error:', err);
            throw err;
        });

        return this.parseAuthorFromDynamoDB(result.Attributes) as AuthorDto;
    }

    async remove(id: number): Promise<void> {
        const params = {
            TableName: this.authorsTable,
            Key: {
                authorId: { N: String(id) },
            },
        };
        await this.dynamoDbService.delete(params).catch(err => {
            console.error('DynamoDB Delete Error:', err);
            throw err;
        });
    }

    private parseAuthorFromDynamoDB(item: AWS.DynamoDB.DocumentClient.AttributeMap): AuthorDto {
        return {
            authorId: Number(item.authorId.N),
            name: item.name.S,
            bio: item.bio.S,
            imageUrl: item.imageUrl.S,
        };
    }
}