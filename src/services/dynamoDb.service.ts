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
  DeleteCommand, // Adicionado
  QueryCommand,
  ScanCommand,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput, // Adicionado
  QueryCommandInput,
  ScanCommandInput,
  GetCommandOutput,
  PutCommandOutput,
  UpdateCommandOutput,
  DeleteCommandOutput, // Adicionado
  QueryCommandOutput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';

dotenv.config();

/**
 * Exceção personalizada para erros durante operações no DynamoDB.
 */
export class DynamoDBOperationError extends Error {
  public readonly originalError: unknown;
  public readonly operationName: string;

  /**
   * Cria uma instância de DynamoDBOperationError.
   * @param operationName - O nome da operação do DynamoDB que falhou (ex: 'getItem', 'putItem').
   * @param message - A mensagem de erro descritiva.
   * @param originalError - O erro original capturado.
   */
  constructor(operationName: string, message: string, originalError: unknown) {
    super(message);
    this.name = 'DynamoDBOperationError';
    this.operationName = operationName;
    this.originalError = originalError;
    // Mantém o stack trace adequado
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DynamoDBOperationError);
    }
  }
}

/**
 * @Injectable
 * @Service DynamoDbService
 * @description
 * Serviço encapsulado para interagir com o AWS DynamoDB.
 * Utiliza o DynamoDBDocumentClient do AWS SDK v3 para facilitar a manipulação
 * de objetos JavaScript diretamente, sem a necessidade de marshalling/unmarshalling manual.
 */
