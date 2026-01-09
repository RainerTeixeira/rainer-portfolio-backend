/**
 * @fileoverview Repositório Base Otimizado para DynamoDB
 * 
 * Classe abstrata com otimizações de performance e custo:
 * - Batch operations otimizadas
 * - Projection expressions para reduzir consumo
 * - Consistent reads apenas quando necessário
 * - Paginação eficiente
 * - Cache de queries frequentes
 * - Índices otimizados
 * 
 * @module database/dynamodb/base-dynamodb.repository
 * @version 2.0.0 - Performance Optimized
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Injectable, Logger } from '@nestjs/common';
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
  TransactGetCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';

/**
 * Opções de consulta otimizadas
 */
interface OptimizedQueryOptions {
  /**
   * Tipos de consistência: eventual (padrão/mais barato) ou strong (mais caro)
   */
  consistentRead?: boolean;
  /**
   * Atributos específicos para retornar (reduz consumo)
   */
  projectionExpression?: string;
  /**
   * Limite de itens (controla custo)
   */
  limit?: number;
  /**
   * Paginação eficiente
   */
  exclusiveStartKey?: any;
  /**
   * Ordenação (false = mais recentes primeiro)
   */
  scanIndexForward?: boolean;
  /**
   * Para contagem eficiente (sem trazer dados)
   */
  select?: 'COUNT' | 'SPECIFIC_ATTRIBUTES';
}

/**
 * Opções de batch otimizadas
 */
interface BatchOptions {
  /**
   * Tipos de consistência: eventual (padrão/mais barato) ou strong (mais caro)
   */
  consistentRead?: boolean;
  /**
   * Atributos específicos para retornar (reduz consumo)
   */
  projectionExpression?: string;
  /**
   * Tamanho do lote para operações (máx 25)
   */
  batchSize?: number;
  /**
   * Paralelismo de processamento
   */
  parallelism?: number;
  /**
   * Retry automático em falhas
   */
  retryAttempts?: number;
}

/**
 * Repositório base otimizado para DynamoDB.
 * 
 * Foco em performance e controle de custos:
 * - Operações batch eficientes
 * - Projection expressions
 * - Cache inteligente
 * - Monitoramento de consumo
 * 
 * @abstract
 * @class BaseDynamoDBRepository
 * @version 2.0.0
 */
@Injectable()
export abstract class BaseDynamoDBRepository {
  /**
   * Logger para registro de eventos e erros.
   */
  protected readonly logger = new Logger(this.constructor.name);
  
  /**
   * Cliente DynamoDB Document para operações.
   */
  protected readonly client: DynamoDBDocumentClient;
  
  /**
   * Nome da tabela DynamoDB.
   */
  protected readonly tableName: string;

  /**
   * Cache simples para queries frequentes
   */
  protected cache: Map<string, { data: any; ttl: number }> = new Map();
  
  /**
   * TTL padrão do cache (5 minutos)
   */
  private readonly defaultCacheTTL = 5 * 60 * 1000;

  /**
   * Construtor do repositório base otimizado.
   */
  constructor(dynamoDb: DynamoDBDocumentClient, tableName: string) {
    this.client = dynamoDb;
    this.tableName = tableName;
  }

  /**
   * Cria PK otimizada (shorter strings = menor custo)
   */
  protected createEntityPK(entity: string, id: string): string {
    // Otimizado: prefixes curtos
    const prefixes: Record<string, string> = {
      'USER': 'U',
      'POST': 'P', 
      'COMMENT': 'C',
      'LIKE': 'L',
      'BOOKMARK': 'B',
      'NOTIFICATION': 'N',
      'CATEGORY': 'CAT'
    };
    const prefix = prefixes[entity] || entity;
    return `${prefix}#${id}`;
  }

  /**
   * Cria SK otimizada com timestamp invertido para ordenação
   */
  protected createEntitySK(type: string, id: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString();
    // Timestamp invertido para ordenação descendente (mais recentes primeiro)
    const invertedTs = ts.replace(/[-T:Z.]/g, '').split('').reverse().join('');
    return `${type}#${id}#${invertedTs}`;
  }

  /**
   * Cria GSI1 PK para queries globais otimizadas
   */
  protected createGSI1PK(gsiType: string, value: string): string {
    const prefixes: Record<string, string> = {
      'ENTITY': 'E',
      'STATUS': 'S',
      'TYPE': 'T'
    };
    const prefix = prefixes[gsiType] || gsiType;
    return `${prefix}#${value}`;
  }

  /**
   * Cria GSI1 SK otimizada
   */
  protected createGSI1SK(type: string, id: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString();
    const invertedTs = ts.replace(/[-T:Z.]/g, '').split('').reverse().join('');
    return `${type}#${invertedTs}#${id}`;
  }

