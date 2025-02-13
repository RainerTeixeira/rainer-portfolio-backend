// src/services/dynamoDb.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  DynamoDBClient,
  DynamoDBClientConfig,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
  QueryCommand,
  BatchWriteItemCommand,
  BatchGetItemCommand,
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
      const command = new GetCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'getItem');
    }
  }

  async putItem(params: PutCommandInput) {
    try {
      const command = new PutCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'putItem');
    }
  }

  async updateItem(params: UpdateCommandInput) {
    try {
      const command = new UpdateCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'updateItem');
    }
  }

  async deleteItem(params: DeleteCommandInput) {
    try {
      const command = new DeleteCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'deleteItem');
    }
  }

  async scanItems(params: ScanCommandInput) {
    try {
      const command = new ScanCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'scanItems');
    }
  }

  async queryItems(params: QueryCommandInput) {
    try {
      const command = new QueryCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'queryItems');
    }
  }

  async batchWrite(params: BatchWriteCommandInput) {
    try {
      const command = new BatchWriteCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'batchWrite');
    }
  }

  async batchGet(params: BatchGetCommandInput) {
    try {
      const command = new BatchGetCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError(error, 'batchGet');
    }
  }

  buildUpdateExpression(
    input: Record<string, any>,
    excludeKeys: string[] = []
  ) {
    const updateKeys = Object.keys(input)
      .filter((key) => !excludeKeys.includes(key))
      .filter((key) => input[key] !== undefined);

    if (updateKeys.length === 0) return null;

    const UpdateExpression = `SET ${updateKeys
      .map((key, index) => `#field${index} = :value${index}`)
      .join(', ')}`;

    const ExpressionAttributeNames = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`#field${index}`]: key,
      }),
      {}
    );

    const ExpressionAttributeValues = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`:value${index}`]: input[key],
      }),
      {}
    );

    return {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    };
  }

  private handleError(error: any, operation: string): never {
    this.logger.error(
      `DynamoDB Error (${operation}): ${error.message}`,
      error.stack
    );

    const mappedError = new Error(this.mapErrorMessage(error, operation));
    mappedError.name = error.name || 'DynamoDBError';

    throw mappedError;
  }

  private mapErrorMessage(error: any, operation: string): string {
    const errorMessages: Record<string, string> = {
      ResourceNotFoundException: 'Recurso não encontrado',
      ProvisionedThroughputExceededException: 'Limite de capacidade excedido',
      ConditionalCheckFailedException: 'Condição de escrita não satisfeita',
      TransactionConflictException: 'Conflito em transação',
    };

    return (
      errorMessages[error.name] ||
      `Erro na operação ${operation}: ${error.message}`
    );
  }
}