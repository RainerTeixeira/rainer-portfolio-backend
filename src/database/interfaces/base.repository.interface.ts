/**
 * Interface base para todos os repositórios
 * Define operações CRUD comuns usando Single Table Design
 */
export interface IBaseRepository<T> {
  /**
   * Cria uma nova entidade
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Busca por PK (Partition Key)
   */
  findById(pk: string, sk?: string): Promise<T | null>;

  /**
   * Atualiza uma entidade existente
   */
  update(pk: string, sk: string, data: Partial<T>): Promise<T>;

  /**
   * Remove uma entidade
   */
  delete(pk: string, sk: string): Promise<void>;

  /**
   * Query por PK com opções de filtro
   */
  queryByPK(pk: string, options?: QueryOptions): Promise<T[]>;

  /**
   * Query por GSI1
   */
  queryByGSI1(gsi1pk: string, options?: QueryOptions): Promise<T[]>;

  /**
   * Query por GSI2
   */
  queryByGSI2(gsi2pk: string, options?: QueryOptions): Promise<T[]>;

  /**
   * Scan (usar com cuidado - mais custoso)
   */
  scan(options?: ScanOptions): Promise<T[]>;

  /**
   * Batch write (múltiplas operações)
   */
  batchWrite(operations: BatchWriteOperation[]): Promise<void>;

  /**
   * Batch get (múltiplas leituras)
   */
  batchGet(keys: BatchGetKey[]): Promise<T[]>;
}

/**
 * Opções para query
 */
export interface QueryOptions {
  limit?: number;
  exclusiveStartKey?: any;
  scanIndexForward?: boolean;
  filterExpression?: string;
  expressionAttributeNames?: { [key: string]: string };
  expressionAttributeValues?: { [key: string]: any };
  beginsWith?: string;
}

/**
 * Opções para scan
 */
export interface ScanOptions {
  limit?: number;
  exclusiveStartKey?: any;
  filterExpression?: string;
  expressionAttributeNames?: { [key: string]: string };
  expressionAttributeValues?: { [key: string]: any };
}

/**
 * Operação de batch write
 */
export interface BatchWriteOperation {
  operation: 'PUT' | 'DELETE';
  item?: any;
  key?: {
    PK: string;
    SK: string;
  };
}

/**
 * Chave para batch get
 */
export interface BatchGetKey {
  PK: string;
  SK: string;
}

/**
 * Entidade base do DynamoDB
 */
export interface DynamoDBEntity {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  entityType: string;
  createdAt: string;
  updatedAt: string;
  data?: any;
}
