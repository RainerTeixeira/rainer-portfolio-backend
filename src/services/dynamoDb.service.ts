/**
 * Serviço para integração com Amazon DynamoDB
 * 
 * Responsabilidades principais:
 * - Fornecer operações CRUD seguras e tipadas
 * - Gerenciar conexão com o DynamoDB
 * - Converter automaticamente tipos JavaScript para DynamoDB
 * - Logging detalhado de operações
 * - Tratamento padronizado de erros
 * 
 * Estratégias chave:
 * - Uso do DynamoDBDocumentClient para conversão automática
 * - Métodos genéricos para operações básicas
 * - Controle de tempo de execução para monitoramento
 * - Auditoria completa de operações
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
 * Exceção customizada para operações DynamoDB
 * 
 * Contém informações contextuais para debug:
 * @property operation - Nome da operação que falhou
 * @property context.table - Nome da tabela envolvida
 * @property context.originalError - Erro original do DynamoDB
 * @property context.params - Parâmetros da operação
 */
export class DynamoDBOperationError extends Error {
  constructor(
    public readonly operation: string,
    message: string,
    public readonly context: {
      table?: string;
      originalError?: string;
      params?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'DynamoDBOperationError';
    Error.captureStackTrace?.(this, DynamoDBOperationError);
  }
}

@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly docClient: DynamoDBDocumentClient;

