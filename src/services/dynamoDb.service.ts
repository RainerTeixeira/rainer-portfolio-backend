/**
 * Serviço para interagir com o Amazon DynamoDB utilizando o NestJS.
 * Fornece métodos para operações CRUD (get, put, update, delete) e para consultas (query e scan).
 * Utiliza o AWS SDK para JavaScript (v3) e a camada de abstração DynamoDBDocumentClient para simplificar
 * a conversão entre tipos do DynamoDB e objetos JavaScript.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import {
  DynamoDBClient,
  DynamoDBClientConfig,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  TranslateConfig,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  QueryCommandInput,
  ScanCommandInput,
  GetCommandOutput,
  PutCommandOutput,
  UpdateCommandOutput,
  DeleteCommandOutput,
  QueryCommandOutput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';

// Carrega as variáveis de ambiente definidas no arquivo .env
dotenv.config();

/**
 * Classe personalizada para tratar erros de operações com o DynamoDB.
 * Estende a classe Error padrão e encapsula informações adicionais como o nome da operação e o erro original.
 */
export class DynamoDBOperationError extends Error {
  public readonly originalError: unknown;
  public readonly operationName: string;

  /**
   * Cria uma instância de DynamoDBOperationError.
   * @param operationName Nome da operação que falhou.
   * @param message Mensagem de erro descritiva.
   * @param originalError O erro original capturado.
   */
  constructor(operationName: string, message: string, originalError: unknown) {
    super(message);
    this.name = 'DynamoDBOperationError';
    this.operationName = operationName;
    this.originalError = originalError;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DynamoDBOperationError);
    }
  }
}

// Define um tipo que engloba os possíveis retornos dos comandos do DynamoDB
type DynamoDBCommandOutput =
  | GetCommandOutput
  | PutCommandOutput
  | UpdateCommandOutput
  | DeleteCommandOutput
  | QueryCommandOutput
  | ScanCommandOutput;

@Injectable()
export class DynamoDbService {
  // Instância do Logger do NestJS para registrar logs de operações e erros
  private readonly logger = new Logger(DynamoDbService.name);
  // Cliente base para comunicação com o DynamoDB
  private readonly client: DynamoDBClient;
  // Cliente document para operações simplificadas com o DynamoDB
  private readonly docClient: DynamoDBDocumentClient;

  /**
   * Construtor do serviço.
   * Inicializa o DynamoDBClient e o DynamoDBDocumentClient com as configurações obtidas das variáveis de ambiente.
   */
  constructor() {
    this.logger.log('Inicializando DynamoDbService...');
    // Obtém a região AWS a partir da variável de ambiente ou define como 'us-east-1' se não estiver definida
    const region = process.env.AWS_REGION || 'us-east-1';
    // Possível endpoint customizado para ambientes de desenvolvimento ou teste
    const endpoint = process.env.DYNAMO_ENDPOINT || undefined;

    const clientConfig: DynamoDBClientConfig = { region };
    if (endpoint) {
      clientConfig.endpoint = endpoint;
      this.logger.log(`Usando endpoint customizado: ${endpoint}`);
    }

    // Inicializa o cliente do DynamoDB com as configurações definidas
    this.client = new DynamoDBClient(clientConfig);

    // Configura as opções de tradução para conversão dos tipos do DynamoDB para objetos JavaScript
    const translateConfig: TranslateConfig = {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    };

    // Cria um único DocumentClient para melhorar a performance e evitar reconfigurações desnecessárias
    this.docClient = DynamoDBDocumentClient.from(this.client, translateConfig);
    this.logger.log(`Client e DocumentClient inicializados para a região: ${region}`);
  }

