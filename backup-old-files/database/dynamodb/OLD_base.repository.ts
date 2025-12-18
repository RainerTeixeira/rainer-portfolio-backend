import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { 
  IBaseRepository, 
  QueryOptions, 
  ScanOptions, 
  BatchWriteOperation, 
  BatchGetKey,
  DynamoDBEntity 
} from '../interfaces/base.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export abstract class BaseRepository<T extends DynamoDBEntity> implements IBaseRepository<T> {
  constructor(
    protected readonly dynamoDBService: DynamoDBService,
    protected readonly entityType: string,
  ) {}

  /**
   * Cria uma nova entidade
   */
  async create(data: Partial<T>): Promise<T> {
    const now = new Date().toISOString();
    const entity: T = {
      ...data,
      PK: this.generatePK(data),
      SK: this.generateSK(data),
      entityType: this.entityType,
      createdAt: now,
      updatedAt: now,
    } as T;

    await this.dynamoDBService.put(entity);
    return entity;
  }

  /**
   * Busca por PK e SK
   */
  async findById(pk: string, sk?: string): Promise<T | null> {
    const item = await this.dynamoDBService.get(pk, sk || 'METADATA');
    return item as T || null;
  }

  /**
   * Atualiza uma entidade
   */
  async update(pk: string, sk: string, data: Partial<T>): Promise<T> {
    const now = new Date().toISOString();
    
    // Constrói expressão de atualização dinamicamente
    const updateExpressions: string[] = ['set #updatedAt = :updatedAt'];
    const expressionAttributeNames: { [key: string]: string } = {
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: { [key: string]: any } = {
      ':updatedAt': now,
    };

    // Adiciona campos do data
    let fieldIndex = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'PK' && key !== 'SK' && key !== 'entityType' && key !== 'createdAt') {
        const attributeName = `#attr${fieldIndex}`;
        const attributeValue = `:val${fieldIndex}`;
        
        updateExpressions.push(`${attributeName} = ${attributeValue}`);
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = value;
        
        fieldIndex++;
      }
    }

    const updateExpression = updateExpressions.join(', ');

    const result = await this.dynamoDBService.update(
      pk,
      sk,
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues
    );

    return result as T;
  }

  /**
   * Remove uma entidade
   */
  async delete(pk: string, sk: string): Promise<void> {
    await this.dynamoDBService.delete(pk, sk);
  }

  /**
   * Query por PK
   */
  async queryByPK(pk: string, options?: QueryOptions): Promise<T[]> {
    let keyConditionExpression = 'PK = :pk';
    const expressionAttributeValues: { [key: string]: any } = {
      ':pk': pk,
    };

    // Adiciona begins_with se especificado
    if (options?.beginsWith) {
      keyConditionExpression += ' AND begins_with(SK, :sk)';
      expressionAttributeValues[':sk'] = options.beginsWith;
    }

    const result = await this.dynamoDBService.query(
      keyConditionExpression,
      expressionAttributeValues,
      options?.expressionAttributeNames,
      undefined, // indexName
      options?.limit,
      options?.exclusiveStartKey,
      options?.scanIndexForward,
      options?.filterExpression
    );

    return result.items as T[];
  }

  /**
   * Query por GSI1
   */
  async queryByGSI1(gsi1pk: string, options?: QueryOptions): Promise<T[]> {
    let keyConditionExpression = 'GSI1PK = :gsi1pk';
    const expressionAttributeValues: { [key: string]: any } = {
      ':gsi1pk': gsi1pk,
    };

    // Adiciona begins_with se especificado
    if (options?.beginsWith) {
      keyConditionExpression += ' AND begins_with(GSI1SK, :gsi1sk)';
      expressionAttributeValues[':gsi1sk'] = options.beginsWith;
    }

    const result = await this.dynamoDBService.query(
      keyConditionExpression,
      expressionAttributeValues,
      options?.expressionAttributeNames,
      'GSI1',
      options?.limit,
      options?.exclusiveStartKey,
      options?.scanIndexForward,
      options?.filterExpression
    );

    return result.items as T[];
  }

  /**
   * Query por GSI2
   */
  async queryByGSI2(gsi2pk: string, options?: QueryOptions): Promise<T[]> {
    let keyConditionExpression = 'GSI2PK = :gsi2pk';
    const expressionAttributeValues: { [key: string]: any } = {
      ':gsi2pk': gsi2pk,
    };

    // Adiciona begins_with se especificado
    if (options?.beginsWith) {
      keyConditionExpression += ' AND begins_with(GSI2SK, :gsi2sk)';
      expressionAttributeValues[':gsi2sk'] = options.beginsWith;
    }

    const result = await this.dynamoDBService.query(
      keyConditionExpression,
      expressionAttributeValues,
      options?.expressionAttributeNames,
      'GSI2',
      options?.limit,
      options?.exclusiveStartKey,
      options?.scanIndexForward,
      options?.filterExpression
    );

    return result.items as T[];
  }

  /**
   * Scan na tabela
   */
  async scan(options?: ScanOptions): Promise<T[]> {
    const result = await this.dynamoDBService.scan(
      options?.filterExpression,
      options?.expressionAttributeNames,
      options?.expressionAttributeValues,
      options?.limit,
      options?.exclusiveStartKey
    );

    return result.items as T[];
  }

  /**
   * Batch write
   */
  async batchWrite(operations: BatchWriteOperation[]): Promise<void> {
    const putRequests: any[] = [];
    const deleteRequests: { PK: string; SK: string }[] = [];

    operations.forEach(op => {
      if (op.operation === 'PUT' && op.item) {
        putRequests.push(op.item);
      } else if (op.operation === 'DELETE' && op.key) {
        deleteRequests.push(op.key);
      }
    });

    await this.dynamoDBService.batchWrite(putRequests, deleteRequests);
  }

  /**
   * Batch get
   */
  async batchGet(keys: BatchGetKey[]): Promise<T[]> {
    const items = await this.dynamoDBService.batchGet(keys);
    return items as T[];
  }

  /**
   * Gera UUID
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * Gera PK - deve ser implementado pela classe filha
   */
  protected abstract generatePK(data: Partial<T>): string;

  /**
   * Gera SK - deve ser implementado pela classe filha
   */
  protected abstract generateSK(data: Partial<T>): string;

  /**
   * Helper para converter timestamp
   */
  protected toISOString(date?: Date): string {
    return (date || new Date()).toISOString();
  }

  /**
   * Helper para criar GSI1PK
   */
  protected createGSI1PK(prefix: string, value: string): string {
    return `${prefix}#${value}`;
  }

  /**
   * Helper para criar GSI1SK
   */
  protected createGSI1SK(value: string): string {
    return value;
  }

  /**
   * Helper para criar GSI2PK
   */
  protected createGSI2PK(prefix: string, value: string): string {
    return `${prefix}#${value}`;
  }

  /**
   * Helper para criar GSI2SK
   */
  protected createGSI2SK(prefix: string, value: string): string {
    return `${prefix}#${value}`;
  }
}