  /**
   * Cria GSI2 PK para relacionamentos
   */
  protected createGSI2PK(gsiType: string, value: string): string {
    const prefixes: Record<string, string> = {
      'USER': 'U',
      'POST': 'P',
      'CATEGORY': 'CAT',
      'AUTHOR': 'A',
      'EMAIL': 'E',
      'USERNAME': 'UN',
      'FULLNAME': 'FN',
      'NICKNAME': 'NN'
    };
    const prefix = prefixes[gsiType] || gsiType;
    return `${prefix}#${value}`;
  }

  /**
   * Cria GSI2 SK otimizada
   */
  protected createGSI2SK(type: string, id: string, timestamp?: string): string {
    const ts = timestamp || new Date().toISOString();
    const invertedTs = ts.replace(/[-T:Z.]/g, '').split('').reverse().join('');
    return `${type}#${invertedTs}#${id}`;
  }

  /**
   * Get otimizado com cache e projection
   */
  async getItemOptimized(params: { PK: string; SK: string }, options: OptimizedQueryOptions = {}): Promise<any | null> {
    const cacheKey = `${params.PK}:${params.SK}`;
    
    // Verificar cache primeiro
    if (!options.consistentRead) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const command = new GetCommand({
      TableName: this.tableName,
      Key: params,
      ConsistentRead: options.consistentRead || false, // Eventual read por padrão (mais barato)
      ProjectionExpression: options.projectionExpression,
    });
    
    const result = await this.client.send(command);
    const item = result.Item || null;
    
    // Cache apenas para consistent reads falsas
    if (item && !options.consistentRead) {
      this.setCache(cacheKey, item);
    }
    
    return item;
  }

