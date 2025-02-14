// src/modules/blog/comments/services/comments.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '../../../../services/dynamoDb.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CommentDto } from '../dto/comment.dto';

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
        return this.findOne(createCommentDto.postId.toString(), createCommentDto.authorId); // postId é Number no DTO, mas String na chave do DynamoDB
    }

    async findAll(): Promise<CommentDto[]> {
        const params = {
            TableName: this.tableName,
        };
        const result = await this.dynamoDbService.scanItems(params);
        return (result.Items as CommentDto[]) || [];
    }

    async findOne(postId: string, authorId: string): Promise<CommentDto> {
        const params = {
            TableName: this.tableName,
            Key: {
                postId: { N: postId }, // postId como Number
                authorId: { S: authorId },
            },
        };
        const result = await this.dynamoDbService.getItem(params);
        if (!result.Item) {
            throw new NotFoundException(`Comment com postId '${postId}' e authorId '${authorId}' não encontrado`);
        }
        return result.Item as CommentDto;
    }

    async update(postId: string, authorId: string, updateCommentDto: UpdateCommentDto): Promise<CommentDto> {
        await this.findOne(postId, authorId);
        const updateExpression = this.dynamoDbService.buildUpdateExpression(updateCommentDto);
        if (!updateExpression) {
            return this.findOne(postId, authorId);
        }

        const params = {
            TableName: this.tableName,
            Key: {
                postId: { N: postId },
                authorId: { S: authorId },
            },
            ...updateExpression,
            ReturnValues: 'ALL_NEW',
        };

        const result = await this.dynamoDbService.updateItem(params);
        return result.Attributes as CommentDto;
    }

    async remove(postId: string, authorId: string): Promise<void> {
        await this.findOne(postId, authorId);
        const params = {
            TableName: this.tableName,
            Key: {
                postId: { N: postId },
                authorId: { S: authorId },
            },
        };
        await this.dynamoDbService.deleteItem(params);
    }
}