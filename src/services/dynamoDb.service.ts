// src/services/dynamoDb.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  TranslateConfig,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  ScanCommandInput,
  QueryCommandInput,
  BatchWriteCommandInput,
  BatchGetCommandInput,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly docClient: DynamoDBDocumentClient;

  constructor() {
    const clientConfig: DynamoDBClientConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.LOCAL_DYNAMO_ENDPOINT && {
        endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
      }),
    };

    const translateConfig: TranslateConfig = {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
        convertEmptyValues: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    };

    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient(clientConfig),
      translateConfig
    );
  }

  async getItem(params: GetCommandInput) {
    try {
      return await this.docClient.send(new GetCommand(params));
    } catch (error) {
      this.handleError(error, 'getItem');
    }
  }

  async putItem(params: PutCommandInput) {
    try {
      return await this.docClient.send(new PutCommand(params));
    } catch (error) {
      this.handleError(error, 'putItem');
    }
  }

  async updateItem(params: UpdateCommandInput) {
    try {
      return await this.docClient.send(new UpdateCommand(params));
    } catch (error) {
      this.handleError(error, 'updateItem');
    }
  }

  async deleteItem(params: DeleteCommandInput) {
    try {
      return await this.docClient.send(new DeleteCommand(params));
    } catch (error) {
      this.handleError(error, 'deleteItem');
    }
  }

  async scanItems(params: ScanCommandInput) {
    try {
      return await this.docClient.send(new ScanCommand(params));
    } catch (error) {
      this.handleError(error, 'scanItems');
    }
  }

  async queryItems(params: QueryCommandInput) {
    try {
      return await this.docClient.send(new QueryCommand(params));
    } catch (error) {
      this.handleError(error, 'queryItems');
    }
  }

  async batchWrite(params: BatchWriteCommandInput) {
    try {
      return await this.docClient.send(new BatchWriteCommand(params));
    } catch (error) {
      this.handleError(error, 'batchWrite');
    }
  }

  async batchGet(params: BatchGetCommandInput) {
    try {
      return await this.docClient.send(new BatchGetCommand(params));
    } catch (error) {
      this.handleError(error, 'batchGet');
    }
  }

  private handleError(error: any, operation: string): never {
    this.logger.error(`DynamoDB Error (${operation}): ${error.message}`, error.stack);

    throw new Error(this.mapErrorMessage(error, operation));
  }

  private mapErrorMessage(error: any, operation: string): string {
    const errorMessages: Record<string, string> = {
      ResourceNotFoundException: 'Recurso não encontrado',
      ProvisionedThroughputExceededException: 'Limite de capacidade excedido',
      ConditionalCheckFailedException: 'Condição de escrita não satisfeita',
      TransactionConflictException: 'Conflito em transação',
    };

    return errorMessages[error.name] || `Erro na operação ${operation}: ${error.message}`;
  }

  buildUpdateExpression(input: Record<string, any>, excludeKeys: string[] = []) {
    const updateKeys = Object.keys(input)
      .filter(key => !excludeKeys.includes(key))
      .filter(key => input[key] !== undefined);

    if (updateKeys.length === 0) return null;

    const UpdateExpression = `SET ${updateKeys
      .map((key, index) => `#field${index} = :value${index}`)
      .join(', ')}`;

    const ExpressionAttributeNames = updateKeys.reduce((acc, key, index) => ({
      ...acc,
      [`#field${index}`]: key,
    }), {});

    const ExpressionAttributeValues = updateKeys.reduce((acc, key, index) => ({
      ...acc,
      [`:value${index}`]: input[key],
    }), {});

    return {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    };
  }
}