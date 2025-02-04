import {
    Injectable,
    NotFoundException,
    BadRequestException
} from '@nestjs/common';
import {
    DynamoDBDocumentClient,
    ScanCommand,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand
} from '@aws-sdk/lib-dynamodb'; // AWS SDK v3 for DynamoDB Document Client
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'; // AWS SDK v3 for DynamoDB Client

import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
    private readonly tableName = process.env.DYNAMO_TABLE_NAME_POSTS;

    // Use DynamoDBClient from AWS SDK v3
    private readonly dynamoDBClient = new DynamoDBClient({});
    private readonly docClient = DynamoDBDocumentClient.from(this.dynamoDBClient);

    async create(createPostDto: CreatePostDto) {
        try {
            const post = {
                postId: Date.now().toString(),
                ...createPostDto,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await this.docClient.send(new PutCommand({
                TableName: this.tableName,
                Item: post
            }));

            return post;
        } catch (error) {
            throw new BadRequestException('Failed to create post');
        }
    }

    async findAll(query: any) {
        try {
            const { Items, LastEvaluatedKey } = await this.docClient.send(new ScanCommand({
                TableName: this.tableName,
                Limit: Number(query.limit) || 20,
                ExclusiveStartKey: query.lastKey ? JSON.parse(query.lastKey) : undefined
            }));

            return {
                data: Items,
                meta: {
                    count: Items?.length || 0,
                    nextCursor: LastEvaluatedKey ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64') : null
                }
            };
        } catch (error) {
            throw new BadRequestException('Failed to fetch posts');
        }
    }

    async findOne(id: string) {
        try {
            const { Item } = await this.docClient.send(new GetCommand({
                TableName: this.tableName,
                Key: { postId: id }
            }));

            if (!Item) {
                throw new NotFoundException('Post not found');
            }

            return Item;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new BadRequestException('Invalid post ID');
        }
    }

    async update(id: string, updatePostDto: UpdatePostDto) {
        try {
            const updateExpressions: string[] = []; // Add specific type
            const expressionAttributeNames: { [key: string]: string } = {}; // Define type for object
            const expressionAttributeValues: { [key: string]: any } = {}; // Define type for object

            Object.entries(updatePostDto).forEach(([key, value], index) => {
                updateExpressions.push(`#field${index} = :value${index}`);
                expressionAttributeNames[`#field${index}`] = key;
                expressionAttributeValues[`:value${index}`] = value;
            });

            const { Attributes } = await this.docClient.send(new UpdateCommand({
                TableName: this.tableName,
                Key: { postId: id },
                UpdateExpression: `SET ${updateExpressions.join(', ')}, updatedAt = :updatedAt`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: {
                    ...expressionAttributeValues,
                    ':updatedAt': new Date().toISOString()
                },
                ReturnValues: 'ALL_NEW'
            }));

            return Attributes;
        } catch (error) {
            throw new BadRequestException('Failed to update post');
        }
    }

    async remove(id: string) {
        try {
            await this.docClient.send(new DeleteCommand({
                TableName: this.tableName,
                Key: { postId: id }
            }));

            return { success: true, message: 'Post deleted successfully' };
        } catch (error) {
            throw new BadRequestException('Failed to delete post');
        }
    }
}
