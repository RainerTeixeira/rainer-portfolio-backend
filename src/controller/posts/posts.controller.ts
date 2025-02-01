import { dynamoDBClient } from '../../../services/dynamoDb';
import {
    PutItemCommand,
    GetItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ScanCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

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

export const create = async (event: LambdaEvent) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const postId = Date.now().toString();

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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};

export const findOne = async (event: LambdaEvent) => {
    try {
        const postId = event.pathParameters?.id;

        if (!postId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing post ID' })
            };
        }

        const { Item } = await dynamoDBClient.send(new GetItemCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Key: marshall({ postId })
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
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};

export const update = async (event: LambdaEvent) => {
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

        const expressionAttributeNames = Object.keys(body).reduce(
            (acc, key, index) => ({ ...acc, [`#key${index}`]: key }),
            {}
        );

        const expressionAttributeValues = Object.keys(body).reduce(
            (acc, key, index) => ({ ...acc, [`:value${index}`]: body[key] }),
            {}
        );

        const { Attributes } = await dynamoDBClient.send(new UpdateItemCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Key: marshall({ postId }),
            UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: marshall({
                ...expressionAttributeValues,
                ':updatedAt': new Date().toISOString()
            }),
            ReturnValues: 'ALL_NEW'
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(unmarshall(Attributes || {}))
        };
    } catch (error) {
        console.error('Error updating post:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};

export const remove = async (event: LambdaEvent) => {
    try {
        const postId = event.pathParameters?.id;

        if (!postId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing post ID' })
            };
        }

        await dynamoDBClient.send(new DeleteItemCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Key: marshall({ postId })
        }));

        return {
            statusCode: 204,
            body: ''
        };
    } catch (error) {
        console.error('Error deleting post:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};

export const getAll = async (event: LambdaEvent) => {
    try {
        const { Items } = await dynamoDBClient.send(new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE_POSTS,
            Limit: 100
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Items?.map(item => unmarshall(item)) || [])
        };
    } catch (error) {
        console.error('Error fetching posts:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};