@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly client: DynamoDBClient;
  private readonly docClient: DynamoDBDocumentClient;

  constructor() {
    this.logger.log('Inicializando DynamoDbService...');
    const region = process.env.AWS_REGION || 'us-east-1'; // Defina sua região padrão
    const endpoint = process.env.DYNAMO_ENDPOINT || undefined; // Para DynamoDB Local ou testes

    const clientConfig: DynamoDBClientConfig = { region };
    if (endpoint) {
      clientConfig.endpoint = endpoint;
      this.logger.log(`Usando endpoint DynamoDB customizado: ${endpoint}`);
    }

    this.client = new DynamoDBClient(clientConfig);

    // Configuração para traduzir automaticamente entre tipos JS e DynamoDB
    const translateConfig: TranslateConfig = {
      marshallOptions: {
        // Tratar valores vazios (ex: "", [], {}) como NULL? (padrão: false)
        convertEmptyValues: false, // Mantenha false a menos que tenha um motivo específico
        // Remover atributos com valor undefined? (padrão: false)
        removeUndefinedValues: true, // Útil para updates parciais
        // Converter objetos `Buffer` e `TypedArray` em `Binary`? (padrão: true)
        convertClassInstanceToMap: false, // Mantenha false a menos que saiba o que está fazendo
      },
      unmarshallOptions: {
        // Converter números grandes (fora do Number.MAX_SAFE_INTEGER) para BigInt? (padrão: false)
        wrapNumbers: false, // Mantenha false a menos que trabalhe com números muito grandes
      },
    };

    this.docClient = DynamoDBDocumentClient.from(this.client, translateConfig);
    this.logger.log(
      `DynamoDB Client e DocumentClient inicializados para a região: ${region}`,
    );
  }

  /**
   * Busca um único item no DynamoDB pela sua chave primária.
   * @param params - Input para o GetCommand, requer TableName e Key.
   * @returns Promise<GetCommandOutput> - O resultado do comando Get, incluindo o Item encontrado (se houver).
   * @throws {DynamoDBOperationError} - Se ocorrer um erro durante a operação.
   */
  async getItem(params: GetCommandInput): Promise<GetCommandOutput> {
    const operation = 'getItem';
    this.logOperationStart(operation, params.TableName, params.Key);
    try {
      if (!params.Key || Object.keys(params.Key).length === 0) {
        throw new Error('A chave primária (Key) é obrigatória.');
      }
      const command = new GetCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, params.TableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error);
    }
  }

  /**
   * Cria um novo item ou substitui um item existente com a mesma chave primária.
   * @param params - Input para o PutCommand, requer TableName e Item. O Item deve ser um objeto JavaScript.
   * @returns Promise<PutCommandOutput> - O resultado do comando Put.
   * @throws {DynamoDBOperationError} - Se ocorrer um erro durante a operação.
   */
  async putItem(params: PutCommandInput): Promise<PutCommandOutput> {
    const operation = 'putItem';
    this.logOperationStart(operation, params.TableName, params.Item);
    try {
      if (!params.Item || Object.keys(params.Item).length === 0) {
        throw new Error('O item (Item) a ser inserido é obrigatório.');
      }
      const command = new PutCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, params.TableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error);
    }
  }

  /**
   * Atualiza atributos de um item existente no DynamoDB.
   * Constrói dinamicamente a UpdateExpression com base nos dados fornecidos.
   * @param tableName - O nome da tabela.
   * @param key - A chave primária do item a ser atualizado (ex: { id: '123' }).
   * @param updateData - Um objeto contendo os atributos a serem atualizados (ex: { status: 'ativo', updatedAt: 'data' }).
   * Atributos com valor `undefined` serão ignorados se `removeUndefinedValues` for true.
   * @param returnValues - (Opcional) Controla quais valores são retornados após a atualização. Padrão 'ALL_NEW'.
   * Outras opções: 'NONE', 'ALL_OLD', 'UPDATED_NEW', 'UPDATED_OLD'.
   * @returns Promise<UpdateCommandOutput> - O resultado do comando Update, incluindo os atributos (se solicitado por ReturnValues).
   * @throws {DynamoDBOperationError} - Se ocorrer um erro ou se `updateData` estiver vazio.
   */
  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updateData: Record<string, any>,
    returnValues: UpdateCommandInput['ReturnValues'] = 'ALL_NEW', // Padrão ALL_NEW
  ): Promise<UpdateCommandOutput> {
    const operation = 'updateItem';
    this.logOperationStart(operation, tableName, { key, updateData });

    if (!updateData || Object.keys(updateData).length === 0) {
      this.logger.warn(`[${operation}] Tentativa de atualização sem dados para a chave: ${JSON.stringify(key)} na tabela ${tableName}`);
      // Decide o que fazer: pode lançar erro ou retornar como sucesso sem alteração
      // Lançar erro é mais seguro para indicar que nada foi atualizado.
      throw new DynamoDBOperationError(operation, `Nenhum dado fornecido para atualização do item com chave ${JSON.stringify(key)}`, null);
      // Alternativa: retornar um objeto vazio ou similar se a lógica de negócio permitir
      // return { Attributes: {}, $metadata: {} };
    }
    if (!key || Object.keys(key).length === 0) {
      throw new DynamoDBOperationError(operation, `A chave primária (Key) é obrigatória para a operação de atualização na tabela ${tableName}`, null);
    }


    // Constrói a expressão de atualização dinamicamente
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};
    let nameIndex = 0;
    let valueIndex = 0;

    for (const attributeKey in updateData) {
      // Ignora se o valor for undefined (se removeUndefinedValues for true no docClient)
      // Mas verificamos explicitamente para não gerar expressão inválida
      if (updateData[attributeKey] !== undefined) {
        const namePlaceholder = `#attr${nameIndex++}`;
        const valuePlaceholder = `:val${valueIndex++}`;

        updateExpressionParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
        expressionAttributeNames[namePlaceholder] = attributeKey; // Mapeia placeholder para nome real
        expressionAttributeValues[valuePlaceholder] = updateData[attributeKey]; // Mapeia placeholder para valor real
      }
    }

    // Se após filtrar undefined não sobrar nada, lança erro.
    if (updateExpressionParts.length === 0) {
      throw new DynamoDBOperationError(operation, `Nenhum dado válido (não undefined) fornecido para atualização do item com chave ${JSON.stringify(key)}`, null);
    }

    const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: returnValues,
    };

    this.logger.debug(`[${operation}] Parâmetros construídos para UpdateCommand: ${JSON.stringify(params)}`);

    try {
      const command = new UpdateCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, tableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, tableName, error, { key, updateData });
    }
  }

  /**
   * Deleta um item do DynamoDB pela sua chave primária.
   * @param params - Input para o DeleteCommand, requer TableName e Key.
   * @returns Promise<DeleteCommandOutput> - O resultado do comando Delete.
   * @throws {DynamoDBOperationError} - Se ocorrer um erro durante a operação.
   */
  async deleteItem(params: DeleteCommandInput): Promise<DeleteCommandOutput> {
    const operation = 'deleteItem';
    this.logOperationStart(operation, params.TableName, params.Key);
    try {
      if (!params.Key || Object.keys(params.Key).length === 0) {
        throw new Error('A chave primária (Key) é obrigatória para deletar.');
      }
      const command = new DeleteCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, params.TableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error, params.Key);
    }
  }

  /**
   * Realiza uma operação de Scan na tabela, retornando todos os itens (com possibilidade de paginação).
   * Use com cautela em tabelas grandes, pois Scan lê todos os itens. Prefira Query quando possível.
   * @param params - Input para o ScanCommand, requer TableName. Pode incluir FilterExpression, Limit, etc.
   * @returns Promise<ScanCommandOutput> - O resultado do comando Scan, incluindo os Itens encontrados.
   * @throws {DynamoDBOperationError} - Se ocorrer um erro durante a operação.
   */
  async scan(params: ScanCommandInput): Promise<ScanCommandOutput> {
    const operation = 'scan';
    this.logOperationStart(operation, params.TableName, params);
    try {
      const command = new ScanCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(
        operation,
        params.TableName,
        `Itens encontrados: ${result.Items?.length ?? 0}`,
      );
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error, params);
    }
  }

  /**
   * Realiza uma operação de Query na tabela ou índice, buscando itens que correspondem a uma chave de partição
   * e, opcionalmente, a condições na chave de ordenação ou outros atributos.
   * @param params - Input para o QueryCommand, requer TableName e KeyConditionExpression.
   * @returns Promise<QueryCommandOutput> - O resultado do comando Query, incluindo os Itens encontrados.
   * @throws {DynamoDBOperationError} - Se ocorrer um erro durante a operação.
   */
  async query(params: QueryCommandInput): Promise<QueryCommandOutput> {
    try {
      // Ajusta os valores de ExpressionAttributeValues
      if (params.ExpressionAttributeValues) {
        params.ExpressionAttributeValues = this.adjustExpressionAttributeValues(params.ExpressionAttributeValues);
      }

      const result = await this.docClient.send(new QueryCommand(params));
      return result;
    } catch (error) {
      this.handleError('query', params.TableName, error);
      throw error;
    }
  }

  /**
   * Ajusta os valores de ExpressionAttributeValues para o formato esperado pelo DynamoDB.
   * @param values - Os valores a serem ajustados.
   * @returns Os valores ajustados.
   */
  private adjustExpressionAttributeValues(values: Record<string, any>): Record<string, any> {
    const adjustedValues: Record<string, any> = {};
    for (const key in values) {
      const value = values[key];
      if (typeof value === 'string') {
        adjustedValues[key] = { S: value }; // Converte strings para o formato esperado
      } else if (typeof value === 'number') {
        adjustedValues[key] = { N: value.toString() }; // Converte números para strings
      } else if (Array.isArray(value)) {
        adjustedValues[key] = { L: value.map((v) => ({ S: String(v) })) }; // Exemplo para listas de strings
      } else {
        adjustedValues[key] = value; // Mantém outros tipos como estão
      }
    }
    return adjustedValues;
  }

  /**
   * Constrói dinamicamente a UpdateExpression e os valores de atributos para o DynamoDB.
   * @param updateData - Dados a serem atualizados.
   * @returns Um objeto contendo a UpdateExpression e ExpressionAttributeValues.
   */
  buildUpdateExpression(updateData: Record<string, any>): {
    UpdateExpression: string;
    ExpressionAttributeValues: Record<string, any>;
  } {
    const updateExpressionParts: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressionParts.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    return {
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
    };
  }

  // --- Métodos auxiliares ---

  /**
   * Loga o início de uma operação no DynamoDB.
   * @param operationName - Nome da operação (ex: 'getItem').
   * @param tableName - Nome da tabela alvo.
   * @param details - Detalhes adicionais (ex: Key, Item, parâmetros).
   */
  private logOperationStart(
    operationName: string,
    tableName: string | undefined,
    details?: any,
  ): void {
    this.logger.log(
      `[${operationName}] Iniciando operação na tabela: ${tableName ?? 'Não especificada'
      }...`,
    );
    if (details) {
      this.logger.debug(
        `[${operationName}] Detalhes: ${JSON.stringify(details)}`,
      );
    }
  }

  /**
   * Loga o sucesso de uma operação no DynamoDB.
   * @param operationName - Nome da operação.
   * @param tableName - Nome da tabela alvo.
   * @param result - O resultado da operação ou uma mensagem de sucesso.
   */
  private logOperationSuccess(
    operationName: string,
    tableName: string | undefined,
    result?: any,
  ): void {
    this.logger.log(
      `[${operationName}] Operação na tabela ${tableName ?? 'Não especificada'
      } concluída com sucesso.`,
    );
    if (result && typeof result !== 'string') {
      // Evita logar objetos muito grandes, como listas de itens de scan/query
      if (result.Items) {
        this.logger.debug(`[${operationName}] Contagem de itens: ${result.Items.length}`);
      } else if (result.Attributes) {
        this.logger.debug(`[${operationName}] Atributos retornados: ${JSON.stringify(result.Attributes)}`);
      } else if (result.Item) {
        this.logger.debug(`[${operationName}] Item retornado: ${JSON.stringify(result.Item)}`);
      } else {
        // Log genérico para outros casos (Put, Delete)
        this.logger.debug(`[${operationName}] Metadados da resposta: ${JSON.stringify(result.$metadata)}`);
      }

    } else if (typeof result === 'string') {
      this.logger.debug(`[${operationName}] Detalhes do sucesso: ${result}`);
    }
  }

  /**
   * Manipula erros ocorridos durante as operações do DynamoDB.
   * Loga o erro e lança uma exceção DynamoDBOperationError encapsulada.
   * @param operationName - Nome da operação onde o erro ocorreu.
   * @param tableName - Nome da tabela alvo.
   * @param error - O erro capturado.
   * @param context - (Opcional) Contexto adicional (parâmetros da operação) para logging.
   * @throws {DynamoDBOperationError} - Sempre lança esta exceção.
   */
  private handleError(
    operationName: string,
    tableName: string | undefined,
    error: unknown,
    context?: any,
  ): never {
    const baseMessage = `Erro na operação [${operationName}] na tabela ${tableName ?? 'Não especificada'
      }`;
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    this.logger.error(`${baseMessage}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    if (context) {
      this.logger.error(`[${operationName}] Contexto do erro: ${JSON.stringify(context)}`);
    }

    // Lança uma exceção personalizada encapsulando a original
    throw new DynamoDBOperationError(
      operationName,
      `${baseMessage}. Detalhes: ${errorMessage}`,
      error,
    );
  }
}