import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv'; // Importa dotenv para carregar variáveis do .env

dotenv.config(); // Carrega as variáveis de ambiente do .env para o process.env

// Importa o DynamoDBClient e sua configuração do pacote correto
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

// Importa o DynamoDBDocumentClient, os comandos e os tipos do Document Client
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

// Adicione a definição da classe ValidationException
class ValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationException';
  }
}

/**
 * Serviço responsável por abstrair e fornecer uma interface para interações com o banco de dados DynamoDB.
 * Utiliza o AWS SDK v3 e o DynamoDB Document Client para facilitar a manipulação de itens.
 */
@Injectable()
export class DynamoDbService {
  private static instance: DynamoDbService;
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly docClient: DynamoDBDocumentClient;

  constructor() {
    if (DynamoDbService.instance) {
      return DynamoDbService.instance;
    }

    this.logger.log('DynamoDbService constructor iniciado');
    this.logger.log(`AWS Region: ${process.env.AWS_REGION}`);
    this.logger.log(`DynamoDB Endpoint: ${process.env.DYNAMODB_ENDPOINT}`);

    // Configuração base do cliente DynamoDB (AWS SDK v3)
    const clientConfig: DynamoDBClientConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.LOCAL_DYNAMO_ENDPOINT && {
        endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
      }),
    };

    // Configuração de tradução para o Document Client.
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
      // Cria e inicializa o DynamoDB Document Client com o cliente base e as opções de tradução
      this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig), translateConfig);
      this.logger.log('DynamoDB DocumentClient inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar DynamoDB DocumentClient:', error);
      throw error;
    }

    DynamoDbService.instance = this;
    this.logger.log('DynamoDbService constructor finalizado');
  }

  static getInstance(): DynamoDbService {
    if (!DynamoDbService.instance) {
      DynamoDbService.instance = new DynamoDbService();
    }
    return DynamoDbService.instance;
  }

  /**
   * Recupera um item do DynamoDB com base em sua chave primária.
   * @param params - Parâmetros para a operação GetCommand.
   * @returns O item recuperado do DynamoDB.
   */
  async getItem(params: GetCommandInput): Promise<GetCommandOutput> {
    if (!params.Key || Object.keys(params.Key).length === 0) {
      throw new ValidationException('O elemento-chave fornecido não corresponde ao esquema esperado');
    }
    try {
      // Verifique se as chaves estão sendo passadas corretamente
      if (!params.Key || Object.keys(params.Key).length === 0) {
        throw new Error('Chave não fornecida para a operação getItem');
      }

      // Garante que todos os valores das chaves sejam strings
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
   * @param params - Parâmetros para a operação UpdateCommand.
   * @returns O resultado da operação UpdateCommand.
   */
  async updateItem(params: UpdateCommandInput): Promise<any> {
    try {
      const command = new UpdateCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('updateItem', error, 'Erro na operação updateItem');
    }
  }

  /**
   * Deleta um item do DynamoDB com base em sua chave primária.
   * @param params - Parâmetros para a operação DeleteCommand.
   * @returns O resultado da operação DeleteCommand.
   */
  async deleteItem(params: DeleteCommandInput): Promise<any> {
    try {
      const command = new DeleteCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('deleteItem', error, 'Erro na operação deleteItem');
    }
  }

  /**
   * Escaneia uma tabela inteira do DynamoDB.
   * **CUIDADO**: Operação ineficiente para tabelas grandes.
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
   * Consulta itens do DynamoDB utilizando a operação Query.
   * @param params - Parâmetros para a operação QueryCommand.
   * @returns O resultado da operação QueryCommand.
   */
  async queryItems(params: QueryCommandInput): Promise<any> {
    try {
      const command = new QueryCommand(params);
      return await this.docClient.send(command);
    } catch (error) {
      this.handleError('queryItems', error, 'Erro na operação queryItems');
    }
  }

  /**
   * Consulta itens do DynamoDB utilizando a operação Query.
   * @param params - Parâmetros para a operação QueryCommand.
   * @returns O resultado da operação QueryCommand.
   */
  async query(params: QueryCommandInput): Promise<QueryCommandOutput> {
    if (!params.ExpressionAttributeValues || Object.keys(params.ExpressionAttributeValues).length === 0) {
      throw new ValidationException('ExpressionAttributeValues must not be empty');
    }
    try {
      this.logger.log(`query: Iniciando operação query com params: ${JSON.stringify(params)}`);
      if (!params.KeyConditionExpression || !params.ExpressionAttributeValues || Object.keys(params.ExpressionAttributeValues).length === 0) {
        throw new Error('KeyConditionExpression ou ExpressionAttributeValues não fornecidos ou vazios para operação query');
      }
      const result = await this.docClient.send(new QueryCommand(params));
      this.logger.log(`query: Resposta completa do DynamoDB SDK: ${JSON.stringify(result, null, 2)}`);
      return result;
    } catch (error) {
      this.handleError('query', error, 'Erro na operação query');
    }
  }

  /**
   * Realiza operações de escrita em lote no DynamoDB.
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
   * Realiza operações de leitura em lote no DynamoDB.
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
   * Método utilitário para construir dinamicamente expressões de atualização para o DynamoDB.
   * @param input - Objeto contendo os campos e valores a serem atualizados.
   * @param excludeKeys - Lista de chaves a serem excluídas da expressão de atualização.
   * @returns Um objeto contendo a expressão de atualização, nomes e valores de atributos.
   */
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
      .join(', ')}, #modifiedDate = :modifiedDate`;

    const ExpressionAttributeNames = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`#field${index}`]: key,
      }),
      { '#modifiedDate': 'modifiedDate' }
    );

    const ExpressionAttributeValues = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`:value${index}`]: input[key],
      }),
      { ':modifiedDate': new Date().toISOString() }
    );

    return {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    };
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
   * @param operationName - Nome da operação onde ocorreu o erro.
   * @param error - Objeto de erro capturado.
   * @param defaultMessage - Mensagem de erro padrão a ser usada caso o erro não tenha uma mensagem específica.
   */
  private handleError(operationName: string, error: any, defaultMessage?: string): void {
    this.logger.error(`DynamoDB Erro em ${operationName}:`, error);

    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : defaultMessage || 'Erro desconhecido do DynamoDB';

    throw new DynamoDBError(`Erro na operação ${operationName}: ${errorMessage}`, error);
  }
}

// Classe de Erro Personalizada para DynamoDB
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