  /**
   * Put otimizado com conditional writes
   */
  async putItemOptimized(item: any, conditionExpression?: string): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
      ConditionExpression: conditionExpression,
      // Evitar consumir capacidade desnecessária
      ReturnValues: 'NONE',
    });
    
    await this.client.send(command);
    
    // Invalidar cache relacionado
    this.invalidateCache(`${item.PK}:${item.SK}`);
  }

  /**
   * Query otimizada com projection e paginação
   */
  async queryOptimized(params: OptimizedQueryOptions & {
    KeyConditionExpression?: string;
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
    IndexName?: string;
  }): Promise<{ items: any[]; lastEvaluatedKey?: any; consumedCapacity?: any }> {
    const command = new QueryCommand({
      TableName: this.tableName,
      ConsistentRead: false, // Sempre eventual read para queries
      ProjectionExpression: params.projectionExpression,
      Limit: params.limit || 25, // Limite padrão para controlar custo
      ExclusiveStartKey: params.exclusiveStartKey,
      ScanIndexForward: params.scanIndexForward ?? false, // Mais recentes primeiro
      Select: params.select,
      ReturnConsumedCapacity: 'TOTAL', // Monitorar consumo
      KeyConditionExpression: params.KeyConditionExpression,
      FilterExpression: params.FilterExpression,
      ExpressionAttributeNames: params.ExpressionAttributeNames,
      ExpressionAttributeValues: params.ExpressionAttributeValues,
      IndexName: params.IndexName,
    });

    const result = await this.client.send(command);
    
    // Log de consumo para monitoramento
    if (result.ConsumedCapacity) {
      this.logger.debug(`Query consumed: ${JSON.stringify(result.ConsumedCapacity)}`);
    }

    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      consumedCapacity: result.ConsumedCapacity,
    };
  }

  /**
   * Batch Get otimizado (até 100 itens)
   */
  async batchGetOptimized(keys: { PK: string; SK: string }[], options: BatchOptions = {}): Promise<any[]> {
    const batchSize = options.batchSize || 25; // Máximo permitido pelo DynamoDB
    const results: any[] = [];
    
    // Processar em lotes para evitar throttling
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      const command = new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: batch,
            ProjectionExpression: options.projectionExpression,
          },
        },
        ReturnConsumedCapacity: 'TOTAL',
      });

      const result = await this.client.send(command);
      const items = result.Responses?.[this.tableName] || [];
      results.push(...items);
      
      // Pequeno delay entre batches para evitar throttling
      if (i + batchSize < keys.length) {
        await this.sleep(10);
      }
    }
    
    return results;
  }

  /**
   * Batch Write otimizado (até 25 itens por lote)
   */
  async batchWriteOptimized(
    putRequests: any[] = [],
    deleteRequests: { PK: string; SK: string }[] = [],
    options: BatchOptions = {}
  ): Promise<void> {
    const batchSize = options.batchSize || 25;
    const retryAttempts = options.retryAttempts || 3;
    
    for (let i = 0; i < Math.max(putRequests.length, deleteRequests.length); i += batchSize) {
      const putBatch = putRequests.slice(i, i + batchSize);
      const deleteBatch = deleteRequests.slice(i, i + batchSize);
      
      const requestItems: any[] = [];
      
      // Adiciona operações PUT
      putBatch.forEach(item => {
        requestItems.push({
          PutRequest: { Item: item },
        });
      });
      
      // Adiciona operações DELETE
      deleteBatch.forEach(key => {
        requestItems.push({
          DeleteRequest: { Key: key },
        });
      });
      
      // Retry automático em caso de falha
      for (let attempt = 0; attempt < retryAttempts; attempt++) {
        try {
          const command = new BatchWriteCommand({
            RequestItems: {
              [this.tableName]: requestItems,
            },
            ReturnConsumedCapacity: 'TOTAL',
          });

          await this.client.send(command);
          break; // Sucesso, sair do retry
        } catch (error) {
          if (attempt === retryAttempts - 1) throw error;
          
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 100);
        }
      }
      
      // Delay entre batches para controlar throughput
      if (i + batchSize < Math.max(putRequests.length, deleteRequests.length)) {
        await this.sleep(50);
      }
    }
  }

  /**
   * Transação Write para operações atômicas
   */
  async transactWriteOptimized(transactItems: any[]): Promise<void> {
    const command = new TransactWriteCommand({
      TransactItems: transactItems,
      ReturnConsumedCapacity: 'TOTAL',
    });
    
    await this.client.send(command);
  }

  /**
   * Transação Get para leituras atômicas
   */
  async transactGetOptimized(keys: { PK: string; SK: string }[]): Promise<any[]> {
    const command = new TransactGetCommand({
      TransactItems: keys.map(key => ({
        Get: {
          TableName: this.tableName,
          Key: key,
        },
      })),
      ReturnConsumedCapacity: 'TOTAL',
    });
    
    const result = await this.client.send(command);
    return result.Responses || [];
  }

  /**
   * Adiciona campos comuns otimizados
   */
  protected addCommonFields(item: any, entityType: string): any {
    return {
      ...item,
      entityType,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Campos para otimização de queries
      gsi1Sort: this.createGSI1SK('SORT', item.id || 'unknown'),
      gsi2Sort: this.createGSI2SK('SORT', item.id || 'unknown'),
    };
  }

  /**
   * Remove campos do DynamoDB de forma otimizada
   */
  protected fromDynamoDB(item: any): any {
    if (!item) return null;
    
    const cleanItem = { ...item };
    // Remover campos do DynamoDB
    delete cleanItem.PK;
    delete cleanItem.SK;
    delete cleanItem.GSI1PK;
    delete cleanItem.GSI1SK;
    delete cleanItem.GSI2PK;
    delete cleanItem.GSI2SK;
    delete cleanItem.gsi1Sort;
    delete cleanItem.gsi2Sort;
    
    return cleanItem;
  }

  /**
   * Prepara item para DynamoDB com otimizações
   */
  protected toDynamoDB(item: any, entityType: string, PK: string, SK: string): any {
    return {
      PK,
      SK,
      ...this.addCommonFields(item, entityType),
    };
  }

  // Métodos de cache simples
  protected getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  protected setCache(key: string, data: any): void {
    this.cache.set(key, { data, ttl: Date.now() + this.defaultCacheTTL });
  }

  protected invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  // Utilitário para delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos legacy para compatibilidade (sem duplicação)
  async getItem(params: { PK: string; SK: string }): Promise<any | null> {
    return this.getItemOptimized(params);
  }

  async putItem(item: any): Promise<void> {
    return this.putItemOptimized(item);
  }

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
    const result = await this.queryOptimized(params);
    return {
      items: result.items,
      lastEvaluatedKey: result.lastEvaluatedKey,
    };
  }

  protected async scan(params: {
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
    Limit?: number;
    ExclusiveStartKey?: any;
  }): Promise<{ items: any[]; lastEvaluatedKey?: any }> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: params.FilterExpression,
      ExpressionAttributeNames: params.ExpressionAttributeNames,
      ExpressionAttributeValues: params.ExpressionAttributeValues,
      Limit: params.Limit || 25,
      ExclusiveStartKey: params.ExclusiveStartKey,
      ReturnConsumedCapacity: 'TOTAL',
    });

    const result = await this.client.send(command);
    
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    };
  }

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
      ReturnConsumedCapacity: 'TOTAL',
    });
    
    const result = await this.client.send(command);
    return result.Attributes;
  }

  async deleteItem(params: { PK: string; SK: string }): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: params,
      ReturnConsumedCapacity: 'TOTAL',
    });
    
    await this.client.send(command);
    
    // Invalidar cache
    this.invalidateCache(`${params.PK}:${params.SK}`);
  }
}
