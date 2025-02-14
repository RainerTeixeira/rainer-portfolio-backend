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
  BatchWriteItemCommand, // Correção: Importe BatchWriteItemCommand
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
import * as dotenv from 'dotenv'; // Importa dotenv para carregar variáveis do .env

dotenv.config(); // Carrega as variáveis de ambiente do .env para o process.env

@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name); // Logger para registrar mensagens do serviço
  private readonly docClient: DynamoDBDocumentClient; // Cliente do DynamoDB Document

  constructor() {
    // Configuração do cliente DynamoDB (AWS SDK v3)
    const clientConfig: DynamoDBClientConfig = {
      region: process.env.AWS_REGION || 'us-east-1', // Define a região da AWS, usa 'us-east-1' como padrão se AWS_REGION não estiver definido no .env
      // Se LOCAL_DYNAMO_ENDPOINT estiver definido no .env, usa endpoint local para DynamoDB (para desenvolvimento local)
      ...(process.env.LOCAL_DYNAMO_ENDPOINT && {
        endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
      }),
      // Removi accessKeyId e secretAccessKey da configuração,
      // pois o AWS SDK v3 usa o Default Credential Provider Chain por padrão,
      // que busca credenciais em variáveis de ambiente, arquivos de configuração, IAM roles, etc.
      // Em produção, é recomendado usar IAM Roles ao invés de hardcodar credenciais.
    };

    // Configuração de tradução para o Document Client (facilita trabalhar com objetos JavaScript)
    const translateConfig: TranslateConfig = {
      marshallOptions: {
        removeUndefinedValues: true, // Remove valores undefined ao converter objetos JavaScript para o formato DynamoDB
        convertClassInstanceToMap: true, // Converte instâncias de classes para mapas (objetos)
        convertEmptyValues: false, // Não converte strings vazias, números zero, etc. para tipos vazios do DynamoDB
      },
      unmarshallOptions: {
        wrapNumbers: false, // Não envolve números em objetos Number ao converter do formato DynamoDB para JavaScript
      },
    };

    // Cria o Document Client a partir do cliente DynamoDB e configuração de tradução
    this.docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient(clientConfig),
      translateConfig
    );
    this.logger.log('DynamoDB DocumentClient inicializado usando variáveis de ambiente'); // Loga que o cliente foi inicializado
  }

  // Método para buscar um item do DynamoDB por chave primária (GetItem)
  async getItem(params: GetCommandInput) {
    try {
      const command = new GetItemCommand(params); // Cria o comando GetItem
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'getItem'); // Em caso de erro, trata o erro
    }
  }

  // Método para criar ou substituir um item no DynamoDB (PutItem)
  async putItem(params: PutCommandInput) {
    try {
      const command = new PutItemCommand(params); // Cria o comando PutItem
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'putItem'); // Em caso de erro, trata o erro
    }
  }

  // Método para atualizar um item existente no DynamoDB (UpdateItem)
  async updateItem(params: UpdateCommandInput) {
    try {
      const command = new UpdateItemCommand(params); // Cria o comando UpdateItem
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'updateItem'); // Em caso de erro, trata o erro
    }
  }

  // Método para deletar um item do DynamoDB (DeleteItem)
  async deleteItem(params: DeleteCommandInput) {
    try {
      const command = new DeleteItemCommand(params); // Cria o comando DeleteItem
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'deleteItem'); // Em caso de erro, trata o erro
    }
  }

  // Método para escanear uma tabela inteira do DynamoDB (Scan) - CUIDADO: Ineficiente para tabelas grandes em produção
  async scan(params: ScanCommandInput) { // Correção: Renomeado de scanItems para scan
    try {
      const command = new ScanCommand(params); // Cria o comando Scan
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'scan'); // Correção: Renomeado para scan
    }
  }

  // Método para consultar itens do DynamoDB usando chave de partição e, opcionalmente, chave de classificação (Query) - Mais eficiente que Scan para consultas específicas
  async queryItems(params: QueryCommandInput) {
    try {
      const command = new QueryCommand(params); // Cria o comando Query
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'queryItems'); // Em caso de erro, trata o erro
    }
  }

  // Método para realizar operações de escrita em lote no DynamoDB (BatchWriteItem) - Para criar ou deletar múltiplos itens eficientemente
  async batchWrite(params: BatchWriteCommandInput) {
    try {
      const command = new BatchWriteItemCommand(params); // Correção: BatchWriteItemCommand // Cria o comando BatchWriteItem
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'batchWrite'); // Em caso de erro, trata o erro
    }
  }

  // Método para realizar operações de leitura em lote no DynamoDB (BatchGetItem) - Para buscar múltiplos itens eficientemente
  async batchGet(params: BatchGetCommandInput) {
    try {
      const command = new BatchGetItemCommand(params); // Cria o comando BatchGetItem
      return await this.docClient.send(command); // Envia o comando para o DynamoDB e retorna a resposta
    } catch (error) {
      this.handleError(error, 'batchGet'); // Em caso de erro, trata o erro
    }
  }

  // Método utilitário para construir expressões de atualização (UpdateExpression) dinamicamente
  // Útil para atualizar apenas os campos que foram modificados em um item
  buildUpdateExpression(
    input: Record<string, any>, // Objeto com os campos a serem atualizados (chave: nome do atributo, valor: novo valor)
    excludeKeys: string[] = [] // Array de chaves a serem excluídas da atualização (opcional)
  ) {
    const updateKeys = Object.keys(input) // Obtém as chaves do objeto de entrada
      .filter((key) => !excludeKeys.includes(key)) // Filtra chaves excluídas
      .filter((key) => input[key] !== undefined); // Filtra chaves com valor undefined

    if (updateKeys.length === 0) return null; // Se não houver chaves para atualizar, retorna null

    // Constrói a UpdateExpression usando placeholders #field e :value para evitar palavras reservadas e injeção de valores
    const UpdateExpression = `SET ${updateKeys
      .map((key, index) => `#field${index} = :value${index}`) // Cria '#field0 = :value0, #field1 = :value1, ...'
      .join(', ')}`; // Junta as partes da expressão com vírgula e espaço

    // Constrói ExpressionAttributeNames para mapear placeholders #field para nomes de atributos reais
    const ExpressionAttributeNames = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`#field${index}`]: key, // Mapeia '#field0' para o nome da chave, ex: '#field0': 'name'
      }),
      {}
    );

    // Constrói ExpressionAttributeValues para mapear placeholders :value para os valores dos atributos
    const ExpressionAttributeValues = updateKeys.reduce(
      (acc, key, index) => ({
        ...acc,
        [`:value${index}`]: input[key], // Mapeia ':value0' para o valor correspondente, ex: ':value0': 'Novo Nome'
      }),
      {}
    );

    // Retorna o objeto com UpdateExpression, ExpressionAttributeNames e ExpressionAttributeValues
    return {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    };
  }

  // Método privado para tratar erros do DynamoDB
  private handleError(error: any, operation: string): never {
    this.logger.error(
      `Erro do DynamoDB (${operation}): ${error.message}`, // Loga o erro com a operação e mensagem
      error.stack // Loga o stacktrace do erro para debugging
    );

    // Mapeia mensagens de erro conhecidas para mensagens mais amigáveis em português
    const mappedError = new Error(this.mapErrorMessage(error, operation));
    mappedError.name = error.name || 'DynamoDBError'; // Mantém o nome original do erro ou usa 'DynamoDBError' como fallback

    throw mappedError; // Lança o erro tratado para que o NestJS possa lidar (ex: retornar 500 Internal Server Error)
  }

  // Método privado para mapear mensagens de erro do DynamoDB para português
  private mapErrorMessage(error: any, operation: string): string {
    const errorMessages: Record<string, string> = {
      ResourceNotFoundException: 'Recurso não encontrado', // Erro quando a tabela ou item não existe
      ProvisionedThroughputExceededException: 'Limite de capacidade excedido', // Erro quando a capacidade provisionada da tabela é excedida
      ConditionalCheckFailedException: 'Condição de escrita não satisfeita', // Erro em operações condicionais (ex: Update com ConditionExpression)
      TransactionConflictException: 'Conflito em transação', // Erro em transações concorrentes
    };

    // Retorna a mensagem mapeada em português se existir, senão retorna uma mensagem genérica com a mensagem original
    return (
      errorMessages[error.name] ||
      `Erro na operação ${operation}: ${error.message}`
    );
  }
}