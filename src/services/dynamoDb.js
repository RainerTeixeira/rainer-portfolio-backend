import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { fromEnvironment } from "@aws-sdk/credential-provider-env";
const dynamoDBConfig = {
    region: process.env.AWS_REGION || "us-east-1", // Pegando da variável de ambiente
    credentials: process.env.AWS_ACCESS_KEY_ID
        ? fromEnvironment() // Usa as variáveis de ambiente se existirem
        : fromIni({ profile: "default" }), // Usa as credenciais do AWS CLI (~/.aws/credentials)
};
export const dynamoDBClient = new DynamoDBClient(dynamoDBConfig);
//# sourceMappingURL=dynamoDb.js.map