// src/controller/authors/authors.service.ts
import { Injectable } from '@nestjs/common';
import { DynamoDB } from 'aws-sdk';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
    private readonly dynamoDb = new DynamoDB.DocumentClient();
    private readonly tableName = process.env.DYNAMODB_TABLE_AUTHORS || 'default-table-name';
    
    async create(createAuthorDto: CreateAuthorDto) {
        const params = {
            TableName: this.tableName,
            Item: {
                id: new Date().getTime().toString(),  // Gerar um ID único (ou pode usar UUID)
                ...createAuthorDto,
            },
        };

        await this.dynamoDb.put(params).promise();
        return params.Item;
    }

    async findAll() {
        const params = {
            TableName: this.tableName,
        };
        const result = await this.dynamoDb.scan(params).promise();
        return result.Items;
    }

    async findOne(id: string) {
        const params = {
            TableName: this.tableName,
            Key: { id },
        };

        const result = await this.dynamoDb.get(params).promise();
        return result.Item;
    }

    async update(id: string, updateAuthorDto: UpdateAuthorDto) {
        const params = {
            TableName: this.tableName,
            Key: { id },
            UpdateExpression: 'set #name = :name, #bio = :bio, #website = :website',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#bio': 'bio',
                '#website': 'website',
            },
            ExpressionAttributeValues: {
                ':name': updateAuthorDto.name,
                ':bio': updateAuthorDto.bio,
                ':website': updateAuthorDto.website,
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDb.update(params).promise();
        return result.Attributes;
    }

    async delete(id: string) {
        const params = {
            TableName: this.tableName,
            Key: { id },
        };

        await this.dynamoDb.delete(params).promise();
        return { message: `Author with id ${id} deleted successfully` };
    }
}
