"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsService = void 0;
const dynamoDb_1 = require("../../services/dynamoDb");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const common_1 = require("@nestjs/common");
let PostsService = class PostsService {
    async create(body) {
        try {
            const postId = Date.now().toString(); // Gerando um ID único
            const item = {
                postId,
                ...body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.PutItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Item: (0, util_dynamodb_1.marshall)(item)
            }));
            return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            };
        }
        catch (error) {
            console.error('Error creating post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }
    async findOne(id) {
        try {
            const { Item } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.GetItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Key: (0, util_dynamodb_1.marshall)({ postId: id })
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
                body: JSON.stringify((0, util_dynamodb_1.unmarshall)(Item))
            };
        }
        catch (error) {
            console.error('Error fetching post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }
    async update(id, body) {
        try {
            const updateExpression = Object.keys(body)
                .map((key, index) => `#key${index} = :value${index}`)
                .join(', ');
            const expressionAttributeNames = Object.keys(body).reduce((acc, key, index) => ({ ...acc, [`#key${index}`]: key }), {});
            const expressionAttributeValues = Object.keys(body).reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: { S: body[key] }
            }), {});
            const { Attributes } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.UpdateItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Key: (0, util_dynamodb_1.marshall)({ postId: id }),
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
                body: JSON.stringify((0, util_dynamodb_1.unmarshall)(Attributes || {}))
            };
        }
        catch (error) {
            console.error('Error updating post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }
    async remove(id) {
        try {
            await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.DeleteItemCommand({
                TableName: process.env.DYNAMODB_TABLE_POSTS,
                Key: (0, util_dynamodb_1.marshall)({ postId: id })
            }));
            return {
                statusCode: 204,
                body: ''
            };
        }
        catch (error) {
            console.error('Error deleting post:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }
    async getAll(query) {
        try {
            const page = Number(query.page) || 1;
            const limit = Number(query.limit) || 10;
            const { Items, LastEvaluatedKey } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.ScanCommand({
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
                    items: Items?.map(item => (0, util_dynamodb_1.unmarshall)(item)) || [],
                    nextPage: LastEvaluatedKey ? page + 1 : null
                })
            };
        }
        catch (error) {
            console.error('Error fetching posts:', error);
            const message = error instanceof Error ? error.message : 'Internal Server Error';
            return {
                statusCode: 500,
                body: JSON.stringify({ error: message })
            };
        }
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)()
], PostsService);
//# sourceMappingURL=posts.service.js.map