  /**
   * Recupera um item da tabela com base na chave primária.
   * @param params Objeto contendo os parâmetros da operação (nome da tabela e chave do item).
   * @returns A resposta do comando Get do DynamoDB.
   */
  async getItem(params: GetCommandInput): Promise<GetCommandOutput> {
    const operation = 'getItem';
    this.logOperationStart(operation, params.TableName, params.Key);
    try {
      // Valida se a chave primária foi informada
      if (!params.Key || Object.keys(params.Key).length === 0) {
        throw new Error('A chave primária (Key) é obrigatória.');
      }
      // Cria e envia o comando Get para o DynamoDB
      const command = new GetCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, params.TableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error);
    }
  }

  /**
   * Insere ou substitui um item em uma tabela do DynamoDB.
   * @param params Objeto contendo os parâmetros da operação (nome da tabela e item a ser inserido).
   * @returns A resposta do comando Put do DynamoDB.
   */
  async putItem(params: PutCommandInput): Promise<PutCommandOutput> {
    const operation = 'putItem';
    this.logOperationStart(operation, params.TableName, params.Item);
    try {
      // Verifica se o item a ser inserido foi informado
      if (!params.Item || Object.keys(params.Item).length === 0) {
        throw new Error('O item (Item) a ser inserido é obrigatório.');
      }
      // Cria e envia o comando Put para inserir o item
      const command = new PutCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, params.TableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error);
    }
  }

  /**
   * Atualiza atributos de um item existente na tabela.
   * @param tableName Nome da tabela.
   * @param key Objeto representando a chave primária do item.
   * @param updateData Objeto com os dados a serem atualizados.
   * @param returnValues Especifica os valores de retorno da operação, padrão 'ALL_NEW'.
   * @returns A resposta do comando Update do DynamoDB.
   */
  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updateData: Record<string, any>,
    returnValues: UpdateCommandInput['ReturnValues'] = 'ALL_NEW'
  ): Promise<UpdateCommandOutput> {
    const operation = 'updateItem';
    this.logOperationStart(operation, tableName, { key, updateData });

    // Validação: garante que há dados para atualizar
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new DynamoDBOperationError(
        operation,
        `Nenhum dado fornecido para atualização do item com chave ${JSON.stringify(key)}`,
        null
      );
    }
    // Validação: garante que a chave primária está presente
    if (!key || Object.keys(key).length === 0) {
      throw new DynamoDBOperationError(
        operation,
        `A chave primária (Key) é obrigatória para a atualização na tabela ${tableName}`,
        null
      );
    }

    // Prepara a expressão de atualização dinâmica
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, AttributeValue> = {};
    let index = 0;

    for (const attributeKey in updateData) {
      if (updateData[attributeKey] !== undefined) {
        const namePlaceholder = `#attr${index}`;
        const valuePlaceholder = `:val${index}`;
        updateExpressionParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
        expressionAttributeNames[namePlaceholder] = attributeKey;
        expressionAttributeValues[valuePlaceholder] = updateData[attributeKey];
        index++;
      }
    }

    // Verifica se foi construída alguma expressão válida
    if (updateExpressionParts.length === 0) {
      throw new DynamoDBOperationError(
        operation,
        `Nenhum dado válido fornecido para atualização do item com chave ${JSON.stringify(key)}`,
        null
      );
    }

    // Monta os parâmetros para o comando Update
    const paramsUpdate: UpdateCommandInput = {
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: returnValues,
    };

    try {
      const command = new UpdateCommand(paramsUpdate);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, tableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, tableName, error, { key, updateData });
    }
  }

  /**
   * Deleta um item de uma tabela com base na chave primária.
   * @param params Objeto contendo os parâmetros da operação (nome da tabela e chave do item).
   * @returns A resposta do comando Delete do DynamoDB.
   */
  async deleteItem(params: DeleteCommandInput): Promise<DeleteCommandOutput> {
    const operation = 'deleteItem';
    this.logOperationStart(operation, params.TableName, params.Key);
    try {
      // Valida se a chave primária foi informada para a deleção
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
   * Realiza uma varredura (scan) na tabela, retornando múltiplos itens.
   * @param params Objeto contendo os parâmetros da operação, podendo incluir ProjectionExpression para limitar os dados retornados.
   * @returns A resposta do comando Scan do DynamoDB.
   */
  async scan(params: ScanCommandInput): Promise<ScanCommandOutput> {
    const operation = 'scan';
    this.logOperationStart(operation, params.TableName, params);
    try {
      // Sugestão: sempre utilize ProjectionExpression para limitar os dados retornados e reduzir o consumo
      if (params.ProjectionExpression) {
        params.ExpressionAttributeNames = {
          ...(params.ExpressionAttributeNames || {}),
          '#st': 'status',
          '#vi': 'views',
        };
        params.ProjectionExpression = params.ProjectionExpression
          .replace(/status/g, '#st')
          .replace(/views/g, '#vi');
      }
      // Define um limite padrão para evitar varreduras pesadas na tabela
      params.Limit = params.Limit || 100;

      const command = new ScanCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, params.TableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error, params);
    }
  }

  /**
   * Executa uma consulta (query) na tabela baseada em condições específicas.
   * @param params Objeto contendo os parâmetros da operação, incluindo ExpressionAttributeValues e ExpressionAttributeNames.
   * @returns A resposta do comando Query do DynamoDB.
   */
  async query(params: QueryCommandInput): Promise<QueryCommandOutput> {
    const operation = 'query';
    this.logOperationStart(operation, params.TableName, params);

    // Valida se os valores das expressões foram definidos e não estão vazios
    if (params.ExpressionAttributeValues) {
      for (const [key, value] of Object.entries(params.ExpressionAttributeValues)) {
        if (value === undefined || (typeof value === 'object' && Object.keys(value).length === 0)) {
          throw new DynamoDBOperationError(
            operation,
            `O valor para ${key} em ExpressionAttributeValues está vazio ou indefinido.`,
            null
          );
        }
      }
    }

    // Garante que o parâmetro obrigatório ':categoryIdSubcategoryId' esteja definido para evitar cobranças desnecessárias
    if (!params.ExpressionAttributeValues || !params.ExpressionAttributeValues[':categoryIdSubcategoryId']) {
      throw new Error("O valor de ':categoryIdSubcategoryId' não pode ser vazio.");
    }

    try {
      const command = new QueryCommand(params);
      const result = await this.docClient.send(command);
      this.logOperationSuccess(operation, params.TableName, result);
      return result;
    } catch (error) {
      this.handleError(operation, params.TableName, error, params);
    }
  }

  /**
   * Constrói dinamicamente uma expressão de atualização (UpdateExpression) com os dados fornecidos.
   * @param updateData Objeto contendo os campos e valores a serem atualizados.
   * @returns Um objeto contendo a UpdateExpression e os ExpressionAttributeValues correspondentes.
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

  /**
   * Registra o início de uma operação, informando o nome da operação, o nome da tabela e detalhes adicionais (se houver).
   * @param operationName Nome da operação.
   * @param tableName Nome da tabela envolvida na operação.
   * @param details Informações adicionais (opcionais) sobre a operação.
   */
  private logOperationStart(
    operationName: string,
    tableName: string | undefined,
    details?: Record<string, unknown>
  ): void {
    this.logger.log(`[${operationName}] Iniciando operação na tabela: ${tableName ?? 'Não especificada'}...`);
    if (details) {
      this.logger.debug(`[${operationName}] Detalhes: ${JSON.stringify(details)}`);
    }
  }

  /**
   * Registra o sucesso de uma operação, exibindo informações adicionais sobre o resultado.
   * @param operationName Nome da operação.
   * @param tableName Nome da tabela envolvida.
   * @param result Resultado retornado pela operação.
   */
  private logOperationSuccess(
    operationName: string,
    tableName: string | undefined,
    result?: DynamoDBCommandOutput | string
  ): void {
    this.logger.log(`[${operationName}] Operação na tabela ${tableName ?? 'Não especificada'} concluída com sucesso.`);
    if (result && typeof result !== 'string') {
      if ('Items' in result && result.Items) {
        this.logger.debug(`[${operationName}] Contagem de itens: ${result.Items.length}`);
      } else if ('Attributes' in result && result.Attributes) {
        this.logger.debug(`[${operationName}] Atributos retornados: ${JSON.stringify(result.Attributes)}`);
      } else if ('Item' in result && result.Item) {
        this.logger.debug(`[${operationName}] Item retornado: ${JSON.stringify(result.Item)}`);
      } else if ('$metadata' in result) {
        this.logger.debug(`[${operationName}] Metadados da resposta: ${JSON.stringify(result.$metadata)}`);
      }
    } else if (typeof result === 'string') {
      this.logger.debug(`[${operationName}] Detalhes do sucesso: ${result}`);
    }
  }

  /**
   * Trata os erros ocorridos durante as operações com o DynamoDB.
   * Registra o erro e seu contexto, e lança uma instância de DynamoDBOperationError para propagação.
   * @param operationName Nome da operação que falhou.
   * @param tableName Nome da tabela envolvida.
   * @param error Erro capturado.
   * @param context Informações adicionais de contexto (opcional).
   * @throws DynamoDBOperationError
   */
  private handleError(
    operationName: string,
    tableName: string | undefined,
    error: unknown,
    context?: Record<string, unknown>
  ): never {
    const baseMessage = `Erro na operação [${operationName}] na tabela ${tableName ?? 'Não especificada'}`;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    this.logger.error(`${baseMessage}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    if (context) {
      this.logger.error(`[${operationName}] Contexto do erro: ${JSON.stringify(context)}`);
    }
    throw new DynamoDBOperationError(operationName, `${baseMessage}. Detalhes: ${errorMessage}`, error);
  }
}