  /**
   * Configura o cliente DynamoDB com opções de:
   * - Região AWS
   * - Endpoint customizado (para ambientes locais)
   * - Políticas de marshalling/unmarshalling
   */
  constructor() {
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY || '',
        },

      }),
      {
        marshallOptions: {
          removeUndefinedValues: true, // Remove valores undefined
          convertClassInstanceToMap: true, // Converte classes para objetos
        },
        unmarshallOptions: {
          wrapNumbers: false, // Mantém números como números (evita BigInt)
        },
      }
    );
  }

  /**
   * Recupera um único item da tabela
   * @param params Parâmetros do comando Get
   * @returns Objeto contendo:
   * - success: Indicador de sucesso
   * - data: Resultado da operação
   * - metadata: Metadados de execução
   */
  async get(params: GetCommandInput) {
    if (!params.TableName || typeof params.TableName !== 'string' || !params.Key || typeof params.Key !== 'object' || Object.keys(params.Key).length === 0) {
      this.logger.error(`[get] Parâmetros inválidos: TableName ou Key ausentes`);
      throw new Error('Parâmetros inválidos para operação get: TableName e Key são obrigatórios.');
    }
    return this.executeOperation('get', params, () =>
      this.docClient.send(new GetCommand(params))
    );
  }

  /**
   * Cria ou substitui um item na tabela
   * @param params Parâmetros do comando Put
   * @returns Objeto com metadados da operação
   */
  async put(params: PutCommandInput) {
    return this.executeOperation('put', params, () =>
      this.docClient.send(new PutCommand(params))
    );
  }

  /**
   * Atualiza parcialmente um item existente
   * @param params Parâmetros do comando UpdateItem
   * @returns Item atualizado
   */
  async update(params: UpdateCommandInput) {
    return this.executeOperation('update', params, () =>
      this.docClient.send(new UpdateCommand(params))
    );
  }

  /**
   * Remove um item da tabela
   * @param params Parâmetros do comando Delete
   * @returns Metadados da operação
   */
  async delete(params: DeleteCommandInput) {
    return this.executeOperation('delete', params, () =>
      this.docClient.send(new DeleteCommand(params))
    );
  }

  /**
   * Executa consulta em índice primário ou secundário
   * @param params Parâmetros do comando Query
   * @returns Resultados paginados
   */
  async query(params: QueryCommandInput) {
    return this.executeOperation('query', params, () =>
      this.docClient.send(new QueryCommand(params))
    );
  }

  /**
   * Varredura completa da tabela (use com cuidado)
   * @param params Parâmetros do comando Scan
   * @returns Todos os itens correspondentes
   */
  async scan(params: ScanCommandInput) {
    return this.executeOperation('scan', params, () =>
      this.docClient.send(new ScanCommand(params))
    );
  }

  /**
   * Operação de leitura em lote
   * @param params Parâmetros do comando BatchGet
   * @returns Itens recuperados
   */
  async batchGet(params: BatchGetCommandInput) {
    return this.executeOperation('batchGet', params, () =>
      this.docClient.send(new BatchGetCommand(params))
    );
  }

  /**
   * Operação de escrita em lote
   * @param params Parâmetros do comando BatchWrite
   * @returns Resultado das operações
   */
  async batchWrite(params: BatchWriteCommandInput) {
    return this.executeOperation('batchWrite', params, () =>
      this.docClient.send(new BatchWriteCommand(params))
    );
  }

  /**
   * Executa operações com tratamento padronizado
   * 
   * Fluxo principal:
   * 1. Log inicial com parâmetros
   * 2. Execução da operação
   * 3. Log de sucesso com tempo de execução
   * 4. Retorno formatado
   * 5. Tratamento de erros com log detalhado
   * 
   * @param operation Nome da operação para logging
   * @param params Parâmetros da operação
   * @param handler Função de execução do comando
   */
  private async executeOperation<T>(
    operation: string,
    params: Record<string, unknown>,
    handler: () => Promise<T>
  ) {
    const table: string = params.TableName?.toString() || 'unknown-table';
    const startTime = Date.now();

    try {
      this.logOperationStart(operation, table, params);

      const result = await handler();
      const duration = Date.now() - startTime;

      this.logOperationSuccess(operation, table, duration);

      const consumed = (result as { ConsumedCapacity?: unknown })?.ConsumedCapacity;
      this.logger.debug(`[${operation}] Resultado: duration=${duration}ms${consumed ? `, ConsumedCapacity=${JSON.stringify(consumed)}` : ''}`);

      return this.formatSuccessResponse(operation, table, duration, result);

    } catch (error) {
      this.logOperationError(operation, table, error, params);
      throw this.formatErrorResponse(operation, table, error, params);
    }
  }

  /** Loga o início de uma operação */
  private logOperationStart(operation: string, table: string, params: Record<string, unknown>) {
    this.logger.log(`[${operation}] Iniciando em ${table}`);
    this.logger.debug(`Parâmetros: ${JSON.stringify(params, null, 2)}`);
  }

  /** Loga operação bem sucedida */
  private logOperationSuccess(operation: string, table: string, duration: number) {
    this.logger.log(`[${operation}] Sucesso em ${table} (${duration}ms)`);
  }

  /** Formata resposta de sucesso padronizada */
  private formatSuccessResponse<T>(operation: string, table: string, duration: number, result: T) {
    return {
      success: true,
      data: result,
      metadata: {
        operation,
        table,
        duration,
        capacityUnits: (result as { ConsumedCapacity?: number })?.ConsumedCapacity
      }
    };
  }

  /** Loga e trata erros da operação */
  private logOperationError(
    operation: string,
    table: string,
    error: unknown,
    params: Record<string, unknown>
  ): never {
    this.logger.error(`[${operation}] Falha em ${table}`);
    if (error instanceof Error) {
      this.logger.error(`Mensagem do erro: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
    } else {
      this.logger.error(`Erro desconhecido: ${JSON.stringify(error)}`);
    }
    this.logger.error(`Parâmetros completos: ${JSON.stringify(params, null, 2)}`);
    this.logger.error(`Contexto: operação=${operation}, tabela=${table}`);

    throw new DynamoDBOperationError(
      operation,
      `Falha na operação ${operation}`,
      {
        table,
        originalError: error instanceof Error ? error.message : String(error),
        params: { TableName: table, ...params }
      }
    );
  }

  /** Formata erro padronizado para lançamento */
  private formatErrorResponse(operation: string, table: string, error: unknown, params: Record<string, unknown>) {
    return new DynamoDBOperationError(
      operation,
      `Falha na operação ${operation}`,
      {
        table,
        originalError: error instanceof Error ? error.message : String(error),
        params
      }
    );
  }
}