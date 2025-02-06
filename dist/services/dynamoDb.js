"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamoDBClient = void 0;
// src/services/dynamoDb.ts
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamoDBConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
};
const client = new client_dynamodb_1.DynamoDBClient(dynamoDBConfig);
exports.dynamoDBClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
