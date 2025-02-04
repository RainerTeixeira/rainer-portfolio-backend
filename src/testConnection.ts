import { dynamoDBClient } from './services/dynamoDb';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';

async function testDynamoDB() {
  try {
    const command = new ListTablesCommand({});
    const response = await dynamoDBClient.send(command);
    console.log('Tabelas disponíveis:', response.TableNames);
  } catch (error) {
    console.error('Erro ao conectar ao DynamoDB:', error);
  }
}

testDynamoDB();
