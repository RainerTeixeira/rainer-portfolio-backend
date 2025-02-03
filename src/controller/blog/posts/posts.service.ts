import { dynamoDBClient } from '@src/services/dynamoDb'; // Usando alias para caminho absoluto
import { PutItemCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Injectable } from '@nestjs/common';
import { CreatePostDto, UpdatePostDto } from '../controller/posts/dto';
import { DynamoDbService } from './dynamoDb.service';


interface LambdaEvent {
    body?: string;
    pathParameters?: {
        id?: string;
    };
    queryStringParameters?: {
        page?: string;
        limit?: string;
    };
}

@Injectable()
export class PostsService {
    async create(body: any) {
        try {
            const postId = Date.now().toString(); // Gerando um ID único
            const item = {
                postId,
                ...body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await dynamoDBClient.send(new PutItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Item: marshall(item)
            }));

            return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            };
        } catch (error) {
            console.error('Error creating post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }

    async findOne(id: string) {
        try {
            const { Item } = await dynamoDBClient.send(new GetItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Key: marshall({ postId: id })
            }));

            if (!Item) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Post not found' })
                };
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(unmarshall(Item))
            };
        } catch (error) {
            console.error('Error fetching post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }

    async update(id: string, body: any) {
        try {
            const updateExpression = Object.keys(body)
                .map((key, index) => `#key${index} = :value${index}`)
                .join(', ');

            const expressionAttributeNames = Object.keys(body).reduce(
                (acc, key, index) => ({ ...acc, [`#key${index}`]: key }),
                {}
            );

            const expressionAttributeValues = Object.keys(body).reduce(
                (acc, key, index) => ({
                    ...acc,
                    [`:value${index}`]: { S: body[key] }
                }),
                {}
            );

            const { Attributes } = await dynamoDBClient.send(new UpdateItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Key: marshall({ postId: id }),
                UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: {
                    ...expressionAttributeValues,
                    ':updatedAt': { S: new Date().toISOString() }
                },
                ReturnValues: 'ALL_NEW'
            }));

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(unmarshall(Attributes || {}))
            };
        } catch (error) {
            console.error('Error updating post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }

    async remove(id: string) {
        try {
            await dynamoDBClient.send(new DeleteItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Key: marshall({ postId: id })
            }));

            return {
                statusCode: 204,
                body: ''
            };
        } catch (error) {
            console.error('Error deleting post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }

    async getAll(query: any) {
        try {
            const page = Number(query.page) || 1;
            const limit = Number(query.limit) || 10;

            const { Items, LastEvaluatedKey } = await dynamoDBClient.send(new ScanCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Limit: limit,
                ExclusiveStartKey: page > 1 ? {
                    postId: { S: String((page - 1) * limit) }
                } : undefined
            }));

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: Items?.map(item => unmarshall(item)) || [],
                    nextPage: LastEvaluatedKey ? page + 1 : null
                })
            };
        } catch (error) {
            console.error('Error fetching posts:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }
}
