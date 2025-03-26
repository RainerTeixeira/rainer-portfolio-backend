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
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
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
  private readonly client: DynamoDBClient;

  constructor() {
    this.logger.log('Iniciando construtor do DynamoDbService');
    const region = process.env.AWS_REGION || 'us-east-1';
    this.logger.log(`Região AWS: ${region}`);

    this.client = new DynamoDBClient({
      region,
      endpoint: process.env.DYNAMO_ENDPOINT || undefined, // Use endpoint customizado se definido
    });
    this.logger.log('DynamoDB Client inicializado com sucesso');
  }

  async getItem(params: { TableName: string; Key: Record<string, unknown> }) {
    this.logger.log(`Executando getItem na tabela: ${params.TableName}`);
    this.logger.log(`Parâmetros: ${JSON.stringify(params)}`);
    try {
      const command = new GetCommand(params);
      const result = await this.client.send(command);
      return result;
    } catch (error) {
      this.logger.error('Erro em getItem:', error);
      throw error;
    }
  }

  /**
   * Cria ou substitui um item no DynamoDB.
   */
  async putItem(params: PutCommandInput): Promise<PutCommandOutput> {
    try {
      return await this.client.send(new PutCommand(params));
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
      return await this.client.send(new UpdateCommand({
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
      return await this.client.send(new QueryCommand(params));
    } catch (error) {
      this.handleError('query', error, 'Erro na operação query');
    }
  }

  /**
   * Executa uma operação de scan no DynamoDB.
   */
  async scan(params: ScanCommandInput): Promise<ScanCommandOutput> {
    this.logger.log(`Executando scan na tabela: ${params.TableName}`);
    try {
      const command = new ScanCommand(params);
      return await this.client.send(command);
    } catch (error) {
      this.handleError('scan', error, 'Erro na operação scan');
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
