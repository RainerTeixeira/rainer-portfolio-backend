import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import {
  DynamoDBClient,
  DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  TranslateConfig,
  GetCommand,
  PutCommand,
  UpdateCommand,
  GetCommandInput,
  PutCommandInput,
  GetCommandOutput,
  PutCommandOutput,
  UpdateCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';

dotenv.config();

/**
 * Exceção personalizada para validação.
 */
class ValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationException';
  }
}

/**
 * Classe de erro personalizada para operações no DynamoDB.
 */
export class DynamoDBError extends Error {
  public readonly originalError: unknown;

  constructor(message: string, originalError: unknown) {
    super(message);
    this.name = 'DynamoDBError';
    this.originalError = originalError;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DynamoDBError);
    }
  }
}

/**
 * @Service - DynamoDbService
 *
 * Esta classe fornece os métodos para interagir com o DynamoDB.
 */
@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly docClient: DynamoDBDocumentClient;
  private static instance: DynamoDbService;

  private constructor() {
    this.logger.log('Iniciando construtor do DynamoDbService');
    this.logger.log(`Região AWS: ${process.env.AWS_REGION}`);
    this.logger.log(`Endpoint DynamoDB: ${process.env.DYNAMODB_ENDPOINT || 'default (AWS online)'}`);

    const clientConfig: DynamoDBClientConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT }),
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

    try {
      this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig), translateConfig);
      this.logger.log('DynamoDB DocumentClient inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar o DynamoDB DocumentClient:', error);
      throw error;
    }
  }

  public static getInstance(): DynamoDbService {
    if (!DynamoDbService.instance) {
      DynamoDbService.instance = new DynamoDbService();
    }
    return DynamoDbService.instance;
  }

  /**
   * Obtém um item do DynamoDB.
   * @param params - Os parâmetros para a operação de obtenção.
   * @returns Uma Promise que resolve para o item obtido.
   */
  async getItem(params: GetCommandInput): Promise<GetCommandOutput> {
    if (!params.Key || Object.keys(params.Key).length === 0) {
      throw new ValidationException('Chave fornecida não corresponde ao esquema esperado');
    }
    try {
      for (const key in params.Key) {
        if (typeof params.Key[key] !== 'string') {
          params.Key[key] = String(params.Key[key]);
        }
      }
      return await this.docClient.send(new GetCommand(params));
    } catch (error) {
      this.handleError('getItem', error, 'Erro na operação getItem');
    }
  }

  /**
   * Cria ou substitui um item no DynamoDB.
   */
  async putItem(params: PutCommandInput): Promise<PutCommandOutput> {
    try {
      return await this.docClient.send(new PutCommand(params));
    } catch (error) {
      this.handleError('putItem', error, 'Erro na operação putItem');
    }
  }

  /**
   * Atualiza um item existente no DynamoDB.
   */
  async updateItem(
    tableName: string,
    key: Record<string, string | number>,
    updateData: Record<string, unknown>
  ): Promise<UpdateCommandOutput> {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new ValidationException('Nenhum dado fornecido para atualização.');
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    let index = 0;
    for (const attribute in updateData) {
      if (updateData[attribute] !== undefined) {
        const namePlaceholder = `#attr${index}`;
        const valuePlaceholder = `:val${index}`;
        updateExpressions.push(`${namePlaceholder} = ${valuePlaceholder}`);
        expressionAttributeNames[namePlaceholder] = attribute;
        expressionAttributeValues[valuePlaceholder] = updateData[attribute];
        index++;
      }
    }

    try {
      return await this.docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }));
    } catch (error) {
      this.handleError('updateItem', error, 'Erro na operação updateItem');
    }
  }

  /**
   * Executa uma operação de consulta (query) no DynamoDB.
   */
  async query(params: QueryCommandInput): Promise<QueryCommandOutput> {
    try {
      return await this.docClient.send(new QueryCommand(params));
    } catch (error) {
      this.handleError('query', error, 'Erro na operação query');
    }
  }

  /**
   * Método para tratamento de erros.
   */
  private handleError(operationName: string, error: unknown, defaultMessage?: string): void {
    this.logger.error(`Erro em ${operationName}:`, error);
    throw new DynamoDBError(`Erro na operação ${operationName}: ${error instanceof Error ? error.message : defaultMessage}`, error);
  }
}
