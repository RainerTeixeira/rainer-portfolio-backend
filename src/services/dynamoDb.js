import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamoDBConfig = {
    region: process.env.DYNAMODB_REGION,
    credentials: {
        accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
        secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY
    }
};

if (process.env.NODE_ENV === 'dev') {
    Object.assign(dynamoDBConfig, {
        endpoint: 'http://localhost:8000',
        sslEnabled: false,
        region: 'localhost'
    });
}

export const dynamoDBClient = new DynamoDBClient(dynamoDBConfig);