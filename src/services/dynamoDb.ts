import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromEnv } from "@aws-sdk/credential-provider-env";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

const dynamoDBConfig = {
    region: process.env.DYNAMODB_REGION || "us-east-1",
    credentials: fromNodeProviderChain() // ambiente certo
};

export const dynamoDBClient = new DynamoDBClient(dynamoDBConfig);
