"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamoDBClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const credential_providers_1 = require("@aws-sdk/credential-providers");
const dynamoDBConfig = {
    region: process.env.DYNAMODB_REGION || "us-east-1",
    credentials: (0, credential_providers_1.fromNodeProviderChain)() // ambiente certo
};
exports.dynamoDBClient = new client_dynamodb_1.DynamoDBClient(dynamoDBConfig);
//# sourceMappingURL=dynamoDb.js.map