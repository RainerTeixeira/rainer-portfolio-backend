"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = exports.remove = exports.update = exports.findOne = exports.create = void 0;
const dynamoDb_1 = require("../../../services/dynamoDb");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const create = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const postId = Date.now().toString();
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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
exports.create = create;
const findOne = async (event) => {
    try {
        const postId = event.pathParameters?.id;
        if (!postId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing post ID' })
            };
        }
        const { Item } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.GetItemCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Key: (0, util_dynamodb_1.marshall)({ postId })
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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
exports.findOne = findOne;
const update = async (event) => {
    try {
        const postId = event.pathParameters?.id;
        const body = JSON.parse(event.body || '{}');
        if (!postId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing post ID' })
            };
        }
        const updateExpression = Object.keys(body)
            .map((key, index) => `#key${index} = :value${index}`)
            .join(', ');
        const expressionAttributeNames = Object.keys(body).reduce((acc, key, index) => ({ ...acc, [`#key${index}`]: key }), {});
        const expressionAttributeValues = Object.keys(body).reduce((acc, key, index) => ({ ...acc, [`:value${index}`]: body[key] }), {});
        const { Attributes } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.UpdateItemCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Key: (0, util_dynamodb_1.marshall)({ postId }),
            UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ...expressionAttributeValues,
                ':updatedAt': new Date().toISOString()
            }),
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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
exports.update = update;
const remove = async (event) => {
    try {
        const postId = event.pathParameters?.id;
        if (!postId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing post ID' })
            };
        }
        await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.DeleteItemCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Key: (0, util_dynamodb_1.marshall)({ postId })
        }));
        return {
            statusCode: 204,
            body: ''
        };
    }
    catch (error) {
        console.error('Error deleting post:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
exports.remove = remove;
const getAll = async (event) => {
    try {
        const { Items } = await dynamoDb_1.dynamoDBClient.send(new client_dynamodb_1.ScanCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Limit: 100
        }));
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Items?.map(item => (0, util_dynamodb_1.unmarshall)(item)) || [])
        };
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
exports.getAll = getAll;
//# sourceMappingURL=posts.controller.js.map