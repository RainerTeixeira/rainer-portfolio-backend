import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

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
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  BatchWriteCommand,
  BatchGetCommand,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  ScanCommandInput,
  QueryCommandInput,
  BatchWriteCommandInput,
  BatchGetCommandInput,
  QueryCommandOutput,
  GetCommandOutput,
} from '@aws-sdk/lib-dynamodb';

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
  public readonly originalError: any;

  constructor(message: string, originalError: any) {
    super(message);
    this.name = 'DynamoDBError';
    this.originalError = originalError;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DynamoDBError);
    }
  }
}

/**
 * Serviço responsável por abstrair e fornecer uma interface para interações com o DynamoDB.
 * Utiliza o AWS SDK v3 e o DynamoDB Document Client para facilitar a manipulação de itens.
 */
@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly docClient: DynamoDBDocumentClient;

  constructor() {
    this.logger.log('Iniciando construtor do DynamoDbService');
    this.logger.log(`Região AWS: ${process.env.AWS_REGION}`);
    this.logger.log(`Endpoint DynamoDB: ${process.env.DYNAMODB_ENDPOINT || 'default (AWS online)'}`);

    // Configuração base do cliente DynamoDB (AWS SDK v3)
    const clientConfig: DynamoDBClientConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT }), // Usa o endpoint apenas se definido
    };

    // Configuração para tradução de dados no Document Client
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
      // Inicializa o DynamoDB Document Client
      this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig), translateConfig);
      this.logger.log('DynamoDB DocumentClient inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar o DynamoDB DocumentClient:', error);
      throw error;
    }

    this.logger.log('Construtor do DynamoDbService finalizado');
  }

  /**
   * Recupera um item do DynamoDB com base em sua chave primária.
   * Garante que os valores das chaves sejam convertidos para string.
   * @param params - Parâmetros para a operação GetCommand.
   * @returns O item recuperado do DynamoDB.
   * @throws ValidationException caso a chave esteja vazia.
   */
  async getItem(params: GetCommandInput): Promise<GetCommandOutput> {
    if (!params.Key || Object.keys(params.Key).length === 0) {
      throw new ValidationException('Chave fornecida não corresponde ao esquema esperado');
    }
    try {
      // Converte os valores das chaves para string
      for (const key in params.Key) {
        if (typeof params.Key[key] !== 'string') {
          params.Key[key] = String(params.Key[key]);
        }
      }
      const result = await this.docClient.send(new GetCommand(params));
      return result;
    } catch (error) {
      this.handleError('getItem', error, 'Erro na operação getItem');
    }
  }

  /**
   * Cria um novo item ou substitui um item existente no DynamoDB.
   * @param params - Parâmetros para a operação PutCommand.
   * @returns O resultado da operação PutCommand.
   */
  async putItem(params: PutCommandInput): Promise<any> {
    try {
      const command = new PutCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('putItem', error, 'Erro na operação putItem');
    }
  }

  /**
   * Atualiza um item existente no DynamoDB.
   * Integra a construção da expressão de atualização com base nos dados fornecidos.
   * @param tableName - Nome da tabela.
   * @param key - Chave primária do item a ser atualizado.
   * @param updateData - Dados a serem atualizados.
   * @returns O item atualizado (ALL_NEW) ou erro na operação.
   * @throws ValidationException caso não haja dados para atualização.
   */
  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updateData: Record<string, any>
  ): Promise<any> {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new ValidationException('Nenhum dado fornecido para atualização.');
    }

    // Construção da expressão de atualização
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

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

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    try {
      const command = new UpdateCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('updateItem', error, 'Erro na operação updateItem');
    }
  }

  /**
   * Deleta um item do DynamoDB com base em sua chave primária.
   * Valida a presença de chave composta, se aplicável.
   * @param params - Parâmetros para a operação DeleteCommand.
   * @returns O resultado da operação DeleteCommand.
   * @throws ValidationException caso a chave esteja ausente ou incompleta.
   */
  async deleteItem(params: DeleteCommandInput): Promise<any> {
    try {
      this.logger.log(`deleteItem: Iniciando operação com params: ${JSON.stringify(params)}`);
      if (!params.Key || Object.keys(params.Key).length === 0) {
        throw new ValidationException('Chave não fornecida para a operação deleteItem');
      }
      // Exemplo de verificação para chave composta
      if (!params.Key['categoryId#subcategoryId'] || !params.Key['postId']) {
        throw new ValidationException('Chave composta não fornecida para a operação deleteItem');
      }
      const command = new DeleteCommand(params);
      const result = await this.docClient.send(command);
      this.logger.log(`deleteItem: Operação concluída com sucesso: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.handleError('deleteItem', error, 'Erro na operação deleteItem');
    }
  }

  /**
   * Escaneia uma tabela inteira do DynamoDB.
   * **CUIDADO**: Esta operação pode ser ineficiente para tabelas grandes.
   * @param params - Parâmetros para a operação ScanCommand.
   * @returns O resultado da operação ScanCommand.
   */
  async scan(params: ScanCommandInput): Promise<any> {
    try {
      const command = new ScanCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('scan', error, 'Erro na operação scan');
    }
  }

  /**
   * Executa uma consulta (query) no DynamoDB.
   * Verifica se os parâmetros obrigatórios estão presentes antes de executar a operação.
   * @param params - Parâmetros para a operação QueryCommand.
   * @returns O resultado da operação QueryCommand.
   * @throws ValidationException caso os parâmetros obrigatórios estejam ausentes.
   */
  async query(params: QueryCommandInput): Promise<QueryCommandOutput> {
    if (
      !params.KeyConditionExpression ||
      !params.ExpressionAttributeValues ||
      Object.keys(params.ExpressionAttributeValues).length === 0
    ) {
      throw new ValidationException('KeyConditionExpression ou ExpressionAttributeValues não fornecidos ou vazios');
    }
    try {
      this.logger.log(`query: Iniciando operação com params: ${JSON.stringify(params)}`);
      const result = await this.docClient.send(new QueryCommand(params));
      this.logger.log(`query: Resposta completa do DynamoDB: ${JSON.stringify(result, null, 2)}`);
      return result;
    } catch (error) {
      this.handleError('query', error, 'Erro na operação query');
    }
  }

  /**
   * Executa operações de escrita em lote no DynamoDB.
   * @param params - Parâmetros para a operação BatchWriteCommand.
   * @returns O resultado da operação BatchWriteCommand.
   */
  async batchWrite(params: BatchWriteCommandInput): Promise<any> {
    try {
      const command = new BatchWriteCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('batchWrite', error, 'Erro na operação batchWrite');
    }
  }

  /**
   * Executa operações de leitura em lote no DynamoDB.
   * @param params - Parâmetros para a operação BatchGetCommand.
   * @returns O resultado da operação BatchGetCommand.
   */
  async batchGet(params: BatchGetCommandInput): Promise<any> {
    try {
      const command = new BatchGetCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('batchGet', error, 'Erro na operação batchGet');
    }
  }

  /**
   * Verifica se o DynamoDB DocumentClient está inicializado corretamente.
   * @returns true se estiver inicializado, false caso contrário.
   */
  isInitialized(): boolean {
    return !!this.docClient;
  }

  /**
   * Método privado para tratamento centralizado de erros do DynamoDB.
   * Registra o erro e lança uma exceção personalizada.
   * @param operationName - Nome da operação onde ocorreu o erro.
   * @param error - Objeto de erro capturado.
   * @param defaultMessage - Mensagem de erro padrão.
   * @throws DynamoDBError encapsulando o erro original.
   */
  private handleError(operationName: string, error: any, defaultMessage?: string): void {
    this.logger.error(`Erro em ${operationName}:`, error);
    const errorMessage = error instanceof Error && error.message ? error.message : defaultMessage || 'Erro desconhecido no DynamoDB';
    throw new DynamoDBError(`Erro na operação ${operationName}: ${errorMessage}`, error);
  }
}
