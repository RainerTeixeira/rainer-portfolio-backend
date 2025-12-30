/**
 * @fileoverview Repositório Base para DynamoDB
 * 
 * Classe abstrata que contém métodos comuns para todas as implementações
 * de repositórios DynamoDB, seguindo o padrão Single Table Design.
 * 
 * @module database/dynamodb/base-dynamodb.repository
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Repositório base abstrato para DynamoDB.
 * 
 * Fornece funcionalidades comuns para operações CRUD e gerenciamento
 * de chaves no padrão Single Table Design. Todos os repositórios
 * específicos devem estender esta classe.
 * 
 * Funcionalidades:
 * - Gerenciamento de chaves PK/SK e GSIs
 * - Operações CRUD básicas (get, put, update, delete)
 * - Query e Scan com suporte a paginação
 * - Transformação de dados entre app e DynamoDB
 * - Logging integrado
 * 
 * @abstract
 * @class BaseDynamoDBRepository
 * 
 * @example
 * ```typescript
 * // Implementação de repositório específico
 * @Injectable()
 * export class UserRepository extends BaseDynamoDBRepository {
 *   async findById(id: string) {
 *     const PK = this.createEntityPK('USER', id);
 *     const SK = this.createEntitySK('USER', id);
 *     return this.getItem({ PK, SK });
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
@Injectable()
export abstract class BaseDynamoDBRepository {
  /**
   * Logger para registro de eventos e erros.
   * 
   * @protected
   * @readonly
   * @type {Logger}
   */
  protected readonly logger = new Logger(this.constructor.name);
  
  /**
   * Cliente DynamoDB Document para operações.
   * 
   * @protected
   * @readonly
   * @type {DynamoDBDocumentClient}
   */
  protected readonly client: DynamoDBDocumentClient;
  
  /**
   * Nome da tabela DynamoDB.
   * 
   * @protected
   * @readonly
   * @type {string}
   */
  protected readonly tableName: string;

  /**
   * Construtor do repositório base.
   * 
   * Recebe o client já configurado (AWS ou Local) e o nome da tabela.
   */
  constructor(dynamoDb: DynamoDBDocumentClient, tableName: string) {
    this.client = dynamoDb;
    this.tableName = tableName;
  }

  /**
   * Cria a chave primária (PK) para uma entidade.
   * 
   * Formato: ENTITY#ID
   * 
   * @protected
   * @method createEntityPK
   * @param {string} entity - Tipo da entidade (ex: USER, POST)
   * @param {string} id - ID único da entidade
   * @returns {string} Chave primária formatada
   * 
   * @example
   * ```typescript
   * const PK = this.createEntityPK('USER', '123');
   * // Returns: 'USER#123'
   * ```
   */
  protected createEntityPK(entity: string, id: string): string {
    return `${entity}#${id}`;
  }

  /**
   * Cria a chave de ordenação (SK) para uma entidade.
   * 
   * Formato: TYPE#ID#TIMESTAMP
   * 
   * @protected
   * @method createEntitySK
   * @param {string} type - Tipo do item
   * @param {string} id - ID do item
   * @param {string} [timestamp] - Timestamp opcional (gerado automaticamente)
   * @returns {string} Chave de ordenação formatada
   */
  protected createEntitySK(type: string, id: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString();
    return `${type}#${id}#${ts}`;
  }

  /**
   * Cria chave primária para GSI1.
   * 
   * GSI1 é usada para consultas por tipo de entidade.
   * 
   * @protected
   * @method createGSI1PK
   * @param {string} gsiType - Tipo de consulta GSI1
   * @param {string} value - Valor para a consulta
   * @returns {string} Chave GSI1 formatada
   */
  protected createGSI1PK(gsiType: string, value: string): string {
    return `${gsiType}#${value}`;
  }

  /**
   * Cria chave de ordenação para GSI1.
   * 
   * @protected
   * @method createGSI1SK
   * @param {string} type - Tipo do item
   * @param {string} id - ID do item
   * @param {string} [timestamp] - Timestamp opcional
   * @returns {string} Chave GSI1 formatada
   */
  protected createGSI1SK(type: string, id: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString();
    return `${type}#${ts}#${id}`;
  }

  /**
   * Cria chave primária para GSI2.
   * 
   * GSI2 é usada para consultas por relacionamentos.
   * 
   * @protected
   * @method createGSI2PK
   * @param {string} gsiType - Tipo de consulta GSI2
   * @param {string} value - Valor para a consulta
   * @returns {string} Chave GSI2 formatada
   */
  protected createGSI2PK(gsiType: string, value: string): string {
    return `${gsiType}#${value}`;
  }

  /**
   * Cria chave de ordenação para GSI2.
   * 
   * @protected
   * @method createGSI2SK
   * @param {string} type - Tipo do item
   * @param {string} id - ID do item
   * @param {string} [timestamp] - Timestamp opcional
   * @returns {string} Chave GSI2 formatada
   */
  protected createGSI2SK(type: string, id: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString();
    return `${type}#${ts}#${id}`;
  }

  /**
   * Adiciona campos comuns a todos os itens.
   * 
   * Inclui metadados como tipo de entidade, timestamps
   * e outros campos padrão.
   * 
   * @protected
   * @method addCommonFields
   * @param {any} item - Item original
   * @param {string} entityType - Tipo da entidade
   * @returns {any} Item com campos comuns adicionados
   */
  protected addCommonFields(item: any, entityType: string): any {
    return {
      ...item,
      entityType,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Obtém um item pela chave primária (PK) e chave de ordenação (SK).
   * 
   * @async
   * @method getItem
   * @param {object} params - Parâmetros da consulta
   * @param {string} params.PK - Chave primária
   * @param {string} params.SK - Chave de ordenação
   * @returns {Promise<any|null>} Item encontrado ou null
   * 
   * @example
   * ```typescript
   * const user = await this.getItem({
   *   PK: 'USER#123',
   *   SK: 'USER#123#2023-01-01T00:00:00.000Z'
   * });
   * ```
   */
  async getItem(params: { PK: string; SK: string }): Promise<any | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: params,
    });
    
    const result = await this.client.send(command);
    return result.Item || null;
  }

  /**
   * Insere ou atualiza um item na tabela.
   * 
   * @async
   * @method putItem
   * @param {any} item - Item a ser inserido/atualizado
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * await this.putItem({
   *   PK: 'USER#123',
   *   SK: 'USER#123#2023-01-01T00:00:00.000Z',
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  async putItem(item: any): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });
    
    await this.client.send(command);
  }

  /**
   * Atualiza um item existente na tabela.
   * 
   * @async
   * @method updateItem
   * @param {object} params - Parâmetros da atualização
   * @param {string} params.PK - Chave primária
   * @param {string} params.SK - Chave de ordenação
   * @param {string} params.UpdateExpression - Expressão de atualização
   * @param {Record<string,string>} [params.ExpressionAttributeNames] - Nomes de atributos
   * @param {Record<string,any>} [params.ExpressionAttributeValues] - Valores de atributos
   * @returns {Promise<any>} Item atualizado
   */
  async updateItem(params: {
    PK: string;
    SK: string;
    UpdateExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
  }): Promise<any> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { PK: params.PK, SK: params.SK },
      UpdateExpression: params.UpdateExpression,
      ExpressionAttributeNames: params.ExpressionAttributeNames,
      ExpressionAttributeValues: params.ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });
    
    const result = await this.client.send(command);
    return result.Attributes;
  }

  /**
   * Remove um item da tabela.
   * 
   * @async
   * @method deleteItem
   * @param {object} params - Parâmetros da exclusão
   * @param {string} params.PK - Chave primária
   * @param {string} params.SK - Chave de ordenação
   * @returns {Promise<void>}
   */
  async deleteItem(params: { PK: string; SK: string }): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: params,
    });
    
    await this.client.send(command);
  }

  /**
   * Executa comando Query para busca eficiente.
   * 
   * @async
   * @protected
   * @method query
   * @param {object} params - Parâmetros da query
   * @returns {Promise<object>} Resultados com paginação
   */
  protected async query(params: {
    KeyConditionExpression?: string;
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
    IndexName?: string;
    Limit?: number;
    ExclusiveStartKey?: any;
    ScanIndexForward?: boolean;
  }): Promise<{ items: any[]; lastEvaluatedKey?: any }> {
    const command = new QueryCommand({
      TableName: this.tableName,
      ...params,
    });

    const result = await this.client.send(command);
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  /**
   * Executa comando Scan para busca completa.
   * 
   * @async
   * @protected
   * @method scan
   * @param {object} params - Parâmetros do scan
   * @returns {Promise<object>} Resultados com paginação
   */
  protected async scan(params: {
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
    Limit?: number;
    ExclusiveStartKey?: any;
  }): Promise<{ items: any[]; lastEvaluatedKey?: any }> {
    const command = new ScanCommand({
      TableName: this.tableName,
      ...params,
    });

    const result = await this.client.send(command);
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

  /**
   * Converte item do DynamoDB para formato da aplicação.
   * 
   * Remove campos específicos do DynamoDB (PK, SK, GSIs)
   * e retorna apenas os dados da aplicação.
   * 
   * @protected
   * @method fromDynamoDB
   * @param {any} item - Item do DynamoDB
   * @returns {any} Item limpo para a aplicação
   */
  protected fromDynamoDB(item: any): any {
    if (!item) return null;
    
    const cleanItem = { ...item };
    delete cleanItem.PK;
    delete cleanItem.SK;
    delete cleanItem.GSI1PK;
    delete cleanItem.GSI1SK;
    delete cleanItem.GSI2PK;
    delete cleanItem.GSI2SK;
    
    return cleanItem;
  }

  /**
   * Prepara item da aplicação para formato DynamoDB.
   * 
   * Adiciona chaves PK/SK e campos comuns necessários
   * para armazenamento no DynamoDB.
   * 
   * @protected
   * @method toDynamoDB
   * @param {any} item - Item da aplicação
   * @param {string} entityType - Tipo da entidade
   * @param {string} PK - Chave primária
   * @param {string} SK - Chave de ordenação
   * @returns {any} Item formatado para DynamoDB
   */
  protected toDynamoDB(item: any, entityType: string, PK: string, SK: string): any {
    return {
      PK,
      SK,
      ...this.addCommonFields(item, entityType),
    };
  }
}
