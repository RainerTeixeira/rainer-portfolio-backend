/**
 * Serviço para interagir com o Amazon DynamoDB utilizando o NestJS.
 * Fornece métodos para operações CRUD (get, put, update, delete) e para consultas (query e scan).
 * Utiliza o AWS SDK para JavaScript (v3) e a camada de abstração DynamoDBDocumentClient para simplificar
 * a conversão entre tipos do DynamoDB e objetos JavaScript.
 */

import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  type GetCommandInput,
  type PutCommandInput,
  type UpdateCommandInput,
  type DeleteCommandInput,
  type QueryCommandInput,
  type ScanCommandInput,
  type BatchGetCommandInput,
  type BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';

/**
 * Exceção customizada para operações DynamoDB com:
 * - Contexto completo da operação
 * - Metadados de diagnóstico
 * - Stack trace original preservado
 */
export class DynamoDBOperationError extends Error {
  constructor(
    public readonly operation: string,
    message: string,
    public readonly context: {
      table?: string;
      originalError?: string;
      params?: Record<string, any>;
    }
  ) {
    super(message);
    this.name = 'DynamoDBOperationError';
    Error.captureStackTrace?.(this, DynamoDBOperationError);
  }
}

/**
 * Serviço de alto nível para operações DynamoDB com:
 * - Conversão automática de tipos JavaScript <-> DynamoDB
 * - Logging detalhado para auditoria
 * - Controle transacional implícito
 * - Suporte completo a operações CRUD + queries
 */
@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly docClient: DynamoDBDocumentClient;

  constructor() {
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: process.env.DYNAMO_ENDPOINT,
      }),
      {
        marshallOptions: {
          removeUndefinedValues: true,
          convertClassInstanceToMap: true,
        },
        unmarshallOptions: {
          wrapNumbers: false,
        },
      }
    );
  }

  /**
   * Operação GET para recuperar um único item
   * @param params Parâmetros da operação
   * @returns Item recuperado ou null
   */
  async getItem(params: GetCommandInput) {
    return this.executeOperation('get', params, () =>
      this.docClient.send(new GetCommand(params))
    );
  }

  /**
   * Operação PUT para criar/atualizar item
   * @param params Parâmetros da operação
   * @returns Metadados da operação
   */
  async putItem(params: PutCommandInput) {
    return this.executeOperation('put', params, () =>
      this.docClient.send(new PutCommand(params))
    );
  }

  /**
   * Operação UPDATE para atualização parcial
   * @param params Parâmetros da operação
   * @returns Item atualizado
   */
  async updateItem(params: UpdateCommandInput) {
    return this.executeOperation('update', params, () =>
      this.docClient.send(new UpdateCommand(params))
    );
  }

  /**
   * Operação DELETE para remover item
   * @param params Parâmetros da operação
   * @returns Metadados da operação
   */
  async deleteItem(params: DeleteCommandInput) {
    return this.executeOperation('delete', params, () =>
      this.docClient.send(new DeleteCommand(params))
    );
  }

  /**
   * Operação QUERY para consultas em índices
   * @param params Parâmetros da query
   * @returns Conjunto de resultados paginados
   */
  async query(params: QueryCommandInput) {
    return this.executeOperation('query', params, () =>
      this.docClient.send(new QueryCommand(params))
  }

  /**
   * Operação SCAN para varredura completa da tabela
   * @param params Parâmetros do scan
   * @returns Todos os itens correspondentes
   */
  async scan(params: ScanCommandInput) {
    return this.executeOperation('scan', params, () =>
      this.docClient.send(new ScanCommand(params))
    );
  }

  /**
   * Operação BatchGet para múltiplas leituras
   * @param params Parâmetros da operação
   * @returns Itens recuperados
   */
  async batchGet(params: BatchGetCommandInput) {
    return this.executeOperation('batchGet', params, () =>
      this.docClient.send(new BatchGetCommand(params))
    );
  }

  /**
   * Operação BatchWrite para múltiplas escritas
   * @param params Parâmetros da operação
   * @returns Resultado das operações
   */
  async batchWrite(params: BatchWriteCommandInput) {
    return this.executeOperation('batchWrite', params, () =>
      this.docClient.send(new BatchWriteCommand(params))
    );
  }

  /**
   * Método base para execução de operações com:
   * - Controle de tempo de execução
   * - Logging contextual
   * - Formatação padronizada de erros
   */
  private async executeOperation<T>(
    operation: string,
    params: Record<string, any>,
    handler: () => Promise<T>
  ) {
    const table = params.TableName || 'unknown-table';
    const startTime = Date.now();

    try {
      this.logger.log(`[${operation}] Iniciando em ${table}`);
      this.logger.debug(`Parâmetros: ${JSON.stringify(params, null, 2)}`);

      const result = await handler();
      const duration = Date.now() - startTime;

      this.logger.log(`[${operation}] Sucesso em ${table} (${duration}ms)`);
      return {
        success: true,
        data: result,
        metadata: {
          operation,
          table,
          duration,
          capacityUnits: (result as any)?.ConsumedCapacity
        }
      };

    } catch (error) {
      this.logger.error(`[${operation}] Falha em ${table}: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      this.logger.error(`Contexto: ${JSON.stringify(params, null, 2)}`);

      throw new DynamoDBOperationError(
        operation,
        `Falha na operação ${operation}`,
        {
          table,
          originalError: error.code,
          params
        }
      );
    }
  }
}